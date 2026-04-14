import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PDF Studio — Free Online PDF Editor, Converter & Merger',
  description: 'Edit, annotate, merge, convert and enhance PDF files directly in your browser. No uploads, no sign-up, no limits. 100% private and free.',
  keywords: ['PDF editor', 'PDF merger', 'PDF converter', 'annotate PDF', 'edit PDF online', 'Word to PDF', 'PDF to image', 'free PDF tools', 'online PDF editor', 'browser PDF editor'],
  authors: [{ name: 'PDF Studio' }],
  openGraph: {
    title: 'PDF Studio — Free Online PDF Editor',
    description: 'Edit, annotate, merge, convert and enhance PDF files directly in your browser. No uploads, no sign-up.',
    url: 'https://pdfstudio.app',
    siteName: 'PDF Studio',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Studio — Free Online PDF Editor',
    description: 'Edit, annotate, merge, convert and enhance PDF files directly in your browser.',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://pdfstudio.app'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
