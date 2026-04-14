'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, Sparkles, Loader2, Image as ImageIcon, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFDocument } from 'pdf-lib';
import { getPdfDocument } from '@/lib/pdf-utils';
import { GoogleGenAI } from "@google/genai";

type FileType = 'pdf' | 'image' | null;

export function ResolutionEnhancer() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.type === 'application/pdf') { setFileType('pdf'); }
    else if (selectedFile.type.startsWith('image/')) { setFileType('image'); }
    else { setError('Please select a valid PDF or image file.'); return; }
    setFile(selectedFile); setError(null); setResultUrl(null); setProgress(0); setStatus('');
  };

  const enhanceImage = async (imageFile: File) => {
    setIsProcessing(true);
    setStatus('Enhancing image with AI...');
    setProgress(20);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(imageFile);
      });
      const base64Data = await base64Promise;
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) { throw new Error('Gemini API key not configured.'); }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: imageFile.type } },
            { text: `Enhance this image to ${scale}x higher resolution. Improve sharpness, remove noise, and maintain all original details perfectly.` },
          ],
        },
      });
      setProgress(80);
      let enhancedImageUrl = null;
      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if ((part as any).inlineData) { enhancedImageUrl = `data:image/png;base64,${(part as any).inlineData.data}`; break; }
        }
      }
      if (!enhancedImageUrl) { throw new Error('AI could not generate image.'); }
      setResultUrl(enhancedImageUrl); setStatus('Done!'); setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error enhancing image.');
    } finally { setIsProcessing(false); }
  };

  const enhancePdf = async (pdfFile: File) => {
    setIsProcessing(true);
    setStatus('Processing PDF pages at high resolution...');
    setProgress(10);
    try {
      const pdf = await getPdfDocument(pdfFile);
      const numPages = pdf.numPages;
      const outPdf = await PDFDocument.create();
      for (let i = 1; i <= numPages; i++) {
        setStatus(`Processing page ${i}/${numPages}...`);
        setProgress(10 + (i / numPages) * 80);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;
        canvas.height = viewport.height; canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport, canvas: canvas as any } as any).promise;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgBytes = await fetch(imgData).then(res => res.arrayBuffer());
        const pdfImg = await outPdf.embedJpg(imgBytes);
        const pdfPage = outPdf.addPage([viewport.width, viewport.height]);
        pdfPage.drawImage(pdfImg, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      }
      const pdfBytes = await outPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob)); setStatus('Done!'); setProgress(100);
    } catch (err) {
      console.error(err);
      setError('Error processing PDF.');
    } finally { setIsProcessing(false); }
  };

  const handleEnhance = () => {
    if (!file) return;
    if (fileType === 'pdf') enhancePdf(file); else enhanceImage(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Resolution Enhancer</h2>
        <p className="text-gray-500">Upscale PDFs and images with AI-powered enhancement.</p>
      </div>
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8">
          {!file ? (
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/pdf,image/*" />
              <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Select or Drop File</h3>
              <p className="text-sm text-gray-500 mt-1">PDF, PNG, JPG or WebP (Max 10MB)</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    {fileType === 'pdf' ? <FileText className="w-6 h-6 text-red-500" /> : <ImageIcon className="w-6 h-6 text-blue-500" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 truncate max-w-[200px]">{file.name}</div>
                    <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setResultUrl(null); }} className="text-sm text-gray-400 hover:text-red-500 font-medium">Change</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Scale Factor</label>
                  <div className="flex gap-2">
                    {[2, 4].map((s) => (
                      <button key={s} onClick={() => setScale(s)}
                        className={cn("flex-1 py-2 rounded-xl border font-medium transition-all",
                          scale === s ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" : "bg-white border-gray-200 text-gray-600 hover:border-blue-200")}>
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Method</label>
                  <div className="py-2 px-4 rounded-xl border border-gray-100 bg-gray-50 text-gray-600 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    {fileType === 'pdf' ? 'High Quality Render' : 'AI Super Resolution'}
                  </div>
                </div>
              </div>
              {isProcessing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-blue-600" />{status}</span>
                    <span className="text-blue-600 font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : resultUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-2xl border border-green-100">
                    <CheckCircle2 className="w-5 h-5" /><span className="font-medium">Successfully enhanced!</span>
                  </div>
                  <a href={resultUrl} download={`enhanced_${file?.name}`}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    <Download className="w-5 h-5" /> Download Enhanced File
                  </a>
                </div>
              ) : (
                <button onClick={handleEnhance}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl">
                  <Sparkles className="w-5 h-5 text-blue-400" /> Enhance Now
                </button>
              )}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
                  <AlertCircle className="w-5 h-5" /><span className="text-sm font-medium">{error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-blue-50 rounded-3xl space-y-2 border border-blue-100">
          <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"><Sparkles className="w-5 h-5 text-blue-600" /></div>
          <h4 className="font-bold text-gray-900">AI Enhancement</h4>
          <p className="text-xs text-gray-600 leading-relaxed">Remove pixelation and reconstruct details with AI.</p>
        </div>
        <div className="p-6 bg-purple-50 rounded-3xl space-y-2 border border-purple-100">
          <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"><FileText className="w-5 h-5 text-purple-600" /></div>
          <h4 className="font-bold text-gray-900">High Quality Render</h4>
          <p className="text-xs text-gray-600 leading-relaxed">Re-render PDF pages at high DPI for crystal clarity.</p>
        </div>
        <div className="p-6 bg-orange-50 rounded-3xl space-y-2 border border-orange-100">
          <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"><ImageIcon className="w-5 h-5 text-orange-600" /></div>
          <h4 className="font-bold text-gray-900">Noise Reduction</h4>
          <p className="text-xs text-gray-600 leading-relaxed">Clean digital noise from low-light or old photos.</p>
        </div>
      </div>
    </div>
  );
}
