// @ts-nocheck
"use server";

/**
 * Cursor Pagination
 * ================
 * Scalable pagination using opaque cursors instead of OFFSET.
 * WHY: OFFSET scales poorly (O(offset) row skipping). Cursor pagination
 * is O(limit) regardless of page depth, essential for mobile feeds at scale.
 */

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CursorPaginationParams {
  cursor?: string | null;
  limit?: number;
  direction?: "next" | "prev";
  sortColumn?: string;
  sortAscending?: boolean;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  totalEstimate?: number;
}

export interface OffsetPaginationParams {
  page?: number;
  pageSize?: number;
  maxPageSize?: number;
}

export interface OffsetPaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ---------------------------------------------------------------------------
// Cursor encoding / decoding
// ---------------------------------------------------------------------------

function encodeCursor(value: string): string {
  try {
    return Buffer.from(value).toString("base64url");
  } catch {
    return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
}

function decodeCursor(cursor: string): string {
  try {
    // Add padding if needed for base64url
    const padding = 4 - (cursor.length % 4);
    const padded = padding !== 4 ? cursor + "=".repeat(padding) : cursor;
    return Buffer.from(padded, "base64url").toString("utf-8");
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Core cursor pagination
// ---------------------------------------------------------------------------

/**
 * Paginate any Supabase query using cursor-based pagination.
 * The cursor is an opaque base64-encoded sortColumn value.
 */
export async function paginateWithCursor<T extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseQuery: any,
  params: CursorPaginationParams
): Promise<CursorPaginatedResult<T>> {
  const limit = Math.min(params.limit ?? 20, 100);
  const sortColumn = params.sortColumn ?? "created_at";
  const ascending = params.sortAscending ?? false;
  const direction = params.direction ?? "next";

  let query = baseQuery
    .order(sortColumn, { ascending })
    .limit(limit + 1);

  if (params.cursor) {
    const decoded = decodeCursor(params.cursor);
    if (decoded) {
      if (direction === "next") {
        // For descending: next page = values LESS than cursor
        // For ascending: next page = values GREATER than cursor
        query = ascending
          ? query.gt(sortColumn, decoded)
          : query.lt(sortColumn, decoded);
      } else {
        query = ascending
          ? query.lt(sortColumn, decoded)
          : query.gt(sortColumn, decoded);
      }
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("[pagination] paginateWithCursor error:", error.message);
    return { data: [], nextCursor: null, prevCursor: null, hasMore: false };
  }

  const rows = (data ?? []) as T[];
  const hasMore = rows.length > limit;
  const resultRows = hasMore ? rows.slice(0, limit) : rows;

  // Compute next cursor from the last row
  const lastRow = resultRows[resultRows.length - 1];
  const nextCursor = hasMore && lastRow
    ? encodeCursor(String(lastRow[sortColumn]))
    : null;

  // Compute prev cursor from the first row
  const firstRow = resultRows[0];
  const prevCursor = firstRow
    ? encodeCursor(String(firstRow[sortColumn]))
    : null;

  return {
    data: resultRows,
    nextCursor,
    prevCursor: params.cursor ? prevCursor : null,
    hasMore,
  };
}

// ---------------------------------------------------------------------------
// Offset pagination (for admin tables, small datasets)
// ---------------------------------------------------------------------------

/**
 * Offset-based pagination with a hard cap on total pages.
 * Use ONLY for admin tables or when jumping to arbitrary pages is required.
 * Prefer cursor pagination for user-facing feeds.
 */
export async function paginateWithOffset<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseQuery: any,
  countQuery: any,
  params: OffsetPaginationParams
): Promise<OffsetPaginatedResult<T>> {
  const page = Math.max(1, params.page ?? 1);
  const maxPageSize = params.maxPageSize ?? 100;
  const pageSize = Math.min(params.pageSize ?? 20, maxPageSize);
  const offset = (page - 1) * pageSize;

  // Cap total results to prevent deep pagination abuse
  const MAX_TOTAL = 10000;

  const [{ data: rows, error }, { count, error: countError }] = await Promise.all([
    baseQuery.range(offset, offset + pageSize - 1),
    countQuery,
  ]);

  if (error) {
    console.error("[pagination] paginateWithOffset error:", error.message);
  }
  if (countError) {
    console.error("[pagination] paginateWithOffset count error:", countError.message);
  }

  const totalCount = Math.min(count ?? 0, MAX_TOTAL);
  const totalPages = Math.ceil(totalCount / pageSize);
  const data = ((rows ?? []) as T[]).slice(0, pageSize);

  return {
    data,
    page,
    pageSize,
    totalPages,
    totalCount,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// ---------------------------------------------------------------------------
// Mobile-optimized feed pagination (rides, notifications, messages)
// ---------------------------------------------------------------------------

export interface FeedPage<T> {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

/**
 * Load a mobile feed page with cursor-based pagination.
 * Optimized for pull-to-refresh (prev) and infinite scroll (next).
 */
export async function loadFeedPage<T extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryBuilder: any,
  params: {
    cursor?: string | null;
    limit?: number;
    sortColumn?: string;
    sortAscending?: boolean;
  }
): Promise<FeedPage<T>> {
  const result = await paginateWithCursor<T>(queryBuilder, {
    cursor: params.cursor,
    limit: params.limit,
    direction: "next",
    sortColumn: params.sortColumn ?? "created_at",
    sortAscending: params.sortAscending ?? false,
  });

  return {
    items: result.data,
    nextCursor: result.nextCursor,
    prevCursor: result.prevCursor,
    hasMore: result.hasMore,
  };
}

// ---------------------------------------------------------------------------
// Keyset pagination for time-series data (analytics, audit logs)
// ---------------------------------------------------------------------------

export interface TimeSeriesPage<T> {
  data: T[];
  nextCursor: string | null;
  startTime: string | null;
  endTime: string | null;
}

/**
 * Paginate time-series data efficiently.
 * Uses composite cursor: timestamp + id for stability.
 */
export async function paginateTimeSeries<T extends { id: string; created_at: string }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseQuery: any,
  params: {
    cursor?: string | null; // format: "timestamp|id"
    limit?: number;
    timeColumn?: string;
  }
): Promise<TimeSeriesPage<T>> {
  const limit = Math.min(params.limit ?? 50, 200);
  const timeColumn = params.timeColumn ?? "created_at";

  let query = baseQuery
    .order(timeColumn, { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (params.cursor) {
    const [timestamp, id] = decodeCursor(params.cursor).split("|");
    if (timestamp && id) {
      query = query.or(
        `${timeColumn}.lt.${timestamp},and(${timeColumn}.eq.${timestamp},id.lt.${id})`
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("[pagination] paginateTimeSeries error:", error.message);
    return { data: [], nextCursor: null, startTime: null, endTime: null };
  }

  const rows = (data ?? []) as T[];
  const hasMore = rows.length > limit;
  const resultRows = hasMore ? rows.slice(0, limit) : rows;

  const lastRow = resultRows[resultRows.length - 1];
  const nextCursor = hasMore && lastRow
    ? encodeCursor(`${lastRow[timeColumn]}|${lastRow.id}`)
    : null;

  return {
    data: resultRows,
    nextCursor,
    startTime: resultRows[0]?.[timeColumn] ?? null,
    endTime: resultRows[resultRows.length - 1]?.[timeColumn] ?? null,
  };
}
