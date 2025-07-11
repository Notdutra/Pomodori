import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
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
          href='/icons/apple-touch-icon.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/icons/favicon-32x32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='/icons/favicon-16x16.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='192x192'
          href='/icons/android-chrome-192x192.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='512x512'
          href='/icons/android-chrome-512x512.png'
        />
        <link
          rel='shortcut icon'
          type='image/x-icon'
          href='/icons/favicon.ico'
        />
      </head>
      <body className='min-h-screen overflow-x-hidden antialiased'>
        {children}
      </body>
    </html>
  );
}
