import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AppAuthBoundary } from '@/components/auth/AppAuthBoundary';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'TutorTrack',
  description: 'Трекинг прогресса учеников репетитора',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#f5f4f0] text-[#1a1a18]"><AppAuthBoundary>{children}</AppAuthBoundary></body>
    </html>
  );
}
