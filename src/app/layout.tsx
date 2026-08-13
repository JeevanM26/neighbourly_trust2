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
  title: "Neighborly Trust — Find Local Service Specialists",
  description:
    "Book verified local electricians, plumbers, carpenters, and home cleaners in your area. Fast, reliable, and trustworthy service at your doorstep.",
  keywords: "electrician, plumber, carpenter, home cleaning, local services, book service, nearby workers, trusted providers",
  authors: [{ name: "Neighborly Trust" }],
  openGraph: {
    title: "Neighborly Trust",
    description: "Find and book verified local service specialists near you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* theme-color is set via viewport export above */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
