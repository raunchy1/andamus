"use server";

/**
 * AI Embeddings Architecture
 * ==========================
 * Preparation for vector-based semantic search and recommendation.
 * WHY: As the platform scales, lexical search (city names) is insufficient.
 * Semantic embeddings enable: "find rides near Florence" → vector similarity.
 *
 * This module provides the data preparation layer. Actual embedding
 * generation can be plugged in via OpenAI, Cohere, or a self-hosted model.
 */

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRedis } from "@/lib/redis";
import { logInfo } from "@/lib/server/observability/logging";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmbeddingVector {
  id: string;
  entityType: "ride" | "user" | "review" | "message";
  entityId: string;
  vector: number[];
  dimensions: number;
  model: string;
  createdAt: string;
}

export interface SimilarityResult {
  entityId: string;
  entityType: string;
  similarity: number; // cosine similarity 0-1
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Text preparation for embedding
// ---------------------------------------------------------------------------

/**
 * Build a semantic text representation of a ride for embedding.
 */
export function buildRideEmbeddingText(ride: {
  from_city: string;
  to_city: string;
  notes?: string | null;
  meeting_point?: string | null;
  car_model?: string | null;
  preferences?: Record<string, boolean | string | null>;
}): string {
  const parts: string[] = [
    `Ride from ${ride.from_city} to ${ride.to_city}`,
  ];

  if (ride.notes) parts.push(`Notes: ${ride.notes}`);
  if (ride.meeting_point) parts.push(`Meeting at: ${ride.meeting_point}`);
  if (ride.car_model) parts.push(`Vehicle: ${ride.car_model}`);

  if (ride.preferences) {
    const prefs: string[] = [];
    if (ride.preferences.smoking_allowed) prefs.push("smoking allowed");
    if (ride.preferences.pets_allowed) prefs.push("pets allowed");
    if (ride.preferences.large_luggage) prefs.push("large luggage");
    if (ride.preferences.women_only) prefs.push("women only");
    if (ride.preferences.students_only) prefs.push("students only");
    if (prefs.length > 0) parts.push(`Preferences: ${prefs.join(", ")}`);
  }

  return parts.join(". ");
}

/**
 * Build a semantic text representation of a user for embedding.
 */
export function buildUserEmbeddingText(user: {
  name?: string;
  bio?: string | null;
  car_model?: string | null;
  music_preference?: string | null;
  interests?: string[];
}): string {
  const parts: string[] = [`User ${user.name ?? ""}`];
  if (user.bio) parts.push(user.bio);
  if (user.car_model) parts.push(`Drives a ${user.car_model}`);
  if (user.music_preference) parts.push(`Prefers ${user.music_preference} music`);
  if (user.interests?.length) parts.push(`Interested in: ${user.interests.join(", ")}`);
  return parts.join(". ");
}

/**
 * Build a semantic text representation of a review for embedding.
 */
export function buildReviewEmbeddingText(review: {
  comment: string;
  rating: number;
}): string {
  const sentiment = review.rating >= 4 ? "positive" : review.rating <= 2 ? "negative" : "neutral";
  return `${sentiment} review: ${review.comment}`;
}

// ---------------------------------------------------------------------------
// Vector operations (cosine similarity)
// ---------------------------------------------------------------------------

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function magnitude(v: number[]): number {
  return Math.sqrt(dotProduct(v, v));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

/**
 * Find top-K most similar vectors using brute-force search.
 * For production at scale, this should be replaced with pgvector or a vector DB.
 */
export function findTopKSimilar(
  query: number[],
  candidates: EmbeddingVector[],
  k = 10
): SimilarityResult[] {
  const scored = candidates.map((candidate) => ({
    entityId: candidate.entityId,
    entityType: candidate.entityType,
    similarity: cosineSimilarity(query, candidate.vector),
  }));

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k);
}

// ---------------------------------------------------------------------------
// Redis-based vector cache
// ---------------------------------------------------------------------------

/**
 * Store an embedding vector in Redis for fast retrieval.
 */
export async function cacheEmbedding(vector: EmbeddingVector): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const key = `embedding:${vector.entityType}:${vector.entityId}`;
  await redis.setex(key, 86400 * 7, JSON.stringify(vector));
}

/**
 * Retrieve cached embedding vectors by entity type.
 */
export async function getCachedEmbeddings(entityType: string): Promise<EmbeddingVector[]> {
  const redis = getRedis();
  if (!redis) return [];

  const keys = await redis.keys(`embedding:${entityType}:*`);
  if (!keys || keys.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const key of keys) {
    pipeline.get(key as string);
  }

  const results = await pipeline.exec();
  const vectors: EmbeddingVector[] = [];

  for (const result of results ?? []) {
    if (result) {
      try {
        vectors.push(JSON.parse(result as string) as EmbeddingVector);
      } catch {
        // Skip invalid
      }
    }
  }

  return vectors;
}

// ---------------------------------------------------------------------------
// Ride embedding generation pipeline
// ---------------------------------------------------------------------------

export interface RideEmbeddingJob {
  rideId: string;
  text: string;
}

/**
 * Prepare embedding jobs for all active rides.
 * The actual embedding generation would be done by an external service.
 */
export async function prepareRideEmbeddings(options?: {
  batchSize?: number;
  since?: string;
}): Promise<RideEmbeddingJob[]> {
  const supabase = await createServiceRoleClient();
  const batchSize = options?.batchSize ?? 100;

  let query = supabase
    .from("rides")
    .select("id, from_city, to_city, notes, meeting_point, car_model, smoking_allowed, pets_allowed, large_luggage, women_only, students_only")
    .eq("status", "active")
    .gte("date", new Date().toISOString().split("T")[0]);

  if (options?.since) {
    query = query.gte("created_at", options.since);
  }

  const { data, error } = await query.limit(batchSize);

  if (error || !data) {
    console.error("[embeddings] prepareRideEmbeddings error:", error?.message);
    return [];
  }

  return (data as Array<Record<string, unknown>>).map((ride) => ({
    rideId: ride.id as string,
    text: buildRideEmbeddingText({
      from_city: ride.from_city as string,
      to_city: ride.to_city as string,
      notes: ride.notes as string | null,
      meeting_point: ride.meeting_point as string | null,
      car_model: ride.car_model as string | null,
      preferences: {
        smoking_allowed: ride.smoking_allowed as boolean | null,
        pets_allowed: ride.pets_allowed as boolean | null,
        large_luggage: ride.large_luggage as boolean | null,
        women_only: ride.women_only as boolean | null,
        students_only: ride.students_only as boolean | null,
      },
    }),
  }));
}

// ---------------------------------------------------------------------------
// Semantic ride search (preparation)
// ---------------------------------------------------------------------------

export interface SemanticSearchQuery {
  text: string;
  fromCity?: string;
  toCity?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Prepare a semantic search query for embedding.
 * This would be sent to an embedding model, then used for vector similarity.
 */
export function prepareSemanticSearchQuery(query: SemanticSearchQuery): string {
  const parts: string[] = [];

  if (query.fromCity) parts.push(`Looking for a ride from ${query.fromCity}`);
  if (query.toCity) parts.push(`to ${query.toCity}`);
  if (!query.fromCity && !query.toCity) parts.push("Looking for a ride");

  if (query.text) parts.push(query.text);
  if (query.dateFrom) parts.push(`on or after ${query.dateFrom}`);

  return parts.join(". ");
}

// ---------------------------------------------------------------------------
// Feature store design (future-ready)
// ---------------------------------------------------------------------------

export interface UserFeatures {
  userId: string;
  // Booking behavior
  totalBookings: number;
  totalRidesOffered: number;
  avgBookingValue: number;
  preferredFromCities: string[];
  preferredToCities: string[];
  preferredTimeWindow: string;
  // Engagement
  lastActiveAt: string;
  sessionCount30d: number;
  messagesSent30d: number;
  // Trust
  trustScore: number;
  rating: number;
  reviewCount: number;
  // Preferences
  smokingPreference: boolean | null;
  petsPreference: boolean | null;
  musicPreference: string | null;
}

/**
 * Compute user features for ML models.
 * These features can be consumed by recommendation, churn prediction,
 * and fraud detection models.
 */
export async function computeUserFeatures(userId: string): Promise<UserFeatures | null> {
  const supabase = await createServiceRoleClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("rating, review_count, trust_score, rides_count, last_active_at, completed_rides_count")
    .eq("id", userId)
    .single();

  if (profileError || !profile) return null;

  // Booking stats
  const { data: bookings } = await supabase
    .from("bookings")
    .select("ride_id, created_at")
    .eq("passenger_id", userId)
    .order("created_at", { ascending: false });

  const { data: rides } = await supabase
    .from("rides")
    .select("from_city, to_city, time, price")
    .eq("driver_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: messages } = await supabase
    .from("messages")
    .select("id")
    .eq("sender_id", userId)
    .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

  // Compute preferences from history
  const fromCities = new Map<string, number>();
  const toCities = new Map<string, number>();
  let totalValue = 0;
  const times: number[] = [];

  for (const ride of rides ?? []) {
    fromCities.set(ride.from_city, (fromCities.get(ride.from_city) ?? 0) + 1);
    toCities.set(ride.to_city, (toCities.get(ride.to_city) ?? 0) + 1);
    totalValue += ride.price ?? 0;
    if (ride.time) {
      const hour = parseInt(ride.time.split(":")[0], 10);
      if (!isNaN(hour)) times.push(hour);
    }
  }

  const preferredFrom = Array.from(fromCities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city]) => city);

  const preferredTo = Array.from(toCities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city]) => city);

  const avgHour = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 12;
  const timeWindow = avgHour < 12 ? "morning" : avgHour < 17 ? "afternoon" : avgHour < 22 ? "evening" : "night";

  return {
    userId,
    totalBookings: bookings?.length ?? 0,
    totalRidesOffered: rides?.length ?? 0,
    avgBookingValue: rides && rides.length > 0 ? totalValue / rides.length : 0,
    preferredFromCities: preferredFrom,
    preferredToCities: preferredTo,
    preferredTimeWindow: timeWindow,
    lastActiveAt: profile.last_active_at ?? new Date().toISOString(),
    sessionCount30d: 0, // Would need session tracking
    messagesSent30d: messages?.length ?? 0,
    trustScore: profile.trust_score ?? 50,
    rating: profile.rating ?? 5,
    reviewCount: profile.review_count ?? 0,
    smokingPreference: null,
    petsPreference: null,
    musicPreference: null,
  };
}

/**
 * Store user features in Redis for fast model inference.
 */
export async function cacheUserFeatures(features: UserFeatures): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const key = `features:user:${features.userId}`;
  await redis.setex(key, 3600, JSON.stringify(features));
  logInfo("Cached user features", { metadata: { userId: features.userId } });
}

/**
 * Retrieve cached user features.
 */
export async function getCachedUserFeatures(userId: string): Promise<UserFeatures | null> {
  const redis = getRedis();
  if (!redis) return null;

  const data = await redis.get(`features:user:${userId}`);
  if (!data) return null;

  try {
    return JSON.parse(data as string) as UserFeatures;
  } catch {
    return null;
  }
}
