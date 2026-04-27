import type { MetadataRoute } from "next";

export default async function manifest({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<MetadataRoute.Manifest> {
  const { locale } = await params;

  const names: Record<string, { name: string; short_name: string; description: string }> = {
    it: {
      name: "Andamus - Carpooling Sardegna",
      short_name: "Andamus",
      description: "Trova e offri passaggi in Sardegna. Il carpooling sardo gratuito per viaggiare insieme, risparmiare sui costi e ridurre le emissioni.",
    },
    en: {
      name: "Andamus - Sardinia Carpooling",
      short_name: "Andamus",
      description: "Find and offer rides in Sardinia. The free Sardinian carpooling platform to travel together, save on costs and reduce emissions.",
    },
    de: {
      name: "Andamus - Fahrgemeinschaft Sardinien",
      short_name: "Andamus",
      description: "Finden oder bieten Sie Mitfahrgelegenheiten in Sardinien. Die kostenlose sardische Fahrgemeinschafts-Plattform.",
    },
  };

  const n = names[locale] || names.it;

  const shortcuts: MetadataRoute.Manifest["shortcuts"] = [
    {
      name: locale === "it" ? "Cerca passaggio" : locale === "en" ? "Find a ride" : "Fahrt finden",
      short_name: locale === "it" ? "Cerca" : locale === "en" ? "Search" : "Suchen",
      description: locale === "it" ? "Trova un passaggio in Sardegna" : locale === "en" ? "Find a ride in Sardinia" : "Finden Sie eine Mitfahrgelegenheit in Sardinien",
      url: `/${locale}/cerca`,
      icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
    },
    {
      name: locale === "it" ? "Offri passaggio" : locale === "en" ? "Offer a ride" : "Fahrt anbieten",
      short_name: locale === "it" ? "Offri" : locale === "en" ? "Offer" : "Anbieten",
      description: locale === "it" ? "Pubblica una corsa" : locale === "en" ? "Publish a ride" : "Veröffentlichen Sie eine Fahrt",
      url: `/${locale}/offri`,
      icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
    },
    {
      name: locale === "it" ? "Profilo" : locale === "en" ? "Profile" : "Profil",
      short_name: locale === "it" ? "Profilo" : locale === "en" ? "Profile" : "Profil",
      description: locale === "it" ? "Visualizza il tuo profilo" : locale === "en" ? "View your profile" : "Zeigen Sie Ihr Profil an",
      url: `/${locale}/profilo`,
      icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
    },
  ];

  return {
    name: n.name,
    short_name: n.short_name,
    description: n.description,
    start_url: `/${locale}`,
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#e63946",
    orientation: "portrait",
    scope: "/",
    lang: locale,
    dir: "ltr",
    categories: ["travel", "navigation", "social", "lifestyle"],
    icons: [
      { src: "/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "maskable" },
      { src: "/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "maskable" },
      { src: "/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "maskable" },
      { src: "/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "maskable" },
      { src: "/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "maskable" },
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "maskable" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshot-home.png", sizes: "1280x720", type: "image/png", form_factor: "wide", label: locale === "it" ? "Homepage di Andamus" : locale === "en" ? "Andamus Homepage" : "Andamus Startseite" },
      { src: "/screenshot-mobile.png", sizes: "750x1334", type: "image/png", form_factor: "narrow", label: locale === "it" ? "Andamus su mobile" : locale === "en" ? "Andamus on mobile" : "Andamus auf dem Handy" },
    ],
    shortcuts,
    related_applications: [],
    prefer_related_applications: false,
    id: "andamus-carpooling",
  };
}
