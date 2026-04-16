'use client';

import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function htmlToPlainText(html: string): string {
  // Strip HTML tags but preserve basic structure
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getTextFromHtml(html: string): string[] {
  const plain = htmlToPlainText(html);
  return plain.split('\n').filter(line => line.trim().length > 0);
}

export function WordToPdf() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth warnings:', result.messages);
      }

      // Step 2: Extract plain text lines from HTML
      const lines = getTextFromHtml(html);

      if (lines.length === 0) {
        throw new Error('No text content found in the document.');
      }

      // Step 3: Create PDF with pdf-lib
      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // A4 dimensions in points
      const PAGE_WIDTH = 595.28;
      const PAGE_HEIGHT = 841.89;
      const MARGIN = 50;
      const LINE_HEIGHT = 14;
      const FONT_SIZE = 11;
      const MAX_WIDTH = PAGE_WIDTH - 2 * MARGIN;

      let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      let y = PAGE_HEIGHT - MARGIN;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line is a heading (starts with # or is all uppercase short)
        const isHeading = line.startsWith('#') || (line.length < 50 && line === line.toUpperCase() && /[A-Z]/.test(line));
        
        const font = isHeading ? helveticaBold : helvetica;
        const size = isHeading ? FONT_SIZE + 4 : FONT_SIZE;
        const lh = isHeading ? LINE_HEIGHT * 1.5 : LINE_HEIGHT;

        // Check if line is bold (HTML bold tags)
        const isBold = /<\/?(b|strong)>/i.test(line) || line.startsWith('#');

        // Word wrap long lines
        const words = line.replace(/<[^>]+>/g, '').split(/\s+/);
        let currentLine = '';
        let lineFont = isBold ? helveticaBold : helvetica;

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = lineFont.widthOfTextAtSize(testLine, size);

          if (testWidth > MAX_WIDTH && currentLine) {
            // Draw current line
            if (y < MARGIN + lh) {
              currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - MARGIN;
            }
            currentPage.drawText(currentLine, {
              x: MARGIN,
              y: y,
              size: size,
              font: lineFont,
              color: { r: 0, g: 0, b: 0 } as any,
            });
            y -= lh;
            currentLine = word;
            lineFont = isBold ? helveticaBold : helvetica;
          } else {
            currentLine = testLine;
          }
        }

        // Draw remaining text on the line
        if (currentLine) {
          if (y < MARGIN + lh) {
            currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - MARGIN;
          }
          currentPage.drawText(currentLine, {
            x: MARGIN,
            y: y,
            size: size,
            font: lineFont,
            color: { r: 0, g: 0, b: 0 } as any,
          });
          y -= lh;
        }
      }

      // Step 4: Save and download
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
