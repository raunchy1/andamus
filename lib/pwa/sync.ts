"use client";

/**
 * Background Sync
 * ===============
 * Queues actions when offline and syncs them when connectivity returns.
 * WHY: Users should be able to book rides, send messages, and create
 * listings even without connectivity. Background sync ensures data
 * integrity when the connection is restored.
 */

import {
  queuePendingAction,
  getPendingActions,
  removePendingAction,
  updatePendingAction,
  isOnline,
  subscribeToNetworkChanges,
} from "./offline";
import type { PendingAction } from "./offline";

// ---------------------------------------------------------------------------
// Sync state
// ---------------------------------------------------------------------------

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  pendingCount: number;
  errors: Array<{ actionId: number; error: string }>;
}

let _syncState: SyncState = {
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  errors: [],
};

let _syncListeners: Array<(state: SyncState) => void> = [];

export function getSyncState(): SyncState {
  return { ..._syncState };
}

export function subscribeToSync(listener: (state: SyncState) => void): () => void {
  _syncListeners.push(listener);
  return () => {
    _syncListeners = _syncListeners.filter((l) => l !== listener);
  };
}

function notifySyncListeners(): void {
  for (const listener of _syncListeners) {
    try {
      listener({ ..._syncState });
    } catch {
      // Ignore listener errors
    }
  }
}

function setSyncState(updates: Partial<SyncState>): void {
  _syncState = { ..._syncState, ...updates };
  notifySyncListeners();
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

type ActionHandler = (payload: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;

const _actionHandlers = new Map<string, ActionHandler>();

export function registerSyncHandler(actionType: string, handler: ActionHandler): void {
  _actionHandlers.set(actionType, handler);
}

export function unregisterSyncHandler(actionType: string): void {
  _actionHandlers.delete(actionType);
}

// ---------------------------------------------------------------------------
// Queue actions optimistically
// ---------------------------------------------------------------------------

export interface OptimisticActionResult {
  queued: boolean;
  actionId?: number;
  error?: string;
}

/**
 * Queue an action to be executed when online.
 * Returns immediately with a queued status.
 */
export async function queueAction(
  type: PendingAction["type"],
  payload: Record<string, unknown>
): Promise<OptimisticActionResult> {
  try {
    const actionId = await queuePendingAction({
      type,
      payload,
      created_at: Date.now(),
      retry_count: 0,
    });

    // Update pending count
    const pending = await getPendingActions();
    setSyncState({ pendingCount: pending.length });

    // If online, try to sync immediately
    if (isOnline()) {
      syncPendingActions().catch(() => {});
    }

    return { queued: true, actionId };
  } catch (err) {
    return {
      queued: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Sync pending actions
// ---------------------------------------------------------------------------

export async function syncPendingActions(): Promise<{
  synced: number;
  failed: number;
  remaining: number;
}> {
  if (_syncState.isSyncing) return { synced: 0, failed: 0, remaining: _syncState.pendingCount };
  if (!isOnline()) return { synced: 0, failed: 0, remaining: _syncState.pendingCount };

  setSyncState({ isSyncing: true });

  const actions = await getPendingActions();
  let synced = 0;
  let failed = 0;
  const errors: Array<{ actionId: number; error: string }> = [];

  for (const action of actions) {
    const handler = _actionHandlers.get(action.type);
    if (!handler) {
      // No handler — mark as failed
      await removePendingAction(action.id!);
      failed++;
      continue;
    }

    try {
      const result = await handler(action.payload);

      if (result.success) {
        await removePendingAction(action.id!);
        synced++;
      } else {
        // Retry logic
        const newRetryCount = (action.retry_count ?? 0) + 1;
        if (newRetryCount >= 3) {
          await removePendingAction(action.id!);
          failed++;
          errors.push({ actionId: action.id!, error: result.error ?? "Max retries exceeded" });
        } else {
          await updatePendingAction(action.id!, {
            retry_count: newRetryCount,
            last_error: result.error,
          });
          failed++;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const newRetryCount = (action.retry_count ?? 0) + 1;

      if (newRetryCount >= 3) {
        await removePendingAction(action.id!);
        failed++;
        errors.push({ actionId: action.id!, error: message });
      } else {
        await updatePendingAction(action.id!, {
          retry_count: newRetryCount,
          last_error: message,
        });
      }
    }
  }

  const remaining = actions.length - synced;

  setSyncState({
    isSyncing: false,
    lastSyncAt: Date.now(),
    pendingCount: remaining,
    errors,
  });

  return { synced, failed, remaining };
}

// ---------------------------------------------------------------------------
// Auto-sync on network recovery
// ---------------------------------------------------------------------------

let _unsubscribeNetwork: (() => void) | null = null;

export function initializeAutoSync(): () => void {
  if (_unsubscribeNetwork) return _unsubscribeNetwork;

  _unsubscribeNetwork = subscribeToNetworkChanges(
    () => {
      // Came online — trigger sync
      syncPendingActions().catch(() => {});
    },
    () => {
      // Went offline — no action needed
    }
  );

  // Also sync on visibility change (user returns to app)
  const handleVisibility = () => {
    if (document.visibilityState === "visible" && isOnline()) {
      syncPendingActions().catch(() => {});
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    _unsubscribeNetwork?.();
    document.removeEventListener("visibilitychange", handleVisibility);
    _unsubscribeNetwork = null;
  };
}

// ---------------------------------------------------------------------------
// Sync badge for PWA install prompt
// ---------------------------------------------------------------------------

export function updateAppBadge(count: number): void {
  if ("setAppBadge" in navigator) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).setAppBadge(count).catch(() => {});
  }
}

export function clearAppBadge(): void {
  if ("clearAppBadge" in navigator) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).clearAppBadge().catch(() => {});
  }
}
