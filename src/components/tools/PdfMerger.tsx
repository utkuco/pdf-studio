'use client';

import React, { useState, useRef } from 'react';
import { FileUpload } from '../FileUpload';
import { mergePdfs, downloadFile } from '@/lib/pdf-utils';
import { Download, Loader2, FileText, Trash2, GripVertical, ArrowUp, ArrowDown, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '../Toast';

export function PdfMerger() {
  const { addToast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleFileSelect = (selectedFiles: File[]) => {
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);
    addToast('success', `${selectedFiles.length} file(s) added`);
  };

  const handleRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setFiles(newFiles);
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setFiles(newFiles);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
    setDragOverIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const newFiles = [...files];
    const draggedItem = newFiles[dragItem.current];
    newFiles.splice(dragItem.current, 1);
    newFiles.splice(dragOverItem.current, 0, draggedItem);
    setFiles(newFiles);

    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleMerge = async () => {
    if (files.length < 2) { 
      addToast('warning', 'Select at least 2 PDF files to merge.'); 
      return; 
    }
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

  if (files.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-12 px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Merge PDF
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Combine multiple PDF files into one document</p>
        </div>
        <FileUpload 
          onFilesSelected={handleFileSelect} 
          accept={{ 'application/pdf': ['.pdf'] }} 
          multiple={true}
          title="Drop PDF files here"
          subtitle="Select multiple files to merge"
        />
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            💡 Tip: You can add more files after the first selection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-3">
          <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          Merge PDF
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Drag files to reorder, then merge</p>
      </div>

      {/* File List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Files ({files.length})
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Move className="w-4 h-4" />
            Drag to reorder
          </div>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-move group",
                draggedIndex === index 
                  ? "opacity-50 border-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                  : dragOverIndex === index 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]" 
                    : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {/* Drag Handle */}
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                <GripVertical className="w-5 h-5" />
                <span className="text-sm font-mono w-6 text-center">{index + 1}</span>
              </div>

              {/* File Icon */}
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">{file.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>

              {/* Order Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === files.length - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(index)}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add More Files */}
      <div className="mb-6">
        <FileUpload 
          onFilesSelected={handleFileSelect} 
          accept={{ 'application/pdf': ['.pdf'] }} 
          multiple={true}
          title="Add more files"
          subtitle="Click or drop to add"
          className="py-4 min-h-[80px]"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setFiles([])}
          className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={handleMerge}
          disabled={processing || files.length < 2}
          className={cn(
            "flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all",
            processing || files.length < 2
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
          )}
        >
          {processing ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Merging...</>
          ) : (
            <><Download className="w-5 h-5" /> Merge {files.length} PDFs</>
          )}
        </button>
      </div>
    </div>
  );
}
