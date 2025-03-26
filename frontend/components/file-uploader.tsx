"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { processCSV, type UploadProgress } from '@/lib/actions'

interface FileUploaderProps {
  onUploadComplete?: () => void;
}

export const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileProcessed = async (file: File) => {
    try {
      setError(null);
      setUploadProgress({
        status: 'uploading',
        progress: 0,
        message: 'Starting upload...'
      });

      await processCSV(file, (progress) => {
        setUploadProgress(progress);
        if (progress.status === 'complete') {
          onUploadComplete?.();
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: 'Upload failed'
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    await handleFileProcessed(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Upload CSV File</h2>
      
      {uploadProgress && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">{uploadProgress.message}</span>
            <span className="text-sm font-medium">{Math.round(uploadProgress.progress)}%</span>
          </div>
          <Progress value={uploadProgress.progress} className="h-3" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2">
            <svg 
              className="w-12 h-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg">
              {isDragActive ? 
                'Drop your CSV file here' : 
                'Drag and drop your CSV file here or click to browse'
              }
            </p>
            <p className="text-sm text-gray-500">
              Supports CSV files of any size
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Upload File</label>
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileProcessed(file);
            }}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
};

