import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineBanner } from "../components/OfflineBanner";
import { AppProvider } from "../context/AppContext";
import { LocationProvider } from "../context/LocationContext";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0B3D66',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://herohand.me'),
  title: {
    default: 'HeroHand — Find Local Service Specialists | Plumbers, Electricians, Carpenters',
    template: '%s | HeroHand',
  },
  description:
    'Book verified local electricians, plumbers, carpenters, cleaners, and appliance technicians in your area with HeroHand. Fast arrival, live map tracking, and trusted pricing.',
  keywords: [
    'HeroHand',
    'Hero Hand',
    'book local service',
    'electrician near me',
    'plumber near me',
    'carpenter near me',
    'home cleaning near me',
    'appliance repair',
    'local technician booking',
    'handyman app',
    'verified home services',
    'neighbourly trust'
  ],
  authors: [{ name: 'HeroHand Team' }],
  creator: 'HeroHand',
  publisher: 'HeroHand',
  applicationName: 'HeroHand',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://herohand.me',
    siteName: 'HeroHand',
    title: 'HeroHand — Find & Book Verified Local Service Specialists',
    description: 'Find trusted local plumbers, electricians, and home cleaners nearby. Live tracking and quick service.',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'HeroHand App Icon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HeroHand — Find & Book Local Specialists',
    description: 'Book verified electricians, plumbers, carpenters, and cleaners near you.',
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
  verification: {
    google: 'googleb967122bc276897b.html',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'HeroHand',
  description: 'Hyperlocal verified services marketplace connecting customers with nearby electricians, plumbers, carpenters, and cleaners.',
  url: 'https://herohand.me',
  logo: 'https://herohand.me/icon-512.png',
  areaServed: {
    '@type': 'Country',
    name: 'India',
  },
  priceRange: '₹₹',
  openingHours: 'Mo-Su 07:00-22:00',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <AppProvider>
          <LocationProvider>
            <div id="app-root">
              <OfflineBanner />
              {children}
            </div>
          </LocationProvider>
        </AppProvider>
      </body>
    </html>
  );
}
