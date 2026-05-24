import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://andamus.it";

interface RideMetadataParams {
  fromCity: string;
  toCity: string;
  date?: string;
  time?: string;
  price: number;
  driverName?: string;
  locale: string;
}

interface EventMetadataParams {
  name: string;
  description?: string;
  location?: string;
  locale: string;
}

interface ProfileMetadataParams {
  name: string;
  rating?: number;
  locale: string;
}

export function buildRideMetadata({
  fromCity,
  toCity,
  date,
  time,
  price,
  driverName,
  locale,
}: RideMetadataParams): Metadata {
  const priceText =
    price > 0
      ? `€${price}`
      : locale === "it"
        ? "Gratis"
        : locale === "de"
          ? "Kostenlos"
          : "Free";

  const title = `${fromCity} → ${toCity} · ${priceText} · Andamus`;

  const description =
    locale === "it"
      ? `Passaggio da ${fromCity} a ${toCity}${date ? ` il ${date}` : ""}${time ? ` alle ${time}` : ""}${driverName ? ` con ${driverName}` : ""}. Prenota su Andamus!`
      : locale === "de"
        ? `Mitfahrt von ${fromCity} nach ${toCity}${date ? ` am ${date}` : ""}${time ? ` um ${time}` : ""}${driverName ? ` mit ${driverName}` : ""}. Buchen Sie auf Andamus!`
        : `Ride from ${fromCity} to ${toCity}${date ? ` on ${date}` : ""}${time ? ` at ${time}` : ""}${driverName ? ` with ${driverName}` : ""}. Book on Andamus!`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "de_DE",
      url: `${BASE_URL}/${locale}/corsa/${fromCity}-${toCity}`,
      siteName: "Andamus",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function buildEventMetadata({
  name,
  description,
  location,
  locale,
}: EventMetadataParams): Metadata {
  const title = `${name} · Andamus`;
  const desc =
    description ||
    (locale === "it"
      ? `Evento a ${location || "Sardegna"} su Andamus`
      : locale === "de"
        ? `Veranstaltung in ${location || "Sardinien"} auf Andamus`
        : `Event in ${location || "Sardinia"} on Andamus`);

  return {
    title,
    description: desc,
    openGraph: {
      type: "article",
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "de_DE",
      url: `${BASE_URL}/${locale}/eventi`,
      siteName: "Andamus",
      title,
      description: desc,
    },
  };
}

export function buildProfileMetadata({
  name,
  rating,
  locale,
}: ProfileMetadataParams): Metadata {
  const title = `${name} · Andamus`;
  const desc =
    locale === "it"
      ? `Profilo di ${name}${rating ? ` · ${rating}★` : ""} su Andamus`
      : locale === "de"
        ? `Profil von ${name}${rating ? ` · ${rating}★` : ""} auf Andamus`
        : `Profile of ${name}${rating ? ` · ${rating}★` : ""} on Andamus`;

  return {
    title,
    description: desc,
    openGraph: {
      type: "profile",
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "de_DE",
      url: `${BASE_URL}/${locale}/profilo`,
      siteName: "Andamus",
      title,
      description: desc,
    },
  };
}

export function buildDefaultMetadata(locale: string): Metadata {
  const title =
    locale === "it"
      ? "Andamus · Carpooling in Sardegna"
      : locale === "de"
        ? "Andamus · Fahrgemeinschaften auf Sardinien"
        : "Andamus · Carpooling in Sardinia";

  const description =
    locale === "it"
      ? "Trova o offri un passaggio in tutta la Sardegna. Andamus è il carpooling moderno, sicuro e gratuito per l'isola."
      : locale === "de"
        ? "Finden oder bieten Sie eine Mitfahrgelegenheit in ganz Sardinien. Andamus ist das moderne, sichere und kostenlose Carpooling für die Insel."
        : "Find or offer a ride across Sardinia. Andamus is the modern, safe and free carpooling for the island.";

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    openGraph: {
      type: "website",
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "de_DE",
      url: BASE_URL,
      siteName: "Andamus",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
