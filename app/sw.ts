/// <reference lib="webworker" />
// Service Worker runs in a Web Worker context; types provided by TypeScript's webworker lib

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{ url: string; revision: string | null }>;
};

import { 
  Serwist, 
  CacheFirst, 
  NetworkFirst, 
  StaleWhileRevalidate,
  ExpirationPlugin
} from "serwist";

// Default cache configuration for Next.js
const defaultCache = [
  {
    matcher: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: "google-fonts",
      plugins: [],
    }),
  },
  {
    matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-font-assets",
      plugins: [],
    }),
  },
  {
    matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-image-assets",
      plugins: [],
    }),
  },
  {
    matcher: /\/_next\/image\?url=.+$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "next-image",
      plugins: [],
    }),
  },
  {
    matcher: /\.(?:mp3|mp4|webm)$/i,
    handler: new CacheFirst({
      cacheName: "static-media-assets",
      plugins: [],
    }),
  },
];

// Initialize Serwist with precaching
const serwist = new Serwist({
  precacheEntries: [
    { url: "/offline", revision: "1" },
    ...self.__SW_MANIFEST,
  ],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Default Next.js cache
    ...defaultCache,
    
    // Cache static assets (images, fonts, etc.)
    {
      matcher: ({ request }: { request: Request }) =>
        request.destination === "image" ||
        request.destination === "font" ||
        request.destination === "style",
      handler: new CacheFirst({
        cacheName: "static-assets",
        plugins: [],
      }),
    },
    
    // Cache Google Maps API responses (limited)
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname.includes("googleapis.com") ||
        url.hostname.includes("gstatic.com"),
      handler: new StaleWhileRevalidate({
        cacheName: "google-maps-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    },
    
    // Supabase storage assets (images/audio) — short cache
    {
      matcher: ({ url, request }: { url: URL; request: Request }) =>
        url.hostname.includes("supabase.co") &&
        url.pathname.includes("/storage/v1/object/public/") &&
        request.method === "GET",
      handler: new StaleWhileRevalidate({
        cacheName: "supabase-storage-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 60 * 60, // 1 hour
          }),
        ],
      }),
    },

    // Supabase REST API — NEVER cache (prevents stale rides/notifications/chat)
    {
      matcher: ({ url, request }: { url: URL; request: Request }) =>
        url.hostname.includes("supabase.co") &&
        url.pathname.includes("/rest/v1/") &&
        request.method === "GET",
      handler: async ({ request }: { request: Request }) => {
        return fetch(request);
      },
    },
    
    // Cache internal API routes (GET only)
    {
      matcher: ({ url, request }: { url: URL; request: Request }) =>
        url.pathname.startsWith("/api/") &&
        request.method === "GET",
      handler: new NetworkFirst({
        cacheName: "api-internal-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          }),
        ],
        networkTimeoutSeconds: 3,
      }),
    },
    
    // Page navigations: NetworkOnly with offline fallback.
    // We deliberately do NOT cache HTML pages — stale cached HTML across
    // deploys caused users to see broken pages from previous middleware bugs.
    // Only fall back to /offline if the network truly fails.
    {
      matcher: ({ request }: { request: Request }) => request.mode === "navigate",
      handler: async ({ request }: { request: Request }) => {
        try {
          // Use request.url instead of request to avoid navigate-mode TypeError in browsers
          return await fetch(request.url);
        } catch {
          const offline = await caches.match("/offline");
          return offline ?? new Response("Offline", { status: 503 });
        }
      },
    },
  ],
});

// Drop any stale page caches left over from prior NetworkFirst strategy.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n === "pages-cache" || n === "api-internal-cache")
          .map((n) => caches.delete(n))
      );
    })()
  );
});

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Handle push notifications (for future implementation)
self.addEventListener("push", (event) => {
  if (event.data) {
    let data: { title?: string; body?: string; data?: { url?: string } } = {};
    try {
      data = event.data.json();
    } catch {
      data = { title: "Andamus", body: "Nuova notifica" };
    }
    event.waitUntil(
      self.registration.showNotification(data.title || "Andamus", {
        body: data.body,
        icon: "/icon-192x192.png",
        badge: "/icon-72x72.png",
        data: data.data,
        // @ts-expect-error Notification actions not in standard DOM types
        actions: [
          {
            action: "open",
            title: "Apri",
          },
          {
            action: "close",
            title: "Chiudi",
          },
        ],
      })
    );
  }
});

// Handle notification clicks
// event.action === "" (empty string) = user clicked notification body
// event.action === "open" = user clicked explicit action button
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const targetUrl = (event.notification.data as { url?: string } | null)?.url || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Focus an existing window if available (avoids duplicate windows in standalone mode)
      for (const client of allClients) {
        if ("focus" in client) {
          await (client as WindowClient).navigate(targetUrl);
          await (client as WindowClient).focus();
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })()
  );
});

// Install and activate
serwist.addEventListeners();
