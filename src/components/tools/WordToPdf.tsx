'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// ─── HTML Parser & Styled Text ─────────────────────────────────────────────

type TextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
};

type DocNode = 
  | { type: 'text'; content: string; style: TextStyle }
  | { type: 'inline'; tag: string; children: DocNode[]; style: TextStyle }
  | { type: 'block'; tag: string; children: DocNode[]; style: TextStyle }
  | { type: 'table'; rows: DocNode[][] };

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&[a-z]+;/gi, '');
}

function parseInlineHtml(html: string, baseStyle: TextStyle = {}): DocNode[] {
  const nodes: DocNode[] = [];
  
  // Regex to match HTML tags
  const tagRegex = /<(\/?)([\w]+)([^>]*)>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let currentStyle = { ...baseStyle };
  const stack: { tag: string; style: TextStyle }[] = [];

  // Get text content without the outer wrapping tags we don't want
  const cleanHtml = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/table>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/div>/gi, '\n');

  const segments: { text: string; style: TextStyle }[] = [];
  
  // Split by tags, keeping tags in the result
  const parts = cleanHtml.split(/(<[^>]+>)/gi);
  
  let activeStyle = { ...baseStyle };
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      // It's a tag
      const isClose = trimmed.startsWith('</');
      const tagName = trimmed.replace(/<\/?|>/gi, '').split(/\s/)[0].toLowerCase();
      
      if (isClose) {
        // Pop from stack
        const popped = stack.pop();
        if (popped) {
          activeStyle = { ...baseStyle };
          for (const item of stack) {
            Object.assign(activeStyle, item.style);
          }
        }
      } else {
        // Push to stack
        const newStyle: TextStyle = {};
        if (tagName === 'strong' || tagName === 'b') newStyle.bold = true;
        if (tagName === 'em' || tagName === 'i') newStyle.italic = true;
        if (tagName === 'u') newStyle.underline = true;
        
        // Handle inline style attribute
        const styleMatch = trimmed.match(/style=["']([^"']+)["']/i);
        if (styleMatch) {
          const styles = styleMatch[1].split(';');
          for (const s of styles) {
            const [prop, val] = s.split(':').map(x => x.trim());
            if (prop === 'font-size') {
              const size = parseInt(val);
              if (!isNaN(size)) newStyle.fontSize = size;
            }
            if (prop === 'color') newStyle.color = val;
            if (prop === 'font-family') newStyle.fontFamily = val;
          }
        }
        
        stack.push({ tag: tagName, style: newStyle });
        activeStyle = { ...baseStyle, ...newStyle };
      }
    } else {
      // It's text content
      const text = decodeHtmlEntities(trimmed);
      if (text) {
        segments.push({ text, style: { ...activeStyle } });
      }
    }
  }

  // Merge consecutive segments with same style
  for (const seg of segments) {
    if (nodes.length > 0) {
      const last = nodes[nodes.length - 1];
      if (last.type === 'text' && 
          JSON.stringify(last.style) === JSON.stringify(seg.style)) {
        (last as any).content += seg.text;
        continue;
      }
    }
    nodes.push({ type: 'text', content: seg.text, style: seg.style });
  }

  return nodes;
}

// Simple HTML tag stripper for debugging
function stripAllHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

// Parse HTML into block-level nodes
function parseHtml(html: string): DocNode[] {
  const blocks: DocNode[] = [];
  
  // Remove XML declaration and DOCTYPE if present
  const cleanHtml = html
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '');

  // Split by block-level tags
  const blockRegex = /<(table|thead|tbody|tfoot|tr|h[1-6]|p|div|ul|ol|li)([^>]*)>([\s\S]*?)<\/\1>/gi;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(cleanHtml)) !== null) {
    const fullMatch = match[0];
    const tag = match[1].toLowerCase();
    const inner = match[3];

    // Add any text before this block as a paragraph
    const before = cleanHtml.substring(lastIndex, match.index).trim();
    if (before) {
      blocks.push({
        type: 'block',
        tag: 'p',
        children: parseInlineHtml(before),
        style: {},
      });
    }

    if (tag === 'table') {
      const rows: DocNode[][] = [];
      
      // Parse rows
      const rowRegex = /<tr([^>]*)>([\s\S]*?)<\/tr>/gi;
      let rowMatch: RegExpExecArray | null;
      
      while ((rowMatch = rowRegex.exec(fullMatch)) !== null) {
        const cells: DocNode[] = [];
        
        // Check if it's a header row
        const isHeader = rowMatch[1].includes('th') || 
          rowMatch[2].includes('<th');
        
        // Parse cells
        const cellRegex = /<(t[hd])([^>]*)>([\s\S]*?)<\/\1>/gi;
        let cellMatch: RegExpExecArray | null;
        
        while ((cellMatch = cellRegex.exec(rowMatch[2])) !== null) {
          const cellTag = cellMatch[1];
          const cellInner = cellMatch[3];
          const cellStyle: TextStyle = cellTag === 'th' 
            ? { bold: true, fontSize: 11 } 
            : { fontSize: 11 };
          
          cells.push({
            type: 'inline',
            tag: cellTag,
            children: parseInlineHtml(cellInner, cellStyle),
            style: cellStyle,
          });
        }
        
        if (cells.length > 0) {
          rows.push(cells);
        }
      }
      
      if (rows.length > 0) {
        blocks.push({ type: 'table', rows });
      }
    } else if (tag.match(/^h[1-6]$/)) {
      const level = parseInt(tag[1]);
      const fontSize = level === 1 ? 22 : level === 2 ? 18 : level === 3 ? 15 : 13;
      blocks.push({
        type: 'block',
        tag,
        children: parseInlineHtml(inner, { bold: true, fontSize }),
        style: { bold: true, fontSize },
      });
    } else if (tag === 'p' || tag === 'div') {
      const children = parseInlineHtml(inner);
      if (children.length > 0) {
        blocks.push({
          type: 'block',
          tag,
          children,
          style: {},
        });
      }
    } else if (tag === 'ul' || tag === 'ol') {
      // Parse list items
      const itemRegex = /<li([^>]*)>([\s\S]*?)<\/li>/gi;
      let itemMatch: RegExpExecArray | null;
      
      while ((itemMatch = itemRegex.exec(fullMatch)) !== null) {
        const bullet = tag === 'ul' ? '• ' : '1. ';
        blocks.push({
          type: 'block',
          tag: 'li',
          children: [
            { type: 'text', content: bullet, style: { bold: false } },
            ...parseInlineHtml(itemMatch[2]),
          ],
          style: {},
        });
      }
    }
    
    lastIndex = match.index + fullMatch.length;
  }

  // Any remaining text
  const after = cleanHtml.substring(lastIndex).trim();
  if (after) {
    blocks.push({
      type: 'block',
      tag: 'p',
      children: parseInlineHtml(after),
      style: {},
    });
  }

  const blockNodes = blocks.filter((b): b is { type: 'block'; tag: string; children: DocNode[]; style: TextStyle } =>
    b.type === 'block'
  );
  return blockNodes.filter(b => b.children && b.children.length > 0);
}

// ─── PDF Renderer ───────────────────────────────────────────────────────────

async function createPdfFromDocx(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  onProgress?: (status: string) => void
): Promise<Blob> {
  onProgress?.('Parsing document...');
  
  // Step 1: Convert DOCX to HTML via mammoth
  const mammothResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = mammothResult.value;
  
  if (mammothResult.messages.length > 0) {
    console.warn('Mammoth warnings:', mammothResult.messages);
  }

  onProgress?.('Building PDF structure...');

  // Step 2: Parse HTML into structured nodes
  const nodes = parseHtml(html);

  if (nodes.length === 0) {
    throw new Error('No content found in the document.');
  }

  // Step 3: Create PDF with pdf-lib
  const pdfDoc = await PDFDocument.create();
  
  // Register fontkit for custom font embedding
  pdfDoc.registerFontkit(fontkit);
  
  // Load Roboto fonts from Google Fonts (supports Turkish and all Unicode)
  let regularFont: any, boldFont: any, italicFont: any, boldItalicFont: any;
  
  try {
    onProgress?.('Loading fonts...');
    
    // Fetch Roboto fonts from Google Fonts (v51, correct URLs)
    // Regular (400) and Bold (700) - extracted from Google Fonts CSS API
    console.log('Fetching Roboto Regular from Google Fonts...');
    const regResp = await fetch(
      'https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmT.ttf',
      { signal: AbortSignal.timeout(10000) }
    );
    console.log('Roboto Regular fetch status:', regResp.status, 'OK:', regResp.ok);
    
    // Roboto Bold (700)
    console.log('Fetching Roboto Bold from Google Fonts...');
    const boldResp = await fetch(
      'https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjammT.ttf',
      { signal: AbortSignal.timeout(10000) }
    );
    console.log('Roboto Bold fetch status:', boldResp.status, 'OK:', boldResp.ok);
    
    // Roboto Italic - use Regular (no true italic available in basic package)
    const italResp = regResp.clone();
    // Roboto Bold Italic - use Bold
    const boldItResp = boldResp.clone();

    if (regResp.ok && boldResp.ok) {
      console.log('Embedding fonts...');
      const regBytes = await regResp.arrayBuffer();
      const boldBytes = await boldResp.arrayBuffer();
      console.log('Regular font bytes:', regBytes.byteLength);
      console.log('Bold font bytes:', boldBytes.byteLength);
      
      regularFont = await pdfDoc.embedFont(regBytes);
      boldFont = await pdfDoc.embedFont(boldBytes);
      italicFont = regularFont;
      boldItalicFont = boldFont;
      console.log('Fonts embedded successfully');
      onProgress?.('Rendering content...');
    } else {
      console.log('Font fetch failed, using fallback');
      throw new Error('Font load failed');
    }
  } catch (e: any) {
    console.error('Font loading error:', e?.message || e);
    // Fallback to built-in fonts (no Turkish support)
    console.log('Using Helvetica fallback (no Turkish support)');
    regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    italicFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldItalicFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  // Page dimensions (A4 in points)
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 50;
  const MAX_WIDTH = PAGE_WIDTH - 2 * MARGIN;

  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  // Helper to get font based on style
  function getFont(style: TextStyle): any {
    if (style.bold && style.italic) return boldItalicFont || boldFont;
    if (style.bold) return boldFont;
    if (style.italic) return italicFont;
    return regularFont;
  }

  // Helper to wrap text into lines
  function wrapText(text: string, maxWidth: number, font: any, size: number): string[] {
    if (!text.trim()) return [''];
    
    const lines: string[] = [];
    const paragraphs = text.split('\n');
    
    for (const para of paragraphs) {
      if (!para.trim()) {
        lines.push('');
        continue;
      }
      
      const words = para.split(/\s+/);
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, size);
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) lines.push(currentLine);
    }
    
    return lines;
  }

  // Draw a text node at current cursor position, handle overflow
  function drawStyledText(children: DocNode[], startX: number): number {
    let x = startX;
    
    for (const child of children) {
      if (child.type === 'text') {
        const style = child.style;
        const font = getFont(style);
        const size = style.fontSize || 11;
        const text = child.content;
        
        const lines = wrapText(text, MAX_WIDTH - (x - MARGIN), font, size);
        
        for (let i = 0; i < lines.length; i++) {
          if (y < MARGIN + size) {
            currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - MARGIN;
          }
          
          if (lines[i]) {
            try {
              currentPage.drawText(lines[i], {
                x,
                y,
                size,
                font,
              });
            } catch {
              // Skip problematic characters
            }
          }
          y -= size + 4;
        }
        x = startX;
      }
    }
    
    return y;
  }

  // Draw a table
  function drawTable(table: { rows: DocNode[][] }) {
    if (table.rows.length === 0) return;
    
    const CELL_PADDING = 6;
    const LINE_HEIGHT = 12;
    const FONT_SIZE = 10;
    
    // Calculate column widths based on content
    const colCount = Math.max(...table.rows.map(r => r.length));
    const colWidth = (MAX_WIDTH - CELL_PADDING * 2) / colCount;
    
    for (const row of table.rows) {
      // First pass: measure content height for each cell
      const cellHeights: number[] = [];
      
      for (let col = 0; col < Math.min(row.length, colCount); col++) {
        const cell = row[col] as { type: 'inline'; tag: string; children: DocNode[]; style: TextStyle };
        let totalText = '';
        
        if (cell.type === 'inline') {
          for (const child of cell.children) {
            if (child.type === 'text') totalText += child.content;
          }
        }
        
        const font = getFont(cell.style);
        const lines = wrapText(totalText, colWidth - CELL_PADDING * 2, font, cell.style.fontSize || FONT_SIZE);
        cellHeights.push(lines.length * LINE_HEIGHT + CELL_PADDING * 2);
      }
      
      const rowHeight = Math.max(...cellHeights, LINE_HEIGHT + CELL_PADDING * 2);
      
      // Check if we need a new page
      if (y < MARGIN + rowHeight) {
        currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      
      const rowY = y;
      
      // Draw cells
      let x = MARGIN;
      for (let col = 0; col < Math.min(row.length, colCount); col++) {
        const cell = row[col] as { type: 'inline'; tag: string; children: DocNode[]; style: TextStyle };
        const cellWidth = colWidth;
        
        // Draw cell border
        currentPage.drawRectangle({
          x,
          y: rowY - rowHeight,
          width: cellWidth,
          height: rowHeight,
          borderColor: rgb(0.5, 0.5, 0.5),
          borderWidth: 0.5,
        });
        
        // Draw cell content
        let cellText = '';
        if (cell.type === 'inline') {
          for (const child of cell.children) {
            if (child.type === 'text') cellText += child.content;
          }
        }
        
        if (cellText) {
          const font = getFont(cell.style);
          const size = cell.style.fontSize || FONT_SIZE;
          const lines = wrapText(cellText, cellWidth - CELL_PADDING * 2, font, size);
          
          let textY = rowY - CELL_PADDING - size;
          for (const line of lines) {
            if (textY < rowY - rowHeight + CELL_PADDING) break;
            try {
              currentPage.drawText(line, {
                x: x + CELL_PADDING,
                y: textY,
                size,
                font,
              });
            } catch {}
            textY -= LINE_HEIGHT;
          }
        }
        
        x += cellWidth;
      }
      
      y -= rowHeight;
    }
    
    y -= 10; // Space after table
  }

  // Draw a block element
  function drawBlock(node: DocNode) {
    if (node.type === 'table') {
      drawTable(node);
      return;
    }
    
    if (node.type !== 'block') return;

    const tag = node.tag;
    const children = node.children;
    const style = node.style || {};
    const size = style.fontSize || 11;

    if (tag === 'li') {
      // List item
      const indent = 20;
      drawStyledText(children, MARGIN + indent);
      y -= 4;
    } else if (tag.match(/^h[1-6]$/)) {
      // Heading
      if (y < MARGIN + size + 10) {
        currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      drawStyledText(children, MARGIN);
      y -= size + 8;
    } else {
      // Paragraph or other block
      drawStyledText(children, MARGIN);
      y -= 8;
    }
  }

  // Render all blocks
  for (const node of nodes) {
    if (y < MARGIN + 20) {
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    
    drawBlock(node);
  }

  onProgress?.('Saving PDF...');
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

// ─── React Component ────────────────────────────────────────────────────────

export function WordToPdf() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState<string>('');

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
    setProgress('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const blob = await createPdfFromDocx(
        arrayBuffer,
        file.name,
        (status) => setProgress(status)
      );
      
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
      setProgress('');
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

            {converting && progress && (
              <div className="text-center text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                {progress}
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
