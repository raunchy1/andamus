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

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Auth: CRON_SECRET bearer token (set in Vercel env)
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[api/admin/seed] Starting Sardinia Marketplace Seeder...");
  const supabase = createServiceRoleClient();

  const driverIds: string[] = [];
  const logs: string[] = [];

  try {
    // ── 0. IDEMPOTENT CLEANUP ──────────────────────────────────────────────
    logs.push("Fetching existing @andamus.it users for cleanup...");
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (listError) {
      logs.push(`Warning: could not list users: ${listError.message}`);
    } else if (usersData?.users) {
      const seedUsers = usersData.users.filter((u) =>
        u.email?.toLowerCase().endsWith("@andamus.it")
      );
      const existingIds = seedUsers.map((u) => u.id);

      if (existingIds.length > 0) {
        logs.push(`Found ${existingIds.length} existing seed users — cleaning up...`);

        // Delete rides first (FK: rides → profiles)
        const { error: delRidesErr } = await supabase
          .from("rides")
          .delete()
          .in("driver_id", existingIds);
        if (delRidesErr) logs.push(`Delete rides error: ${delRidesErr.message}`);
        else logs.push(`Deleted old rides for seed users.`);

        // Delete profiles (FK: profiles → auth.users)
        const { error: delProfErr } = await supabase
          .from("profiles")
          .delete()
          .in("id", existingIds);
        if (delProfErr) logs.push(`Delete profiles error: ${delProfErr.message}`);
        else logs.push(`Deleted old profiles for seed users.`);

        // Delete auth users
        for (const id of existingIds) {
          const { error: delAuthErr } = await supabase.auth.admin.deleteUser(id);
          if (delAuthErr) logs.push(`Delete auth user ${id}: ${delAuthErr.message}`);
        }
        logs.push("Cleanup complete.");
      } else {
        logs.push("No existing seed users found.");
      }
    }

    // ── 1. CREATE DRIVERS ──────────────────────────────────────────────────
    for (const user of SEED_USERS) {
      logs.push(`Creating user: ${user.name}`);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: "AndamusLaunch2026PasswordSecret!",
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          name: user.name,
          avatar_url: user.avatarUrl,
        },
      });

      if (authError || !authData?.user) {
        logs.push(`Auth error for ${user.name}: ${authError?.message}`);
        continue;
      }

      const userId = authData.user.id;
      logs.push(`Auth user created: ${userId}`);

      // Upsert profile — only real production columns
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          name: user.name,
          avatar_url: user.avatarUrl,
          phone: user.phone,
          email: user.email,
          rating: user.rating,
          rides_count: user.ridesCount,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        logs.push(`Profile upsert error for ${user.name}: ${profileError.message}`);
        // Don't add to driverIds — can't create rides without a profile
        continue;
      }

      logs.push(`Profile ready for ${user.name}`);
      driverIds.push(userId);
    }

    if (driverIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No driver profiles could be created.", logs },
        { status: 500 }
      );
    }

    logs.push(`${driverIds.length} driver profiles ready. Seeding rides...`);

    // ── 2. SEED RIDES ──────────────────────────────────────────────────────
    const ridesToCreate = 45;
    const today = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ridesData: any[] = [];

    for (let i = 0; i < ridesToCreate; i++) {
      const driverId = randomItem(driverIds);
      const route = randomItem(PRIMARY_ROUTES);

      const dateOffset = randomRange(1, 10);
      const rideDate = new Date();
      rideDate.setDate(today.getDate() + dateOffset);

      const dayOfWeek = rideDate.getDay();
      let timeString = "";

      if (dayOfWeek === 5) {
        // Friday afternoon spike
        const hour = randomItem([14, 15, 16, 17, 18, 19]);
        const minute = randomItem([0, 15, 30, 45]);
        timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      } else if (dayOfWeek === 0) {
        // Sunday evening spike
        const hour = randomItem([16, 17, 18, 19, 20, 21]);
        const minute = randomItem([0, 15, 30, 45]);
        timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      } else {
        // Weekday: commute / midday / airport
        const pattern = randomItem(["commute", "midday", "airport"]);
        if (pattern === "commute") {
          const minute = randomItem([0, 15, 30, 45]);
          timeString = `07:${String(minute).padStart(2, "0")}:00`;
        } else if (pattern === "airport") {
          const hour = randomItem([6, 7, 8]);
          const minute = randomItem([0, 15, 30, 45]);
          timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
        } else {
          const hour = randomRange(11, 15);
          timeString = `${String(hour).padStart(2, "0")}:30:00`;
        }
      }

      const priceOffset = randomRange(-2, 2);
      const finalPrice = Math.max(1, parseFloat((route.avgPrice + priceOffset).toFixed(1)));

      ridesData.push({
        driver_id: driverId,
        from_city: route.from,
        to_city: route.to,
        date: rideDate.toISOString().split("T")[0],
        time: timeString,
        seats: randomRange(2, 4),
        price: finalPrice,
        notes: randomItem(SEED_NOTES),
        meeting_point: randomItem(MEETING_POINTS),
        status: "active",
        fumatori_ammessi: false,
        animali_ammessi: Math.random() > 0.7,
        music_in_car: randomItem(["qualsiasi", "pop", "nessuna"]),
        baggage_large: Math.random() > 0.5,
      });
    }

    // Insert all rides in one batch
    const { data: createdRides, error: ridesError } = await supabase
      .from("rides")
      .insert(ridesData)
      .select("id");

    if (ridesError) {
      logs.push(`Rides insert error: ${ridesError.message}`);
      return NextResponse.json(
        { success: false, error: ridesError.message, logs },
        { status: 500 }
      );
    }

    const ridesSeeded = createdRides?.length ?? 0;
    logs.push(`Seeded ${ridesSeeded} rides successfully!`);

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
