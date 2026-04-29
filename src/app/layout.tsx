import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/Providers';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PDF Studio — Free Online PDF Editor, Converter & Merger',
  description: 'Edit, annotate, merge, convert and enhance PDF files directly in your browser. No uploads, no sign-up, no limits. 100% private and free.',
  keywords: ['PDF editor', 'PDF merger', 'PDF converter', 'annotate PDF', 'edit PDF online', 'Word to PDF', 'PDF to image', 'free PDF tools', 'online PDF editor', 'browser PDF editor'],
  authors: [{ name: 'PDF Studio' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icon-192.svg',
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-865LB5NGLX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-865LB5NGLX');
          `}
        </Script>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
