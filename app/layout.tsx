import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import "./globals.css";

const inter = {
  variable: "font-sans",
};

const spaceGrotesk = {
  variable: "font-space",
};

const SUPPORTED_LOCALES = ["it", "en", "de"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export const metadata: Metadata = {
  title: "Andamus - Carpooling in Sardegna",
  description:
    "Trova e offri passaggi in Sardegna. Il carpooling sardo per viaggiare insieme, risparmiare e ridurre le emissioni.",
  keywords: [
    "carpooling",
    "Sardegna",
    "passaggi",
    "viaggi",
    "condivisione",
    "auto",
    "trasporto",
  ],
  authors: [{ name: "Andamus Team" }],
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://andamus.it",
    siteName: "Andamus",
    title: "Andamus - Carpooling in Sardegna",
    description:
      "Trova e offri passaggi in Sardegna. Il carpooling sardo per viaggiare insieme.",
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
    description:
      "Trova e offri passaggi in Sardegna. Il carpooling sardo per viaggiare insieme.",
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
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

/**
 * Extracts the locale from the current request URL pathname.
 * Falls back to "it" if the path doesn't contain a recognized locale segment.
 *
 * This runs server-side on every request so the <html lang> attribute
 * is always correct for SEO crawlers (no client-side JS needed).
 */
async function getLocaleFromPath(): Promise<SupportedLocale> {
  try {
    const headersList = await headers();
    // Next.js sets x-next-url or we can derive from x-invoke-path / x-middleware-rewrite
    const nextUrl = headersList.get("x-next-url");
    const invokedPath = headersList.get("x-invoke-path");
    const pathname = nextUrl || invokedPath || "";

    // Match /it/..., /en/..., /de/...
    const match = pathname.match(/^\/(it|en|de)(?:\/|$)/);
    if (match && isSupportedLocale(match[1])) {
      return match[1];
    }
  } catch {
    // headers() may throw outside of a request context (e.g., during build)
  }
  return "it";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromPath();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${spaceGrotesk.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#0a0a0a] text-[#e5e2e1]">
        {children}
        <Script src="/sw-register.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
