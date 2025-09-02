import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Studio 8 AI UX tester',
  description: 'Professional UX evaluation tool with AI-powered personas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
