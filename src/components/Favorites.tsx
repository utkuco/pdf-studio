'use client';

import React from 'react';
import { Star, FileText, Edit3, RefreshCw, Merge, FileDown, Shield, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface Tool {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

const tools: Tool[] = [
  { id: 'annotate', name: 'Annotate', icon: Edit3, description: 'Add text, shapes', color: 'blue' },
  { id: 'edit', name: 'Edit Pages', icon: FileText, description: 'Delete, rotate', color: 'purple' },
  { id: 'convert', name: 'Convert', icon: RefreshCw, description: 'PDF ↔ Images', color: 'green' },
  { id: 'merge', name: 'Merge PDF', icon: Merge, description: 'Combine files', color: 'orange' },
  { id: 'word-to-pdf', name: 'Word → PDF', icon: FileDown, description: 'Convert docx', color: 'indigo' },
  { id: 'security', name: 'Security', icon: Shield, description: 'Encrypt PDF', color: 'red' },
  { id: 'batch', name: 'Batch', icon: Clock, description: 'Process multiple', color: 'teal' },
];

const colorClasses: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'dark:bg-blue-900/40', darkText: 'dark:text-blue-400' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'dark:bg-purple-900/40', darkText: 'dark:text-purple-400' },
  green: { bg: 'bg-green-100', text: 'text-green-600', darkBg: 'dark:bg-green-900/40', darkText: 'dark:text-green-400' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'dark:bg-orange-900/40', darkText: 'dark:text-orange-400' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', darkBg: 'dark:bg-indigo-900/40', darkText: 'dark:text-indigo-400' },
  red: { bg: 'bg-red-100', text: 'text-red-600', darkBg: 'dark:bg-red-900/40', darkText: 'dark:text-red-400' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600', darkBg: 'dark:bg-teal-900/40', darkText: 'dark:text-teal-400' },
};

export function Favorites() {
  const { favoriteTools, toggleFavoriteTool } = useAppStore();

  if (favoriteTools.length === 0) {
    return (
      <div className="p-4 text-center">
        <Star className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-xs text-gray-500 dark:text-gray-400">No favorites yet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Star tools for quick access</p>
      </div>
    );
  }

  const favoriteToolData = favoriteTools
    .map(id => tools.find(t => t.id === id))
    .filter(Boolean) as Tool[];

  return (
    <div className="p-2">
      <div className="px-2 py-1 mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Favorites
        </span>
      </div>
      <div className="space-y-1">
        {favoriteToolData.map((tool) => {
          const colors = colorClasses[tool.color];
          return (
            <button
              key={tool.id}
              onClick={() => toggleFavoriteTool(tool.id)}
              className="w-full group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
            >
              <div className={cn("p-1.5 rounded-md", colors.bg, colors.darkBg)}>
                <tool.icon className={cn("w-4 h-4", colors.text, colors.darkText)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{tool.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{tool.description}</div>
              </div>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Hook to add/remove star button to any tool
export function FavoriteButton({ toolId }: { toolId: string }) {
  const { favoriteTools, toggleFavoriteTool } = useAppStore();
  const isFavorite = favoriteTools.includes(toolId);

  return (
    <button
      onClick={() => toggleFavoriteTool(toolId)}
      className={cn(
        "p-2 rounded-lg transition-all",
        isFavorite 
          ? "text-amber-500 hover:text-amber-600 dark:hover:text-amber-400" 
          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      )}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={cn("w-5 h-5", isFavorite && "fill-amber-500")} />
    </button>
  );
}

// Tool list with star buttons for settings
export function ToolListWithStars() {
  const { favoriteTools, toggleFavoriteTool } = useAppStore();

  return (
    <div className="space-y-2">
      {tools.map((tool) => {
        const colors = colorClasses[tool.color];
        const isFavorite = favoriteTools.includes(tool.id);
        
        return (
          <div
            key={tool.id}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
          >
            <div className={cn("p-2 rounded-lg", colors.bg, colors.darkBg)}>
              <tool.icon className={cn("w-5 h-5", colors.text, colors.darkText)} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">{tool.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{tool.description}</div>
            </div>
            <button
              onClick={() => toggleFavoriteTool(tool.id)}
              className={cn(
                "p-2 rounded-lg transition-all",
                isFavorite 
                  ? "text-amber-500 hover:text-amber-600 dark:hover:text-amber-400" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <Star className={cn("w-5 h-5", isFavorite && "fill-amber-500")} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
