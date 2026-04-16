'use client';

import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/Toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>{children}</ToastProvider>
    </LanguageProvider>
  );
}
