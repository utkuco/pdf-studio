'use client';

import React, { useState } from 'react';
import { FileUpload } from '../FileUpload';
import { renderPdfPagesToImages, imagesToPdf, downloadFile } from '@/lib/pdf-utils';
import { Download, Loader2, ArrowRightLeft, FileImage, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConversionMode = 'pdf-to-image' | 'image-to-pdf';

export function FormatConverter() {
  const [mode, setMode] = useState<ConversionMode>('pdf-to-image');
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = (selectedFiles: File[]) => {
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      if (mode === 'pdf-to-image') {
        const file = files[0];
        const images = await renderPdfPagesToImages(file, 2.0);
        images.forEach((imgData, index) => {
          downloadFile(imgData, `${file.name.replace('.pdf', '')}_page_${index + 1}.png`, 'image/png');
        });
      } else {
        const pdfBytes = await imagesToPdf(files);
        downloadFile(pdfBytes, 'converted_images.pdf', 'application/pdf');
      }
    } catch (error) {
      console.error("Conversion error:", error);
      alert("An error occurred during conversion.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Format Converter</h2>
        <p className="text-gray-500 mt-2">Convert PDF to images or images to PDF</p>
      </div>
      <div className="flex p-1 bg-gray-100 rounded-xl mb-8 w-fit mx-auto">
        <button onClick={() => { setMode('pdf-to-image'); setFiles([]); }}
          className={cn("flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
            mode === 'pdf-to-image' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <FileText className="w-4 h-4" /> PDF to Image
        </button>
        <button onClick={() => { setMode('image-to-pdf'); setFiles([]); }}
          className={cn("flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
            mode === 'image-to-pdf' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <FileImage className="w-4 h-4" /> Image to PDF
        </button>
      </div>
      {files.length === 0 ? (
        <FileUpload onFilesSelected={handleFileSelect}
          accept={mode === 'pdf-to-image' ? { 'application/pdf': ['.pdf'] } : { 'image/*': ['.png', '.jpg', '.jpeg'] }}
          multiple={mode === 'image-to-pdf'}
          title={mode === 'pdf-to-image' ? "Drop PDF here" : "Drop images here"} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-900">Selected Files ({files.length})</h3>
            <button onClick={() => setFiles([])} className="text-sm text-red-600 hover:text-red-700 font-medium">Clear</button>
          </div>
          <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                {mode === 'pdf-to-image' ? <FileText className="w-5 h-5 text-blue-500" /> : <FileImage className="w-5 h-5 text-green-500" />}
                <span className="text-sm font-medium text-gray-700 truncate flex-1">{f.name}</span>
                <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ))}
          </div>
          <button onClick={handleConvert} disabled={processing}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            {processing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Converting...</>) : (<><ArrowRightLeft className="w-5 h-5" /> Convert Now</>)}
          </button>
        </div>
      )}
    </div>
  );
}
