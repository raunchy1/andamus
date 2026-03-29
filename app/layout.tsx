import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "react-hot-toast";
import { SafetyButton } from "@/components/SafetyButton";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Andamus - Carpooling in Sardegna",
  description: "Trova e offri passaggi in Sardegna. Il carpooling sardo per viaggiare insieme.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Andamus",
  },
};

export const viewport: Viewport = {
  themeColor: "#e63946",
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
      lang="it"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Navbar />
        {children}
        <SafetyButton />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e2a4a',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#1e2a4a',
              },
            },
            error: {
              iconTheme: {
                primary: '#e63946',
                secondary: '#1e2a4a',
              },
            },
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((registration) => console.log('SW registered'))
                    .catch((error) => console.log('SW registration failed'));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
