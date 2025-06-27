import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Focus Glass - Pomodoro Timer',
  description:
    'A beautiful, minimalist Pomodoro timer with Apple-inspired glass morphism design',
  keywords: ['pomodoro', 'timer', 'focus', 'productivity', 'glass morphism'],
  authors: [{ name: 'Focus Glass' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
