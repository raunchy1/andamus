// @ts-nocheck
"use client";

/**
 * Offline-First PWA Support
 * =========================
 * Client-side offline data management using IndexedDB.
 * WHY: Mobile users frequently experience poor connectivity.
 * Offline-first UX ensures core features work regardless of network state.
 */

// ---------------------------------------------------------------------------
// IndexedDB setup
// ---------------------------------------------------------------------------

const DB_NAME = "andamus-offline";
const DB_VERSION = 1;

interface OfflineDB extends IDBDatabase {
  // Marker interface
}

let _db: OfflineDB | null = null;

async function getDB(): Promise<OfflineDB | null> {
  if (_db) return _db;
  if (typeof window === "undefined") return null;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      _db = request.result as OfflineDB;
      resolve(_db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Rides cache
      if (!db.objectStoreNames.contains("rides")) {
        const ridesStore = db.createObjectStore("rides", { keyPath: "id" });
        ridesStore.createIndex("date", "date", { unique: false });
        ridesStore.createIndex("from_city", "from_city", { unique: false });
        ridesStore.createIndex("cached_at", "cached_at", { unique: false });
      }

      // Bookings cache
      if (!db.objectStoreNames.contains("bookings")) {
        db.createObjectStore("bookings", { keyPath: "id" });
      }

      // Messages cache
      if (!db.objectStoreNames.contains("messages")) {
        const msgStore = db.createObjectStore("messages", { keyPath: "id" });
        msgStore.createIndex("booking_id", "booking_id", { unique: false });
      }

      // User profile cache
      if (!db.objectStoreNames.contains("profile")) {
        db.createObjectStore("profile", { keyPath: "id" });
      }

      // Notifications cache
      if (!db.objectStoreNames.contains("notifications")) {
        const notifStore = db.createObjectStore("notifications", { keyPath: "id" });
        notifStore.createIndex("read", "read", { unique: false });
      }

      // Pending actions queue (for background sync)
      if (!db.objectStoreNames.contains("pending_actions")) {
        db.createObjectStore("pending_actions", { keyPath: "id", autoIncrement: true });
      }

      // Search history
      if (!db.objectStoreNames.contains("search_history")) {
        db.createObjectStore("search_history", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

// ---------------------------------------------------------------------------
// Generic store operations
// ---------------------------------------------------------------------------

async function put<T extends Record<string, unknown>>(
  storeName: string,
  data: T
): Promise<void> {
  const db = await getDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function get<T>(storeName: string, id: string): Promise<T | null> {
  const db = await getDB();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as T | null);
    request.onerror = () => reject(request.error);
  });
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result as T[]) ?? []);
    request.onerror = () => reject(request.error);
  });
}

async function clearStore(storeName: string): Promise<void> {
  const db = await getDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Rides cache
// ---------------------------------------------------------------------------

export interface CachedRide {
  id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  status: string;
  driver_id: string;
  profiles: Record<string, unknown>;
  cached_at: number;
  expires_at: number;
}

export async function cacheRides(rides: CachedRide[]): Promise<void> {
  const now = Date.now();
  const expiresAt = now + 3600000; // 1 hour

  for (const ride of rides) {
    await put("rides", { ...ride, cached_at: now, expires_at: expiresAt });
  }
}

export async function getCachedRides(): Promise<CachedRide[]> {
  const rides = await getAll<CachedRide>("rides");
  const now = Date.now();
  // Filter out expired rides
  return rides.filter((r) => r.expires_at > now);
}

export async function getCachedRideById(id: string): Promise<CachedRide | null> {
  const ride = await get<CachedRide>("rides", id);
  if (ride && ride.expires_at > Date.now()) return ride;
  return null;
}

export async function clearExpiredRides(): Promise<void> {
  const db = await getDB();
  if (!db) return;

  const now = Date.now();
  const tx = db.transaction("rides", "readwrite");
  const store = tx.objectStore("rides");
  const index = store.index("cached_at");

  return new Promise((resolve, reject) => {
    const request = index.openCursor();
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
      if (!cursor) {
        resolve();
        return;
      }
      const ride = cursor.value as CachedRide;
      if (ride.expires_at < now) {
        cursor.delete();
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Messages cache (for offline chat)
// ---------------------------------------------------------------------------

export interface CachedMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  synced: boolean;
  pending?: boolean;
}

export async function cacheMessages(messages: CachedMessage[]): Promise<void> {
  for (const msg of messages) {
    await put("messages", msg as unknown as Record<string, unknown>);
  }
}

export async function getCachedMessages(bookingId: string): Promise<CachedMessage[]> {
  const db = await getDB();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction("messages", "readonly");
    const store = tx.objectStore("messages");
    const index = store.index("booking_id");
    const request = index.getAll(bookingId);
    request.onsuccess = () => resolve((request.result as CachedMessage[]) ?? []);
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Pending actions queue (optimistic offline actions)
// ---------------------------------------------------------------------------

export interface PendingAction {
  id?: number;
  type: "book_ride" | "cancel_booking" | "send_message" | "create_ride" | "update_profile";
  payload: Record<string, unknown>;
  created_at: number;
  retry_count: number;
  last_error?: string;
}

export async function queuePendingAction(action: Omit<PendingAction, "id">): Promise<number> {
  const db = await getDB();
  if (!db) throw new Error("IndexedDB not available");

  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_actions", "readwrite");
    const store = tx.objectStore("pending_actions");
    const request = store.add({
      ...action,
      created_at: Date.now(),
      retry_count: 0,
    });
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const actions = await getAll<PendingAction>("pending_actions");
  return actions.sort((a, b) => a.created_at - b.created_at);
}

export async function removePendingAction(id: number): Promise<void> {
  const db = await getDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_actions", "readwrite");
    const store = tx.objectStore("pending_actions");
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updatePendingAction(
  id: number,
  updates: Partial<PendingAction>
): Promise<void> {
  const db = await getDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_actions", "readwrite");
    const store = tx.objectStore("pending_actions");
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as PendingAction | undefined;
      if (existing) {
        const request = store.put({ ...existing, ...updates });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// ---------------------------------------------------------------------------
// Network state
// ---------------------------------------------------------------------------

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function subscribeToNetworkChanges(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

// ---------------------------------------------------------------------------
// Cache size management
// ---------------------------------------------------------------------------

export async function getCacheSize(): Promise<{
  rides: number;
  messages: number;
  pendingActions: number;
}> {
  const [rides, messages, pendingActions] = await Promise.all([
    getAll("rides").then((r) => r.length),
    getAll("messages").then((m) => m.length),
    getAll("pending_actions").then((a) => a.length),
  ]);

  return { rides, messages, pendingActions };
}

export async function clearAllOfflineCache(): Promise<void> {
  await clearStore("rides");
  await clearStore("bookings");
  await clearStore("messages");
  await clearStore("notifications");
  await clearStore("search_history");
  // Don't clear pending_actions — those need to be synced
}
