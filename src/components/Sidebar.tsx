'use client';

import React from 'react';
import Link from 'next/link';
import { FileEdit, ArrowRightLeft, Layers, FileText, Type, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export type ToolType = 'annotate' | 'edit' | 'convert' | 'merge' | 'word-to-pdf';

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
}

export function Sidebar({ activeTool, setActiveTool }: SidebarProps) {
  const { t } = useLanguage();
  const tools = [
    { id: 'annotate', name: t('annotate'), icon: Type, description: t('annotateDesc') },
    { id: 'edit', name: t('editPages'), icon: FileEdit, description: t('editPagesDesc') },
    { id: 'convert', name: t('convert'), icon: ArrowRightLeft, description: t('convertDesc') },
    { id: 'merge', name: t('mergePdf'), icon: Layers, description: t('mergePdfDesc') },
    { id: 'word-to-pdf', name: t('wordToPdf'), icon: FileText, description: t('wordToPdfDesc') },
  ] as const;

  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">PDF Studio</h1>
            <p className="text-xs text-gray-500 font-medium">{t('secureFast')}</p>
          </div>
        </div>
        <Link href="/" className="p-2 rounded-lg hover:bg-gray-200 transition-colors" title={t('goHome')}>
          <Home className="w-5 h-5 text-gray-500" />
        </Link>
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
          {t('privacyNote')}
        </p>
      </div>
    </div>
  );
}
