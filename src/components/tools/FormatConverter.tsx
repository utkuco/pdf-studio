'use client';

import React, { useState } from 'react';
import { FileUpload } from '../FileUpload';
import { renderPdfPagesToImages, imagesToPdf, downloadFile } from '@/lib/pdf-utils';
import { Download, Loader2, ArrowRightLeft, FileImage, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '../Toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type ConversionMode = 'pdf-to-image' | 'image-to-pdf';

export function FormatConverter() {
  const { t } = useLanguage();
  const { addToast } = useToast();
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
        addToast('success', `Converted ${images.length} pages to images!`);
      } else {
        const pdfBytes = await imagesToPdf(files);
        downloadFile(pdfBytes, 'converted_images.pdf', 'application/pdf');
        addToast('success', `${files.length} images converted to PDF!`);
      }
    } catch (error) {
      console.error("Conversion error:", error);
      addToast('error', "An error occurred during conversion.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('formatConverter')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{t('convertPdfToImages')}</p>
      </div>
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8 w-fit mx-auto">
        <button onClick={() => { setMode('pdf-to-image'); setFiles([]); }}
          className={cn("flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
            mode === 'pdf-to-image' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")}>
          <FileText className="w-4 h-4" /> {t('pdfToImage')}
        </button>
        <button onClick={() => { setMode('image-to-pdf'); setFiles([]); }}
          className={cn("flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
            mode === 'image-to-pdf' ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")}>
          <FileImage className="w-4 h-4" /> {t('imageToPdf')}
        </button>
      </div>
      {files.length === 0 ? (
        <FileUpload onFilesSelected={handleFileSelect}
          accept={mode === 'pdf-to-image' ? { 'application/pdf': ['.pdf'] } : { 'image/*': ['.png', '.jpg', '.jpeg'] }}
          multiple={mode === 'image-to-pdf'}
          title={mode === 'pdf-to-image' ? t('dropPdfHere') : t('dropImagesHere')} />
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white">{t('selectedFiles')} ({files.length})</h3>
            <button onClick={() => setFiles([])} className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">{t('clear')}</button>
          </div>
          <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                {mode === 'pdf-to-image' ? <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" /> : <FileImage className="w-5 h-5 text-green-500 dark:text-green-400" />}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1">{f.name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ))}
          </div>
          <button onClick={handleConvert} disabled={processing}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            {processing ? (<><Loader2 className="w-5 h-5 animate-spin" /> {t('convertingFiles')}</>) : (<><ArrowRightLeft className="w-5 h-5" /> {t('convertNow')}</>)}
          </button>
        </div>
      )}
    </div>
  );
}
