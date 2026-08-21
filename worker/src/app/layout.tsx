import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfflineBanner } from '../components/OfflineBanner';
import { WorkerProvider } from '../context/WorkerContext';
import { WorkerLocationProvider } from '../context/WorkerLocationContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#059669',
};

export const metadata: Metadata = {
  title: 'Hero Hand — Worker Portal',
  description: 'Manage your service bookings, skills, and earnings. Accept jobs, track your income, and grow your business.',
  authors: [{ name: 'Hero Hand' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <WorkerProvider>
          <div className="app-shell">
            <OfflineBanner />
            {children}
          </div>
        </WorkerProvider>
      </body>
    </html>
  );
}
