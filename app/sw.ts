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
  precacheEntries: self.__SW_MANIFEST,
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
    
    // Cache Supabase API GET requests (rides data for offline viewing)
    {
      matcher: ({ url, request }: { url: URL; request: Request }) =>
        url.hostname.includes("supabase.co") &&
        request.method === "GET",
      handler: new NetworkFirst({
        cacheName: "api-rides-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
        networkTimeoutSeconds: 3,
      }),
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
    
    // Cache page navigations (HTML documents)
    {
      matcher: ({ request }: { request: Request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages-cache",
        plugins: [
          {
            handlerDidError: async () => {
              // Return offline fallback if available (default locale)
              const offlineResponse = await caches.match("/it/offline");
              if (offlineResponse) return offlineResponse;
              // Fallback to any cached offline page
              const cache = await caches.open("pages-cache");
              const keys = await cache.keys();
              const offline = keys.find((req) => req.url.includes("/offline"));
              return offline ? cache.match(offline) : undefined;
            },
          },
        ],
        networkTimeoutSeconds: 3,
      }),
    },
  ],
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
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  if (event.action === "open" || event.action === "default") {
    event.waitUntil(
      self.clients.openWindow(event.notification.data?.url || "/")
    );
  }
});

// Install and activate
serwist.addEventListeners();
