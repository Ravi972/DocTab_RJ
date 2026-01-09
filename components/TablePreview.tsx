import React, { useState, useEffect } from 'react';
import { ExtractedTableData } from '../types';
import { Download, Table as TableIcon, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface TablePreviewProps {
  data: ExtractedTableData[];
  onDownload: () => void;
}

const TablePreview: React.FC<TablePreviewProps> = ({ data, onDownload }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset index if data changes dramatically or is empty
    if (currentIndex >= data.length) {
        setCurrentIndex(0);
    }
  }, [data.length]);

  const currentTable = data[currentIndex];
  
  if (!currentTable) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-wrap gap-2">
        <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">
            {currentTable.tableTitle || `Table ${currentIndex + 1}`}
            </h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {currentTable.rows.length} rows
            </span>
        </div>
        
        <div className="flex items-center gap-2">
          {data.length > 1 && (
             <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 mr-2">
                <button 
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs font-medium text-gray-500 px-2 min-w-[60px] text-center">
                  {currentIndex + 1} / {data.length}
                </span>
                <button 
                  onClick={() => setCurrentIndex(prev => Math.min(data.length - 1, prev + 1))}
                  disabled={currentIndex === data.length - 1}
                  className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
             </div>
          )}

          <button
            onClick={onDownload}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            {data.length > 1 ? <Layers className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {data.length > 1 ? "Download ZIP" : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
            <tr>
              {currentTable.headers.map((header, idx) => (
                <th key={idx} scope="col" className="px-6 py-3 border-b border-gray-200 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentTable.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="bg-white border-b hover:bg-gray-50 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-6 py-3 whitespace-nowrap border-r border-gray-100 last:border-0">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {currentTable.rows.length === 0 && (
                <tr>
                    <td colSpan={currentTable.headers.length || 1} className="text-center py-8 text-gray-400 italic">
                        No data rows found.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablePreview;