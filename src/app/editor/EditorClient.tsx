'use client';

import React, { useState } from 'react';
import { Sidebar, ToolType } from '@/components/Sidebar';
import { PdfAnnotator } from '@/components/tools/PdfAnnotator';
import { PdfEditor } from '@/components/tools/PdfEditor';
import { FormatConverter } from '@/components/tools/FormatConverter';
import { PdfMerger } from '@/components/tools/PdfMerger';
import { WordToPdf } from '@/components/tools/WordToPdf';

export default function EditorClient() {
  const [activeTool, setActiveTool] = useState<ToolType>('annotate');

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="p-8 h-full">
          {activeTool === 'annotate' && <PdfAnnotator />}
          {activeTool === 'edit' && <PdfEditor />}
          {activeTool === 'convert' && <FormatConverter />}
          {activeTool === 'merge' && <PdfMerger />}
          {activeTool === 'word-to-pdf' && <WordToPdf />}
        </div>
      </main>
    </div>
  );
}
