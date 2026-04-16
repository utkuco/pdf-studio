'use client';

import { useState } from 'react';
import { DocumentArrowDownIcon, ArrowsRightLeftIcon, RectangleStackIcon, PencilIcon, DocumentTextIcon, ArrowPathIcon, CodeBracketIcon, PhotoIcon, LockClosedIcon, BoltIcon, GlobeAmericasIcon, CheckBadgeIcon, EyeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

type ToolType = 'annotate' | 'edit' | 'convert' | 'merge' | 'word-to-pdf' | 'security' | 'batch';

export function ToolPreview({ tool }: { tool: ToolType }) {
  const [isHovered, setIsHovered] = useState(false);

  const previews = {
    annotate: (
      <svg viewBox="0 0 200 150" className="w-full h-full">
        {/* Document */}
        <rect x="30" y="20" width="100" height="120" rx="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
        {/* Text lines */}
        <line x1="40" y1="40" x2="90" y2="40" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="50" x2="120" y2="50" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="60" x2="100" y2="60" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        {/* Annotation - highlight */}
        <rect x="35" y="70" width="90" height="15" rx="2" fill="#fef08a" opacity={isHovered ? "0.9" : "0.6"} className="transition-opacity duration-300" />
        {/* Annotation - text */}
        <rect x="100" y="85" width="25" height="12" rx="2" fill="#fbbf24" opacity={isHovered ? "0.9" : "0.6"} className="transition-opacity duration-300" />
        {/* Cursor icon */}
        <path d="M130 80 L140 100 L135 100 L135 115 L130 115 L130 100 L125 100 Z" fill="#3b82f6" opacity={isHovered ? "1" : "0.5"} className="transition-all duration-300" />
        {/* Floating icons */}
        <circle cx="160" cy="30" r="12" fill="#ede9fe" className="animate-float" />
        <path d="M156 30 L160 26 L164 30 M156 30 L160 34 L164 30" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="130" r="10" fill="#dbeafe" className="animate-float" style={{ animationDelay: '0.5s' }} />
        <path d="M46 130 L54 130 M50 126 L50 134" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    edit: (
      <svg viewBox="0 0 200 150" className="w-full h-full">
        {/* Document stack */}
        <rect x="35" y="30" width="90" height="110" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
        <rect x="45" y="20" width="90" height="110" rx="4" fill="white" stroke="#cbd5e1" strokeWidth="2" />
        {/* Active page */}
        <rect x="55" y="10" width="90" height="110" rx="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
        {/* Page content */}
        <line x1="65" y1="30" x2="135" y2="30" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="65" y1="40" x2="125" y2="40" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="65" y1="50" x2="130" y2="50" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        {/* Rotate indicator */}
        <g transform="translate(155, 70)" opacity={isHovered ? "1" : "0.5"} className="transition-opacity duration-300">
          <circle cx="0" cy="0" r="18" fill="#ede9fe" />
          <path d="M-8 0 A8 8 0 1 1 0 8" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M0 8 L4 4 L8 8" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* Delete indicator */}
        <g transform="translate(155, 110)" opacity={isHovered ? "1" : "0.5"} className="transition-opacity duration-300">
          <circle cx="0" cy="0" r="18" fill="#fee2e2" />
          <path d="M-6 -2 L6 6 M6 -2 L-6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    ),
    convert: (
      <svg viewBox="0 0 200 150" className="w-full h-full">
        {/* PDF icon */}
        <rect x="20" y="40" width="60" height="75" rx="4" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
        <text x="35" y="85" fill="#ef4444" fontSize="16" fontWeight="bold">PDF</text>
        {/* Arrow */}
        <g opacity={isHovered ? "1" : "0.5"} className="transition-opacity duration-300">
          <path d="M90 77 L110 77" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
          <path d="M105 70 L115 77 L105 84" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* Image icon */}
        <rect x="120" y="40" width="60" height="75" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
        <circle cx="145" cy="65" r="10" fill="#93c5fd" />
        <path d="M130 100 L145 80 L160 100 Z" fill="#60a5fa" />
        {/* Bidirectional arrow for reverse */}
        <g transform="translate(90, 125)" opacity={isHovered ? "1" : "0.5"} className="transition-opacity duration-300">
          <path d="M-20 0 L20 0" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
          <path d="M-15 -5 L-20 0 L-15 5" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M15 -5 L20 0 L15 5" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    ),
    merge: (
      <svg viewBox="0 0 200 150" className="w-full h-full">
        {/* Document 1 */}
        <rect x="25" y="50" width="50" height="65" rx="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
        <line x1="32" y1="62" x2="68" y2="62" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="72" x2="60" y2="72" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="82" x2="65" y2="82" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        {/* Document 2 */}
        <rect x="45" y="35" width="50" height="65" rx="4" fill="white" stroke="#8b5cf6" strokeWidth="2" />
        <line x1="52" y1="47" x2="88" y2="47" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="57" x2="80" y2="57" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" />
        {/* Merged document */}
        <rect x="100" y="25" width="70" height="100" rx="4" fill="white" stroke="#10b981" strokeWidth="2" className="transition-transform duration-300" style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }} />
        <line x1="110" y1="40" x2="160" y2="40" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
        <line x1="110" y1="50" x2="150" y2="50" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
        <line x1="110" y1="60" x2="155" y2="60" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
        <line x1="110" y1="70" x2="145" y2="70" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
        <line x1="110" y1="80" x2="158" y2="80" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
        {/* Merge arrows */}
        <g opacity={isHovered ? "1" : "0.5"} className="transition-opacity duration-300">
          <path d="M78 70 L95 75" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <path d="M78 55 L95 60" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    ),
    'word-to-pdf': (
      <svg viewBox="0 0 200 150" className="w-full h-full">
        {/* Word icon */}
        <rect x="20" y="40" width="55" height="70" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
        <text x="30" y="80" fill="#2563eb" fontSize="14" fontWeight="bold">DOCX</text>
        {/* Arrow */}
        <g opacity={isHovered ? "1" : "0.5"} className="transition-opacity duration-300">
          <path d="M85 75 L115 75" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <path d="M108 68 L118 75 L108 82" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* PDF icon */}
        <rect x="125" y="40" width="55" height="70" rx="4" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
        <text x="138" y="80" fill="#dc2626" fontSize="14" fontWeight="bold">PDF</text>
        {/* Checkmark */}
        <g transform="translate(150, 25)" opacity={isHovered ? "1" : "0.5"} className="transition-opacity duration-300">
          <circle cx="0" cy="0" r="15" fill="#dcfce7" />
          <path d="M-6 0 L-2 4 L6 -4" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    ),
    security: (
      <svg viewBox="0 0 200 150" className="w-full h-full">
        {/* Lock body */}
        <rect x="70" y="60" width="60" height="50" rx="8" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
        {/* Lock shackle */}
        <path d="M80 60 L80 45 A20 20 0 0 1 120 45 L120 60" stroke="#ef4444" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Keyhole */}
        <circle cx="100" cy="80" r="8" fill="#ef4444" />
        <rect x="96" y="80" width="8" height="15" rx="2" fill="#ef4444" />
        {/* Glow effect */}
        <g opacity={isHovered ? "1" : "0.5"} className="transition-opacity duration-300">
          <circle cx="100" cy="75" r="40" fill="none" stroke="#fef08a" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
        </g>
        {/* Shield icon */}
        <g transform="translate(155, 25)">
          <circle cx="0" cy="0" r="18" fill="#fef2f2" />
          <path d="M-8 0 L0 -8 L8 0 L0 12 Z" fill="#ef4444" opacity={isHovered ? "1" : "0.6"} />
        </g>
      </svg>
    ),
    batch: (
      <svg viewBox="0 0 200 150" className="w-full h-full">
        {/* Document 1 */}
        <rect x="20" y="35" width="45" height="55" rx="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
        <line x1="27" y1="45" x2="58" y2="45" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="27" y1="53" x2="52" y2="53" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        {/* Document 2 */}
        <rect x="40" y="25" width="45" height="55" rx="4" fill="white" stroke="#8b5cf6" strokeWidth="2" />
        <line x1="47" y1="35" x2="78" y2="35" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" />
        <line x1="47" y1="43" x2="72" y2="43" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" />
        {/* Document 3 */}
        <rect x="60" y="15" width="45" height="55" rx="4" fill="white" stroke="#10b981" strokeWidth="2" />
        <line x1="67" y1="25" x2="98" y2="25" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
        <line x1="67" y1="33" x2="92" y2="33" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
        {/* Progress arrows */}
        <g opacity={isHovered ? "1" : "0.5"} className="transition-opacity duration-300">
          <path d="M120 40 L145 40" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <path d="M138 34 L148 40 L138 46" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M120 60 L145 60" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <path d="M138 54 L148 60 L138 66" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M120 80 L145 80" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <path d="M138 74 L148 80 L138 86" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* Checkmarks */}
        <g transform="translate(160, 40)">
          <circle cx="0" cy="0" r="12" fill="#dcfce7" />
          <path d="M-5 0 L-2 3 L5 -4" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g transform="translate(160, 60)">
          <circle cx="0" cy="0" r="12" fill="#dcfce7" />
          <path d="M-5 0 L-2 3 L5 -4" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g transform="translate(160, 80)">
          <circle cx="0" cy="0" r="12" fill="#dcfce7" />
          <path d="M-5 0 L-2 3 L5 -4" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    ),
  };

  return (
    <div 
      className="w-full aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {previews[tool]}
    </div>
  );
}
