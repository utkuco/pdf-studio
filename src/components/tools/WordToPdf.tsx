'use client';

import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import mammoth from 'mammoth';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) { setFile(selectedFile); setError(null); setSuccess(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    multiple: false
  } as any);

  const handleConvert = async () => {
    if (!file) return;
    setConverting(true); setError(null); setSuccess(false);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      if (previewRef.current) {
        previewRef.current.innerHTML = html;
        const opt = {
          margin: 1,
          filename: `${file.name.replace('.docx', '')}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
        };
        await html2pdf().set(opt).from(previewRef.current).save();
        setSuccess(true);
      }
    } catch (err) {
      console.error('Conversion error:', err);
      setError('An error occurred during conversion.');
    } finally { setConverting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Word to PDF</h2>
        <p className="text-gray-600">Convert .docx files to PDF in seconds.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {!file ? (
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
            <input {...getInputProps()} />
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{isDragActive ? 'Drop file here' : 'Drag Word file here'}</h3>
            <p className="text-sm text-gray-500">or click to browse (.docx)</p>
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
              <button onClick={() => setFile(null)} className="text-sm text-red-600 hover:text-red-700 font-medium">Remove</button>
            </div>
            {error && (<div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100"><AlertCircle className="w-5 h-5 flex-shrink-0" /><p className="text-sm font-medium">{error}</p></div>)}
            {success && (<div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100"><CheckCircle2 className="w-5 h-5 flex-shrink-0" /><p className="text-sm font-medium">Successfully converted and downloaded!</p></div>)}
            <button onClick={handleConvert} disabled={converting}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${converting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}>
              {converting ? (<><Loader2 className="w-5 h-5 animate-spin" /> Converting...</>) : (<><Download className="w-5 h-5" /> Download as PDF</>)}
            </button>
          </div>
        )}
      </div>
      <div ref={previewRef} className="absolute -left-[9999px] top-0 w-[800px]" style={{ padding: '40px', backgroundColor: 'white', color: 'black', fontFamily: 'serif', lineHeight: '1.6' }} />
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4"><CheckCircle2 className="w-6 h-6 text-purple-600" /></div>
          <h4 className="font-bold text-gray-900 mb-2">Fast Conversion</h4>
          <p className="text-sm text-gray-500">Convert Word documents to PDF in seconds.</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4"><CheckCircle2 className="w-6 h-6 text-blue-600" /></div>
          <h4 className="font-bold text-gray-900 mb-2">Privacy First</h4>
          <p className="text-sm text-gray-500">All processing happens in your browser.</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center mb-4"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>
          <h4 className="font-bold text-gray-900 mb-2">Easy to Use</h4>
          <p className="text-sm text-gray-500">Drag and drop for effortless file upload.</p>
        </div>
      </div>
    </div>
  );
}
