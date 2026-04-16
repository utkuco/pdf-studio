'use client';

import React, { useState } from 'react';
import { FileUpload } from '../FileUpload';
import { mergePdfs, downloadFile } from '@/lib/pdf-utils';
import { Download, Loader2, FileText, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '../Toast';

export function PdfMerger() {
  const { addToast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = (selectedFiles: File[]) => {
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        return newFiles;
      });
    } else if (direction === 'down' && index < files.length - 1) {
      setFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
        return newFiles;
      });
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) { addToast('warning', 'Select at least 2 PDF files to merge.'); return; }
    setProcessing(true);
    try {
      const mergedPdfBytes = await mergePdfs(files);
      downloadFile(mergedPdfBytes, 'merged_document.pdf', 'application/pdf');
      addToast('success', `${files.length} PDFs merged successfully!`);
    } catch (error) {
      console.error("Merge error:", error);
      addToast('error', 'An error occurred while merging PDFs.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Merge PDF</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Combine multiple PDF files into one</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm mb-6">
        <FileUpload onFilesSelected={handleFileSelect} accept={{ 'application/pdf': ['.pdf'] }} multiple={true}
          title="Drop PDFs here" className="min-h-[160px] py-8" />
        {files.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Files to Merge ({files.length})</h3>
            <div className="space-y-2 mb-6">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 group">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveFile(i, 'up')} disabled={i === 0} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <button onClick={() => moveFile(i, 'down')} disabled={i === files.length - 1} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                  </div>
                  <FileText className="w-6 h-6 text-red-500 dark:text-red-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1">{f.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-16 text-right">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                  <button onClick={() => removeFile(i)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handleMerge} disabled={processing || files.length < 2}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {processing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Merging...</>) : (<><Download className="w-5 h-5" /> Merge PDFs</>)}
            </button>
            {files.length < 2 && (
              <p className="text-center text-sm text-amber-600 dark:text-amber-400 mt-3">At least 2 files required for merging.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
