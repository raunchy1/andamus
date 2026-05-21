import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://andamus.it";

  let fromCity = "";
  let toCity = "";
  let date = "";
  let time = "";
  let price = 0;
  let driverName = "";

  try {
    const supabase = await createClient();
    const { data: ride } = await supabase
      .from("rides")
      .select("from_city, to_city, date, time, price, profiles(name)")
      .eq("id", id)
      .single();

    if (ride) {
      fromCity = ride.from_city;
      toCity = ride.to_city;
      date = ride.date;
      time = ride.time?.slice(0, 5) || "";
      price = ride.price || 0;
      const profile = Array.isArray(ride.profiles) ? ride.profiles[0] : ride.profiles;
      driverName = profile?.name || "";
    }
  } catch {
    // Fallback to defaults
  }

  const priceText = price > 0 ? `€${price}` : locale === "it" ? "Gratis" : locale === "de" ? "Kostenlos" : "Free";

  const title = fromCity && toCity
    ? `${fromCity} → ${toCity} · ${priceText} · Andamus`
    : locale === "it"
      ? "Passaggio su Andamus"
      : locale === "de"
        ? "Mitfahrt auf Andamus"
        : "Ride on Andamus";

  const description = fromCity && toCity
    ? (locale === "it"
      ? `Passaggio da ${fromCity} a ${toCity}${date ? ` il ${date}` : ""}${time ? ` alle ${time}` : ""}${driverName ? ` con ${driverName}` : ""}. Prenota su Andamus!`
      : locale === "de"
        ? `Mitfahrt von ${fromCity} nach ${toCity}${date ? ` am ${date}` : ""}${time ? ` um ${time}` : ""}${driverName ? ` mit ${driverName}` : ""}. Buchen Sie auf Andamus!`
        : `Ride from ${fromCity} to ${toCity}${date ? ` on ${date}` : ""}${time ? ` at ${time}` : ""}${driverName ? ` with ${driverName}` : ""}. Book on Andamus!`)
    : (locale === "it"
      ? "Trova o offri un passaggio in tutta la Sardegna su Andamus."
      : locale === "de"
        ? "Finden oder bieten Sie eine Mitfahrgelegenheit in ganz Sardinien auf Andamus."
        : "Find or offer a ride across Sardinia on Andamus.");

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: "article",
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "de_DE",
      url: `${baseUrl}/${locale}/corsa/${id}`,
      siteName: "Andamus",
      title,
      description,
      images: [`/${locale}/corsa/${id}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/${locale}/corsa/${id}/twitter-image`],
    },
  };
}

export default function RideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
