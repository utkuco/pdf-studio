import type { Metadata } from 'next';
import EditorWrapper from './EditorWrapper';

export const metadata: Metadata = {
  title: 'PDF Studio Editor — Edit, Annotate, Merge & Convert PDFs',
  description: 'Open the PDF Studio editor to edit pages, annotate content, merge files, convert formats, and enhance resolution — all in your browser.',
  robots: { index: true, follow: true },
};

export default function EditorPage() {
  return <EditorWrapper />;
}
