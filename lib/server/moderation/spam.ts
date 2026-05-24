import "server-only";

/**
 * Spam & Abuse Detection
 * ======================
 * Heuristic and pattern-based spam detection for user-generated content.
 * WHY: Automated spam detection catches the majority of abuse before
 * human moderators need to review, dramatically reducing queue volume.
 */

import { getRedis } from "@/lib/redis";
import { logWarn } from "@/lib/server/observability/logging";

// ---------------------------------------------------------------------------
// Spam patterns
// ---------------------------------------------------------------------------

const SPAM_PATTERNS = {
  // Excessive caps
  excessiveCaps: /[A-Z\s]{15,}/,

  // Repeated characters
  repeatedChars: /(.)\1{5,}/,

  // URL patterns (many spam messages contain URLs)
  urls: /https?:\/\/|www\.|\.com|\.it|\.net|\.org/gi,

  // Phone numbers in messages
  phoneNumbers: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,

  // Suspicious keywords
  suspiciousKeywords: [
    "guadagna", "earn money", "soldi facili", "easy money",
    "investimento", "investment", "cripto", "crypto", "bitcoin",
    "truffa", "scam", "piramide", "pyramid", "mlm",
    "contatto whatsapp", "whatsapp", "telegram", "solo contatto",
    "paga prima", "pay first", "bonifico anticipato",
    "prezzo speciale", "special price", "offerta limitata",
  ],

  // Excessive emoji
  excessiveEmoji: /[\u{1F300}-\u{1F9FF}]{5,}/u,
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface SpamScore {
  score: number; // 0-100
  flags: string[];
  isSpam: boolean;
  isAutoBlock: boolean;
}

const SPAM_THRESHOLD = 60;
const AUTO_BLOCK_THRESHOLD = 85;

/**
 * Analyze text content for spam indicators.
 */
export function analyzeSpam(text: string): SpamScore {
  const flags: string[] = [];
  let score = 0;

  if (!text || text.length < 3) {
    return { score: 0, flags: [], isSpam: false, isAutoBlock: false };
  }

  const lowerText = text.toLowerCase();

  // Excessive caps (10 pts)
  const capsRatio = (text.match(/[A-Z]/g) ?? []).length / text.length;
  if (capsRatio > 0.7 && text.length > 10) {
    score += 10;
    flags.push("excessive_caps");
  }

  // Repeated characters (10 pts)
  if (SPAM_PATTERNS.repeatedChars.test(text)) {
    score += 10;
    flags.push("repeated_chars");
  }

  // URLs (15 pts per URL, max 30)
  const urlMatches = text.match(SPAM_PATTERNS.urls);
  if (urlMatches) {
    score += Math.min(urlMatches.length * 15, 30);
    flags.push("contains_urls");
  }

  // Phone numbers (15 pts)
  const phoneMatches = text.match(SPAM_PATTERNS.phoneNumbers);
  if (phoneMatches) {
    score += 15;
    flags.push("contains_phone");
  }

  // Suspicious keywords (20 pts each, max 40)
  let keywordScore = 0;
  for (const keyword of SPAM_PATTERNS.suspiciousKeywords) {
    if (lowerText.includes(keyword)) {
      keywordScore += 20;
      flags.push(`keyword:${keyword}`);
      if (keywordScore >= 40) break;
    }
  }
  score += Math.min(keywordScore, 40);

  // Excessive emoji (10 pts)
  if (SPAM_PATTERNS.excessiveEmoji.test(text)) {
    score += 10;
    flags.push("excessive_emoji");
  }

  // Very short + URL = high spam probability
  if (text.length < 30 && urlMatches && urlMatches.length > 0) {
    score += 20;
    flags.push("short_with_url");
  }

  // Normalize to 0-100
  score = Math.min(100, score);

  return {
    score,
    flags,
    isSpam: score >= SPAM_THRESHOLD,
    isAutoBlock: score >= AUTO_BLOCK_THRESHOLD,
  };
}

// ---------------------------------------------------------------------------
// Rate-based spam detection
// ---------------------------------------------------------------------------

export interface RateLimitCheck {
  allowed: boolean;
  currentCount: number;
  limit: number;
  resetAt: number;
}

/**
 * Check if a user is posting too frequently (potential spam bot).
 */
export async function checkPostingRate(
  userId: string,
  contentType: string,
  options?: { limit?: number; windowSeconds?: number }
): Promise<RateLimitCheck> {
  const redis = getRedis();
  const limit = options?.limit ?? 10;
  const windowSeconds = options?.windowSeconds ?? 60;

  if (!redis) {
    // Fallback: allow (can't enforce without Redis)
    return { allowed: true, currentCount: 0, limit, resetAt: Date.now() + windowSeconds * 1000 };
  }

  const key = `spam:rate:${userId}:${contentType}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  try {
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Get current count
    const count = await redis.zcard(key);

    if (count >= limit) {
      const oldest = await redis.zrange(key, 0, 0, { withScores: true });
      const resetAt = oldest.length >= 2
        ? (Number(oldest[1]) + windowSeconds) * 1000
        : Date.now() + windowSeconds * 1000;

      return { allowed: false, currentCount: count, limit, resetAt };
    }

    // Add current post
    await redis.zadd(key, { score: now, member: `${now}:${Math.random()}` });
    await redis.expire(key, windowSeconds + 1);

    return { allowed: true, currentCount: count + 1, limit, resetAt: (now + windowSeconds) * 1000 };
  } catch {
    return { allowed: true, currentCount: 0, limit, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

// ---------------------------------------------------------------------------
// User reputation-based spam detection
// ---------------------------------------------------------------------------

export interface UserSpamRisk {
  userId: string;
  riskScore: number; // 0-100
  factors: string[];
  isRestricted: boolean;
}

/**
 * Calculate spam risk for a user based on their behavior patterns.
 */
export async function calculateUserSpamRisk(userId: string): Promise<UserSpamRisk> {
  const redis = getRedis();
  if (!redis) {
    return { userId, riskScore: 0, factors: [], isRestricted: false };
  }

  try {
    const factors: string[] = [];
    let riskScore = 0;

    // Check recent posting rate
    const rideRate = await checkPostingRate(userId, "rides", { limit: 20, windowSeconds: 3600 });
    if (!rideRate.allowed) {
      riskScore += 30;
      factors.push("excessive_ride_posting");
    }

    const messageRate = await checkPostingRate(userId, "messages", { limit: 50, windowSeconds: 300 });
    if (!messageRate.allowed) {
      riskScore += 25;
      factors.push("excessive_messaging");
    }

    // Check for repeated content (simple hash comparison)
    const recentContent = await redis.lrange(`spam:content:${userId}`, 0, 9);
    if (recentContent && recentContent.length >= 5) {
      const uniqueContent = new Set(recentContent);
      const duplicateRatio = 1 - uniqueContent.size / recentContent.length;
      if (duplicateRatio > 0.5) {
        riskScore += 20;
        factors.push("repeated_content");
      }
    }

    // Check report count
    const reportCount = await redis.get(`spam:reports:${userId}`);
    if (reportCount) {
      const count = Number(reportCount);
      if (count >= 3) {
        riskScore += 30;
        factors.push("multiple_reports");
      } else if (count >= 1) {
        riskScore += 10;
        factors.push("prior_reports");
      }
    }

    riskScore = Math.min(100, riskScore);

    return {
      userId,
      riskScore,
      factors,
      isRestricted: riskScore >= 70,
    };
  } catch {
    return { userId, riskScore: 0, factors: [], isRestricted: false };
  }
}

/**
 * Store content hash for duplicate detection.
 */
export async function trackContentHash(
  userId: string,
  contentHash: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.lpush(`spam:content:${userId}`, contentHash);
    await redis.ltrim(`spam:content:${userId}`, 0, 49);
    await redis.expire(`spam:content:${userId}`, 86400);
  } catch {
    // Silent fail
  }
}

/**
 * Increment report count for a user.
 */
export async function incrementReportCount(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.incr(`spam:reports:${userId}`);
    await redis.expire(`spam:reports:${userId}`, 86400 * 30); // 30 days
  } catch {
    // Silent fail
  }
}

// ---------------------------------------------------------------------------
// Content pre-moderation
// ---------------------------------------------------------------------------

export interface PreModerationResult {
  allowed: boolean;
  reason?: string;
  spamScore?: SpamScore;
  rateLimit?: RateLimitCheck;
  userRisk?: UserSpamRisk;
}

/**
 * Pre-moderate user-generated content before saving.
 * Returns whether the content should be allowed, blocked, or queued.
 */
export async function preModerateContent(
  userId: string,
  contentType: "ride" | "message" | "review" | "profile" | "group" | "event",
  content: string
): Promise<PreModerationResult> {
  // Check rate limits
  const rateLimit = await checkPostingRate(userId, contentType);
  if (!rateLimit.allowed) {
    logWarn("Rate limit exceeded", { metadata: { userId, contentType } });
    return { allowed: false, reason: "Rate limit exceeded", rateLimit };
  }

  // Check spam score
  const spamScore = analyzeSpam(content);
  if (spamScore.isAutoBlock) {
    logWarn("Auto-blocked spam content", {
      metadata: { userId, contentType, score: spamScore.score, flags: spamScore.flags },
    });
    return { allowed: false, reason: "Content flagged as spam", spamScore };
  }

  // Check user risk
  const userRisk = await calculateUserSpamRisk(userId);
  if (userRisk.isRestricted) {
    logWarn("Restricted user attempted to post", {
      metadata: { userId, contentType, riskScore: userRisk.riskScore },
    });
    return { allowed: false, reason: "Account restricted due to suspicious activity", userRisk };
  }

  // Track content hash for duplicate detection
  const hash = await contentHash(content);
  await trackContentHash(userId, hash);

  return {
    allowed: true,
    spamScore: spamScore.isSpam ? spamScore : undefined,
    rateLimit,
    userRisk,
  };
}

async function contentHash(content: string): Promise<string> {
  // Simple hash for duplicate detection
  let hash = 0;
  const normalized = content.toLowerCase().replace(/\s+/g, " ").trim();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
