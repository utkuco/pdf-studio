'use client';

import React, { useState } from 'react';
import { FileUpload } from '../FileUpload';
import { renderPdfPagesToImages, editPdfPages, downloadFile } from '@/lib/pdf-utils';
import { Trash2, RotateCw, Download, Loader2, FileText } from 'lucide-react';

export function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [actions, setActions] = useState<{ type: 'delete' | 'rotate', pageIndex: number, rotation?: number }[]>([]);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setLoading(true);
    setActions([]);
    try {
      const renderedPages = await renderPdfPagesToImages(selectedFile, 1.0);
      setPages(renderedPages);
    } catch (error) {
      console.error("Error rendering PDF:", error);
      alert("Error loading PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = (index: number) => {
    setActions(prev => [...prev, { type: 'rotate', pageIndex: index, rotation: 90 }]);
  };

  const handleDelete = (index: number) => {
    setActions(prev => [...prev, { type: 'delete', pageIndex: index }]);
  };

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const modifiedPdfBytes = await editPdfPages(file, actions);
      downloadFile(modifiedPdfBytes, `edited_${file.name}`, 'application/pdf');
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert("Error saving PDF.");
    } finally {
      setProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="max-w-3xl mx-auto mt-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Edit Pages</h2>
          <p className="text-gray-500 mt-2">Delete or rotate pages</p>
        </div>
        <FileUpload onFilesSelected={handleFileSelect} accept={{ 'application/pdf': ['.pdf'] }} multiple={false} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            {file.name}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{pages.length} pages</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setFile(null); setPages([]); setActions([]); }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={processing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500">Loading pages...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {pages.map((pageData, index) => {
            const rotations = actions.filter(a => a.type === 'rotate' && a.pageIndex === index).length;
            const isDeleted = actions.some(a => a.type === 'delete' && a.pageIndex === index);
            if (isDeleted) return null;
            return (
              <div key={index} className="relative group bg-white p-2 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-[1/1.4] overflow-hidden bg-gray-100 rounded-lg flex items-center justify-center">
                  <img src={pageData} alt={`Page ${index + 1}`} className="max-w-full max-h-full object-contain transition-transform duration-300"
                    style={{ transform: `rotate(${rotations * 90}deg)` }} />
                </div>
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleRotate(index)} className="p-2 bg-white/90 backdrop-blur text-gray-700 rounded-full shadow hover:bg-blue-50 hover:text-blue-600" title="Rotate">
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(index)} className="p-2 bg-white/90 backdrop-blur text-gray-700 rounded-full shadow hover:bg-red-50 hover:text-red-600" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 text-center text-xs font-medium text-gray-500">Page {index + 1}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
