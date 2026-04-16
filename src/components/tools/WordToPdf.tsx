'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import mammoth from 'mammoth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function WordToPdf() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) { 
      setFile(selectedFile); 
      setError(null); 
      setSuccess(false);
      setHtmlContent(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    multiple: false
  } as any);

  // Load html2canvas dynamically to avoid SSR issues
  const loadHtml2Canvas = async () => {
    if (typeof window !== 'undefined' && !(window as any).html2canvas) {
      await import('html2canvas').then(mod => {
        (window as any).html2canvas = mod.default;
      });
    }
    return (window as any).html2canvas;
  };

  const handleConvert = async () => {
    if (!file) return;
    setConverting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Step 1: Convert DOCX to HTML using mammoth
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      
      // Store HTML content and show preview
      setHtmlContent(html);
      setPreviewVisible(true);
      
      // Wait for the preview div to be rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!previewRef.current) {
        throw new Error('Preview element not found');
      }
      
      // Step 2: Load html2canvas dynamically
      const html2canvas = await loadHtml2Canvas();
      
      // Step 3: Use html2canvas to render the HTML as a canvas
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      // Step 4: Convert canvas to PDF using pdf-lib
      const imgData = canvas.toDataURL('image/png');
      const base64 = imgData.split(',')[1];
      const imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      
      const pdfDoc = await PDFDocument.create();
      const pageWidth = canvas.width / 2;
      const pageHeight = canvas.height / 2;
      
      const pngImage = await pdfDoc.embedPng(imgBytes);
      
      // Calculate how many pages we need
      const scale = 0.75; // Scale down for better fit
      const scaledWidth = pageWidth * scale;
      const scaledHeight = pageHeight * scale;
      
      // A4 dimensions in points (595 x 842)
      const a4Width = 595;
      const a4Height = 842;
      
      // Calculate pages needed
      const pagesNeeded = Math.ceil(scaledHeight / a4Height);
      
      for (let i = 0; i < Math.max(1, pagesNeeded); i++) {
        const page = pdfDoc.addPage([a4Width, a4Height]);
        
        // Calculate portion of image for this page
        const yOffset = i * a4Height;
        const remainingHeight = Math.min(a4Height, scaledHeight - yOffset);
        
        if (remainingHeight > 0) {
          page.drawImage(pngImage, {
            x: 0,
            y: a4Height - remainingHeight,
            width: a4Width,
            height: remainingHeight,
          });
        }
      }
      
      // Save and download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace('.docx', '')}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
      setSuccess(true);
      setHtmlContent(null);
      setPreviewVisible(false);
      
    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'An error occurred during conversion.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('wordToPdf')}</h2>
        <p className="text-gray-600">{t('convertToPdf')}</p>
      </div>
      
      {/* Hidden preview for rendering - must be visible for html2canvas */}
      {previewVisible && htmlContent && (
        <div 
          ref={previewRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div 
            className="bg-white p-8 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}
          >
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {!file ? (
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
            <input {...getInputProps()} />
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{isDragActive ? t('dropHere') : t('dragWordFile')}</h3>
            <p className="text-sm text-gray-500">{t('orBrowse')} (.docx)</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg"><FileText className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <div className="font-semibold text-gray-900 truncate max-w-md">{file.name}</div>
                  <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
              <button onClick={() => { setFile(null); setHtmlContent(null); setPreviewVisible(false); }} className="text-sm text-red-600 hover:text-red-700 font-medium">{t('remove') || 'Remove'}</button>
            </div>
            {error && (<div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100"><AlertCircle className="w-5 h-5 flex-shrink-0" /><p className="text-sm font-medium">{error}</p></div>)}
            {success && (<div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100"><CheckCircle2 className="w-5 h-5 flex-shrink-0" /><p className="text-sm font-medium">{t('successConvert') || 'Successfully converted and downloaded!'}</p></div>)}
            <button onClick={handleConvert} disabled={converting}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${converting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}>
              {converting ? (<><Loader2 className="w-5 h-5 animate-spin" /> {t('converting') || 'Converting...'}...</>) : (<><Download className="w-5 h-5" /> {t('downloadPdf')}</>)}
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4"><CheckCircle2 className="w-6 h-6 text-purple-600" /></div>
          <h4 className="font-bold text-gray-900 mb-2">{t('fastConversion')}</h4>
          <p className="text-sm text-gray-500">{t('convertToPdf')}</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4"><CheckCircle2 className="w-6 h-6 text-blue-600" /></div>
          <h4 className="font-bold text-gray-900 mb-2">{t('privacyFirst')}</h4>
          <p className="text-sm text-gray-500">{t('allProcessingBrowser')}</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
          <h4 className="font-bold text-gray-900 mb-2">{t('easyToUse')}</h4>
          <p className="text-sm text-gray-500">{t('dragDrop')}</p>
        </div>
      </div>
    </div>
  );
}
