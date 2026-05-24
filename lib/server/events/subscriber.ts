"use server";

/**
 * Event Subscriber
 * ================
 * Consumes domain events from Redis streams and dispatches to registered handlers.
 * WHY: Async, fault-tolerant event processing that scales horizontally.
 * Consumer groups allow multiple workers to process events in parallel.
 */

import { getRedis } from "@/lib/redis";
import type {
  DomainEvent,
  DomainEventType,
  EventEnvelope,
  EventHandler,
  HandlerRegistration,
} from "./types";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _handlers = new Map<DomainEventType, Array<HandlerRegistration>>();

/**
 * Register an event handler.
 * Multiple handlers can be registered for the same event type.
 */
export function registerHandler<E extends DomainEvent>(
  registration: HandlerRegistration<E>
): void {
  const existing = _handlers.get(registration.eventType) ?? [];
  existing.push(registration as HandlerRegistration);
  _handlers.set(registration.eventType, existing);
}

/**
 * Unregister all handlers for an event type.
 */
export function unregisterHandlers(eventType: DomainEventType): void {
  _handlers.delete(eventType);
}

/**
 * Get all registered handlers for an event type.
 */
export function getHandlers(eventType: DomainEventType): HandlerRegistration[] {
  return _handlers.get(eventType) ?? [];
}

// ---------------------------------------------------------------------------
// Stream consumption
// ---------------------------------------------------------------------------

const CONSUMER_GROUP = "event-consumers";
const CONSUMER_NAME = `worker-${process.pid ?? Math.random().toString(36).slice(2, 8)}`;
const STREAM_KEY = "events:domain";

/**
 * Ensure the consumer group exists.
 */
async function ensureConsumerGroup(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.xgroup("create", STREAM_KEY, CONSUMER_GROUP, "$", { mkstream: true });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Group already exists
    if (message.includes("BUSYGROUP")) return true;
    console.error("[events] ensureConsumerGroup failed:", message);
    return false;
  }
}

/**
 * Read events from the stream and dispatch to handlers.
 * Call this in a loop from a background worker.
 */
export async function consumeEvents(options?: {
  batchSize?: number;
  blockMs?: number;
  autoAck?: boolean;
}): Promise<{
  processed: number;
  failed: number;
  events: Array<{ id: string; type: string; success: boolean; error?: string }>;
}> {
  const redis = getRedis();
  if (!redis) {
    return { processed: 0, failed: 0, events: [] };
  }

  const batchSize = options?.batchSize ?? 10;
  const blockMs = options?.blockMs ?? 5000;

  await ensureConsumerGroup();

  try {
    const results = await redis.xreadgroup(
      CONSUMER_GROUP,
      CONSUMER_NAME,
      { key: STREAM_KEY, id: ">" },
      { count: batchSize, block: blockMs }
    );

    if (!results || results.length === 0) {
      return { processed: 0, failed: 0, events: [] };
    }

    const events: Array<{ id: string; type: string; success: boolean; error?: string }> = [];
    let processed = 0;
    let failed = 0;

    for (const stream of results) {
      for (const message of stream.messages) {
        const eventId = message.id;
        const envelopeRaw = message.message?.envelope;

        if (!envelopeRaw) {
          events.push({ id: eventId, type: "unknown", success: false, error: "Missing envelope" });
          failed++;
          continue;
        }

        try {
          const envelope = JSON.parse(envelopeRaw as string) as EventEnvelope;
          const eventType = envelope.event.type;
          const handlers = getHandlers(eventType);

          if (handlers.length === 0) {
            // No handlers — auto-ack to prevent redelivery
            await redis.xack(STREAM_KEY, CONSUMER_GROUP, eventId);
            events.push({ id: eventId, type: eventType, success: true });
            processed++;
            continue;
          }

          // Dispatch to all handlers
          const handlerResults = await Promise.all(
            handlers.map(async (reg) => {
              try {
                return await reg.handler(envelope);
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { success: false, error: msg };
              }
            })
          );

          const allSuccess = handlerResults.every((r) => r.success);

          if (allSuccess || options?.autoAck) {
            await redis.xack(STREAM_KEY, CONSUMER_GROUP, eventId);
          }

          if (allSuccess) {
            processed++;
            events.push({ id: eventId, type: eventType, success: true });
          } else {
            failed++;
            const firstError = handlerResults.find((r) => !r.success)?.error;
            events.push({ id: eventId, type: eventType, success: false, error: firstError });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          failed++;
          events.push({ id: eventId, type: "parse_error", success: false, error: msg });
        }
      }
    }

    return { processed, failed, events };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[events] consumeEvents error:", msg);
    return { processed: 0, failed: 0, events: [] };
  }
}

/**
 * Process pending events that were not acknowledged.
 * Call this periodically to recover from crashed workers.
 */
export async function reclaimPendingEvents(options?: {
  idleTimeMs?: number;
  count?: number;
}): Promise<{
  reclaimed: number;
  events: Array<{ id: string; type: string; success: boolean; error?: string }>;
}> {
  const redis = getRedis();
  if (!redis) return { reclaimed: 0, events: [] };

  const idleTime = options?.idleTimeMs ?? 60000; // 1 minute
  const count = options?.count ?? 10;

  try {
    const pending = await redis.xpending(STREAM_KEY, CONSUMER_GROUP, "-", "+", count);
    if (!pending || pending.length === 0) {
      return { reclaimed: 0, events: [] };
    }

    const eventIds = pending.map((p) => p[0] as string);
    const messages = await redis.xclaim(
      STREAM_KEY,
      CONSUMER_GROUP,
      CONSUMER_NAME,
      idleTime,
      eventIds
    );

    if (!messages || messages.length === 0) {
      return { reclaimed: 0, events: [] };
    }

    const events: Array<{ id: string; type: string; success: boolean; error?: string }> = [];
    let reclaimed = 0;

    for (const msg of messages) {
      const envelopeRaw = msg.message?.envelope;
      if (!envelopeRaw) continue;

      try {
        const envelope = JSON.parse(envelopeRaw as string) as EventEnvelope;
        const handlers = getHandlers(envelope.event.type);

        const results = await Promise.all(
          handlers.map(async (reg) => {
            try {
              return await reg.handler(envelope);
            } catch (err) {
              return { success: false, error: err instanceof Error ? err.message : String(err) };
            }
          })
        );

        const allSuccess = results.every((r) => r.success);
        if (allSuccess) {
          await redis.xack(STREAM_KEY, CONSUMER_GROUP, msg.id);
          reclaimed++;
        }

        events.push({
          id: msg.id,
          type: envelope.event.type,
          success: allSuccess,
          error: results.find((r) => !r.success)?.error,
        });
      } catch (err) {
        events.push({
          id: msg.id,
          type: "parse_error",
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { reclaimed, events };
  } catch (err) {
    console.error("[events] reclaimPendingEvents error:", err instanceof Error ? err.message : String(err));
    return { reclaimed: 0, events: [] };
  }
}

/**
 * Get stream statistics for monitoring.
 */
export async function getStreamStats(): Promise<{
  length: number;
  pendingCount: number;
  consumerCount: number;
} | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const info = await redis.xinfo("stream", STREAM_KEY);
    const groups = await redis.xinfo("groups", STREAM_KEY);

    let pendingCount = 0;
    let consumerCount = 0;

    if (groups && Array.isArray(groups)) {
      for (const group of groups) {
        if (Array.isArray(group)) {
          const pendingIdx = group.indexOf("pending");
          if (pendingIdx >= 0) pendingCount += Number(group[pendingIdx + 1] ?? 0);
          const consumersIdx = group.indexOf("consumers");
          if (consumersIdx >= 0) consumerCount += Number(group[consumersIdx + 1] ?? 0);
        }
      }
    }

    let length = 0;
    if (info && Array.isArray(info)) {
      const lenIdx = info.indexOf("length");
      if (lenIdx >= 0) length = Number(info[lenIdx + 1] ?? 0);
    }

    return { length, pendingCount, consumerCount };
  } catch {
    return null;
  }
}
