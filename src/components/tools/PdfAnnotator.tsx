'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from '../FileUpload';
import { renderPdfPageToImage, applyAnnotationsToPdf, downloadFile, getPdfDocument } from '@/lib/pdf-utils';
import { Download, Loader2, MousePointer2, Eraser, Type, ChevronLeft, ChevronRight, Trash2, FileText, ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

type Annotation = 
  | { id: string, type: 'eraser', nx: number, ny: number, nw: number, nh: number }
  | { id: string, type: 'text', nx: number, ny: number, nw: number, nh: number, text: string, fontSize: number, color: string }
  | { id: string, type: 'patch', nx: number, ny: number, nw: number, nh: number, imageData: string };

export function PdfAnnotator() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageData, setPageData] = useState<{ image: string, width: number, height: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<'select' | 'eraser' | 'text' | 'move-area'>('select');
  const [annotations, setAnnotations] = useState<Record<number, Annotation[]>>({});
  const [zoom, setZoom] = useState(1.0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ nx: 0, ny: 0 });
  const [drawCurrent, setDrawCurrent] = useState({ nx: 0, ny: 0 });
  const [interaction, setInteraction] = useState<{
    id: string; type: 'move' | 'resize'; startNX: number; startNY: number;
    initialNX: number; initialNY: number; initialNW?: number; initialNH?: number;
  } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textSize, setTextSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile); setLoading(true); setAnnotations({}); setCurrentPage(0); setZoom(1.0);
    try {
      const pdf = await getPdfDocument(selectedFile);
      setNumPages(pdf.numPages);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert(`Error loading PDF: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };

  const loadPage = async (f: File, pageIndex: number) => {
    setLoading(true);
    try {
      const data = await renderPdfPageToImage(f, pageIndex, 2.0);
      setPageData(data);
    } catch (error) { console.error("Error rendering page:", error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (file && currentPage >= 0) loadPage(file, currentPage);
  }, [currentPage, file]);

  const getNormalizedCoords = (e: React.PointerEvent | PointerEvent) => {
    if (!overlayRef.current) return { nx: 0, ny: 0 };
    const rect = overlayRef.current.getBoundingClientRect();
    return { nx: (e.clientX - rect.left) / rect.width, ny: (e.clientY - rect.top) / rect.height };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (editingTextId) return;
    const { nx, ny } = getNormalizedCoords(e);
    if (activeTool === 'select') {
      const pageAnns = annotations[currentPage] || [];
      const clickedAnn = [...pageAnns].reverse().find(ann => {
        if (ann.type === 'eraser' || ann.type === 'patch') {
          return nx >= ann.nx && nx <= ann.nx + ann.nw && ny >= ann.ny && ny <= ann.ny + ann.nh;
        }
        return Math.abs(nx - ann.nx) < 0.05 && Math.abs(ny - ann.ny) < 0.02;
      });
      if (clickedAnn) {
        setSelectedId(clickedAnn.id);
        if (clickedAnn.type === 'text') { setTextSize(clickedAnn.fontSize); setTextColor(clickedAnn.color); }
      } else { setSelectedId(null); }
    } else if (activeTool === 'eraser' || activeTool === 'text' || activeTool === 'move-area') {
      setIsDrawing(true); setDrawStart({ nx, ny }); setDrawCurrent({ nx, ny }); setSelectedId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { nx, ny } = getNormalizedCoords(e);
    if (isDrawing && (activeTool === 'eraser' || activeTool === 'text' || activeTool === 'move-area')) {
      setDrawCurrent({ nx: Math.max(0, Math.min(1, nx)), ny: Math.max(0, Math.min(1, ny)) });
    } else if (interaction) {
      const dx = nx - interaction.startNX;
      const dy = ny - interaction.startNY;
      if (interaction.type === 'move') updateAnnotation(interaction.id, { nx: interaction.initialNX + dx, ny: interaction.initialNY + dy });
      else if (interaction.type === 'resize') updateAnnotation(interaction.id, { nw: Math.max(0.01, (interaction.initialNW || 0) + dx), nh: Math.max(0.01, (interaction.initialNH || 0) + dy) });
    }
  };

  const handlePointerUp = async () => {
    if (isDrawing) {
      setIsDrawing(false);
      const nw = Math.abs(drawCurrent.nx - drawStart.nx);
      const nh = Math.abs(drawCurrent.ny - drawStart.ny);
      const nx = Math.min(drawStart.nx, drawCurrent.nx);
      const ny = Math.min(drawStart.ny, drawCurrent.ny);
      if (activeTool === 'eraser' && nw > 0.005 && nh > 0.005) {
        const newAnn: Annotation = { id: Date.now().toString(), type: 'eraser', nx, ny, nw, nh };
        setAnnotations(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] || []), newAnn] }));
      } else if (activeTool === 'text' && nw > 0.005 && nh > 0.005) {
        const newAnn: Annotation = { id: Date.now().toString(), type: 'text', nx, ny, nw, nh, text: '', fontSize: textSize, color: textColor };
        setAnnotations(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] || []), newAnn] }));
        setEditingTextId(newAnn.id); setSelectedId(newAnn.id); setActiveTool('select');
      } else if (activeTool === 'move-area' && nw > 0.005 && nh > 0.005 && pageData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image(); img.src = pageData.image;
        await new Promise(resolve => img.onload = resolve);
        canvas.width = nw * pageData.width; canvas.height = nh * pageData.height;
        if (ctx) {
          ctx.drawImage(img, nx * pageData.width, ny * pageData.height, nw * pageData.width, nh * pageData.height, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/png');
          const eraserAnn: Annotation = { id: Date.now().toString() + '-e', type: 'eraser', nx, ny, nw, nh };
          const patchAnn: Annotation = { id: Date.now().toString() + '-p', type: 'patch', nx, ny, nw, nh, imageData };
          setAnnotations(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] || []), eraserAnn, patchAnn] }));
          setSelectedId(patchAnn.id); setActiveTool('select');
        }
      }
    }
    setInteraction(null);
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev => ({
      ...prev,
      [currentPage]: (prev[currentPage] || []).map(a => a.id === id ? { ...a, ...updates } as Annotation : a)
    }));
  };

  const handlePropertyChange = (updates: Partial<Annotation>) => {
    if (selectedId) updateAnnotation(selectedId, updates);
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => ({ ...prev, [currentPage]: prev[currentPage].filter(a => a.id !== id) }));
  };

  const startMove = (e: React.PointerEvent, ann: Annotation) => {
    if (activeTool !== 'select') return;
    e.stopPropagation(); setSelectedId(ann.id);
    if (ann.type === 'text') { setTextSize(ann.fontSize); setTextColor(ann.color); }
    const { nx, ny } = getNormalizedCoords(e);
    setInteraction({ id: ann.id, type: 'move', startNX: nx, startNY: ny, initialNX: ann.nx, initialNY: ann.ny });
  };

  const startResize = (e: React.PointerEvent, ann: Annotation) => {
    if (activeTool !== 'select' || (ann.type !== 'eraser' && ann.type !== 'patch')) return;
    e.stopPropagation();
    const { nx, ny } = getNormalizedCoords(e);
    setInteraction({ id: ann.id, type: 'resize', startNX: nx, startNY: ny, initialNX: ann.nx, initialNY: ann.ny, initialNW: ann.nw, initialNH: ann.nh });
  };

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const modifiedPdfBytes = await applyAnnotationsToPdf(file, annotations);
      downloadFile(modifiedPdfBytes, `annotated_${file.name}`, 'application/pdf');
      const modifiedFile = new File([modifiedPdfBytes], file.name, { type: 'application/pdf' });
      setFile(modifiedFile); setAnnotations({});
      loadPage(modifiedFile, currentPage);
    } catch (error) { console.error("Error saving PDF:", error); alert("Error saving PDF."); }
    finally { setProcessing(false); }
  };

  if (!file) {
    return (
      <div className="max-w-3xl mx-auto mt-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Annotate PDF</h2>
          <p className="text-gray-500 mt-2">Erase text, add text, and move content</p>
        </div>
        <FileUpload onFilesSelected={handleFileSelect} accept={{ 'application/pdf': ['.pdf'] }} multiple={false} />
      </div>
    );
  }

  const currentAnnotations = annotations[currentPage] || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />{file.name}
          </h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setFile(null); setAnnotations({}); }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={processing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Save Changes
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 shrink-0 bg-gray-50 p-2 rounded-xl border border-gray-200 items-center justify-between overflow-x-auto">
        <div className="flex gap-2 shrink-0">
          <button onClick={() => { setActiveTool('select'); setSelectedId(null); }}
            className={cn("p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors", activeTool === 'select' ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:bg-gray-200/50")} title="Select & Move">
            <MousePointer2 className="w-4 h-4" /> Select
          </button>
          <button onClick={() => { setActiveTool('move-area'); setSelectedId(null); }}
            className={cn("p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors", activeTool === 'move-area' ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:bg-gray-200/50")} title="Move Area">
            <Move className="w-4 h-4" /> Move
          </button>
          <button onClick={() => { setActiveTool('eraser'); setSelectedId(null); }}
            className={cn("p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors", activeTool === 'eraser' ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:bg-gray-200/50")} title="Eraser">
            <Eraser className="w-4 h-4" /> Eraser
          </button>
          <button onClick={() => { setActiveTool('text'); setSelectedId(null); }}
            className={cn("p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors", activeTool === 'text' ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:bg-gray-200/50")} title="Add Text">
            <Type className="w-4 h-4" /> Text
          </button>
        </div>

        <div className="flex items-center gap-2 border-l border-gray-300 pl-4 shrink-0">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 rounded hover:bg-gray-200" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 rounded hover:bg-gray-200" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => setZoom(1.0)} className="p-1.5 rounded hover:bg-gray-200" title="Reset"><Maximize className="w-4 h-4" /></button>
        </div>

        {(activeTool === 'text' || (selectedId && currentAnnotations.find(a => a.id === selectedId)?.type === 'text')) && (
          <div className="flex items-center gap-3 border-l border-gray-300 pl-4 shrink-0">
            <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); handlePropertyChange({ color: e.target.value }); }}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
            <select value={textSize} onChange={(e) => { const size = Number(e.target.value); setTextSize(size); handlePropertyChange({ fontSize: size }); }}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
              {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (<option key={size} value={size}>{size}px</option>))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0 || loading} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">{currentPage + 1} / {numPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(numPages - 1, p + 1))} disabled={currentPage === numPages - 1 || loading} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 rounded-xl border border-gray-200 flex justify-center p-8 relative">
        {loading || !pageData ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" /><p className="text-gray-500">Loading page...</p>
          </div>
        ) : (
          <div className="relative shadow-2xl bg-white origin-top transition-transform duration-200" style={{ width: 'fit-content', height: 'fit-content', transform: `scale(${zoom})` }}>
            <img src={pageData.image} alt={`Page ${currentPage + 1}`} className="max-w-full h-auto block select-none" draggable={false} />
            <div ref={overlayRef}
              className={cn("absolute inset-0 z-10", activeTool === 'eraser' ? "cursor-crosshair" : activeTool === 'text' ? "cursor-text" : "cursor-default")}
              onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
              {currentAnnotations.map(ann => {
                if (ann.type === 'eraser' || ann.type === 'patch') {
                  const isSelected = selectedId === ann.id;
                  return (
                    <div key={ann.id}
                      className={cn("absolute group", ann.type === 'patch' ? "bg-transparent" : "bg-white",
                        activeTool === 'select' && "hover:ring-2 hover:ring-blue-400 cursor-move", isSelected && "ring-2 ring-blue-600 z-20")}
                      style={{ left: `${ann.nx * 100}%`, top: `${ann.ny * 100}%`, width: `${ann.nw * 100}%`, height: `${ann.nh * 100}%`,
                        border: (activeTool === 'eraser' || activeTool === 'move-area' || activeTool === 'select') && ann.type === 'eraser' ? '1px solid rgba(0,0,0,0.1)' : 'none' }}
                      onPointerDown={(e) => startMove(e, ann)}>
                      {ann.type === 'patch' && (<img src={ann.imageData} alt="patch" className="w-full h-full object-fill pointer-events-none" draggable={false} />)}
                      {activeTool === 'select' && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); setSelectedId(null); }}
                            className={cn("absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full transition-opacity z-20", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div onPointerDown={(e) => startResize(e, ann)}
                            className={cn("absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-blue-600 rounded-full z-20 transition-opacity", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 cursor-se-resize")} />
                        </>
                      )}
                    </div>
                  );
                } else {
                  const isSelected = selectedId === ann.id;
                  const isEditing = editingTextId === ann.id;
                  return (
                    <div key={ann.id} className={cn("absolute group", activeTool === 'select' && "cursor-move", isSelected && "z-20")}
                      style={{ left: `${ann.nx * 100}%`, top: `${ann.ny * 100}%`, width: `${ann.nw * 100}%`, height: `${ann.nh * 100}%` }}
                      onPointerDown={(e) => startMove(e, ann)}>
                      {isEditing ? (
                        <textarea autoFocus value={ann.text}
                          onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                          onBlur={() => setEditingTextId(null)}
                          className="w-full h-full bg-transparent border border-blue-300 rounded p-1 text-xs resize-none outline-none"
                          style={{ fontSize: `${ann.fontSize}px`, color: ann.color }} />
                      ) : (
                        <div className="w-full h-full flex items-start justify-center overflow-hidden p-1 pointer-events-none"
                          style={{ fontSize: `${ann.fontSize}px`, color: ann.color, lineHeight: '1.2' }}>
                          {ann.text}
                        </div>
                      )}
                      {activeTool === 'select' && (
                        <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); setSelectedId(null); }}
                          className={cn("absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full transition-opacity z-20", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
