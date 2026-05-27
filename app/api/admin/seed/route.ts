import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// ── Seed data definitions ──────────────────────────────────────────────────

const SEED_USERS = [
  {
    email: "matteo.piras@andamus.it",
    name: "Matteo Piras",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    phone: "+393456789012",
    rating: 4.9,
    ridesCount: 42,
  },
  {
    email: "giulia.carta@andamus.it",
    name: "Giulia Carta",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    phone: "+393339876543",
    rating: 4.8,
    ridesCount: 28,
  },
  {
    email: "alessandro.melis@andamus.it",
    name: "Alessandro Melis",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    phone: "+393471234567",
    rating: 4.7,
    ridesCount: 156,
  },
  {
    email: "francesca.sanna@andamus.it",
    name: "Francesca Sanna",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120",
    phone: "+393284561234",
    rating: 5.0,
    ridesCount: 19,
  },
  {
    email: "marco.pinna@andamus.it",
    name: "Marco Pinna",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120",
    phone: "+393498877665",
    rating: 4.6,
    ridesCount: 63,
  },
  {
    email: "chiara.contini@andamus.it",
    name: "Chiara Contini",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
    phone: "+393312233445",
    rating: 4.9,
    ridesCount: 31,
  },
  {
    email: "davide.manca@andamus.it",
    name: "Davide Manca",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120",
    phone: "+393409988776",
    rating: 4.8,
    ridesCount: 55,
  },
  {
    email: "elena.loi@andamus.it",
    name: "Elena Loi",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    phone: "+393397766554",
    rating: 5.0,
    ridesCount: 12,
  },
  {
    email: "stefano.serra@andamus.it",
    name: "Stefano Serra",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120",
    phone: "+393478899001",
    rating: 4.7,
    ridesCount: 88,
  },
  {
    email: "martina.usai@andamus.it",
    name: "Martina Usai",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120",
    phone: "+393291122334",
    rating: 4.9,
    ridesCount: 74,
  },
];

const PRIMARY_ROUTES = [
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

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

import * as crypto from "crypto";

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS FOR DETERMINISTIC INTEGRITY
// ──────────────────────────────────────────────────────────────────────────────

function generateDeterministicUUID(seed: string): string {
  const hash = crypto.createHash("md5").update(seed).digest("hex");
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

function createPRNG(seedString: string) {
  let h = 0;
  for (let i = 0; i < seedString.length; i++) {
    h = (Math.imul(31, h) + seedString.charCodeAt(i)) | 0;
  }
  return function() {
    h = (Math.imul(h, 48271) + 2147483647) | 0;
    return (h & 2147483647) / 2147483648;
  };
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Auth: CRON_SECRET bearer token (set in Vercel env)
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[api/admin/seed] Starting Sardinia Marketplace Seeder (Deterministic Edition)...");
  const supabase = createServiceRoleClient();

  const driverIds: string[] = [];
  const logs: string[] = [];

  try {
    // Generate deterministic UUIDs for all seed users first
    const seedUsersWithIds = SEED_USERS.map(user => ({
      ...user,
      id: generateDeterministicUUID(`user-${user.email}`)
    }));

    // Fetch all existing auth users first to check for existing accounts
    const { data: usersData } = await supabase.auth.admin.listUsers({
      perPage: 1000
    });

    const targetUserIds = new Set<string>();
    for (const user of seedUsersWithIds) {
      targetUserIds.add(user.id);
      if (usersData?.users) {
        const existing = usersData.users.find(u => u.email?.toLowerCase() === user.email.toLowerCase());
        if (existing) {
          targetUserIds.add(existing.id);
        }
      }
    }

    // ── 0. DATA INTEGRITY CLEANUP ──
    logs.push("Cleaning up old seeded rides to prevent orphaned records...");
    
    // Delete any old rides associated with seed users (for both expected stable IDs and actual existing IDs)
    const { error: delRidesErr } = await supabase
      .from("rides")
      .delete()
      .in("driver_id", Array.from(targetUserIds));

    if (delRidesErr) {
      logs.push(`Warning during rides cleanup: ${delRidesErr.message}`);
    } else {
      logs.push(`Cleaned old rides for target seed users.`);
    }

    // ── 1. CREATE DRIVERS ──────────────────────────────────────────────────
    for (const user of seedUsersWithIds) {
      logs.push(`Processing user: ${user.name} (${user.email}) -> stable ID: ${user.id}`);

      let existsInAuth = false;
      let driverId = user.id; // Default to deterministic stable ID

      if (usersData?.users) {
        const existingUser = usersData.users.find(u => u.email?.toLowerCase() === user.email.toLowerCase());
        if (existingUser) {
          existsInAuth = true;
          driverId = existingUser.id; // Recover and reuse the actual existing ID
          logs.push(`Found existing auth user for ${user.email} with ID: ${driverId}. Recovering...`);
        }
      }

      if (!existsInAuth) {
        // Create Auth User with our stable UUID
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          id: user.id,
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

        if (authError) {
          logs.push(`Failed to create auth user ${user.name}: ${authError.message}`);
          continue;
        } else {
          logs.push(`Auth user created successfully.`);
          driverId = user.id;
        }
      } else {
        logs.push(`Auth user already exists with ID ${driverId}, skipping creation.`);
      }

      // Upsert profile — use ONLY columns that exist in the live schema cache.
      // phone_number, phone_verified, email, driver_verified are not present or not reflected in schema cache.
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: driverId, // Use the recovered/stable ID
          name: user.name,
          avatar_url: user.avatarUrl,
          rating: user.rating,
          rides_count: user.ridesCount,
          phone: user.phone,
        }, { onConflict: "id" });

      if (profileError) {
        logs.push(`Error upserting profile for ${user.name}: ${profileError.message}`);
        continue;
      } else {
        logs.push(`Profile stable & enhanced.`);
      }

      // Set Driver verification document inside verification table for integrity
      await supabase
        .from("verifications")
        .upsert({
          user_id: driverId, // Use the recovered/stable ID
          type: "driver_license",
          status: "approved",
          verified_at: new Date().toISOString(),
        }, { onConflict: "user_id, type" });

      driverIds.push(driverId);
    }

    if (driverIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No driver profiles could be created.", logs },
        { status: 500 }
      );
    }

    logs.push(`${driverIds.length} driver profiles ready. Seeding 45 deterministic rides...`);

    // ── 2. SEED RIDES ──────────────────────────────────────────────────────
    const ridesToCreate = 45;
    const today = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ridesData: any[] = [];

    for (let i = 0; i < ridesToCreate; i++) {
      // Deterministic PRNG initialized with ride seed
      const prng = createPRNG(`ride-seed-${i}`);
      const randomItemDet = <T>(arr: T[]): T => arr[Math.floor(prng() * arr.length)];
      const randomRangeDet = (min: number, max: number): number => Math.floor(prng() * (max - min + 1)) + min;

      const driverId = randomItemDet(driverIds);
      const route = randomItemDet(PRIMARY_ROUTES);

      const dateOffset = randomRangeDet(1, 30);
      const rideDate = new Date();
      rideDate.setDate(today.getDate() + dateOffset);

      const dayOfWeek = rideDate.getDay();
      let timeString = "";

      if (dayOfWeek === 5) {
        // Friday afternoon spike
        const hour = randomItemDet([14, 15, 16, 17, 18, 19]);
        const minute = randomItemDet([0, 15, 30, 45]);
        timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      } else if (dayOfWeek === 0) {
        // Sunday evening spike
        const hour = randomItemDet([16, 17, 18, 19, 20, 21]);
        const minute = randomItemDet([0, 15, 30, 45]);
        timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      } else {
        // Weekday: commute / midday / airport
        const pattern = randomItemDet(["commute", "midday", "airport"]);
        if (pattern === "commute") {
          const minute = randomItemDet([0, 15, 30, 45]);
          timeString = `07:${String(minute).padStart(2, "0")}:00`;
        } else if (pattern === "airport") {
          const hour = randomItemDet([6, 7, 8]);
          const minute = randomItemDet([0, 15, 30, 45]);
          timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
        } else {
          const hour = randomRangeDet(11, 15);
          timeString = `${String(hour).padStart(2, "0")}:30:00`;
        }
      }

      const priceOffset = randomRangeDet(-2, 2);
      const finalPrice = Math.max(1, parseFloat((route.avgPrice + priceOffset).toFixed(1)));

      const rideId = generateDeterministicUUID(`ride-seed-${i}`);

      ridesData.push({
        id: rideId,
        driver_id: driverId,
        from_city: route.from,
        to_city: route.to,
        date: rideDate.toISOString().split("T")[0],
        time: timeString,
        seats: randomRangeDet(2, 4),
        price: finalPrice,
        notes: randomItemDet(SEED_NOTES),
        meeting_point: randomItemDet(MEETING_POINTS),
        status: "active",
        smoking_allowed: false,
        fumatori_ammessi: false,
        pets_allowed: prng() > 0.7,
        animali_ammessi: prng() > 0.7,
        music_preference: randomItemDet(["quiet", "music", "talk"]),
        music_in_car: randomItemDet(["qualsiasi", "pop", "nessuna"]),
        large_luggage: prng() > 0.5,
        baggage_large: prng() > 0.5,
      });
    }

    // Insert batch rides via upsert to ensure stable UUID keys
    const { data: createdRides, error: ridesError } = await supabase
      .from("rides")
      .upsert(ridesData, { onConflict: "id" })
      .select("id");

    if (ridesError) {
      logs.push(`Rides insert error: ${ridesError.message}`);
      return NextResponse.json(
        { success: false, error: ridesError.message, logs },
        { status: 500 }
      );
    }

    const ridesSeeded = createdRides?.length ?? 0;
    logs.push(`Seeded ${ridesSeeded} active, stable, localized rides successfully!`);

    return NextResponse.json({
      success: true,
      message: "✅ Sardinia Marketplace Seeding Completed!",
      driversSeeded: driverIds.length,
      ridesSeeded,
      logs,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    logs.push(`Exception: ${errorMsg}`);
    return NextResponse.json({ success: false, error: errorMsg, logs }, { status: 500 });
  }
}

