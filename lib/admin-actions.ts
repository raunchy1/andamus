"use server";

/**
 * Admin server actions.
 * @deprecated Import directly from `@/lib/server/actions/admin`.
 */

import { resolveFeedback as _resolveFeedback } from "@/lib/server/actions/admin";

export async function resolveFeedback(feedbackId: string, notes?: string) {
  return _resolveFeedback(feedbackId, notes);
}
