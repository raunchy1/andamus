import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Navbar } from "@/components/navbar";
import { Toaster } from "react-hot-toast";
import { SafetyButton } from "@/components/SafetyButton";
import { ThemeProvider } from "@/components/ThemeProvider";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ThemeProvider>
        <Navbar />
        {children}
        <SafetyButton />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--card)',
              color: 'var(--card-foreground)',
              border: '1px solid var(--border)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: 'var(--card)',
              },
            },
            error: {
              iconTheme: {
                primary: '#e63946',
                secondary: 'var(--card)',
              },
            },
          }}
        />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
