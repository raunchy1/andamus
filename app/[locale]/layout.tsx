import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/lib/env";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/navbar";
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SafetyButton } from "@/components/SafetyButton";
import { VersionBadge } from "@/components/VersionBadge";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LangSetter } from "@/components/LangSetter";
import { PostHogProvider } from "@/components/PostHogProvider";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import CookieConsent from "@/components/CookieConsent";
import { Suspense } from "react";
import { locales as SUPPORTED_LOCALES } from "@/i18n/config";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://andamus.it";
  
  const titles: Record<string, string> = {
    it: "Andamus - Carpooling in Sardegna",
    en: "Andamus - Carpooling in Sardinia",
  };
  
  const descriptions: Record<string, string> = {
    it: "Trova e offri passaggi in Sardegna. Semplice, diretto, tra sardi.",
    en: "Find or offer rides in Sardinia. Simple and direct.",
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
      "viaggi condivisi",
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
    manifest: `/${locale}/manifest.json`,
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
      statusBarStyle: "black-translucent",
      title: "Andamus",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

/**
 * Enable static generation for all locale variants.
 * Without this, Next.js treats every page under [locale] as fully dynamic.
 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale — reject unsupported values
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  setRequestLocale(locale);
  let messages;
  try {
    messages = await getMessages({ locale });
  } catch (error) {
    console.error('[layout] Failed to load messages for locale:', locale, error);
    messages = await getMessages({ locale: 'it' });
  }


  return (
    <>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <PostHogProvider>
          <LangSetter locale={locale} />
          <ThemeProvider>
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>
            <Navbar />
            <ClientLayoutWrapper>
              <div className="page-enter">
                {children}
              </div>
            </ClientLayoutWrapper>
            <SafetyButton />
            <VersionBadge />
            <Sonner richColors position="top-center" />
            <CookieConsent />
          </ThemeProvider>
        </PostHogProvider>
      </NextIntlClientProvider>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}
    </>
  );
}
