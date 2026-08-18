// Vehicle server-side data layer
// Andamus carpooling platform

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type {
  Vehicle,
  VehicleWithImages,
  VehicleMake,
  VehicleModel,
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleCompletionScore,
} from "@/lib/types/vehicle";
import { computeVehicleScore } from "@/lib/types/vehicle";

// ─── Makes & Models ────────────────────────────────────────────────────────

export async function searchVehicleMakes(query?: string): Promise<VehicleMake[]> {
  const supabase = await createClient();
  let q = supabase
    .from("vehicle_makes")
    .select("*")
    .order("is_popular", { ascending: false })
    .order("sort_order")
    .order("name")
    .limit(50);

  if (query && query.trim()) {
    q = q.ilike("name", `%${query.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data as VehicleMake[]) ?? [];
}

export async function getVehicleMakeBySlug(slug: string): Promise<VehicleMake | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_makes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as VehicleMake | null;
}

export async function searchVehicleModels(
  makeId: string,
  query?: string
): Promise<VehicleModel[]> {
  const supabase = await createClient();
  let q = supabase
    .from("vehicle_models")
    .select("*")
    .eq("make_id", makeId)
    .order("is_popular", { ascending: false })
    .order("sort_order")
    .order("name")
    .limit(100);

  if (query && query.trim()) {
    q = q.ilike("name", `%${query.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data as VehicleModel[]) ?? [];
}

// ─── Vehicles ──────────────────────────────────────────────────────────────

export async function getVehiclesForUser(userId: string): Promise<VehicleWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      *,
      images:vehicle_images(
        id, storage_path, url, thumbnail_url,
        order_index, is_primary, moderation_status, created_at
      )
    `)
    .eq("owner_id", userId)
    .eq("active", true)
    .order("primary_vehicle", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as VehicleWithImages[]) ?? [];
}

export async function getVehicleById(id: string): Promise<VehicleWithImages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      *,
      images:vehicle_images(
        id, storage_path, url, thumbnail_url,
        order_index, is_primary, moderation_status, created_at
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Sort images by order_index
  const vehicle = data as VehicleWithImages;
  vehicle.images = vehicle.images?.sort((a, b) => a.order_index - b.order_index) ?? [];
  return vehicle;
}

export async function getPrimaryVehicleForUser(
  userId: string
): Promise<VehicleWithImages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      *,
      images:vehicle_images(
        id, url, thumbnail_url, is_primary, order_index
      )
    `)
    .eq("owner_id", userId)
    .eq("active", true)
    .order("primary_vehicle", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as VehicleWithImages | null;
}

export async function createVehicle(
  userId: string,
  input: CreateVehicleInput
): Promise<Vehicle> {
  const supabase = await createClient();

  // If this is the first vehicle, mark it as primary
  const existingCount = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("active", true);

  const isPrimary = (existingCount.count ?? 0) === 0;

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      owner_id: userId,
      make_id: input.make_id ?? null,
      model_id: input.model_id ?? null,
      make_name: input.make_name,
      model_name: input.model_name,
      generation: input.generation ?? null,
      year: input.year,
      color: input.color ?? null,
      color_hex: input.color_hex ?? null,
      fuel_type: input.fuel_type ?? null,
      transmission: input.transmission ?? null,
      seats_total: input.seats_total ?? 5,
      seats_available: input.seats_available ?? 4,
      license_plate_masked: input.license_plate_masked ?? null,
      description: input.description ?? null,
      features: input.features ?? [],
      active: true,
      primary_vehicle: isPrimary,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Vehicle;
}

export async function updateVehicle(
  userId: string,
  input: UpdateVehicleInput
): Promise<Vehicle> {
  const supabase = await createClient();
  const { id, ...rest } = input;

  const { data, error } = await supabase
    .from("vehicles")
    .update({
      ...rest,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", userId) // enforce ownership
    .select("*")
    .single();

  if (error) throw error;
  return data as Vehicle;
}

export async function deleteVehicle(userId: string, vehicleId: string): Promise<void> {
  const supabase = await createClient();
  // Soft delete: set active = false
  const { error } = await supabase
    .from("vehicles")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", vehicleId)
    .eq("owner_id", userId);

  if (error) throw error;
}

export async function setPrimaryVehicle(
  userId: string,
  vehicleId: string
): Promise<void> {
  const supabase = await createClient();

  // Unset all primary flags
  await supabase
    .from("vehicles")
    .update({ primary_vehicle: false })
    .eq("owner_id", userId);

  // Set this one as primary
  const { error } = await supabase
    .from("vehicles")
    .update({ primary_vehicle: true, updated_at: new Date().toISOString() })
    .eq("id", vehicleId)
    .eq("owner_id", userId);

  if (error) throw error;
}

// ─── Vehicle Images ────────────────────────────────────────────────────────

export async function addVehicleImage(
  userId: string,
  vehicleId: string,
  file: File
): Promise<{ url: string; path: string }> {
  // Use regular client for DB reads/writes (respects RLS)
  const supabase = await createClient();
  // Use service client for storage upload (bypasses storage RLS - ownership
  // is already verified in the route handler before calling this function)
  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check image count
  const { count } = await supabase
    .from("vehicle_images")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicleId);

  if ((count ?? 0) >= 10) {
    throw new Error("Maximum 10 photos per vehicle");
  }

  // Get current order_index
  const { data: existingImages } = await supabase
    .from("vehicle_images")
    .select("order_index")
    .eq("vehicle_id", vehicleId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = (existingImages?.[0]?.order_index ?? -1) + 1;
  const isPrimary = nextIndex === 0;

  // Upload to storage
  // Derive extension from filename OR from MIME type (Android can send empty file.type)
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "jpg", // convert heic → jpg label (Supabase accepts the bytes)
    "image/heif": "jpg",
  };
  const extFromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z]/g, "") || "";
  const extFromMime = file.type ? mimeToExt[file.type] ?? "jpg" : "";
  const ext = extFromName || extFromMime || "jpg";

  // Always use a valid MIME type for storage
  const contentType = file.type && file.type.startsWith("image/") ? file.type : `image/${ext === "jpg" ? "jpeg" : ext}`;

  const filename = `${userId}/${vehicleId}/${Date.now()}.${ext}`;

  // Upload to storage using service client (bypasses storage RLS)
  const { data: uploadData, error: uploadError } = await serviceClient.storage
    .from("vehicle-images")
    .upload(filename, file, {
      contentType, // use derived contentType (handles empty file.type on Android)
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error(uploadError.message);
  }

  const { data: urlData } = serviceClient.storage
    .from("vehicle-images")
    .getPublicUrl(uploadData.path);

  const publicUrl = urlData.publicUrl;

  // Save to DB
  const { error: dbError } = await supabase.from("vehicle_images").insert({
    vehicle_id: vehicleId,
    owner_id: userId,
    storage_path: uploadData.path,
    url: publicUrl,
    thumbnail_url: publicUrl, // same URL, can add resize params later
    order_index: nextIndex,
    is_primary: isPrimary,
    moderation_status: "pending",
  });

  if (dbError) throw dbError;

  return { url: publicUrl, path: uploadData.path };
}

export async function deleteVehicleImage(
  userId: string,
  imageId: string
): Promise<void> {
  const supabase = await createClient();

  // Get image info
  const { data: image, error: fetchError } = await supabase
    .from("vehicle_images")
    .select("storage_path, vehicle_id")
    .eq("id", imageId)
    .eq("owner_id", userId)
    .single();

  if (fetchError) throw fetchError;

  // Delete from storage
  await supabase.storage.from("vehicle-images").remove([image.storage_path]);

  // Delete from DB
  const { error } = await supabase
    .from("vehicle_images")
    .delete()
    .eq("id", imageId)
    .eq("owner_id", userId);

  if (error) throw error;

  // Re-order remaining images
  const { data: remaining } = await supabase
    .from("vehicle_images")
    .select("id")
    .eq("vehicle_id", image.vehicle_id)
    .order("order_index");

  if (remaining) {
    for (let i = 0; i < remaining.length; i++) {
      await supabase
        .from("vehicle_images")
        .update({ order_index: i, is_primary: i === 0 })
        .eq("id", remaining[i].id);
    }
  }
}

// ─── Vehicle for ride detail (public read) ─────────────────────────────────

export async function getVehicleForRide(
  vehicleId: string
): Promise<VehicleWithImages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      *,
      images:vehicle_images(
        id, url, thumbnail_url, is_primary, order_index
      )
    `)
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    console.error("getVehicleForRide error:", error);
    return null;
  }

  if (!data) return null;
  const vehicle = data as VehicleWithImages;
  vehicle.images = vehicle.images?.sort((a, b) => a.order_index - b.order_index) ?? [];
  return vehicle;
}

// ─── Vehicle completeness score ────────────────────────────────────────────

export { computeVehicleScore };
// dom 31 mag 2026, 16:40:12, CEST

// ─── Catalog search (make + model in one query) ────────────────────────────

export interface CatalogEntry {
  model_id: string;
  make_id: string;
  make_name: string;
  model_name: string;
  label: string;
  image_url: string | null;
  image_author: string | null;
  image_license: string | null;
  image_source_url: string | null;
}

/**
 * One-box search over the catalog: "pan" finds Fiat Panda, "bmw" finds every
 * BMW. Matching a make returns that make's models so typing a brand still
 * lists cars rather than a dead end.
 */
export async function searchVehicleCatalog(
  query: string,
  limit = 30
): Promise<CatalogEntry[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_models")
    .select(
      "id, name, image_url, image_author, image_license, image_source_url, is_popular, sort_order, vehicle_makes!inner(id, name, is_popular)"
    )
    .or(`name.ilike.${q}%,name.ilike.% ${q}%`)
    .order("sort_order")
    .limit(200);

  const { data: byMake } = await supabase
    .from("vehicle_models")
    .select(
      "id, name, image_url, image_author, image_license, image_source_url, is_popular, sort_order, vehicle_makes!inner(id, name, is_popular)"
    )
    .ilike("vehicle_makes.name", `${q}%`)
    .order("sort_order")
    .limit(200);

  if (error && !byMake) throw error;

  const rows = [...(data ?? []), ...(byMake ?? [])] as unknown as Array<{
    id: string;
    name: string;
    image_url: string | null;
    image_author: string | null;
    image_license: string | null;
    image_source_url: string | null;
    is_popular: boolean;
    sort_order: number;
    vehicle_makes: { id: string; name: string; is_popular: boolean };
  }>;

  const lower = q.toLowerCase();
  const seen = new Set<string>();
  const rank = (r: (typeof rows)[number]) => {
    const name = r.name.toLowerCase();
    const make = r.vehicle_makes.name.toLowerCase();
    // Typing a whole brand should list that brand, not another brand's model
    // that happens to start with the same letters ("mini" → Mini, not Minica).
    if (make === lower) return 0;
    if (name.startsWith(lower)) return 1;
    if (make.startsWith(lower)) return 2;
    return 3;
  };

  return rows
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .sort((a, b) => {
      const byRank = rank(a) - rank(b);
      if (byRank) return byRank;
      // sort_order is 1000 minus the Wikipedia language count, so the
      // nameplates people actually drive come first.
      const bySort = a.sort_order - b.sort_order;
      if (bySort) return bySort;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit)
    .map((r) => ({
      model_id: r.id,
      make_id: r.vehicle_makes.id,
      make_name: r.vehicle_makes.name,
      model_name: r.name,
      label: `${r.vehicle_makes.name} ${r.name}`,
      image_url: r.image_url,
      image_author: r.image_author,
      image_license: r.image_license,
      image_source_url: r.image_source_url,
    }));
}
