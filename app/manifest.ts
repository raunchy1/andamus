import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Andamus - Carpooling Sardegna",
    short_name: "Andamus",
    description: "Trova e offri passaggi in Sardegna. Il carpooling sardo gratuito per viaggiare insieme, risparmiare sui costi e ridurre le emissioni.",
    start_url: "/it",
    display: "standalone",
    background_color: "#1c1b1b",
    theme_color: "#e63946",
    orientation: "portrait",
    scope: "/",
    lang: "it",
    dir: "ltr",
    categories: ["travel", "navigation", "social", "lifestyle"],
    icons: [
      {
        src: "/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-home.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Homepage di Andamus",
      },
      {
        src: "/screenshot-mobile.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "Andamus su mobile",
      },
    ],
    shortcuts: [
      {
        name: "Cerca passaggio",
        short_name: "Cerca",
        description: "Trova un passaggio in Sardegna",
        url: "/it/cerca",
        icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
      },
      {
        name: "Offri passaggio",
        short_name: "Offri",
        description: "Pubblica una corsa",
        url: "/it/offri",
        icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
      },
      {
        name: "Profilo",
        short_name: "Profilo",
        description: "Visualizza il tuo profilo",
        url: "/it/profilo",
        icons: [{ src: "/icon-96x96.png", sizes: "96x96" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
    id: "andamus-carpooling",
  };
}
