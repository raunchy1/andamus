import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "react-hot-toast";
import { SafetyButton } from "@/components/SafetyButton";
import { ThemeProvider } from "@/components/ThemeProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#e63946",
};

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://andamus.it";
  
  const titles: Record<string, string> = {
    it: "Andamus - Carpooling gratuito in Sardegna",
    en: "Andamus - Free Carpooling in Sardinia",
    de: "Andamus - Kostenlose Fahrgemeinschaft in Sardinien",
  };
  
  const descriptions: Record<string, string> = {
    it: "Trova o offri un passaggio in tutta la Sardegna. Gratuito, sicuro e pensato per i sardi. Risparmia sui costi del carburante e riduci le emissioni di CO2.",
    en: "Find or offer a ride across Sardinia. Free, safe, and built for Sardinians. Save on fuel costs and reduce CO2 emissions.",
    de: "Finden oder bieten Sie eine Mitfahrgelegenheit in ganz Sardinien. Kostenlos, sicher und für Sardinien entwickelt. Sparen Sie Benzinkosten und reduzieren Sie CO2-Emissionen.",
  };

  const title = titles[locale] || titles.it;
  const description = descriptions[locale] || descriptions.it;

  return {
    title: {
      default: title,
      template: "%s | Andamus",
    },
    description,
    keywords: [
      "carpooling",
      "passaggi",
      "Sardegna",
      "Sardinia",
      "autostop",
      "viaggi",
      "condivisione",
      "sostenibilità",
      "CO2",
      "car sharing",
      "mobilità",
    ],
    authors: [{ name: "Andamus Team" }],
    creator: "Andamus",
    publisher: "Andamus",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        it: "/it",
        en: "/en",
        de: "/de",
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "de_DE",
      url: `${baseUrl}/${locale}`,
      siteName: "Andamus",
      title,
      description,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Andamus - Carpooling in Sardegna",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
      creator: "@andamus",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Andamus",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data */}
        <Script
          id="json-ld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Andamus",
              applicationCategory: "TravelApplication",
              operatingSystem: "Any",
              description:
                "Carpooling gratuito in Sardegna. Trova o offri passaggi in modo sicuro e sostenibile.",
              url: "https://andamus.it",
              image: "https://andamus.it/og-image.png",
              author: {
                "@type": "Organization",
                name: "Andamus",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
              },
              areaServed: {
                "@type": "Place",
                name: "Sardegna",
                address: {
                  "@type": "PostalAddress",
                  addressRegion: "Sardegna",
                  addressCountry: "IT",
                },
              },
            }),
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            <Navbar />
            {children}
            <BottomNav />
            <SafetyButton />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                  border: "1px solid var(--border)",
                },
                success: {
                  iconTheme: {
                    primary: "#22c55e",
                    secondary: "var(--card)",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#e63946",
                    secondary: "var(--card)",
                  },
                },
              }}
            />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
