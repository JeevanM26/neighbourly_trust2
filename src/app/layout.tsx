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
  '@type': 'HomeAndConstructionBusiness',
  name: 'HeroHand',
  alternateName: ['Hero Hand', 'HeroHand.me'],
  description: 'Instant local home services booking platform for verified electricians, plumbers, carpenters, AC technicians, and cleaners.',
  url: 'https://herohand.me',
  logo: 'https://herohand.me/icon-512.png',
  image: 'https://herohand.me/icon-512.png',
  telephone: '+918867269712',
  priceRange: '₹199 - ₹2500',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Shivamogga',
    addressRegion: 'Karnataka',
    addressCountry: 'IN'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 13.9299,
    longitude: 75.5681
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '06:00',
      closes: '23:00'
    }
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Home Services & Repairs',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Electrician & Electrical Wiring',
          description: 'Switchboards, fan repair, MCB tripping, house wiring, inverter setup'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Plumber & Water Leakage Repair',
          description: 'Pipe leakage, tap repair, bathroom fittings, tank cleaning, drain unclogging'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Carpenter & Furniture Repair',
          description: 'Door locks, modular kitchen hinges, wardrobe assembly, wooden polishing'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'AC Repair & Jet Servicing',
          description: 'Refrigerant gas refill, cooling issue diagnosis, split/window AC installation'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Deep Home & Bathroom Cleaning',
          description: 'Kitchen degreasing, bathroom tile scrub, sofa shampooing, full home sanitization'
        }
      }
    ]
  }
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I book an electrician or plumber on Hero Hand?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Simply open HeroHand.me, select your needed service (Electrician, Plumber, Carpenter, etc.), and our GPS dispatch system will match you with the closest verified technician in your neighborhood within 15–30 minutes.'
      }
    },
    {
      '@type': 'Question',
      name: 'Are technicians on Hero Hand background-verified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! All Hero Hand service specialists undergo rigorous identity and background checks for your complete peace of mind.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is my phone number kept private when calling workers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Hero Hand features a built-in Privacy Shield where phone numbers are masked, and voice calls route directly through encrypted in-app calling.'
      }
    }
  ]
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
        <meta name="geo.region" content="IN-KA" />
        <meta name="geo.placename" content="Shivamogga, Karnataka, India" />
        <meta name="geo.position" content="13.9299;75.5681" />
        <meta name="ICBM" content="13.9299, 75.5681" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Kannada:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
