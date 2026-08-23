import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hands of ShramiXs — Admin Hub",
  description: "Super Admin Command Center for Hands of ShramiXs",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#041B30",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0F172A', color: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif', WebkitTapHighlightColor: 'transparent' }}>
        {children}
      </body>
    </html>
  );
}
