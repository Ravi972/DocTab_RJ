import React, { useState } from 'react';
import { ProcessableFile, AppStatus } from './types';
import FileUpload from './components/FileUpload';
import TablePreview from './components/TablePreview';
import { fileToBase64, downloadData } from './utils/fileUtils';
import { extractTableFromMedia } from './services/geminiService';
import { 
  Loader2, AlertCircle, FileType, CheckCircle2, RotateCcw, 
  Sparkles, Plus, Trash2, Layout, FileText
} from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessableFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const activeFile = files.find(f => f.id === activeFileId);

  const handleFileSelect = async (selectedFiles: File[]) => {
    const newFiles: ProcessableFile[] = [];

    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`File ${file.name} skipped: too large.`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const newFile: ProcessableFile = {
          id: crypto.randomUUID(),
          file,
          previewUrl: base64,
          base64,
          mimeType: file.type,
          status: AppStatus.IDLE,
          extractedData: null,
          errorMsg: null,
        };
        newFiles.push(newFile);
      } catch (err) {
        console.error(`Failed to process ${file.name}`, err);
      }
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      if (!activeFileId) {
        setActiveFileId(newFiles[0].id);
      }
    }
  };

  const updateFileState = (id: string, updates: Partial<ProcessableFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleExtract = async (fileId: string) => {
    const fileToProcess = files.find(f => f.id === fileId);
    if (!fileToProcess) return;

    updateFileState(fileId, { status: AppStatus.PROCESSING, errorMsg: null });

    try {
      const data = await extractTableFromMedia(fileToProcess.base64, fileToProcess.mimeType);
      
      // Data is now ExtractedTableData[]
      updateFileState(fileId, { 
        status: AppStatus.COMPLETE, 
        extractedData: data 
      });
    } catch (err) {
      updateFileState(fileId, { 
        status: AppStatus.ERROR, 
        errorMsg: "Failed to extract data. Please ensure the file contains visible tables." 
      });
    }
  };

  const handleRemoveFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) {
      setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
    }
  };

  const handleReset = () => {
    if (window.confirm("Remove all files?")) {
      setFiles([]);
      setActiveFileId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col h-screen overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 z-50 shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">DocuTable AI</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full hidden sm:inline-block">
                  Powered by Gemini 3 Flash
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        {files.length > 0 && (
          <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-semibold text-gray-700">Files ({files.length})</h2>
              <button onClick={handleReset} className="text-xs text-red-600 hover:text-red-800 font-medium">Clear All</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {files.map(file => (
                <div 
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all group relative
                    ${activeFileId === file.id 
                      ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200 shadow-sm' 
                      : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-1.5 rounded-md ${activeFileId === file.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {file.status === AppStatus.PROCESSING ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : file.status === AppStatus.COMPLETE ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${activeFileId === file.id ? 'text-blue-900' : 'text-gray-700'}`}>
                        {file.file.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        {(file.file.size / 1024).toFixed(0)} KB
                        {file.status === AppStatus.ERROR && <span className="text-red-500 font-medium">• Error</span>}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleRemoveFile(file.id, e)}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <label className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-colors shadow-sm">
                 <Plus className="w-4 h-4" />
                 Add more files
                 <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(Array.from(e.target.files));
                      }
                      e.target.value = '';
                    }} 
                    accept="image/png, image/jpeg, application/pdf"
                    multiple
                  />
              </label>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6 relative">
          
          {!files.length && (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 inline-block mb-6">
                  <Layout className="w-12 h-12 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Upload Multiple Documents
                </h1>
                <p className="text-lg text-gray-600 max-w-lg mx-auto">
                  Extract tables from multiple images or PDFs. Supports splitting multi-page PDFs into separate Excel files.
                </p>
              </div>
              <div className="w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <FileUpload onFileSelect={handleFileSelect} />
              </div>
            </div>
          )}

          {activeFile && (
            <div className="flex flex-col lg:flex-row gap-6 h-full max-h-full">
              
              <div className={`flex flex-col gap-4 transition-all duration-300 ${activeFile.extractedData ? 'lg:w-1/3' : 'lg:w-1/2 mx-auto'} h-full`}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col h-full overflow-hidden">
                  
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                          <FileType className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{activeFile.file.name}</p>
                          <p className="text-xs text-gray-500">{activeFile.mimeType.split('/')[1].toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative flex items-center justify-center border border-gray-200 min-h-0">
                      {activeFile.mimeType === 'application/pdf' ? (
                        <iframe 
                          src={activeFile.previewUrl} 
                          className="w-full h-full object-contain" 
                          title="PDF Preview"
                        />
                      ) : (
                          <img 
                              src={activeFile.previewUrl} 
                              alt="Preview" 
                              className="max-w-full max-h-full object-contain p-2" 
                          />
                      )}
                  </div>

                  <div className="mt-4 shrink-0">
                      {activeFile.status === AppStatus.ERROR && (
                          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              {activeFile.errorMsg || "An error occurred."}
                          </div>
                      )}
                      
                      {activeFile.status === AppStatus.IDLE && (
                          <button
                          onClick={() => handleExtract(activeFile.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          Extract Data
                        </button>
                      )}

                      {activeFile.status === AppStatus.PROCESSING && (
                          <button
                          disabled
                          className="w-full bg-blue-600/80 text-white font-medium py-3 px-4 rounded-xl cursor-not-allowed flex justify-center items-center gap-2"
                        >
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analyzing Document...
                        </button>
                      )}

                      {activeFile.status === AppStatus.COMPLETE && (
                        <div className="flex gap-2">
                           <div className="flex-1 bg-green-50 text-green-700 font-medium py-3 px-4 rounded-xl flex justify-center items-center gap-2 border border-green-200">
                            <CheckCircle2 className="w-5 h-5" />
                            {activeFile.extractedData && activeFile.extractedData.length > 1 
                                ? `${activeFile.extractedData.length} Files Extracted`
                                : "Extraction Complete"}
                          </div>
                          <button
                            onClick={() => handleExtract(activeFile.id)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-xl transition-colors"
                            title="Re-extract"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {activeFile.extractedData && (
                <div className="lg:w-2/3 h-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <TablePreview 
                      data={activeFile.extractedData} 
                      onDownload={() => downloadData(activeFile.extractedData!, activeFile.file.name)}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;