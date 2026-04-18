'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Sparkles, Star, Shield, Clock } from 'lucide-react';
import { 
  DocumentTextIcon, 
  ArrowsRightLeftIcon, 
  RectangleStackIcon, 
  PencilIcon,
  DocumentArrowDownIcon,
  LockClosedIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Favorites, ToolListWithStars } from '@/components/Favorites';
import { RecentFiles } from '@/components/RecentFiles';

export type ToolType = 'annotate' | 'edit' | 'convert' | 'merge' | 'word-to-pdf' | 'security' | 'batch';

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
}

const toolColors: Record<ToolType, { gradient: string; bg: string; text: string }> = {
  'annotate': { gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  'edit': { gradient: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
  'convert': { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'merge': { gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  'word-to-pdf': { gradient: 'from-purple-500 to-pink-600', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  'security': { gradient: 'from-red-500 to-rose-600', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  'batch': { gradient: 'from-cyan-500 to-sky-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
};

const toolIcons: Record<ToolType, typeof PencilIcon> = {
  'annotate': PencilIcon,
  'edit': DocumentTextIcon,
  'convert': ArrowsRightLeftIcon,
  'merge': RectangleStackIcon,
  'word-to-pdf': DocumentArrowDownIcon,
  'security': LockClosedIcon,
  'batch': ListBulletIcon,
};

const HomeIcon = Home;

export function Sidebar({ activeTool, setActiveTool }: SidebarProps) {
  const { t } = useLanguage();
  const [hoveredTool, setHoveredTool] = useState<ToolType | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const tools: { id: ToolType; name: string; description: string; gradient: string }[] = [
    { id: 'annotate', name: t('annotate'), description: t('annotateDesc'), gradient: 'from-blue-500 to-indigo-600' },
    { id: 'edit', name: t('editPages'), description: t('editPagesDesc'), gradient: 'from-indigo-500 to-purple-600' },
    { id: 'convert', name: t('convert'), description: t('convertDesc'), gradient: 'from-emerald-500 to-teal-600' },
    { id: 'merge', name: t('mergePdf'), description: t('mergePdfDesc'), gradient: 'from-orange-500 to-amber-600' },
    { id: 'word-to-pdf', name: t('wordToPdf'), description: t('wordToPdfDesc'), gradient: 'from-purple-500 to-pink-600' },
    { id: 'security', name: t('security') || 'Security', description: t('securityDesc') || 'Password protect PDFs', gradient: 'from-red-500 to-rose-600' },
    { id: 'batch', name: t('batch') || 'Batch', description: t('batchDesc') || 'Process multiple files', gradient: 'from-cyan-500 to-sky-600' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-800 h-screen flex-col shadow-sm transition-colors duration-300">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 32 32" className="w-10 h-10">
              <defs>
                <linearGradient id="sidebarLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB"/>
                  <stop offset="100%" stopColor="#4F46E5"/>
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="30" height="30" rx="6" fill="url(#sidebarLogoGrad)"/>
              <rect x="5" y="4" width="22" height="24" rx="2" fill="white"/>
              <path d="M19 4 L27 12 L19 12 Z" fill="#E5E7EB"/>
              <text x="7" y="20" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="#2563EB">PDF</text>
            </svg>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">PDF Studio</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('secureFast')}</p>
            </div>
          </div>
          <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group" title={t('goHome')}>
            <HomeIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          </Link>
        </div>

        {/* Theme Toggle */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('appearance')}</span>
            <ThemeToggle />
          </div>
        </div>
        
        {/* Favorites Section */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{t('quickAccess')}</span>
            <button 
              onClick={() => setShowFavorites(!showFavorites)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t('manageFavorites')}
            >
              <Star className={cn("w-4 h-4", showFavorites ? "text-amber-500 fill-amber-500" : "text-gray-400")} />
            </button>
          </div>
          {showFavorites && (
            <div className="mt-2">
              <ToolListWithStars />
            </div>
          )}
        </div>

        {/* Recent Files */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <RecentFiles />
        </div>
        
        {/* Tools */}
        <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">{t('tools')}</div>
          {tools.map((tool) => {
            const Icon = toolIcons[tool.id];
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
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-800/50" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent"
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
                    ? `bg-gradient-to-br ${tool.gradient} shadow-lg` 
                    : isHovered
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-800/50 group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                  )} />
                </div>
                
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-semibold text-sm transition-colors",
                    isActive ? toolColors[tool.id].text : "text-gray-700 dark:text-gray-200"
                  )}>
                    {tool.name}
                  </div>
                  <div className={cn(
                    "text-xs mt-0.5 transition-colors truncate",
                    isActive ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"
                  )}>
                    {tool.description}
                  </div>
                </div>
                
                {/* Hover sparkle */}
                <div className={cn(
                  "w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center transition-all duration-300",
                  isHovered && !isActive ? "opacity-100 scale-100" : "opacity-0 scale-50"
                )}>
                  <Sparkles className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium text-center">
              {t('yourFilesPrivate')}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-colors duration-300">
        <div className="flex items-center justify-between h-16 px-1">
          {tools.map((tool) => {
            const Icon = toolIcons[tool.id];
            const isActive = activeTool === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 px-1 py-2 rounded-xl transition-all flex-1",
                  isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                {isActive && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 rounded-full" />
                )}
                
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200",
                  isActive 
                    ? `bg-gradient-to-br ${tool.gradient} shadow-md` 
                    : "bg-gray-50 dark:bg-gray-800"
                )}>
                  <Icon className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-white" : "text-gray-400 dark:text-gray-500"
                  )} />
                </div>
                <span className={cn(
                  "text-[9px] font-semibold transition-colors truncate w-full text-center leading-tight",
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                )}>
                  {tool.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-sm">
              <DocumentTextIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">PDF Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <HomeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
