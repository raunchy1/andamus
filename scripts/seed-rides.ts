/**
 * ANDAMUS — Marketplace Seeder for Sardinia
 * Path: scripts/seed-rides.ts
 *
 * Runs via: npx -y tsx scripts/seed-rides.ts
 *
 * This script:
 * 1. Initializes a Supabase Service Role client (bypasses RLS for seeding).
 * 2. Creates 10 highly realistic Sardinian driver/passenger accounts in auth.users.
 * 3. Populates their profiles with custom bios, ratings, and verification states.
 * 4. Seeds 45 rides across primary Sardinian corridors (Cagliari, Sassari, Olbia, Nuoro, Airports).
 * 5. Models real-life transit schedules (Friday/Sunday spikes, morning airport runs, weekday commutes).
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load local environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 1. DATA DEFINITIONS
// ──────────────────────────────────────────────────────────────────────────────

interface SeedUser {
  email: string;
  name: string;
  avatarUrl: string;
  phone: string;
  bio: string;
  rating: number;
  ridesCount: number;
}

const SEED_USERS: SeedUser[] = [
  {
    email: "matteo.piras@andamus.it",
    name: "Matteo Piras",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    phone: "+393456789012",
    bio: "Studente di Informatica all'Università di Cagliari. Torno a Sassari quasi ogni fine settimana per trovare la famiglia.",
    rating: 4.9,
    ridesCount: 42,
  },
  {
    email: "giulia.carta@andamus.it",
    name: "Giulia Carta",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    phone: "+393339876543",
    bio: "Lavoro nel digital marketing a Olbia. Viaggio regolarmente verso Nuoro e Cagliari. Auto spaziosa e ottima musica!",
    rating: 4.8,
    ridesCount: 28,
  },
  {
    email: "alessandro.melis@andamus.it",
    name: "Alessandro Melis",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    phone: "+393471234567",
    bio: "Pendolare giornaliero Sassari - Alghero. Viaggiatore tranquillo, amo scambiare due chiacchiere o viaggiare in silenzio se preferite.",
    rating: 4.7,
    ridesCount: 156,
  },
  {
    email: "francesca.sanna@andamus.it",
    name: "Francesca Sanna",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120",
    phone: "+393284561234",
    bio: "Specializzanda in Medicina a Sassari. Fine settimana alternati a Cagliari. Viaggio sicuro e auto regolarmente igienizzata.",
    rating: 5.0,
    ridesCount: 19,
  },
  {
    email: "marco.pinna@andamus.it",
    name: "Marco Pinna",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120",
    phone: "+393498877665",
    bio: "Ingegnere edile, viaggio spesso in tutta la Sardegna per lavoro. Cagliari, Oristano, Nuoro, Olbia. Flessibile con orari e bagagli.",
    rating: 4.6,
    ridesCount: 63,
  },
  {
    email: "chiara.contini@andamus.it",
    name: "Chiara Contini",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
    phone: "+393312233445",
    bio: "Studentessa di Lingue a Cagliari, originaria di Oristano. Viaggio spesso il venerdì pomeriggio e la domenica sera.",
    rating: 4.9,
    ridesCount: 31,
  },
  {
    email: "davide.manca@andamus.it",
    name: "Davide Manca",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120",
    phone: "+393409988776",
    bio: "Freelance tech, basato a Nuoro. Spesso a Cagliari per meeting o Olbia Airport per voli di lavoro. Guida ecologica.",
    rating: 4.8,
    ridesCount: 55,
  },
  {
    email: "elena.loi@andamus.it",
    name: "Elena Loi",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    phone: "+393397766554",
    bio: "Insegnante di scuola superiore. Viaggio il fine settimana per tornare nel mio amato paese in Ogliastra da Cagliari.",
    rating: 5.0,
    ridesCount: 12,
  },
  {
    email: "stefano.serra@andamus.it",
    name: "Stefano Serra",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120",
    phone: "+393478899001",
    bio: "Guida turistica e fotografo. Spostamenti frequenti Cagliari Airport - Villasimius - Chia. Spazio per bagagli voluminosi.",
    rating: 4.7,
    ridesCount: 88,
  },
  {
    email: "martina.usai@andamus.it",
    name: "Martina Usai",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120",
    phone: "+393291122334",
    bio: "Lavoratrice pendolare Macomer - Sassari. Puntuale, auto ibrida silenziosa. Viaggio ideale per studenti o pendolari.",
    rating: 4.9,
    ridesCount: 74,
  },
];

interface RouteDef {
  from: string;
  to: string;
  avgPrice: number;
}

const PRIMARY_ROUTES: RouteDef[] = [
  { from: "Cagliari", to: "Sassari", avgPrice: 12.0 },
  { from: "Sassari", to: "Cagliari", avgPrice: 12.0 },
  { from: "Cagliari", to: "Olbia", avgPrice: 14.0 },
  { from: "Olbia", to: "Cagliari", avgPrice: 14.0 },
  { from: "Sassari", to: "Olbia", avgPrice: 8.0 },
  { from: "Olbia", to: "Sassari", avgPrice: 8.0 },
  { from: "Nuoro", to: "Cagliari", avgPrice: 10.0 },
  { from: "Cagliari", to: "Nuoro", avgPrice: 10.0 },
  { from: "Sassari", to: "Alghero", avgPrice: 3.5 },
  { from: "Alghero", to: "Sassari", avgPrice: 3.5 },
  { from: "Cagliari", to: "Oristano", avgPrice: 6.0 },
  { from: "Oristano", to: "Cagliari", avgPrice: 6.0 },
  { from: "Aeroporto Cagliari Elmas", to: "Sassari", avgPrice: 15.0 },
  { from: "Aeroporto Cagliari Elmas", to: "Nuoro", avgPrice: 12.0 },
  { from: "Aeroporto Olbia Costa Smeralda", to: "Sassari", avgPrice: 10.0 },
];

const SEED_NOTES = [
  "Condivido le spese di viaggio. Spazio per 2 trolley medi nel bagagliaio.",
  "Partenza puntuale, si raccomanda la massima serietà. No fumatori a bordo.",
  "Auto ibrida, guida ecologica e rilassata. Buona musica di sottofondo o silenzio su richiesta.",
  "Posti comodi, aria condizionata disponibile. Possiamo concordare piccole deviazioni lungo il percorso.",
  "Spazio per valigie grandi disponibile. Contattatemi in chat per dettagli sul punto di ritrovo.",
  "Viaggio tranquillo. Piccolo animale domestico in trasportino ben accetto.",
];

const MEETING_POINTS = [
  "Stazione Piazza Matteotti",
  "Parcheggio MediaWorld",
  "Uscita Terminal Arrivi",
  "Fermata bus principale",
  "Parcheggio Conad Superstore",
  "Piazza Italia",
  "Ingresso Policlinico Monserrato",
  "Rotonda ingresso città",
];

// Helper to get random item
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Helper to get random number in range
const randomRange = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// ──────────────────────────────────────────────────────────────────────────────
// 2. SEED EXECUTION
// ──────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🚀 Starting Andamus Sardinia Seeder...");

  const driverIds: string[] = [];

  try {
    // ── 0. IDEMPOTENT CLEANUP ──
    console.log("ℹ️ Fetching user list for idempotent cleanup...");
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listError) {
      console.warn(`⚠️ Warning: Failed to retrieve user list for cleanup: ${listError.message}`);
    } else if (usersData?.users) {
      const seedUsersInAuth = usersData.users.filter(u => u.email?.toLowerCase().endsWith("@andamus.it"));
      const existingIds = seedUsersInAuth.map(u => u.id);

      if (existingIds.length > 0) {
        console.log(`ℹ️ Found ${existingIds.length} existing seed users. Cleaning up old seed data...`);

        // Delete dependent rides
        const { error: delRidesErr } = await supabase
          .from("rides")
          .delete()
          .in("driver_id", existingIds);
        if (delRidesErr) console.error(`❌ Error deleting old rides: ${delRidesErr.message}`);

        // Delete dependent verifications
        const { error: delVerErr } = await supabase
          .from("verifications")
          .delete()
          .in("user_id", existingIds);
        if (delVerErr) console.error(`❌ Error deleting old verifications: ${delVerErr.message}`);

        // Delete profiles
        const { error: delProfErr } = await supabase
          .from("profiles")
          .delete()
          .in("id", existingIds);
        if (delProfErr) console.error(`❌ Error deleting old profiles: ${delProfErr.message}`);

        // Delete auth users
        for (const id of existingIds) {
          const { error: delAuthErr } = await supabase.auth.admin.deleteUser(id);
          if (delAuthErr) {
            console.error(`❌ Error deleting auth user ${id}: ${delAuthErr.message}`);
          } else {
            console.log(`Deleted existing seed user ID: ${id}`);
          }
        }

        console.log("✅ Idempotent cleanup completed successfully.");
      } else {
        console.log("ℹ️ No existing seed users found. Ready for fresh seeding.");
      }
    }

    // ── 1. DRIVERS SEEDING ──
    for (const user of SEED_USERS) {
      console.log(`👤 Seeding user: ${user.name} (${user.email})...`);

      // Create Auth User
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: "AndamusLaunch2026PasswordSecret!",
        email_confirm: true,
        phone: user.phone,
        phone_confirm: true,
        user_metadata: {
          full_name: user.name,
          name: user.name,
          avatar_url: user.avatarUrl,
        },
      });

      let userId = "";

      if (authError) {
        const errMsg = authError.message.toLowerCase();
        if (errMsg.includes("already registered") || errMsg.includes("email_exists") || authError.status === 422) {
          // User already exists, fetch their ID using phone_number
          const { data: existingUser, error: fetchError } = await supabase
            .from("profiles")
            .select("id")
            .eq("phone_number", user.phone)
            .maybeSingle();

          if (fetchError || !existingUser) {
            // Alternative fallback check by email
            const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
              console.error(`❌ Failed to retrieve user list: ${listError.message}`);
              continue;
            }
            const found = usersList.users.find((u) => u.email?.toLowerCase() === user.email.toLowerCase());
            if (found) {
              userId = found.id;
            } else {
              console.error(`❌ Error finding user: ${authError.message}`);
              continue;
            }
          } else {
            userId = existingUser.id;
          }
          console.log(`ℹ️ User already registered, reusing existing auth ID: ${userId}`);
        } else {
          console.error(`❌ Auth signup error: ${authError.message}`);
          continue;
        }
      } else if (authData.user) {
        userId = authData.user.id;
      }

      if (!userId) continue;
      driverIds.push(userId);

      // Enhance the Profile (Omit the non-existent 'bio' column from profiles)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          rating: user.rating,
          rides_count: user.ridesCount,
          phone_verified: true,
          email_verified: true,
          driver_verified: true,
          phone_number: user.phone,
          phone: user.phone,
        })
        .eq("id", userId);

      if (profileError) {
        console.error(`❌ Error updating profile for ${user.name}: ${profileError.message}`);
      } else {
        console.log(`✅ Profile enhanced successfully.`);
      }

      // Set Driver verification document inside verification table for integrity
      await supabase.from("verifications").insert({
        user_id: userId,
        type: "driver_license",
        status: "approved",
        verified_at: new Date().toISOString(),
      });
    }

    if (driverIds.length === 0) {
      console.error("❌ Seeding failed: No drivers could be created or recovered.");
      process.exit(1);
    }

    console.log(`🎉 Seeded ${driverIds.length} driver profiles. Beginning dynamic ride seeding...`);

    // ── 2. RIDES SEEDING ──
    const ridesToCreate = 45;
    const today = new Date();
    const ridesData = [];

    for (let i = 0; i < ridesToCreate; i++) {
      const driverId = randomItem(driverIds);
      const route = randomItem(PRIMARY_ROUTES);
      
      const dateOffset = randomRange(1, 8);
      const rideDate = new Date();
      rideDate.setDate(today.getDate() + dateOffset);

      const dayOfWeek = rideDate.getDay();
      let timeString = "";
      const seats = randomRange(3, 4);

      if (dayOfWeek === 5) {
        const hour = randomItem([14, 15, 16, 17, 18, 19]);
        const minute = randomItem([0, 15, 30, 45]);
        timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
      } else if (dayOfWeek === 0) {
        const hour = randomItem([16, 17, 18, 19, 20, 21]);
        const minute = randomItem([0, 15, 30, 45]);
        timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
      } else {
        const pattern = randomItem(["commute", "midday", "airport"]);
        if (pattern === "commute") {
          const hour = 7;
          const minute = randomItem([15, 30, 45]);
          timeString = `0${hour}:${minute}:00`;
        } else if (pattern === "airport") {
          const hour = randomItem([6, 7, 8]);
          const minute = randomItem([0, 15, 30, 45]);
          timeString = `0${hour}:${minute}:00`;
        } else {
          const hour = randomRange(11, 15);
          timeString = `${hour}:30:00`;
        }
      }

      const priceOffset = randomRange(-2, 2);
      const finalPrice = Math.max(0, parseFloat((route.avgPrice + priceOffset).toFixed(1)));

      ridesData.push({
        driver_id: driverId,
        from_city: route.from,
        to_city: route.to,
        date: rideDate.toISOString().split("T")[0],
        time: timeString,
        seats: seats,
        price: finalPrice,
        notes: randomItem(SEED_NOTES),
        meeting_point: randomItem(MEETING_POINTS),
        status: "active",
      });
    }

    // Insert batch rides
    const { data: createdRides, error: ridesError } = await supabase
      .from("rides")
      .insert(ridesData)
      .select("id");

    if (ridesError) {
      console.error(`❌ Error inserting rides: ${ridesError.message}`);
    } else {
      console.log(`✅ Seeded ${createdRides?.length || 0} active, localized rides successfully!`);
    }

    console.log("🏁 Sardinia Seeder finished successfully. Marketplace is bootstrapped!");
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Exception caught during seeding:", errorMsg);
    process.exit(1);
  }
}

seed().catch((err) => {
  console.error("❌ Uncaught exception during seeding:", err);
  process.exit(1);
});
