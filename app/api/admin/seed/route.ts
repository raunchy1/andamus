import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

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

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomRange = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

export async function GET() {
  console.log("[api/admin/seed] Starting Sardinia Marketplace Seeder...");
  const supabase = createServiceRoleClient();

  const driverIds: string[] = [];
  const logs: string[] = [];

  try {
    // ── 0. IDEMPOTENT CLEANUP ──
    // Retrieve all auth users and filter those with @andamus.it emails to recreate them cleanly.
    logs.push("Fetching user list for idempotent cleanup...");
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listError) {
      logs.push(`Warning: Failed to retrieve user list for cleanup: ${listError?.message}`);
    } else if (usersData?.users) {
      const seedUsersInAuth = usersData.users.filter(u => u.email?.toLowerCase().endsWith("@andamus.it"));
      const existingIds = seedUsersInAuth.map(u => u.id);

      if (existingIds.length > 0) {
        logs.push(`Found ${existingIds.length} existing seed users. Cleaning up old seed data...`);

        // Delete dependent rides
        const { error: delRidesErr } = await supabase
          .from("rides")
          .delete()
          .in("driver_id", existingIds);
        if (delRidesErr) logs.push(`Error deleting old rides: ${delRidesErr?.message}`);

        // Delete dependent verifications
        const { error: delVerErr } = await supabase
          .from("verifications")
          .delete()
          .in("user_id", existingIds);
        if (delVerErr) logs.push(`Error deleting old verifications: ${delVerErr?.message}`);

        // Delete profiles
        const { error: delProfErr } = await supabase
          .from("profiles")
          .delete()
          .in("id", existingIds);
        if (delProfErr) logs.push(`Error deleting old profiles: ${delProfErr?.message}`);

        // Delete auth users
        for (const id of existingIds) {
          const { error: delAuthErr } = await supabase.auth.admin.deleteUser(id);
          if (delAuthErr) {
            logs.push(`Error deleting auth user ${id}: ${delAuthErr?.message}`);
          } else {
            logs.push(`Deleted existing seed user ID: ${id}`);
          }
        }

        logs.push("Idempotent cleanup completed successfully.");
      } else {
        logs.push("No existing seed users found. Ready for fresh seeding.");
      }
    }

    // ── 1. DRIVERS SEEDING ──
    for (const user of SEED_USERS) {
      logs.push(`Seeding user: ${user.name}`);
      
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
        const errMsg = authError?.message?.toLowerCase() || "";
        if (errMsg.includes("already registered") || errMsg.includes("email_exists") || authError?.status === 422) {
          // User already exists, fetch their ID from profiles using phone_number
          const { data: existingUser, error: fetchError } = await supabase
            .from("profiles")
            .select("id")
            .eq("phone_number", user.phone)
            .maybeSingle();

          if (fetchError || !existingUser) {
            const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
              logs.push(`Failed to retrieve user list: ${listError?.message}`);
              continue;
            }
            const foundId = usersList.users.find((u) => u.email?.toLowerCase() === user.email.toLowerCase())?.id;
            if (foundId) {
              userId = foundId || "";
            } else {
              logs.push(`Error finding existing user: ${authError?.message}`);
              continue;
            }
          } else {
            userId = existingUser?.id || "";
          }
          logs.push(`User already registered, reusing existing auth ID: ${userId}`);
        } else {
          logs.push(`Auth signup error: ${authError?.message}`);
          continue;
        }
      } else if (authData?.user) {
        userId = authData?.user?.id || "";
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
        logs.push(`Error updating profile for ${user.name}: ${profileError?.message}`);
      } else {
        logs.push(`Profile enhanced successfully for ${user.name}`);
      }

      // Add Driver verification entry for integrity
      await supabase.from("verifications").insert({
        user_id: userId,
        type: "driver_license",
        status: "approved",
        verified_at: new Date().toISOString(),
      });
    }

    if (driverIds.length === 0) {
      return NextResponse.json({ success: false, error: "No drivers could be created.", logs }, { status: 500 });
    }

    logs.push(`Seeded ${driverIds.length} driver profiles. Seeding rides...`);

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
        // Friday pm spikes
        const hour = randomItem([14, 15, 16, 17, 18, 19]);
        const minute = randomItem([0, 15, 30, 45]);
        timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
      } else if (dayOfWeek === 0) {
        // Sunday pm spikes
        const hour = randomItem([16, 17, 18, 19, 20, 21]);
        const minute = randomItem([0, 15, 30, 45]);
        timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
      } else {
        // Weekday morning commutes
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
      logs.push(`Error inserting rides: ${ridesError.message}`);
      return NextResponse.json({ success: false, error: ridesError.message, logs }, { status: 500 });
    }

    logs.push(`Seeded ${createdRides?.length || 0} active rides successfully!`);

    return NextResponse.json({
      success: true,
      message: "Sardinia Marketplace Seeding Completed Successfully!",
      driversSeeded: driverIds.length,
      ridesSeeded: createdRides?.length || 0,
      logs,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    logs.push(`Exception caught: ${errorMsg}`);
    return NextResponse.json({ success: false, error: errorMsg, logs }, { status: 500 });
  }
}
