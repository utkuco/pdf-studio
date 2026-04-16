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
        "border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px]",
        isDragActive 
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20 scale-[1.02]" 
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 hover:scale-[1.01]",
        className
      )}
    >
      <input {...getInputProps()} />
      
      {/* Upload Icon */}
      <div className={cn(
        "p-4 rounded-2xl mb-4 transition-all duration-300",
        isDragActive 
          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 scale-110" 
          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600"
      )}>
        <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12" />
      </div>
      
      {/* Title */}
      <p className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1">
        {title}
      </p>
      
      {/* Subtitle */}
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
        {subtitle}
      </p>
      
      {/* File type hint */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        PDF, Images, Word documents supported
      </p>
    </div>
  );
}
