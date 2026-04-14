'use client';

import React from 'react';
import { FileEdit, ArrowRightLeft, Layers, FileText, Type, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToolType = 'annotate' | 'edit' | 'convert' | 'merge' | 'enhance' | 'word-to-pdf';

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
}

export function Sidebar({ activeTool, setActiveTool }: SidebarProps) {
  const tools = [
    { id: 'annotate', name: 'Annotate', icon: Type, description: 'Add text, erase' },
    { id: 'edit', name: 'Edit Pages', icon: FileEdit, description: 'Delete, rotate pages' },
    { id: 'convert', name: 'Convert', icon: ArrowRightLeft, description: 'PDF ↔ Image' },
    { id: 'merge', name: 'Merge PDF', icon: Layers, description: 'Combine files' },
    { id: 'word-to-pdf', name: 'Word → PDF', icon: FileText, description: 'Convert DOCX' },
    { id: 'enhance', name: 'Enhance', icon: Sparkles, description: 'AI upscale' },
  ] as const;

  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-gray-200">
        <div className="bg-blue-600 p-2 rounded-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">PDF Studio</h1>
          <p className="text-xs text-gray-500 font-medium">Secure & Fast Tools</p>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Tools</div>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all duration-200",
                isActive 
                  ? "bg-blue-100 text-blue-700 shadow-sm" 
                  : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-500")} />
              <div>
                <div className="font-medium text-sm">{tool.name}</div>
                <div className={cn("text-xs mt-0.5", isActive ? "text-blue-500/80" : "text-gray-400")}>
                  {tool.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="p-6 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          All processing happens in your browser. Files are never uploaded.
        </p>
      </div>
    </div>
  );
}
