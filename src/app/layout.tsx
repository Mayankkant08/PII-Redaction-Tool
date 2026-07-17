import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PII Redactor — Document Privacy Tool',
  description: 'Automatically detect and redact Personally Identifiable Information from .docx documents. Supports names, emails, phones, PAN, CIN, DIN, addresses, and more.',
  keywords: ['PII', 'redaction', 'privacy', 'DOCX', 'GDPR', 'data protection'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
