/**
 * ANDAMUS — Marketplace Integrity and Ride Route Validator
 * Path: scripts/validate-rides.ts
 *
 * Runs via: npx -y tsx scripts/validate-rides.ts
 *
 * This script:
 * 1. Connects to the Supabase database.
 * 2. Fetches all active rides.
 * 3. Audits each ride for route resolution, malformed UUIDs, and missing driver profiles.
 * 4. Generates a validation report detailing broken rides, orphaned links, and schema integrity errors.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load local environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface RideValidationResult {
  id: string;
  from_city: string;
  to_city: string;
  driver_id: string;
  isValid: boolean;
  errors: string[];
}

async function validateRides() {
  console.log("🔍 Starting Andamus Marketplace Integrity Audit...");
  console.log(`🔗 Connecting to: ${supabaseUrl}`);

  const results: RideValidationResult[] = [];
  let totalAudited = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  try {
    // 1. Fetch all rides
    console.log("ℹ️ Fetching all rides from database...");
    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select("*");

    if (ridesError) {
      console.error("❌ ERROR: Failed to retrieve rides from database:", ridesError.message);
      process.exit(1);
    }

    if (!rides || rides.length === 0) {
      console.log("⚠️ WARNING: No rides found in the database. Marketplace is currently empty.");
      process.exit(0);
    }

    console.log(`📊 Found ${rides.length} rides. Beginning deep audit...`);

    // UUID Regex validator
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    for (const ride of rides) {
      totalAudited++;
      const errors: string[] = [];
      const rideId = ride.id;

      // Validate UUID format
      if (!uuidRegex.test(rideId)) {
        errors.push(`Malformed UUID format: "${rideId}"`);
      }

      // Check fields existence
      if (!ride.from_city || ride.from_city.trim() === "") {
        errors.push("Missing origin city (from_city)");
      }
      if (!ride.to_city || ride.to_city.trim() === "") {
        errors.push("Missing destination city (to_city)");
      }
      if (!ride.date) {
        errors.push("Missing ride date");
      }
      if (!ride.time) {
        errors.push("Missing ride departure time");
      }

      // Check driver ID integrity
      if (!ride.driver_id) {
        errors.push("Missing driver_id reference");
      } else if (!uuidRegex.test(ride.driver_id)) {
        errors.push(`Malformed driver_id UUID format: "${ride.driver_id}"`);
      } else {
        // Query profile for driver to ensure no !inner join or foreign key failure
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("id", ride.driver_id)
          .maybeSingle();

        if (profileErr) {
          errors.push(`Database error querying driver profile: ${profileErr.message}`);
        } else if (!profile) {
          errors.push(`Orphaned ride: Driver profile does not exist for driver_id: "${ride.driver_id}" (will trigger 404 in !inner join)`);
        } else if (!profile.name || profile.name.trim() === "") {
          errors.push(`Incomplete profile: Driver profile exists but has an empty name`);
        }
      }

      const isValid = errors.length === 0;
      if (isValid) {
        totalPassed++;
      } else {
        totalFailed++;
      }

      results.push({
        id: rideId,
        from_city: ride.from_city || "UNKNOWN",
        to_city: ride.to_city || "UNKNOWN",
        driver_id: ride.driver_id || "UNKNOWN",
        isValid,
        errors,
      });
    }

    // 2. Generate Validation Report
    console.log("\n==================================================");
    console.log("📊 ANDAMUS MARKETPLACE AUDIT REPORT");
    console.log("==================================================");
    console.log(`Total Rides Audited:  ${totalAudited}`);
    console.log(`Passed Integrity:     ${totalPassed}  (✅ ${Math.round((totalPassed/totalAudited)*100)}%)`);
    console.log(`Failed Integrity:     ${totalFailed}  (❌ ${Math.round((totalFailed/totalAudited)*100)}%)`);
    console.log("==================================================");

    if (totalFailed > 0) {
      console.log("\n🚨 BROKEN RIDES & SCHEMA INTEGRITY ERRORS DETECTED:");
      let idx = 1;
      for (const result of results) {
        if (!result.isValid) {
          console.log(`\n${idx++}. Ride ID: ${result.id} [${result.from_city} ➔ ${result.to_city}]`);
          console.log(`   Driver ID: ${result.driver_id}`);
          result.errors.forEach(err => console.log(`   ❌ ERROR: ${err}`));
        }
      }
      console.log("\n⚠️ ACTION REQUIRED: Run the seeder to stabilize seeded marketplace records, or check database RLS/relationships.");
      process.exit(1);
    } else {
      console.log("\n✅ SUCCESS: All active rides have perfect data integrity, valid routes, and resolve correctly! Detail pages are stable.");
      process.exit(0);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Exception caught during validation:", errorMsg);
    process.exit(1);
  }
}

validateRides().catch((err) => {
  console.error("❌ Uncaught exception during validation:", err);
  process.exit(1);
});
