import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';

// pdfjs-dist v3.x with legacy build for Next.js compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Set workerSrc - use CDN URL for production compatibility
// Using pdfjs-dist's CDN to avoid SSR and deployment issues
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    let image;
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdf.embedJpg(arrayBuffer);
    } else if (file.type === 'image/png') {
      image = await pdf.embedPng(arrayBuffer);
    } else {
      continue;
    }
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return await pdf.save();
}

export async function editPdfPages(
  file: File,
  actions: { type: 'delete' | 'rotate'; pageIndex: number; rotation?: number }[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  for (const action of actions.filter((a) => a.type === 'rotate')) {
    const page = pdf.getPage(action.pageIndex);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + (action.rotation || 90)));
  }

  for (const pageIndex of actions
    .filter((a) => a.type === 'delete')
    .map((a) => a.pageIndex)
    .sort((a, b) => b - a)) {
    pdf.removePage(pageIndex);
  }

  return await pdf.save();
}

let cachedPdf: { file: File; pdf: any } | null = null;

export async function getPdfDocument(file: File) {
  if (
    cachedPdf &&
    cachedPdf.file.name === file.name &&
    cachedPdf.file.size === file.size &&
    cachedPdf.file.lastModified === file.lastModified
  ) {
    return cachedPdf.pdf;
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  cachedPdf = { file, pdf };
  return pdf;
}

export async function renderPdfPagesToImages(
  file: File,
  scale: number = 2.0
): Promise<string[]> {
  const pdf = await getPdfDocument(file);
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    images.push(canvas.toDataURL('image/png'));
  }

  return images;
}

export async function renderPdfPageToImage(
  file: File,
  pageIndex: number,
  scale: number = 2.0
): Promise<{ image: string; width: number; height: number }> {
  const pdf = await getPdfDocument(file);
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No context');

  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext: context, viewport }).promise;

  return {
    image: canvas.toDataURL('image/png'),
    width: viewport.width,
    height: viewport.height,
  };
}

export async function applyAnnotationsToPdf(
  file: File,
  annotationsByPage: Record<number, any[]>
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const helveticaItalic = await pdf.embedFont(StandardFonts.HelveticaBoldOblique);
  const pages = pdf.getPages();

  const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16) / 255,
      g: parseInt(h.substring(2, 4), 16) / 255,
      b: parseInt(h.substring(4, 6), 16) / 255,
    };
  };

  for (const [pageIndexStr, annotations] of Object.entries(annotationsByPage)) {
    const pageIndex = parseInt(pageIndexStr, 10);
    const page = pages[pageIndex];
    if (!page) continue;

    const { width: pdfWidth, height: pdfHeight } = page.getSize();

    for (const ann of annotations) {
      const x = ann.nx * pdfWidth;
      const y = pdfHeight - ann.ny * pdfHeight - ann.nh * pdfHeight;
      const w = ann.nw * pdfWidth;
      const h = ann.nh * pdfHeight;

      if (ann.type === 'eraser') {
        page.drawRectangle({ x, y, width: w, height: h, color: rgb(1, 1, 1) });
      } else if (ann.type === 'patch') {
        try {
          const base64Data = ann.imageData.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const embeddedImage = await pdf.embedPng(bytes);
          page.drawImage(embeddedImage, { x, y, width: w, height: h });
        } catch (err) {
          console.error('Error embedding patch image:', err);
        }
      } else if (ann.type === 'text') {
        if (!ann.text) continue;
        const size = ann.fontSize;
        const textY = pdfHeight - ann.ny * pdfHeight - size;
        const { r, g, b } = hexToRgb(ann.color);
        const font = ann.bold ? helveticaBold : ann.italic ? helveticaItalic : helveticaFont;
        
        // Handle text alignment
        let textX = x;
        if (ann.align === 'center') textX = x + w / 2;
        else if (ann.align === 'right') textX = x + w - w * 0.9;
        
        page.drawText(ann.text, {
          x: textX,
          y: textY,
          size,
          font,
          color: rgb(r, g, b),
          maxWidth: w * 0.9,
          lineHeight: size * 1.2,
          opacity: ann.opacity || 1,
        });
        
        if (ann.underline) {
          page.drawLine({
            start: { x: textX, y: textY - 2 },
            end: { x: textX + w * 0.9, y: textY - 2 },
            thickness: size / 12,
            color: rgb(r, g, b),
            opacity: ann.opacity || 1,
          });
        }
      } else if (ann.type === 'rect') {
        const { r, g, b } = hexToRgb(ann.strokeColor);
        const { r: fr, g: fg, b: fb } = hexToRgb(ann.fillColor);
        page.drawRectangle({
          x, y, width: w, height: h,
          borderColor: rgb(r, g, b),
          borderWidth: ann.strokeWidth,
          color: ann.fillColor === '#FFFFFF' ? undefined : rgb(fr, fg, fb),
          opacity: ann.opacity || 1,
        });
      } else if (ann.type === 'circle') {
        const { r, g, b } = hexToRgb(ann.strokeColor);
        const { r: fr, g: fg, b: fb } = hexToRgb(ann.fillColor);
        page.drawEllipse({
          x: x + w / 2, y: y + h / 2,
          xScale: w / 2, yScale: h / 2,
          borderColor: rgb(r, g, b),
          borderWidth: ann.strokeWidth,
          color: ann.fillColor === '#FFFFFF' ? undefined : rgb(fr, fg, fb),
          opacity: ann.opacity || 1,
        });
      } else if (ann.type === 'line') {
        const { r, g, b } = hexToRgb(ann.strokeColor);
        page.drawLine({
          start: { x, y: y + h },
          end: { x: x + w, y },
          thickness: ann.strokeWidth,
          color: rgb(r, g, b),
          opacity: ann.opacity || 1,
        });
      } else if (ann.type === 'arrow') {
        const { r, g, b } = hexToRgb(ann.strokeColor);
        const endX = x + w * 0.85;
        const endY = y;
        const headLen = Math.min(15, w * 0.15);
        const angle = Math.atan2(-h, w);
        
        // Draw line
        page.drawLine({
          start: { x, y: y + h },
          end: { x: endX, y: endY },
          thickness: ann.strokeWidth,
          color: rgb(r, g, b),
          opacity: ann.opacity || 1,
        });
        
        // Draw arrowhead
        const ax1 = endX - headLen * Math.cos(angle - Math.PI / 6);
        const ay1 = endY + headLen * Math.sin(angle - Math.PI / 6) + h;
        const ax2 = endX - headLen * Math.cos(angle + Math.PI / 6);
        const ay2 = endY + headLen * Math.sin(angle + Math.PI / 6) + h;
        
        page.drawLine({
          start: { x: endX, y: endY },
          end: { x: ax1, y: ay1 },
          thickness: ann.strokeWidth,
          color: rgb(r, g, b),
          opacity: ann.opacity || 1,
        });
        page.drawLine({
          start: { x: endX, y: endY },
          end: { x: ax2, y: ay2 },
          thickness: ann.strokeWidth,
          color: rgb(r, g, b),
          opacity: ann.opacity || 1,
        });
      } else if (ann.type === 'highlight') {
        const { r, g, b } = hexToRgb(ann.color);
        page.drawRectangle({
          x, y, width: w, height: h,
          color: rgb(r, g, b),
          opacity: ann.opacity || 0.4,
        });
      }
    }
  }

  return await pdf.save();
}

export function downloadFile(
  data: Uint8Array | Blob | string,
  filename: string,
  mimeType: string
) {
  let blob: Blob;
  if (typeof data === 'string') {
    const byteString = atob(data.split(',')[1]);
    const mimeString = data.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    blob = new Blob([ab], { type: mimeString });
  } else if (data instanceof Uint8Array) {
    blob = new Blob([data], { type: mimeType });
  } else {
    blob = data;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// PDF Encryption using @pdfsmaller/pdf-encrypt-lite (RC4 128-bit)
// Decryption requires server-side processing due to browser security restrictions

export async function encryptPdf(file: File, password: string): Promise<Uint8Array> {
  const { encryptPDF } = await import('@pdfsmaller/pdf-encrypt-lite');
  const arrayBuffer = await file.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);
  return await encryptPDF(pdfBytes, password, password);
}

export async function decryptPdf(file: File, password: string): Promise<Uint8Array> {
  // Browser cannot decrypt PDFs - requires server-side processing
  // For security reasons, browsers block attempts to decrypt encrypted PDFs
  console.warn('PDF decryption is not available in browser. This requires server-side processing.');
  throw new Error('PDF decryption is not supported in browser. Please use a desktop PDF application to decrypt the file, then upload it again.');
}

export async function removePdfPassword(file: File, currentPassword: string): Promise<Uint8Array> {
  // Browser cannot remove password - requires server-side processing
  console.warn('PDF password removal is not available in browser.');
  throw new Error('PDF password removal is not supported in browser. Please use a desktop PDF application to remove the password.');
}

export async function isPdfPasswordProtected(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    await PDFDocument.load(arrayBuffer);
    return false; // No password required
  } catch (error: any) {
    // If error mentions password, it's protected
    if (error.message && (error.message.includes('password') || error.message.includes('encrypted'))) {
      return true;
    }
    return false;
  }
}
