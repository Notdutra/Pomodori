import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pomodori',
  description:
    'A beautiful, minimalist Pomodoro timer to help you focus and boost your productivity.',
  keywords: ['pomodoro', 'timer', 'focus', 'productivity'],
  authors: [
    {
      name: 'notdutra',
    },
  ],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          type='image/png'
          href='/favicon_io/apple-touch-icon.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/favicon_io/favicon-32x32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='/favicon_io/favicon-16x16.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='192x192'
          href='/favicon_io/android-chrome-192x192.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='512x512'
          href='/favicon_io/android-chrome-512x512.png'
        />
        <link
          rel='shortcut icon'
          type='image/x-icon'
          href='/favicon_io/favicon.ico'
        />
      </head>
      <body className='antialiased'>{children}</body>
    </html>
  );
}
