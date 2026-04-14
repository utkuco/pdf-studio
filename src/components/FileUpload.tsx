'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function FileUpload({ onFilesSelected, accept, multiple = true, className, title = "Drop files here", subtitle = "or click to browse" }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept, multiple
  } as any);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center min-h-[240px]",
        isDragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-100/50",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className={cn("p-4 rounded-full mb-4", isDragActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500")}>
        <UploadCloud className="w-8 h-8" />
      </div>
      <p className="text-lg font-medium text-gray-700">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
