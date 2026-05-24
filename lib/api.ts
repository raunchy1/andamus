/**
 * Canonical API response utilities.
 * Re-exports from server-side implementation for convenience.
 * Use in Route Handlers and Server Actions.
 */

export {
  apiError,
  apiSuccess,
  unauthorized,
  forbidden,
  validationError,
  parseBody,
  parseQuery,
  formatZodError,
  withRateLimit,
  withAuth,
  withAdmin,
  rateLimitPresets,
} from "@/lib/server/api-utils";

export type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/lib/server/api-utils";
