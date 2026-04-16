'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export function ProgressBar({ 
  progress, 
  label, 
  showPercentage = true,
  size = 'md',
  color = 'blue'
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className={cn(
        "w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden",
        sizeClasses[size]
      )}>
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            colorClasses[color]
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

// Processing state component with progress bar and status
interface ProcessingStateProps {
  progress?: number;
  status: string;
  substatus?: string;
}

export function ProcessingState({ progress, status, substatus }: ProcessingStateProps) {
  const hasProgress = typeof progress === 'number';
  
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {hasProgress ? (
        <div className="w-full max-w-xs">
          <ProgressBar 
            progress={progress} 
            label={status}
            color="blue"
          />
          {substatus && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              {substatus}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            {/* Spinning border */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{status}</p>
            {substatus && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{substatus}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
