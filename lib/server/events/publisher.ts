// @ts-nocheck
"use server";

/**
 * Event Publisher
 * ===============
 * Publishes domain events to Redis streams for async processing.
 * WHY: Decouples event producers from consumers. Redis streams
 * provide persistence, ordering, and consumer groups for scale.
 */

import { getRedis } from "@/lib/redis";
import { randomUUID } from "crypto";
import type {
  DomainEvent,
  EventEnvelope,
  EventMetadata,
} from "./types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const STREAM_KEY = "events:domain";
const MAX_STREAM_LENGTH = 10000; // Trim to ~10K events

// ---------------------------------------------------------------------------
// Build event envelope
// ---------------------------------------------------------------------------

function buildMetadata(
  emittedBy: string,
  options?: { correlationId?: string; causationId?: string; source?: string }
): EventMetadata {
  return {
    eventId: randomUUID(),
    correlationId: options?.correlationId ?? randomUUID(),
    causationId: options?.causationId,
    emittedAt: new Date().toISOString(),
    emittedBy,
    version: 1,
    source: options?.source ?? "andamus-api",
  };
}

// ---------------------------------------------------------------------------
// Publish to Redis Stream
// ---------------------------------------------------------------------------

export interface PublishResult {
  published: boolean;
  eventId: string;
  correlationId: string;
  error?: string;
}

/**
 * Publish a domain event to the event stream.
 * Events are persisted in Redis and consumed by background workers.
 */
export async function publishEvent(
  event: DomainEvent,
  options?: {
    emittedBy?: string;
    correlationId?: string;
    causationId?: string;
    source?: string;
  }
): Promise<PublishResult> {
  const redis = getRedis();
  const emittedBy = options?.emittedBy ?? "system";

  const metadata = buildMetadata(emittedBy, {
    correlationId: options?.correlationId,
    causationId: options?.causationId,
    source: options?.source,
  });

  const envelope: EventEnvelope = {
    event,
    metadata,
  };

  // Also emit to cache-bust channel for real-time UI updates
  if (redis) {
    try {
      // Add to stream with trimming
      await redis.xadd(
        STREAM_KEY,
        "*", // Auto-generate ID
        "envelope",
        JSON.stringify(envelope),
        { trim: { type: "maxlen", threshold: MAX_STREAM_LENGTH, approximate: true } }
      );

      // Publish to pub/sub for real-time consumers
      await redis.publish(`events:${event.type}`, JSON.stringify(envelope));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[events] publishEvent failed:", message);
      return {
        published: false,
        eventId: metadata.eventId,
        correlationId: metadata.correlationId,
        error: message,
      };
    }
  }

  // Fallback: log to Supabase for audit if Redis fails
  // (handled by calling code via error return)

  return {
    published: true,
    eventId: metadata.eventId,
    correlationId: metadata.correlationId,
  };
}

/**
 * Publish multiple events in a batch.
 * More efficient than individual publishes.
 */
export async function publishEvents(
  events: DomainEvent[],
  options?: {
    emittedBy?: string;
    correlationId?: string;
    source?: string;
  }
): Promise<PublishResult[]> {
  const correlationId = options?.correlationId ?? randomUUID();
  const results: PublishResult[] = [];

  for (const event of events) {
    const result = await publishEvent(event, {
      ...options,
      correlationId,
      causationId: results.length > 0 ? results[results.length - 1].eventId : undefined,
    });
    results.push(result);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Convenience publishers for common events
// ---------------------------------------------------------------------------

export async function publishRideCreated(
  payload: DomainEvent & { type: "ride.created" } extends { payload: infer P } ? P : never,
  emittedBy: string
): Promise<PublishResult> {
  return publishEvent({ type: "ride.created", payload }, { emittedBy });
}

export async function publishBookingConfirmed(
  payload: DomainEvent & { type: "booking.confirmed" } extends { payload: infer P } ? P : never,
  emittedBy: string
): Promise<PublishResult> {
  return publishEvent({ type: "booking.confirmed", payload }, { emittedBy });
}

export async function publishPaymentCompleted(
  payload: DomainEvent & { type: "payment.completed" } extends { payload: infer P } ? P : never,
  emittedBy: string
): Promise<PublishResult> {
  return publishEvent({ type: "payment.completed", payload }, { emittedBy });
}

export async function publishUserRegistered(
  payload: DomainEvent & { type: "user.registered" } extends { payload: infer P } ? P : never,
  emittedBy: string
): Promise<PublishResult> {
  return publishEvent({ type: "user.registered", payload }, { emittedBy });
}

export async function publishReviewCreated(
  payload: DomainEvent & { type: "review.created" } extends { payload: infer P } ? P : never,
  emittedBy: string
): Promise<PublishResult> {
  return publishEvent({ type: "review.created", payload }, { emittedBy });
}

export async function publishMessageSent(
  payload: DomainEvent & { type: "message.sent" } extends { payload: infer P } ? P : never,
  emittedBy: string
): Promise<PublishResult> {
  return publishEvent({ type: "message.sent", payload }, { emittedBy });
}
