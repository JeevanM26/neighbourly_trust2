import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfflineBanner } from '../components/OfflineBanner';
import { WorkerProvider } from '../context/WorkerContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#059669',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://herohand.me'),
  title: {
    default: 'HeroHand Partner - WOH HeroHand | One App. All Workers.',
    template: '%s | HeroHand Partner',
  },
  description: 'Join HeroHand Partner (WOH HeroHand) — The premier platform for electricians, plumbers, carpenters, cleaners, and local technicians. Get instant nearby bookings, loud audio alerts, direct customer calls, and daily payouts.',
  keywords: [
    'HeroHand',
    'HeroHand Partner',
    'WOH HeroHand',
    'Hero Hand',
    'HeroHand Worker',
    'WOH',
    'local technician app',
    'electrician jobs',
    'plumber jobs',
    'carpenter jobs',
    'cleaning services partner',
    'appliance repair jobs',
    'handyman jobs near me',
    'service partner portal',
    'daily payout worker app',
    'neighbourly trust'
  ],
  authors: [{ name: 'HeroHand Team' }],
  creator: 'HeroHand',
  publisher: 'HeroHand',
  applicationName: 'HeroHand Partner (WOH HeroHand)',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://herohand.me',
    siteName: 'HeroHand Partner - WOH HeroHand',
    title: 'HeroHand Partner - WOH HeroHand | One App. All Workers.',
    description: 'Empowering skilled workers with instant customer bookings, zero commission hassle, and daily payouts. Accept jobs and build your reputation.',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'HeroHand Partner Icon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HeroHand Partner - WOH HeroHand | One App. All Workers.',
    description: 'Get local service bookings with instant loud alerts and daily payouts.',
    images: ['/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'HeroHand Partner (WOH HeroHand)',
  operatingSystem: 'Android, iOS, Web',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  description: 'Manage your service bookings, skills, and earnings with HeroHand Partner (WOH HeroHand).',
  author: {
    '@type': 'Organization',
    name: 'HeroHand',
    url: 'https://herohand.me',
  },
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Kannada:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
