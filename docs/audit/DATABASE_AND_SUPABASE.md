# Andamùs — Database & Supabase Audit

> **Domain:** PostgreSQL schema, RLS policies, migrations, indexes, data integrity  
> **Status:** 🔴 Critical bugs in RLS; schema mostly sound  

---

## 1. Schema Overview

The application uses Supabase (PostgreSQL 15) with the following core tables:

| Table | Purpose | Row Count (est.) |
|-------|---------|-----------------|
| `profiles` | User profiles (extends `auth.users`) | ~1,000 |
| `rides` | Ride listings | ~5,000 |
| `bookings` | Ride bookings/passengers | ~10,000 |
| `messages` | Chat messages | ~50,000 |
| `reviews` | User reviews/ratings | ~2,000 |
| `notifications` | User notifications | ~20,000 |
| `badges` | Gamification badges | ~100 |
| `referrals` | Referral tracking | ~500 |
| `user_actions` | Gamification actions log | ~50,000 |
| `push_subscriptions` | PWA push subscriptions | ~200 |
| `ride_templates` | Recurring ride templates | ~50 |
| `carpool_groups` | Carpool groups | ~20 |
| `public.groups` | Alternative group system | ~5 |

---

## 2. Critical RLS Bugs (P0)

### P0-1: Drivers Cannot Read Chat Messages

**File:** Supabase RLS policy on `messages` table

**Current Policy (SELECT):**
```sql
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (auth.uid() = passenger_id);
```

**Problem:** Only checks `passenger_id`. Drivers (who own the ride) cannot read messages for their rides.

**Fix:**
```sql
CREATE POLICY "Users can view messages for their rides or bookings"
ON messages FOR SELECT
USING (
  auth.uid() = passenger_id 
  OR auth.uid() IN (
    SELECT driver_id FROM rides WHERE id = messages.ride_id
  )
);
```

### P0-2: Drivers Cannot Update Booking Status

**File:** Supabase RLS policy on `bookings` table

**Current Policy (UPDATE):**
```sql
CREATE POLICY "Passengers can update their own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = passenger_id);
```

**Problem:** No policy allows drivers to update booking status (accept/reject).

**Fix:**
```sql
CREATE POLICY "Drivers can update bookings for their rides"
ON bookings FOR UPDATE
USING (
  auth.uid() IN (
    SELECT driver_id FROM rides WHERE id = bookings.ride_id
  )
);
```

---

## 3. Over-Permissive INSERT Policies (P1)

The following tables have `WITH CHECK (true)` INSERT policies, allowing **any authenticated user** to insert arbitrary rows:

| Table | Risk |
|-------|------|
| `notifications` | Spam users with fake notifications |
| `badges` | Award fake badges |
| `referrals` | Create fake referral records |
| `user_actions` | Inflate gamification scores |
| `push_subscriptions` | Subscribe others to push notifications |

**Fix:** Replace `WITH CHECK (true)` with proper ownership checks:

```sql
-- Example: notifications
CREATE POLICY "Users can only create their own notifications"
ON notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 4. Missing Table: `waiting_list`

**Reference:** `app/coming-soon/page.tsx` subscribes to `waiting_list` realtime channel.

**Problem:** No migration creates the `waiting_list` table. The realtime subscription will fail silently or throw errors.

**Fix:** Create migration:

```sql
CREATE TABLE waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  locale TEXT DEFAULT 'it'
);

ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts to waiting_list"
ON waiting_list FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view waiting_list"
ON waiting_list FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM admin_users));
```

---

## 5. Duplicate Group Systems

Two competing group implementations exist:

| Table | Purpose | Status |
|-------|---------|--------|
| `carpool_groups` | Carpool group management | Active |
| `public.groups` | Generic group system | Legacy/unused? |

**Recommendation:** Audit which is actually used. Drop the unused one and migrate data if needed.

---

## 6. Missing Indexes

Foreign key columns without indexes cause sequential scans on JOINs:

| Table | Column | Impact |
|-------|--------|--------|
| `bookings` | `ride_id` | Slow ride booking lookups |
| `messages` | `booking_id` | Slow chat message queries |
| `notifications` | `user_id` | Slow notification inbox |
| `reviews` | `ride_id`, `reviewed_user_id` | Slow review lookups |
| `user_actions` | `user_id` | Slow gamification queries |
| `push_subscriptions` | `user_id` | Slow push target queries |

**Fix:**
```sql
CREATE INDEX idx_bookings_ride_id ON bookings(ride_id);
CREATE INDEX idx_messages_booking_id ON messages(booking_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_reviews_ride_id ON reviews(ride_id);
CREATE INDEX idx_reviews_reviewed_user ON reviews(reviewed_user_id);
CREATE INDEX idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

---

## 7. Schema Inconsistencies

### Duplicate Columns in `rides`

Migration 017 added Italian aliases alongside English columns:

| English | Italian | Status |
|---------|---------|--------|
| `smoking_allowed` | `fumatori_ammessi` | Duplicate |
| `pets_allowed` | `animali_ammessi` | Duplicate |
| `music_allowed` | `music_in_car` | Duplicate |
| `large_baggage` | `baggage_large` | Duplicate |

**Recommendation:** Standardize on English column names. Drop Italian aliases after migrating data.

### `ride_templates` → `rides` Generation

The `generate_rides_from_templates()` SQL function correctly generates **future-only** rides. No expired recurring rides are created. ✅

---

## 8. Data Integrity

### Referential Integrity

| Relationship | Enforced | Status |
|-------------|----------|--------|
| `profiles.id` → `auth.users.id` | Yes (FK + trigger) | ✅ |
| `rides.driver_id` → `profiles.id` | Yes | ✅ |
| `bookings.ride_id` → `rides.id` | Yes | ✅ |
| `bookings.passenger_id` → `profiles.id` | Yes | ✅ |
| `messages.ride_id` → `rides.id` | Yes | ✅ |
| `reviews.ride_id` → `rides.id` | Yes | ✅ |

### Cascade Behavior

- `ON DELETE CASCADE` is **not** universally set. Deleting a ride may orphan bookings/messages.
- **Recommendation:** Review and add `ON DELETE CASCADE` where appropriate, or implement soft deletes.

---

## 9. Migrations

### Migration Files

Located in `supabase/migrations/`. Numbered sequentially (001, 002, ..., 017+).

### Migration Quality

| Aspect | Status |
|--------|--------|
| Sequential numbering | ✅ |
| Idempotent statements | ⚠️ Partial |
| Rollback scripts | ❌ None |
| Data migrations | ⚠️ Some inline |

### Recommended Migration Practices

1. **Always use `IF EXISTS`/`IF NOT EXISTS`** for idempotency.
2. **Add down-migrations** (or at least document rollback steps).
3. **Separate schema and data migrations** when possible.

---

## 10. Realtime Configuration

### Channels

| Channel | Table | Issue |
|---------|-------|-------|
| `bookings` | `bookings` | ✅ Properly filtered by `ride_id` |
| `messages` | `messages` | ✅ Properly filtered by `booking_id` |
| `notifications` | `notifications` | ✅ Properly filtered by `user_id` |
| `waiting_list` | `waiting_list` | ❌ Table doesn't exist |

### Cleanup

Realtime subscriptions are properly unsubscribed in `useEffect` cleanup functions. ✅

---

## 11. Recommendations

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Fix `messages` SELECT RLS to include drivers | Low |
| P0 | Fix `bookings` UPDATE RLS to include drivers | Low |
| P1 | Tighten INSERT policies on `notifications`, `badges`, `referrals`, `user_actions`, `push_subscriptions` | Low |
| P1 | Create `waiting_list` migration | Low |
| P1 | Add missing indexes on FK columns | Low |
| P1 | Resolve `carpool_groups` vs `public.groups` duplication | Medium |
| P2 | Standardize `rides` column names (drop Italian aliases) | Medium |
| P2 | Add `ON DELETE CASCADE` or soft delete for rides | Medium |
| P2 | Add rollback/down migrations | Medium |
