"use server";

/**
 * Content Scanning
 * ================
 * Scans user-generated content for policy violations.
 * WHY: Automated scanning catches violations before they reach users,
 * reducing harm and moderator workload.
 */

import { analyzeSpam } from "./spam";

// ---------------------------------------------------------------------------
// Policy violations
// ---------------------------------------------------------------------------

export type ViolationType =
  | "hate_speech"
  | "harassment"
  | "discrimination"
  | "violence"
  | "self_harm"
  | "illegal_activity"
  | "personal_info"
  | "spam"
  | "profanity"
  | "misinformation";

export interface ContentScanResult {
  clean: boolean;
  violations: Array<{
    type: ViolationType;
    severity: "low" | "medium" | "high" | "critical";
    confidence: number;
    matchedText?: string;
  }>;
  spamScore: ReturnType<typeof analyzeSpam>;
  overallRisk: "safe" | "low" | "medium" | "high" | "critical";
  action: "allow" | "flag" | "block" | "escalate";
}

// ---------------------------------------------------------------------------
// Pattern dictionaries (Italian + English)
// ---------------------------------------------------------------------------

const VIOLATION_PATTERNS: Record<ViolationType, { severity: "low" | "medium" | "high" | "critical"; patterns: RegExp[] }> = {
  hate_speech: {
    severity: "high",
    patterns: [
      /\b(niger|negro|ebreo|giudeo|zingaro|rom\b|terron|polentone|frocio|froci|lesbica|trans)\w*\b/i,
      /\b(racial slur|ethnic slur)\b/i,
    ],
  },
  harassment: {
    severity: "high",
    patterns: [
      /\b(molest|stalker|perseguit|minacci|insult|offend|bulliz)\w*\b/i,
      /\b(sei un idiota|sei stupido|cretino|imbecille|stronzo)\b/i,
      /\b(harass|threaten|stalk|bully)\w*\b/i,
    ],
  },
  discrimination: {
    severity: "medium",
    patterns: [
      /\b(razzis|sessis|omofob|xenofob|discrimin|esclusion)\w*\b/i,
      /\b(racis|sexis|homophob|discriminat|exclusion)\w*\b/i,
    ],
  },
  violence: {
    severity: "critical",
    patterns: [
      /\b(violenza|aggressione|arma|pugnal|spara|uccid|bomb|attentat)\w*\b/i,
      /\b(violence|aggression|weapon|stab|shoot|kill|bomb|terror)\w*\b/i,
    ],
  },
  self_harm: {
    severity: "critical",
    patterns: [
      /\b(suicid|autolesion|tagliarsi|mort|morire)\w*\b/i,
      /\b(suicid|self.harm|cut myself|kill myself|want to die)\w*\b/i,
    ],
  },
  illegal_activity: {
    severity: "critical",
    patterns: [
      /\b(droga|stupefac|spaccio|traffico|contrabband|furto|rapina)\w*\b/i,
      /\b(drugs|narcotics|trafficking|smuggling|theft|robbery)\w*\b/i,
    ],
  },
  personal_info: {
    severity: "medium",
    patterns: [
      /\b(cf\s*:?\s*[a-z]{6}\d{2}[a-z]\d{2}[a-z]\d{3}[a-z])\b/i,
      /\b(codice fiscale)\b/i,
      /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/, // Credit card-like
    ],
  },
  spam: {
    severity: "low",
    patterns: [], // Handled by spam analyzer
  },
  profanity: {
    severity: "low",
    patterns: [
      /\b(cazzo|merda|puttana|stronzo|bastardo|vaffanculo|coglione)\b/i,
      /\b(fuck|shit|bitch|bastard|asshole|damn)\b/i,
    ],
  },
  misinformation: {
    severity: "medium",
    patterns: [
      /\b(truffa|falso|bufala|fake news|notizia falsa|hoax)\b/i,
      /\b(scam|false news|hoax|misinformation)\b/i,
    ],
  },
};

// ---------------------------------------------------------------------------
// Scanning logic
// ---------------------------------------------------------------------------

export function scanContent(text: string): ContentScanResult {
  const violations: ContentScanResult["violations"] = [];
  const spamScore = analyzeSpam(text);

  // Check spam
  if (spamScore.isSpam) {
    violations.push({
      type: "spam",
      severity: spamScore.isAutoBlock ? "high" : "medium",
      confidence: spamScore.score / 100,
    });
  }

  // Check policy violations
  for (const [violationType, config] of Object.entries(VIOLATION_PATTERNS) as [ViolationType, typeof VIOLATION_PATTERNS[ViolationType]][]) {
    if (violationType === "spam") continue; // Already handled

    for (const pattern of config.patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        violations.push({
          type: violationType,
          severity: config.severity,
          confidence: Math.min(0.5 + matches.length * 0.1, 0.95),
          matchedText: matches[0],
        });
        break; // Only one match per violation type
      }
    }
  }

  // Determine overall risk and action
  let overallRisk: ContentScanResult["overallRisk"] = "safe";
  let action: ContentScanResult["action"] = "allow";

  if (violations.length === 0) {
    overallRisk = "safe";
    action = "allow";
  } else {
    const hasCritical = violations.some((v) => v.severity === "critical");
    const hasHigh = violations.some((v) => v.severity === "high");
    const hasMedium = violations.some((v) => v.severity === "medium");

    if (hasCritical) {
      overallRisk = "critical";
      action = "block";
    } else if (hasHigh) {
      overallRisk = "high";
      action = "escalate";
    } else if (hasMedium || spamScore.isAutoBlock) {
      overallRisk = "medium";
      action = "flag";
    } else {
      overallRisk = "low";
      action = "flag";
    }
  }

  return {
    clean: violations.length === 0,
    violations,
    spamScore,
    overallRisk,
    action,
  };
}

// ---------------------------------------------------------------------------
// Batch scanning
// ---------------------------------------------------------------------------

export interface BatchScanResult {
  results: ContentScanResult[];
  totalFlagged: number;
  totalBlocked: number;
  totalEscalated: number;
}

export function scanContentBatch(texts: string[]): BatchScanResult {
  const results = texts.map((text) => scanContent(text));

  return {
    results,
    totalFlagged: results.filter((r) => r.action === "flag").length,
    totalBlocked: results.filter((r) => r.action === "block").length,
    totalEscalated: results.filter((r) => r.action === "escalate").length,
  };
}
