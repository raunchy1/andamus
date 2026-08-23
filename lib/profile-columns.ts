/**
 * Column lists for `profiles` queries.
 *
 * `profiles` is world-readable (RLS `SELECT USING (true)`) so that ride cards,
 * reviews and public profiles can show a driver's name and avatar. That makes
 * `select("*")` a data leak: it ships every column of the row — including
 * `email`, `phone`, `car_plate` and the Stripe ids — to whoever asked, even an
 * anonymous visitor. Always select an explicit list instead.
 *
 * These are single-line literals rather than arrays joined at runtime because
 * supabase-js parses the select string at the type level; a computed string
 * collapses the result type to GenericStringError.
 */

/** Safe to expose for *any* user, signed in or not. */
export const PUBLIC_PROFILE_COLUMNS =
  "id, name, avatar_url, bio, slug, rating, review_count, rides_count, completed_rides_count, points, level, trust_score, created_at, last_active_at, phone_verified, email_verified, id_verified, driver_verified, car_model, car_color, car_year, car_image_url, car_image_author, car_image_license";

/**
 * The public columns plus the fields a user may see about themselves.
 * Only ever use this with `.eq("id", <the signed-in user's id>)`.
 */
export const OWN_PROFILE_COLUMNS =
  "id, name, avatar_url, bio, slug, rating, review_count, rides_count, completed_rides_count, points, level, trust_score, created_at, last_active_at, phone_verified, email_verified, id_verified, driver_verified, car_model, car_color, car_year, car_image_url, car_image_author, car_image_license, email, phone, birth_year, role, locale, preferred_zones, onboarding_step, onboarding_completed, referral_code, referrals_count, referral_points_earned, subscription_status, subscription_plan, subscription_period_end, cancellation_penalty_count, connect_onboarded, car_plate, push_notifications_enabled, email_booking_requests, email_booking_confirmed, email_new_messages, email_ride_reminders, email_marketing";
