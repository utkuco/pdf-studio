'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, ToolType } from '@/components/Sidebar';
import { PdfAnnotator } from '@/components/tools/PdfAnnotator';
import { PdfEditor } from '@/components/tools/PdfEditor';
import { FormatConverter } from '@/components/tools/FormatConverter';
import { PdfMerger } from '@/components/tools/PdfMerger';
import { WordToPdf } from '@/components/tools/WordToPdf';
import { SecurityTool } from '@/components/tools/SecurityTool';
import { BatchProcessor } from '@/components/tools/BatchProcessor';
import { useSearchParams } from 'next/navigation';

export default function EditorClient() {
  const searchParams = useSearchParams();
  const toolParam = searchParams.get('tool');
  
  // Initialize from URL param, validate it
  const validTools: ToolType[] = ['annotate', 'edit', 'convert', 'merge', 'word-to-pdf', 'security', 'batch'];
  const initialTool: ToolType = validTools.includes(toolParam as ToolType) ? (toolParam as ToolType) : 'annotate';
  
  const [activeTool, setActiveTool] = useState<ToolType>(initialTool);

  // Update URL when tool changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tool', activeTool);
    window.history.replaceState({}, '', url.toString());
  }, [activeTool]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-300">
      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 lg:pt-0 pt-14 pb-16 lg:pb-0 transition-colors duration-300">
        <div className="p-4 sm:p-6 lg:p-8 h-full">
          {activeTool === 'annotate' && <PdfAnnotator />}
          {activeTool === 'edit' && <PdfEditor />}
          {activeTool === 'convert' && <FormatConverter />}
          {activeTool === 'merge' && <PdfMerger />}
          {activeTool === 'word-to-pdf' && <WordToPdf />}
          {activeTool === 'security' && <SecurityTool />}
          {activeTool === 'batch' && <BatchProcessor />}
        </div>
      </main>
    </div>
  );
}
