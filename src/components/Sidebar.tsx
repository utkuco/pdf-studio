'use client';

import React from 'react';
import Link from 'next/link';
import { FileEdit, ArrowRightLeft, Layers, FileText, Type, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useState } from 'react';

export type ToolType = 'annotate' | 'edit' | 'convert' | 'merge' | 'word-to-pdf';

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
}

const toolColors: Record<ToolType, { gradient: string; bg: string; text: string }> = {
  'annotate': { gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-100', text: 'text-blue-700' },
  'edit': { gradient: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'convert': { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'merge': { gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-100', text: 'text-orange-700' },
  'word-to-pdf': { gradient: 'from-purple-500 to-pink-600', bg: 'bg-purple-100', text: 'text-purple-700' },
};

export function Sidebar({ activeTool, setActiveTool }: SidebarProps) {
  const { t } = useLanguage();
  const [hoveredTool, setHoveredTool] = useState<ToolType | null>(null);

  const tools: { id: ToolType; name: string; icon: typeof Type; description: string; gradient: string }[] = [
    { id: 'annotate', name: t('annotate'), icon: Type, description: t('annotateDesc'), gradient: 'from-blue-500 to-indigo-600' },
    { id: 'edit', name: t('editPages'), icon: FileEdit, description: t('editPagesDesc'), gradient: 'from-indigo-500 to-purple-600' },
    { id: 'convert', name: t('convert'), icon: ArrowRightLeft, description: t('convertDesc'), gradient: 'from-emerald-500 to-teal-600' },
    { id: 'merge', name: t('mergePdf'), icon: Layers, description: t('mergePdfDesc'), gradient: 'from-orange-500 to-amber-600' },
    { id: 'word-to-pdf', name: t('wordToPdf'), icon: FileText, description: t('wordToPdfDesc'), gradient: 'from-purple-500 to-pink-600' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 h-screen flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">PDF Studio</h1>
              <p className="text-xs text-gray-500 font-medium">{t('secureFast')}</p>
            </div>
          </div>
          <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 transition-all group" title={t('goHome')}>
            <Home className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
        </div>
        
        {/* Tools */}
        <div className="p-4 flex-1 flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Tools</div>
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            const isHovered = hoveredTool === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                onMouseEnter={() => setHoveredTool(tool.id)}
                onMouseLeave={() => setHoveredTool(null)}
                className={cn(
                  "relative flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all duration-200 group overflow-hidden",
                  isActive 
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                )}
              >
                {/* Active gradient indicator */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-all duration-300",
                  isActive ? `bg-gradient-to-b ${tool.gradient}` : "bg-transparent"
                )} />
                
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  isActive 
                    ? `bg-gradient-to-br ${tool.gradient} shadow-lg shadow-blue-200` 
                    : isHovered
                      ? "bg-gray-100"
                      : "bg-gray-50 group-hover:bg-gray-100"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                </div>
                
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-semibold text-sm transition-colors",
                    isActive ? toolColors[tool.id].text : "text-gray-700"
                  )}>
                    {tool.name}
                  </div>
                  <div className={cn(
                    "text-xs mt-0.5 transition-colors truncate",
                    isActive ? "text-gray-500" : "text-gray-400"
                  )}>
                    {tool.description}
                  </div>
                </div>
                
                {/* Hover arrow */}
                <div className={cn(
                  "w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center transition-all duration-300",
                  isHovered && !isActive ? "opacity-100 scale-100" : "opacity-0 scale-50"
                )}>
                  <Sparkles className="w-3 h-3 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-700 font-medium text-center">
              🔒 Your files never leave your device
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]",
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
                )}
                
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                  isActive 
                    ? `bg-gradient-to-br ${tool.gradient} shadow-lg` 
                    : "bg-gray-50"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-gray-400"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold transition-colors",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}>
                  {tool.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-sm">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">PDF Studio</span>
          </div>
          <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Home className="w-5 h-5 text-gray-500" />
          </Link>
        </div>
      </div>
    </>
  );
}
