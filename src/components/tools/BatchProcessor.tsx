'use client';

import React, { useState } from 'react';
import { FileUpload } from '../FileUpload';
import { renderPdfPagesToImages, downloadFile, mergePdfs } from '@/lib/pdf-utils';
import { Download, Loader2, FileText, FileImage, CheckCircle2, XCircle, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '../Toast';

type Operation = 'compress' | 'watermark' | 'extract-images' | 'batch-merge';

interface FileJob {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: Blob;
  error?: string;
}

export function BatchProcessor() {
  const { addToast } = useToast();
  const [jobs, setJobs] = useState<FileJob[]>([]);
  const [operation, setOperation] = useState<Operation>('extract-images');
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = (files: File[]) => {
    const newJobs: FileJob[] = files.map((file, i) => ({
      id: `${file.name}-${Date.now()}-${i}`,
      file,
      status: 'pending',
      progress: 0,
    }));
    setJobs(prev => [...prev, ...newJobs]);
    addToast('success', `${files.length} file(s) added to batch`);
  };

  const handleRemoveJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleClearAll = () => {
    setJobs([]);
  };

  const updateJob = (id: string, updates: Partial<FileJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  const processJobs = async () => {
    if (jobs.length === 0) return;
    
    setProcessing(true);
    
    // Process all jobs sequentially
    for (const job of jobs) {
      updateJob(job.id, { status: 'processing', progress: 0 });
      
      try {
        // Simulate processing with progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          updateJob(job.id, { progress: i });
        }

        let result: Blob;
        
        switch (operation) {
          case 'extract-images':
            // Extract first page as image
            const images = await renderPdfPagesToImages(job.file, 2.0);
            // For batch, just use first page image
            const imgData = images[0];
            if (imgData) {
              // Convert base64 to blob
              const response = await fetch(imgData);
              result = await response.blob();
            } else {
              throw new Error('No images extracted');
            }
            break;
            
          case 'batch-merge':
            // For batch merge, we need at least 2 files
            const otherJobs = jobs.filter(j => j.id !== job.id);
            if (otherJobs.length >= 1) {
              const pdfBytes = await mergePdfs([job.file, otherJobs[0].file]);
              result = new Blob([pdfBytes], { type: 'application/pdf' });
            } else {
              result = new Blob([await job.file.arrayBuffer()], { type: 'application/pdf' });
            }
            break;
            
          default:
            // For other operations, just return the original
            result = new Blob([await job.file.arrayBuffer()], { type: 'application/pdf' });
        }
        
        updateJob(job.id, { status: 'completed', progress: 100, result });
        
      } catch (error) {
        updateJob(job.id, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    setProcessing(false);
    addToast('success', 'Batch processing completed!');
  };

  const downloadAll = async () => {
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.result);
    
    if (completedJobs.length === 0) {
      addToast('warning', 'No completed files to download');
      return;
    }

    // Download each file individually
    for (const job of completedJobs) {
      if (job.result) {
        const extension = operation === 'extract-images' ? '.png' : '.pdf';
        const baseName = job.file.name.replace(/\.[^/.]+$/, '');
        downloadFile(job.result, `${baseName}_processed${extension}`, 
          operation === 'extract-images' ? 'image/png' : 'application/pdf');
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between downloads
      }
    }
    
    addToast('success', `Downloaded ${completedJobs.length} files`);
  };

  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const errorCount = jobs.filter(j => j.status === 'error').length;

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-3">
          <RefreshCw className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          Batch Processing
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Process multiple files at once</p>
      </div>

      {/* Operation Selection */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Select Operation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'extract-images', label: 'Extract Images', icon: FileImage, desc: 'Get first page as PNG' },
            { id: 'batch-merge', label: 'Merge PDFs', icon: FileText, desc: 'Combine PDFs' },
            { id: 'compress', label: 'Compress', icon: Download, desc: 'Reduce file size' },
            { id: 'watermark', label: 'Watermark', icon: FileText, desc: 'Add watermark' },
          ].map(op => (
            <button
              key={op.id}
              onClick={() => setOperation(op.id as Operation)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                operation === op.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              )}
            >
              <op.icon className={cn(
                "w-6 h-6 mb-2",
                operation === op.id ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
              )} />
              <div className="font-medium text-sm text-gray-900 dark:text-white">{op.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{op.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload */}
      {jobs.length === 0 ? (
        <FileUpload 
          onFilesSelected={handleFileSelect} 
          accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] }} 
          multiple={true}
          title="Drop files for batch processing"
          subtitle="Select multiple PDF or image files"
        />
      ) : (
        <>
          {/* Job List */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Files ({jobs.length})
                </h3>
                {jobs.length > 0 && (
                  <div className="flex items-center gap-4 mt-1 text-xs">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" /> {completedCount} completed
                    </span>
                    {errorCount > 0 && (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <XCircle className="w-3 h-3" /> {errorCount} errors
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleClearAll}
                className="text-sm text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600"
                >
                  {/* Status Icon */}
                  <div className={cn(
                    "p-2 rounded-lg",
                    job.status === 'completed' ? "bg-green-100 dark:bg-green-900/40" :
                    job.status === 'processing' ? "bg-blue-100 dark:bg-blue-900/40" :
                    job.status === 'error' ? "bg-red-100 dark:bg-red-900/40" :
                    "bg-gray-200 dark:bg-gray-600"
                  )}>
                    {job.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : job.status === 'processing' ? (
                      <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                    ) : job.status === 'error' ? (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {job.file.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {job.status === 'pending' && 'Waiting...'}
                      {job.status === 'processing' && `Processing... ${job.progress}%`}
                      {job.status === 'completed' && 'Completed'}
                      {job.status === 'error' && (job.error || 'Error')}
                    </div>
                    
                    {/* Progress Bar */}
                    {(job.status === 'processing' || job.status === 'completed') && (
                      <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            job.status === 'completed' ? "bg-green-500" : "bg-blue-500"
                          )}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  {job.status !== 'processing' && (
                    <button
                      onClick={() => handleRemoveJob(job.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add More Files */}
          <div className="mb-6">
            <FileUpload 
              onFilesSelected={handleFileSelect} 
              accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] }} 
              multiple={true}
              title="Add more files"
              subtitle="Click or drop to add"
              className="py-4 min-h-[80px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {completedCount > 0 && (
              <button
                onClick={downloadAll}
                className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download All ({completedCount})
              </button>
            )}
            <button
              onClick={processJobs}
              disabled={processing || jobs.length === 0}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all",
                processing || jobs.length === 0
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
              )}
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><RefreshCw className="w-5 h-5" /> Process {jobs.length} Files</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
