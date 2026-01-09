import React, { ChangeEvent } from 'react';
import { Upload, FileImage, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full">
      <label
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 
        ${disabled 
          ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60' 
          : 'bg-white border-blue-300 hover:bg-blue-50 hover:border-blue-500'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <Upload className={`w-8 h-8 ${disabled ? 'text-gray-400' : 'text-blue-600'}`} />
          </div>
          <p className="mb-2 text-sm text-gray-500 text-center">
            <span className="font-semibold text-gray-700">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400">PNG, JPG or PDF (MAX. 10MB)</p>
          
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <FileImage className="w-4 h-4" /> Images
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <FileText className="w-4 h-4" /> Documents
            </div>
          </div>
        </div>
        <input 
          type="file" 
          className="hidden" 
          onChange={handleChange} 
          accept="image/png, image/jpeg, application/pdf"
          disabled={disabled}
          multiple
        />
      </label>
    </div>
  );
};

export default FileUpload;