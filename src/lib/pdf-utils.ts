import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';

// pdfjs-dist v3.x with legacy build for Next.js compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

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
  const pages = pdf.getPages();

  for (const [pageIndexStr, annotations] of Object.entries(annotationsByPage)) {
    const pageIndex = parseInt(pageIndexStr, 10);
    const page = pages[pageIndex];
    if (!page) continue;

    const { width: pdfWidth, height: pdfHeight } = page.getSize();

    for (const ann of annotations) {
      if (ann.type === 'eraser') {
        const x = ann.nx * pdfWidth;
        const y = pdfHeight - ann.ny * pdfHeight - ann.nh * pdfHeight;
        const width = ann.nw * pdfWidth;
        const height = ann.nh * pdfHeight;
        page.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1) });
      } else if (ann.type === 'patch') {
        const x = ann.nx * pdfWidth;
        const y = pdfHeight - ann.ny * pdfHeight - ann.nh * pdfHeight;
        const width = ann.nw * pdfWidth;
        const height = ann.nh * pdfHeight;
        try {
          const base64Data = ann.imageData.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const embeddedImage = await pdf.embedPng(bytes);
          page.drawImage(embeddedImage, { x, y, width, height });
        } catch (err) {
          console.error('Error embedding patch image:', err);
        }
      } else if (ann.type === 'text') {
        if (!ann.text) continue;
        const x = ann.nx * pdfWidth;
        const size = ann.fontSize;
        const y = pdfHeight - ann.ny * pdfHeight - size;
        const maxWidth = ann.nw * pdfWidth;
        const hex = ann.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        page.drawText(ann.text, {
          x,
          y,
          size,
          font: helveticaFont,
          color: rgb(r, g, b),
          maxWidth,
          lineHeight: size * 1.2,
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
