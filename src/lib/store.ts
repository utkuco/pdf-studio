'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentFile {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'word';
  size: number;
  timestamp: number;
  tool: string;
  thumbnail?: string;
}

interface AppState {
  // Recent Files
  recentFiles: RecentFile[];
  addRecentFile: (file: Omit<RecentFile, 'id' | 'timestamp'>) => void;
  removeRecentFile: (id: string) => void;
  clearRecentFiles: () => void;
  
  // Favorite Tools
  favoriteTools: string[];
  toggleFavoriteTool: (toolId: string) => void;
  setFavoriteTools: (tools: string[]) => void;
  
  // Last used tool
  lastUsedTool: string | null;
  setLastUsedTool: (toolId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Recent Files
      recentFiles: [],
      addRecentFile: (file) => {
        const newFile: RecentFile = {
          ...file,
          id: `${file.name}-${Date.now()}`,
          timestamp: Date.now(),
        };
        set((state) => ({
          recentFiles: [
            newFile,
            ...state.recentFiles.filter(f => f.name !== file.name),
          ].slice(0, 20), // Keep only last 20 files
        }));
      },
      removeRecentFile: (id) => {
        set((state) => ({
          recentFiles: state.recentFiles.filter(f => f.id !== id),
        }));
      },
      clearRecentFiles: () => {
        set({ recentFiles: [] });
      },
      
      // Favorite Tools
      favoriteTools: [],
      toggleFavoriteTool: (toolId) => {
        set((state) => ({
          favoriteTools: state.favoriteTools.includes(toolId)
            ? state.favoriteTools.filter(id => id !== toolId)
            : [...state.favoriteTools, toolId],
        }));
      },
      setFavoriteTools: (tools) => {
        set({ favoriteTools: tools });
      },
      
      // Last Used Tool
      lastUsedTool: null,
      setLastUsedTool: (toolId) => {
        set({ lastUsedTool: toolId });
      },
    }),
    {
      name: 'pdf-studio-storage',
      partialize: (state) => ({
        recentFiles: state.recentFiles,
        favoriteTools: state.favoriteTools,
        lastUsedTool: state.lastUsedTool,
      }),
    }
  )
);
