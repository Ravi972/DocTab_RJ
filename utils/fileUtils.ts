import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { ExtractedTableData } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const getPreferredFilename = (data: ExtractedTableData): string => {
  let filename = data.tableTitle || "extracted_data";

  // Find index of "Assembly Part No." (case-insensitive check)
  const partNoIndex = data.headers.findIndex(h => 
    h.trim().toLowerCase() === "assembly part no." || 
    h.trim().toLowerCase() === "assembly part no"
  );

  if (partNoIndex !== -1 && data.rows.length > 0) {
    const firstCellValue = data.rows[0][partNoIndex];
    if (firstCellValue && firstCellValue.trim()) {
      filename = firstCellValue.trim();
    }
  }

  // Sanitize filename
  return filename.replace(/[^a-z0-9\s-_.]/gi, '_').replace(/\s+/g, '_');
};

const createWorkbookBuffer = (data: ExtractedTableData): any => {
  const worksheetData = [data.headers, ...data.rows];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  
  // Sheet name limited to 31 chars
  const sheetName = (data.tableTitle || "Sheet1").replace(/[\\/?*[\]]/g, "").slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
};

export const downloadData = async (tables: ExtractedTableData[], baseFilename: string = "export") => {
  if (tables.length === 0) return;

  // If only one table, download as single Excel file
  if (tables.length === 1) {
    const table = tables[0];
    const wb = XLSX.read(createWorkbookBuffer(table), { type: 'array' });
    let filename = getPreferredFilename(table);
    if (!filename.toLowerCase().endsWith('.xlsx')) {
      filename += '.xlsx';
    }
    XLSX.writeFile(wb, filename);
    return;
  }

  // If multiple tables, create a ZIP
  const zip = new JSZip();
  const usedFilenames = new Set<string>();

  tables.forEach((table, index) => {
    let filename = getPreferredFilename(table);
    
    // Handle duplicate filenames
    if (usedFilenames.has(filename)) {
      let counter = 1;
      while (usedFilenames.has(`${filename}_${counter}`)) {
        counter++;
      }
      filename = `${filename}_${counter}`;
    }
    usedFilenames.add(filename);

    const buffer = createWorkbookBuffer(table);
    zip.file(`${filename}.xlsx`, buffer);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  
  // Create download link for ZIP
  const url = window.URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  
  // Base name for the zip file
  const zipName = baseFilename.split('.')[0] || "extracted_tables";
  a.download = `${zipName}_tables.zip`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};