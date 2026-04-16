'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileUpload } from '../FileUpload';
import { renderPdfPageToImage, applyAnnotationsToPdf, downloadFile, getPdfDocument } from '@/lib/pdf-utils';
import { Download, Loader2, MousePointer2, Eraser, Type, ChevronLeft, ChevronRight, Trash2, FileText, ZoomIn, ZoomOut, Maximize, Move, Square, Circle, Minus, ArrowRight, Highlighter, Undo2, Redo2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

// Annotation types
type AnnotationType = 
  | { id: string; type: 'text'; nx: number; ny: number; nw: number; nh: number; text: string; fontSize: number; color: string; bold: boolean; italic: boolean; underline: boolean; align: 'left' | 'center' | 'right'; opacity: number }
  | { id: string; type: 'rect'; nx: number; ny: number; nw: number; nh: number; strokeColor: string; fillColor: string; strokeWidth: number; opacity: number }
  | { id: string; type: 'circle'; nx: number; ny: number; nw: number; nh: number; strokeColor: string; fillColor: string; strokeWidth: number; opacity: number }
  | { id: string; type: 'line'; nx: number; ny: number; nw: number; nh: number; strokeColor: string; strokeWidth: number; opacity: number }
  | { id: string; type: 'arrow'; nx: number; ny: number; nw: number; nh: number; strokeColor: string; strokeWidth: number; opacity: number }
  | { id: string; type: 'highlight'; nx: number; ny: number; nw: number; nh: number; color: string; opacity: number }
  | { id: string; type: 'eraser'; nx: number; ny: number; nw: number; nh: number }
  | { id: string; type: 'patch'; nx: number; ny: number; nw: number; nh: number; imageData: string };

type Tool = 'select' | 'eraser' | 'text' | 'move-area' | 'rect' | 'circle' | 'line' | 'arrow' | 'highlight';

// Color presets
const COLOR_PRESETS = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF6600', '#9900FF', '#FFFFFF'];

// History for undo/redo
interface HistoryState {
  annotations: Record<number, AnnotationType[]>;
}

export function PdfAnnotator() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageData, setPageData] = useState<{ image: string, width: number, height: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [annotations, setAnnotations] = useState<Record<number, AnnotationType[]>>({});
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
  
  // Text properties
  const [textSize, setTextSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [textOpacity, setTextOpacity] = useState(1);
  
  // Shape properties
  const [shapeStrokeColor, setShapeStrokeColor] = useState('#000000');
  const [shapeFillColor, setShapeFillColor] = useState('#FFFFFF');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);
  const [shapeOpacity, setShapeOpacity] = useState(1);
  
  // Highlight property
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [highlightOpacity, setHighlightOpacity] = useState(0.4);
  
  // History
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const overlayRef = useRef<HTMLDivElement>(null);

  // Save to history
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ annotations: JSON.parse(JSON.stringify(annotations)) });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [annotations, history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setAnnotations(prevState.annotations);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setAnnotations(nextState.annotations);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === 'Delete' && selectedId) {
        deleteAnnotation(selectedId);
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setEditingTextId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, undo, redo]);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile); setLoading(true); setAnnotations({}); setCurrentPage(0); setZoom(1.0); setHistory([]); setHistoryIndex(-1);
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
        if (ann.type === 'text') {
          return nx >= ann.nx && nx <= ann.nx + ann.nw && ny >= ann.ny && ny <= ann.ny + ann.nh;
        }
        // Shape types
        return nx >= ann.nx && nx <= ann.nx + ann.nw && ny >= ann.ny && ny <= ann.ny + ann.nh;
      });
      if (clickedAnn) {
        setSelectedId(clickedAnn.id);
        if (clickedAnn.type === 'text') {
          setTextSize(clickedAnn.fontSize);
          setTextColor(clickedAnn.color);
          setTextBold(clickedAnn.bold);
          setTextItalic(clickedAnn.italic);
          setTextUnderline(clickedAnn.underline);
          setTextAlign(clickedAnn.align);
          setTextOpacity(clickedAnn.opacity);
        }
        if (clickedAnn.type === 'rect' || clickedAnn.type === 'circle') {
          setShapeStrokeColor(clickedAnn.strokeColor);
          setShapeFillColor(clickedAnn.fillColor);
          setShapeStrokeWidth(clickedAnn.strokeWidth);
          setShapeOpacity(clickedAnn.opacity);
        }
        if (clickedAnn.type === 'line' || clickedAnn.type === 'arrow') {
          setShapeStrokeColor(clickedAnn.strokeColor);
          setShapeStrokeWidth(clickedAnn.strokeWidth);
          setShapeOpacity(clickedAnn.opacity);
        }
        if (clickedAnn.type === 'highlight') {
          setHighlightColor(clickedAnn.color);
          setHighlightOpacity(clickedAnn.opacity);
        }
      } else { setSelectedId(null); }
    } else if (['eraser', 'text', 'move-area', 'rect', 'circle', 'line', 'arrow', 'highlight'].includes(activeTool)) {
      setIsDrawing(true); setDrawStart({ nx, ny }); setDrawCurrent({ nx, ny }); setSelectedId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { nx, ny } = getNormalizedCoords(e);
    if (isDrawing && ['eraser', 'text', 'move-area', 'rect', 'circle', 'line', 'arrow', 'highlight'].includes(activeTool)) {
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
      
      const addAnnotation = (ann: AnnotationType) => {
        saveToHistory();
        setAnnotations(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] || []), ann] }));
      };

      if (activeTool === 'eraser' && nw > 0.005 && nh > 0.005) {
        addAnnotation({ id: Date.now().toString(), type: 'eraser', nx, ny, nw, nh });
      } else if (activeTool === 'text' && nw > 0.005 && nh > 0.005) {
        const newAnn: AnnotationType = { id: Date.now().toString(), type: 'text', nx, ny, nw, nh, text: '', fontSize: textSize, color: textColor, bold: textBold, italic: textItalic, underline: textUnderline, align: textAlign, opacity: textOpacity };
        addAnnotation(newAnn);
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
          addAnnotation({ id: Date.now().toString() + '-e', type: 'eraser', nx, ny, nw, nh });
          addAnnotation({ id: Date.now().toString() + '-p', type: 'patch', nx, ny, nw, nh, imageData });
          setSelectedId(null); setActiveTool('select');
        }
      } else if (activeTool === 'rect' && nw > 0.005 && nh > 0.005) {
        addAnnotation({ id: Date.now().toString(), type: 'rect', nx, ny, nw, nh, strokeColor: shapeStrokeColor, fillColor: shapeFillColor, strokeWidth: shapeStrokeWidth, opacity: shapeOpacity });
      } else if (activeTool === 'circle' && nw > 0.005 && nh > 0.005) {
        addAnnotation({ id: Date.now().toString(), type: 'circle', nx, ny, nw, nh, strokeColor: shapeStrokeColor, fillColor: shapeFillColor, strokeWidth: shapeStrokeWidth, opacity: shapeOpacity });
      } else if (activeTool === 'line' && nw > 0.005 && nh > 0.005) {
        addAnnotation({ id: Date.now().toString(), type: 'line', nx, ny, nw, nh, strokeColor: shapeStrokeColor, strokeWidth: shapeStrokeWidth, opacity: shapeOpacity });
      } else if (activeTool === 'arrow' && nw > 0.005 && nh > 0.005) {
        addAnnotation({ id: Date.now().toString(), type: 'arrow', nx, ny, nw, nh, strokeColor: shapeStrokeColor, strokeWidth: shapeStrokeWidth, opacity: shapeOpacity });
      } else if (activeTool === 'highlight' && nw > 0.005 && nh > 0.005) {
        addAnnotation({ id: Date.now().toString(), type: 'highlight', nx, ny, nw, nh, color: highlightColor, opacity: highlightOpacity });
      }
    }
    setInteraction(null);
  };

  const updateAnnotation = (id: string, updates: Partial<AnnotationType>) => {
    setAnnotations(prev => ({
      ...prev,
      [currentPage]: (prev[currentPage] || []).map(a => a.id === id ? { ...a, ...updates } as AnnotationType : a)
    }));
  };

  const deleteAnnotation = (id: string) => {
    saveToHistory();
    setAnnotations(prev => ({ ...prev, [currentPage]: prev[currentPage].filter(a => a.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const startMove = (e: React.PointerEvent, ann: AnnotationType) => {
    if (activeTool !== 'select') return;
    e.stopPropagation(); setSelectedId(ann.id);
    if (ann.type === 'text') {
      setTextSize(ann.fontSize); setTextColor(ann.color);
      setTextBold(ann.bold); setTextItalic(ann.italic); setTextUnderline(ann.underline);
      setTextAlign(ann.align); setTextOpacity(ann.opacity);
    }
    const { nx, ny } = getNormalizedCoords(e);
    setInteraction({ id: ann.id, type: 'move', startNX: nx, startNY: ny, initialNX: ann.nx, initialNY: ann.ny });
  };

  const startResize = (e: React.PointerEvent, ann: AnnotationType) => {
    if (activeTool !== 'select' || ann.type === 'text' || ann.type === 'line' || ann.type === 'arrow') return;
    e.stopPropagation();
    const { nx, ny } = getNormalizedCoords(e);
    setInteraction({ id: ann.id, type: 'resize', startNX: nx, startNY: ny, initialNX: ann.nx, initialNY: ann.ny, initialNW: ann.nw, initialNH: ann.nh });
  };

  const handlePropertyChange = (updates: Partial<AnnotationType>) => {
    if (selectedId) {
      saveToHistory();
      updateAnnotation(selectedId, updates);
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const modifiedPdfBytes = await applyAnnotationsToPdf(file, annotations);
      downloadFile(modifiedPdfBytes, `annotated_${file.name}`, 'application/pdf');
      const modifiedFile = new File([modifiedPdfBytes], file.name, { type: 'application/pdf' });
      setFile(modifiedFile); setAnnotations({}); setHistory([]); setHistoryIndex(-1);
      loadPage(modifiedFile, currentPage);
    } catch (error) { console.error("Error saving PDF:", error); alert("Error saving PDF."); }
    finally { setProcessing(false); }
  };

  if (!file) {
    return (
      <div className="max-w-3xl mx-auto mt-12 px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Annotate PDF</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Add text, shapes, highlights, and more to your PDF</p>
        </div>
        <FileUpload onFilesSelected={handleFileSelect} accept={{ 'application/pdf': ['.pdf'] }} multiple={false} />
      </div>
    );
  }

  const currentAnnotations = annotations[currentPage] || [];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const selectedAnn = currentAnnotations.find(a => a.id === selectedId);
  const showTextProps = activeTool === 'text' || (selectedAnn?.type === 'text');
  const showShapeProps = activeTool === 'rect' || activeTool === 'circle' || (selectedAnn?.type === 'rect' || selectedAnn?.type === 'circle');
  const showLineProps = activeTool === 'line' || activeTool === 'arrow' || (selectedAnn?.type === 'line' || selectedAnn?.type === 'arrow');
  const showHighlightProps = activeTool === 'highlight' || (selectedAnn?.type === 'highlight');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setFile(null)} className="sm:hidden p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white truncate">{file.name}</h2>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button onClick={() => { setFile(null); setAnnotations({}); setHistory([]); setHistoryIndex(-1); }}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={handleSave} disabled={processing}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 sm:gap-2">
            {processing ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Download className="w-3 h-3 sm:w-4 sm:h-4" />} <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 mb-3 sm:mb-4 shrink-0">
        
        {/* Main Toolbar Row - Tools */}
        <div className="flex flex-wrap gap-1 sm:gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-200 dark:border-gray-700 items-center">
          {/* Undo/Redo */}
          <div className="flex gap-1 shrink-0">
            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", canUndo ? "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" : "text-gray-300 dark:text-gray-600 cursor-not-allowed")}>
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)"
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", canRedo ? "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" : "text-gray-300 dark:text-gray-600 cursor-not-allowed")}>
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block" />

          {/* Main tools */}
          <div className="flex gap-0.5 sm:gap-1 shrink-0">
            <button onClick={() => { setActiveTool('select'); setSelectedId(null); }}
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", activeTool === 'select' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50")} title="Select">
              <MousePointer2 className="w-4 h-4" />
            </button>
            <button onClick={() => { setActiveTool('move-area'); setSelectedId(null); }}
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", activeTool === 'move-area' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50")} title="Move Area">
              <Move className="w-4 h-4" />
            </button>
            <button onClick={() => { setActiveTool('eraser'); setSelectedId(null); }}
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", activeTool === 'eraser' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50")} title="Eraser">
              <Eraser className="w-4 h-4" />
            </button>
            <button onClick={() => { setActiveTool('text'); setSelectedId(null); }}
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", activeTool === 'text' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50")} title="Text">
              <Type className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block" />

          {/* Shape tools */}
          <div className="flex gap-0.5 sm:gap-1 shrink-0">
            <button onClick={() => { setActiveTool('rect'); setSelectedId(null); }}
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", activeTool === 'rect' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50")} title="Rectangle">
              <Square className="w-4 h-4" />
            </button>
            <button onClick={() => { setActiveTool('circle'); setSelectedId(null); }}
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", activeTool === 'circle' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50")} title="Circle">
              <Circle className="w-4 h-4" />
            </button>
            <button onClick={() => { setActiveTool('line'); setSelectedId(null); }}
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", activeTool === 'line' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50")} title="Line">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={() => { setActiveTool('arrow'); setSelectedId(null); }}
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", activeTool === 'arrow' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50")} title="Arrow">
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => { setActiveTool('highlight'); setSelectedId(null); }}
              className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", activeTool === 'highlight' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50")} title="Highlight">
              <Highlighter className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-mono w-10 sm:w-12 text-center text-gray-700 dark:text-gray-300">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => setZoom(1.0)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hidden sm:block"><Maximize className="w-4 h-4" /></button>
          </div>

          {/* Page nav */}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0 || loading}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-300"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] sm:min-w-[4rem] text-center">{currentPage + 1}/{numPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(numPages - 1, p + 1))} disabled={currentPage === numPages - 1 || loading}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-300"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Properties Row - Text */}
        {showTextProps && (
          <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-200 dark:border-gray-700 items-center">
            {/* Color picker */}
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {['#000000', '#FF0000', '#0000FF', '#00AA00', '#FF6600', '#9900FF'].map(color => (
                  <button key={color} onClick={() => { setTextColor(color); handlePropertyChange({ color }); }}
                    className={cn("w-6 h-6 sm:w-5 sm:h-5 rounded-sm border border-gray-200 dark:border-gray-600 transition-transform hover:scale-110", textColor === color && "ring-2 ring-blue-500 ring-offset-1")}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
              <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); handlePropertyChange({ color: e.target.value }); }}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded cursor-pointer border-0 p-0" />
            </div>
            
            {/* Size */}
            <select value={textSize} onChange={(e) => { const size = Number(e.target.value); setTextSize(size); handlePropertyChange({ fontSize: size }); }}
              className="text-xs sm:text-sm border-gray-300 rounded-md shadow-sm py-1 px-1 sm:px-2 w-16 sm:w-auto">
              {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64].map(size => (<option key={size} value={size}>{size}</option>))}
            </select>
            
            {/* Bold/Italic/Underline */}
            <div className="flex gap-0.5">
              <button onClick={() => { setTextBold(!textBold); handlePropertyChange({ bold: !textBold }); }}
                className={cn("p-1.5 rounded", textBold ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-200")}><Bold className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setTextItalic(!textItalic); handlePropertyChange({ italic: !textItalic }); }}
                className={cn("p-1.5 rounded", textItalic ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-200")}><Italic className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setTextUnderline(!textUnderline); handlePropertyChange({ underline: !textUnderline }); }}
                className={cn("p-1.5 rounded", textUnderline ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-200")}><Underline className="w-3.5 h-3.5" /></button>
            </div>
            
            {/* Align */}
            <div className="flex gap-0.5">
              <button onClick={() => { setTextAlign('left'); handlePropertyChange({ align: 'left' }); }}
                className={cn("p-1.5 rounded", textAlign === 'left' ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-200")}><AlignLeft className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setTextAlign('center'); handlePropertyChange({ align: 'center' }); }}
                className={cn("p-1.5 rounded", textAlign === 'center' ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-200")}><AlignCenter className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setTextAlign('right'); handlePropertyChange({ align: 'right' }); }}
                className={cn("p-1.5 rounded", textAlign === 'right' ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-200")}><AlignRight className="w-3.5 h-3.5" /></button>
            </div>
            
            {/* Opacity */}
            <div className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-gray-400" />
              <input type="range" min="0.1" max="1" step="0.1" value={textOpacity} onChange={(e) => { setTextOpacity(Number(e.target.value)); handlePropertyChange({ opacity: Number(e.target.value) }); }}
                className="w-12 sm:w-16" />
            </div>
          </div>
        )}

        {/* Properties Row - Shape */}
        {showShapeProps && (
          <div className="flex flex-wrap gap-2 sm:gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 hidden sm:inline">Stroke</span>
              <div className="flex gap-0.5">
                {['#000000', '#FF0000', '#0000FF', '#00AA00'].map(color => (
                  <button key={color} onClick={() => { setShapeStrokeColor(color); handlePropertyChange({ strokeColor: color }); }}
                    className={cn("w-6 h-6 sm:w-5 sm:h-5 rounded-sm border border-gray-200 transition-transform hover:scale-110", shapeStrokeColor === color && "ring-2 ring-blue-500 ring-offset-1")}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
              <input type="color" value={shapeStrokeColor} onChange={(e) => { setShapeStrokeColor(e.target.value); handlePropertyChange({ strokeColor: e.target.value }); }}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded cursor-pointer border-0 p-0" />
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Fill</span>
              <div className="flex gap-0.5">
                {['#FFFFFF', '#FF0000', '#0000FF', '#FFFF00'].map(color => (
                  <button key={color} onClick={() => { setShapeFillColor(color); handlePropertyChange({ fillColor: color }); }}
                    className={cn("w-6 h-6 sm:w-5 sm:h-5 rounded-sm border border-gray-200 dark:border-gray-600 transition-transform hover:scale-110", shapeFillColor === color && "ring-2 ring-blue-500 ring-offset-1")}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
              <input type="color" value={shapeFillColor} onChange={(e) => { setShapeFillColor(e.target.value); handlePropertyChange({ fillColor: e.target.value }); }}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded cursor-pointer border-0 p-0" />
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">W</span>
              <input type="range" min="1" max="10" value={shapeStrokeWidth} onChange={(e) => { setShapeStrokeWidth(Number(e.target.value)); handlePropertyChange({ strokeWidth: Number(e.target.value) }); }}
                className="w-12 sm:w-16" />
              <span className="text-xs text-gray-600 dark:text-gray-400 w-4">{shapeStrokeWidth}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <input type="range" min="0.1" max="1" step="0.1" value={shapeOpacity} onChange={(e) => { setShapeOpacity(Number(e.target.value)); handlePropertyChange({ opacity: Number(e.target.value) }); }}
                className="w-12 sm:w-16" />
            </div>
          </div>
        )}

        {/* Properties Row - Line/Arrow */}
        {showLineProps && (
          <div className="flex flex-wrap gap-2 sm:gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-200 dark:border-gray-700 items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Color</span>
              <div className="flex gap-0.5">
                {['#000000', '#FF0000', '#0000FF', '#00AA00'].map(color => (
                  <button key={color} onClick={() => { setShapeStrokeColor(color); handlePropertyChange({ strokeColor: color }); }}
                    className={cn("w-6 h-6 sm:w-5 sm:h-5 rounded-sm border border-gray-200 dark:border-gray-600 transition-transform hover:scale-110", shapeStrokeColor === color && "ring-2 ring-blue-500 ring-offset-1")}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
              <input type="color" value={shapeStrokeColor} onChange={(e) => { setShapeStrokeColor(e.target.value); handlePropertyChange({ strokeColor: e.target.value }); }}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded cursor-pointer border-0 p-0" />
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">W</span>
              <input type="range" min="1" max="10" value={shapeStrokeWidth} onChange={(e) => { setShapeStrokeWidth(Number(e.target.value)); handlePropertyChange({ strokeWidth: Number(e.target.value) }); }}
                className="w-12 sm:w-16" />
              <span className="text-xs text-gray-600 dark:text-gray-400 w-4">{shapeStrokeWidth}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <input type="range" min="0.1" max="1" step="0.1" value={shapeOpacity} onChange={(e) => { setShapeOpacity(Number(e.target.value)); handlePropertyChange({ opacity: Number(e.target.value) }); }}
                className="w-12 sm:w-16" />
            </div>
          </div>
        )}

        {/* Properties Row - Highlight */}
        {showHighlightProps && (
          <div className="flex flex-wrap gap-2 sm:gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-200 dark:border-gray-700 items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Color</span>
              <div className="flex gap-0.5">
                {['#FFFF00', '#00FF00', '#FF6600', '#FF00FF'].map(color => (
                  <button key={color} onClick={() => { setHighlightColor(color); handlePropertyChange({ color }); }}
                    className={cn("w-6 h-6 sm:w-5 sm:h-5 rounded-sm border border-gray-200 dark:border-gray-600 transition-transform hover:scale-110", highlightColor === color && "ring-2 ring-blue-500 ring-offset-1")}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
              <input type="color" value={highlightColor} onChange={(e) => { setHighlightColor(e.target.value); handlePropertyChange({ color: e.target.value }); }}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded cursor-pointer border-0 p-0" />
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Opacity</span>
              <input type="range" min="0.1" max="0.8" step="0.1" value={highlightOpacity} onChange={(e) => { setHighlightOpacity(Number(e.target.value)); handlePropertyChange({ opacity: Number(e.target.value) }); }}
                className="w-12 sm:w-16" />
              <span className="text-xs text-gray-600 dark:text-gray-400 w-6">{highlightOpacity}</span>
            </div>
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-center p-4 lg:p-8 relative">
        {loading || !pageData ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-4" /><p className="text-gray-500 dark:text-gray-400">Loading page...</p>
          </div>
        ) : (
          <div className="relative shadow-2xl bg-white dark:bg-gray-800 origin-top transition-transform duration-200 rounded-lg overflow-hidden" style={{ width: 'fit-content', height: 'fit-content', transform: `scale(${zoom})` }}>
            <img src={pageData.image} alt={`Page ${currentPage + 1}`} className="max-w-full h-auto block select-none" draggable={false} />
            <div ref={overlayRef}
              className={cn("absolute inset-0 z-10",
                activeTool === 'eraser' ? "cursor-crosshair" :
                activeTool === 'text' ? "cursor-text" :
                activeTool === 'highlight' ? "cursor-crosshair" :
                ['rect', 'circle', 'line', 'arrow'].includes(activeTool) ? "cursor-crosshair" :
                "cursor-default")}
              onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
              
              {/* Drawing preview */}
              {isDrawing && (
                <div className="absolute border-2 border-dashed border-blue-500 bg-blue-50/30 pointer-events-none"
                  style={{
                    left: `${Math.min(drawStart.nx, drawCurrent.nx) * 100}%`,
                    top: `${Math.min(drawStart.ny, drawCurrent.ny) * 100}%`,
                    width: `${Math.abs(drawCurrent.nx - drawStart.nx) * 100}%`,
                    height: `${Math.abs(drawCurrent.ny - drawStart.ny) * 100}%`
                  }} />
              )}

              {/* Render annotations */}
              {currentAnnotations.map(ann => {
                const isSelected = selectedId === ann.id;
                
                // Text annotation
                if (ann.type === 'text') {
                  return (
                    <div key={ann.id}
                      className={cn("absolute group", activeTool === 'select' && "cursor-move", isSelected && "z-20")}
                      style={{ left: `${ann.nx * 100}%`, top: `${ann.ny * 100}%`, width: `${ann.nw * 100}%`, height: `${ann.nh * 100}%`, opacity: ann.opacity }}
                      onPointerDown={(e) => startMove(e, ann)}>
                      {editingTextId === ann.id ? (
                        <textarea autoFocus value={ann.text}
                          onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                          onBlur={() => setEditingTextId(null)}
                          className="w-full h-full bg-white/90 border border-blue-300 rounded p-1 text-xs resize-none outline-none"
                          style={{ fontSize: `${ann.fontSize}px`, color: ann.color, fontWeight: ann.bold ? 'bold' : 'normal', fontStyle: ann.italic ? 'italic' : 'normal', textDecoration: ann.underline ? 'underline' : 'none', textAlign: ann.align }} />
                      ) : (
                        <div className="w-full h-full flex items-center overflow-hidden p-1 pointer-events-none"
                          style={{ fontSize: `${ann.fontSize}px`, color: ann.color, fontWeight: ann.bold ? 'bold' : 'normal', fontStyle: ann.italic ? 'italic' : 'normal', textDecoration: ann.underline ? 'underline' : 'none', textAlign: ann.align, justifyContent: ann.align === 'center' ? 'center' : ann.align === 'right' ? 'flex-end' : 'flex-start' }}>
                          {ann.text || <span className="text-gray-400 italic">Click to edit...</span>}
                        </div>
                      )}
                      {activeTool === 'select' && (
                        <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                          className={cn("absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full transition-opacity z-20", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                }
                
                // Rectangle
                if (ann.type === 'rect') {
                  return (
                    <div key={ann.id}
                      className={cn("absolute group", activeTool === 'select' && "cursor-move", isSelected && "z-20")}
                      style={{ left: `${ann.nx * 100}%`, top: `${ann.ny * 100}%`, width: `${ann.nw * 100}%`, height: `${ann.nh * 100}%`, opacity: ann.opacity }}
                      onPointerDown={(e) => startMove(e, ann)} onPointerDownCapture={(e) => { if (activeTool === 'select') startResize(e, ann); }}>
                      <div className="w-full h-full" style={{ border: `${ann.strokeWidth}px solid ${ann.strokeColor}`, backgroundColor: ann.fillColor === '#FFFFFF' ? 'transparent' : ann.fillColor }} />
                      {activeTool === 'select' && (
                        <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                          className={cn("absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full transition-opacity z-20", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                }
                
                // Circle
                if (ann.type === 'circle') {
                  return (
                    <div key={ann.id}
                      className={cn("absolute group", activeTool === 'select' && "cursor-move", isSelected && "z-20")}
                      style={{ left: `${ann.nx * 100}%`, top: `${ann.ny * 100}%`, width: `${ann.nw * 100}%`, height: `${ann.nh * 100}%`, opacity: ann.opacity }}
                      onPointerDown={(e) => startMove(e, ann)} onPointerDownCapture={(e) => { if (activeTool === 'select') startResize(e, ann); }}>
                      <div className="w-full h-full rounded-full" style={{ border: `${ann.strokeWidth}px solid ${ann.strokeColor}`, backgroundColor: ann.fillColor === '#FFFFFF' ? 'transparent' : ann.fillColor }} />
                      {activeTool === 'select' && (
                        <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                          className={cn("absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full transition-opacity z-20", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                }
                
                // Line
                if (ann.type === 'line') {
                  const x2 = ann.nx + ann.nw;
                  const y2 = ann.ny + ann.nh;
                  const length = Math.sqrt(ann.nw * ann.nw + ann.nh * ann.nh);
                  const angle = Math.atan2(ann.nh, ann.nw) * 180 / Math.PI;
                  return (
                    <div key={ann.id}
                      className={cn("absolute group", activeTool === 'select' && "cursor-move", isSelected && "z-20")}
                      style={{ left: `${ann.nx * 100}%`, top: `${ann.ny * 100}%`, width: `${ann.nw * 100}%`, height: `${ann.nh * 100}%`, opacity: ann.opacity }}
                      onPointerDown={(e) => startMove(e, ann)}>
                      <div className="w-full h-full relative" style={{ transform: `rotate(${angle}deg)`, transformOrigin: '0 50%' }}>
                        <div className="absolute w-full bg-current" style={{ height: `${ann.strokeWidth}px`, backgroundColor: ann.strokeColor }} />
                      </div>
                      {activeTool === 'select' && (
                        <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                          className={cn("absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full transition-opacity z-20", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                }
                
                // Arrow
                if (ann.type === 'arrow') {
                  const x2 = ann.nx + ann.nw;
                  const y2 = ann.ny + ann.nh;
                  const angle = Math.atan2(ann.ny + ann.nh/2 - (ann.ny), ann.nx + ann.nw - ann.nx) * 180 / Math.PI;
                  return (
                    <div key={ann.id}
                      className={cn("absolute group", activeTool === 'select' && "cursor-move", isSelected && "z-20")}
                      style={{ left: `${ann.nx * 100}%`, top: `${ann.ny * 100}%`, width: `${ann.nw * 100}%`, height: `${ann.nh * 100}%`, opacity: ann.opacity }}
                      onPointerDown={(e) => startMove(e, ann)}>
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <marker id={`arrowhead-${ann.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill={ann.strokeColor} />
                          </marker>
                        </defs>
                        <line x1="0" y1="50" x2="85" y2="50" stroke={ann.strokeColor} strokeWidth={ann.strokeWidth} markerEnd={`url(#arrowhead-${ann.id})`} />
                      </svg>
                      {activeTool === 'select' && (
                        <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                          className={cn("absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full transition-opacity z-20", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                }
                
                // Highlight
                if (ann.type === 'highlight') {
                  return (
                    <div key={ann.id}
                      className={cn("absolute group", activeTool === 'select' && "cursor-move", isSelected && "z-20")}
                      style={{ left: `${ann.nx * 100}%`, top: `${ann.ny * 100}%`, width: `${ann.nw * 100}%`, height: `${ann.nh * 100}%`, opacity: ann.opacity, backgroundColor: ann.color }}
                      onPointerDown={(e) => startMove(e, ann)} onPointerDownCapture={(e) => { if (activeTool === 'select') startResize(e, ann); }}>
                      {activeTool === 'select' && (
                        <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                          className={cn("absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full transition-opacity z-20", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                }
                
                // Eraser/Patch
                if (ann.type === 'eraser' || ann.type === 'patch') {
                  return (
                    <div key={ann.id}
                      className={cn("absolute group", ann.type === 'patch' ? "bg-transparent" : "bg-white",
                        activeTool === 'select' && "cursor-move", isSelected && "ring-2 ring-blue-600 z-20")}
                      style={{
                        left: `${ann.nx * 100}%`, top: `${ann.ny * 100}%`, width: `${ann.nw * 100}%`, height: `${ann.nh * 100}%`,
                        border: (activeTool === 'eraser' || activeTool === 'move-area' || activeTool === 'select') && ann.type === 'eraser' ? '1px solid rgba(0,0,0,0.1)' : 'none'
                      }}
                      onPointerDown={(e) => startMove(e, ann)} onPointerDownCapture={(e) => { if (activeTool === 'select') startResize(e, ann); }}>
                      {ann.type === 'patch' && (<img src={ann.imageData} alt="patch" className="w-full h-full object-fill pointer-events-none" draggable={false} />)}
                      {activeTool === 'select' && (
                        <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                          className={cn("absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full transition-opacity z-20", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                }
                
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
