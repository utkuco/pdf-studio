'use client';

import React from 'react';
import { FileText, FileImage, Clock, Trash2, X } from 'lucide-react';
import { useAppStore, RecentFile } from '@/lib/store';
import { cn } from '@/lib/utils';

export function RecentFiles() {
  const { recentFiles, removeRecentFile, clearRecentFiles } = useAppStore();

  if (recentFiles.length === 0) {
    return (
      <div className="p-4 text-center">
        <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No recent files</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Files you process will appear here</p>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Recent ({recentFiles.length})
        </span>
        <button
          onClick={clearRecentFiles}
          className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {recentFiles.slice(0, 10).map((file) => (
          <RecentFileItem key={file.id} file={file} onRemove={removeRecentFile} formatSize={formatSize} formatTime={formatTime} />
        ))}
      </div>
    </div>
  );
}

interface RecentFileItemProps {
  file: RecentFile;
  onRemove: (id: string) => void;
  formatSize: (bytes: number) => string;
  formatTime: (timestamp: number) => string;
}

function RecentFileItem({ file, onRemove, formatSize, formatTime }: RecentFileItemProps) {
  const Icon = file.type === 'image' ? FileImage : FileText;
  
  return (
    <div className="group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
      <div className={cn(
        "p-1.5 rounded-md",
        file.type === 'image' ? "bg-green-100 dark:bg-green-900/40" : "bg-blue-100 dark:bg-blue-900/40"
      )}>
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatSize(file.size)} • {formatTime(file.timestamp)}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(file.id);
        }}
        className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
