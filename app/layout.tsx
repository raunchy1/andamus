import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Andamus - Carpooling in Sardegna",
  description: "Trova e offri passaggi in Sardegna. Il carpooling sardo per viaggiare insieme, risparmiare e ridurre le emissioni.",
  manifest: "/manifest.json",
  keywords: ["carpooling", "Sardegna", "passaggi", "viaggi", "condivisione", "auto", "trasporto"],
  authors: [{ name: "Andamus Team" }],
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://andamus.it",
    siteName: "Andamus",
    title: "Andamus - Carpooling in Sardegna",
    description: "Trova e offri passaggi in Sardegna. Il carpooling sardo per viaggiare insieme.",
    images: [
      {
        url: "https://andamus.it/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Andamus - Carpooling in Sardegna",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Andamus - Carpooling in Sardegna",
    description: "Trova e offri passaggi in Sardegna. Il carpooling sardo per viaggiare insieme.",
    images: ["https://andamus.it/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Andamus",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#131313",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${inter.variable} ${bebasNeue.variable} ${playfair.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#131313] text-[#e5e2e1]">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js');});}`,
          }}
        />
      </body>
    </html>
  );
}
