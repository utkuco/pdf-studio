'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// Turkish character replacements for StandardFonts fallback
const TURKISH_MAP: Record<string, string> = {
  'İ': 'I', 'ı': 'i',
  'Ş': 'S', 'ş': 's',
  'Ğ': 'G', 'ğ': 'g',
  'Ü': 'U', 'ü': 'u',
  'Ö': 'O', 'ö': 'o',
  'Ç': 'C', 'ç': 'c',
  '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₺': 'TL',
};

function stripHtml(html: string): string {
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
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getLines(html: string): string[] {
  return stripHtml(html).split('\n').filter(line => line.trim().length > 0);
}

// Replace Turkish chars with ASCII for StandardFonts
function normalizeTurkish(text: string): string {
  let result = text;
  for (const [turkish, ascii] of Object.entries(TURKISH_MAP)) {
    result = result.replace(new RegExp(turkish, 'g'), ascii);
  }
  return result;
}

// Load a font from Google Fonts that supports Turkish
async function loadTurkishFont(): Promise<any | null> {
  try {
    // Roboto supports Turkish
    const response = await fetch(
      'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) return null;
    const fontBytes = await response.arrayBuffer();
    
    // We'll load font dynamically in the browser
    // But for now, return null to use fallback
    return null;
  } catch {
    return null;
  }
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
      const mammothResult = await mammoth.convertToHtml({ arrayBuffer });
      const html = mammothResult.value;

      if (mammothResult.messages && mammothResult.messages.length > 0) {
        console.warn('Mammoth warnings:', mammothResult.messages);
      }

      // Step 2: Extract plain text lines
      const lines = getLines(html);

      if (lines.length === 0) {
        throw new Error('No text content found in the document.');
      }

      // Step 3: Create PDF with pdf-lib
      const pdfDoc = await PDFDocument.create();
      
      // Try to load a Unicode-capable font
      let font: any;
      let boldFont: any;
      
      try {
        // Try to load Roboto Bold from Google Fonts
        const fontResponse = await fetch(
          'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvFw.ttf',
          { signal: AbortSignal.timeout(5000) }
        );
        if (fontResponse.ok) {
          const fontBytes = await fontResponse.arrayBuffer();
          font = await pdfDoc.embedFont(fontBytes);
          
          const boldResponse = await fetch(
            'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9Vdw.ttf',
            { signal: AbortSignal.timeout(5000) }
          );
          if (boldResponse.ok) {
            const boldBytes = await boldResponse.arrayBuffer();
            boldFont = await pdfDoc.embedFont(boldBytes);
          } else {
            boldFont = font;
          }
        } else {
          throw new Error('Font load failed');
        }
      } catch {
        // Fallback: use StandardFonts (with Turkish char replacement)
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        font = helvetica;
        boldFont = helveticaBold;
      }

      // A4 dimensions in points
      const PAGE_WIDTH = 595.28;
      const PAGE_HEIGHT = 841.89;
      const MARGIN = 50;
      const LINE_HEIGHT = 14;
      const FONT_SIZE = 11;
      const MAX_WIDTH = PAGE_WIDTH - 2 * MARGIN;

      let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      let y = PAGE_HEIGHT - MARGIN;

      // Helper to draw text, handling both Unicode and StandardFonts
      const drawText = (text: string, x: number, yPos: number, size: number, currentFont: any) => {
        try {
          currentPage.drawText(text, {
            x,
            y: yPos,
            size,
            font: currentFont,
            color: { r: 0, g: 0, b: 0 } as any,
          });
        } catch (err: any) {
          // If Unicode font fails, try with normalized text
          if (err.message && err.message.includes('WinAnsi') || err.message.includes('encode')) {
            const normalized = normalizeTurkish(text);
            currentPage.drawText(normalized, {
              x,
              y: yPos,
              size,
              font: currentFont,
              color: { r: 0, g: 0, b: 0 } as any,
            });
          }
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        
        // Check if this line is a heading
        const isHeading = rawLine.startsWith('#') || 
          (rawLine.length < 60 && rawLine === rawLine.toUpperCase() && /[A-Z]/.test(rawLine));
        
        const currentFont = isHeading ? boldFont : font;
        const size = isHeading ? FONT_SIZE + 4 : FONT_SIZE;
        const lh = isHeading ? LINE_HEIGHT * 1.5 : LINE_HEIGHT;

        // Word wrap long lines
        const words = rawLine.split(/\s+/);
        let currentLine = '';
        let usedFont = currentFont;

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          
          let testWidth: number;
          try {
            testWidth = usedFont.widthOfTextAtSize(testLine, size);
          } catch {
            // Fallback width estimation
            testWidth = usedFont.widthOfTextAtSize(normalizeTurkish(testLine), size);
          }

          if (testWidth > MAX_WIDTH && currentLine) {
            if (y < MARGIN + lh) {
              currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
              y = PAGE_HEIGHT - MARGIN;
            }
            drawText(currentLine, MARGIN, y, size, usedFont);
            y -= lh;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        // Draw remaining text
        if (currentLine) {
          if (y < MARGIN + lh) {
            currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - MARGIN;
          }
          drawText(currentLine, MARGIN, y, size, usedFont);
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
