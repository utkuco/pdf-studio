'use client';

import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function WordToPdf() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    multiple: false,
  } as any);

  const handleConvert = async () => {
    if (!file) return;
    setConverting(true);
    setError(null);
    setSuccess(false);

    try {
      // Step 1: Read DOCX and convert to HTML via mammoth
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      // Handle any warnings
      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth warnings:', result.messages);
      }

      // Step 2: Create a hidden preview div with the HTML content
      const previewDiv = previewRef.current;
      if (!previewDiv) throw new Error('Preview element not found');

      previewDiv.innerHTML = html;
      previewDiv.style.position = 'absolute';
      previewDiv.style.left = '-9999px';
      previewDiv.style.top = '0';
      previewDiv.style.width = '794px'; // A4 width in px at 96dpi
      previewDiv.style.backgroundColor = 'white';
      previewDiv.style.padding = '40px';
      previewDiv.style.fontFamily = 'Georgia, serif';
      previewDiv.style.fontSize = '12px';
      previewDiv.style.lineHeight = '1.6';
      previewDiv.style.color = '#000';
      previewDiv.style.overflow = 'hidden';

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Dynamic import html2canvas
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;

      if (typeof html2canvas !== 'function') {
        throw new Error('html2canvas not loaded properly');
      }

      // Step 4: Render HTML to canvas
      const canvas = await html2canvas(previewDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 874,
        windowHeight: previewDiv.scrollHeight + 80,
      });

      // Step 5: Draw canvas content onto PDF using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // A4 dimensions in points
      const PAGE_WIDTH = 595.28;
      const PAGE_HEIGHT = 841.89;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const base64 = imgData.split(',')[1];
      const imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      const jpegImage = await pdfDoc.embedJpg(imgBytes);

      // Calculate how much of the image fits on one page
      const imgAspect = jpegImage.width / jpegImage.height;
      const pageAspect = PAGE_WIDTH / PAGE_HEIGHT;

      let imgWidth: number, imgHeight: number;

      if (imgAspect > pageAspect) {
        // Image is wider than page - fit to width
        imgWidth = PAGE_WIDTH;
        imgHeight = PAGE_WIDTH / imgAspect;
      } else {
        // Image is taller than page - fit to height
        imgHeight = PAGE_HEIGHT;
        imgWidth = PAGE_HEIGHT * imgAspect;
      }

      // Calculate number of pages needed based on image height
      const scaledImgHeight = (canvas.height * imgWidth) / canvas.width;
      const pagesNeeded = Math.ceil(scaledImgHeight / PAGE_HEIGHT);

      for (let i = 0; i < pagesNeeded; i++) {
        const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

        const srcY = (i * PAGE_HEIGHT * canvas.width) / imgWidth;
        const srcHeight = (PAGE_HEIGHT * canvas.width) / imgWidth;

        page.drawImage(jpegImage, {
          x: (PAGE_WIDTH - imgWidth) / 2,
          y: PAGE_HEIGHT - imgHeight,
          width: imgWidth,
          height: imgHeight,
        });
      }

      // Step 6: Save and download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace(/\.docx$/i, '')}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
      setSuccess(true);
      setFile(null);

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

      {/* Hidden preview div for rendering */}
      <div
        ref={previewRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '0',
          width: '794px',
          backgroundColor: 'white',
          padding: '40px',
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#000',
        }}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
          >
            <input {...getInputProps()} />
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {isDragActive ? t('dropHere') : t('dragWordFile')}
            </h3>
            <p className="text-sm text-gray-500">{t('orBrowse')} (.docx)</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 truncate max-w-md">{file.name}</div>
                  <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
              <button
                onClick={() => { setFile(null); setError(null); setSuccess(false); }}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                {t('remove') || 'Remove'}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{t('successConvert') || 'Successfully converted and downloaded!'}</p>
              </div>
            )}

            <button
              onClick={handleConvert}
              disabled={converting}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${converting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}
            >
              {converting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t('converting') || 'Converting...'}...</>
              ) : (
                <><Download className="w-5 h-5" /> {t('downloadPdf')}</>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">{t('fastConversion')}</h4>
          <p className="text-sm text-gray-500">{t('convertToPdf')}</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">{t('privacyFirst')}</h4>
          <p className="text-sm text-gray-500">{t('allProcessingBrowser')}</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">{t('easyToUse')}</h4>
          <p className="text-sm text-gray-500">{t('dragDrop')}</p>
        </div>
      </div>
    </div>
  );
}
