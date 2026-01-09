export interface ExtractedTableData {
  tableTitle: string;
  headers: string[];
  rows: string[][];
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface FileData {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface ProcessableFile extends FileData {
  id: string;
  status: AppStatus;
  extractedData: ExtractedTableData[] | null;
  errorMsg: string | null;
}