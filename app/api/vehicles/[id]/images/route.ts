import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addVehicleImage, deleteVehicleImage } from "@/lib/server/data/vehicles";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id: vehicleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify vehicle ownership
  const { data: vehicle, error: fetchError } = await supabase
    .from("vehicles")
    .select("owner_id")
    .eq("id", vehicleId)
    .maybeSingle();

  if (fetchError || !vehicle || vehicle.owner_id !== user.id) {
    return NextResponse.json({ error: "Vehicle not found or unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Use JPG, PNG or WebP." }, { status: 400 });
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
  }

  try {
    // Log env availability for debugging
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("[vehicles/images POST] Service key available:", hasServiceKey, "| Vehicle:", vehicleId);
    
    const result = await addVehicleImage(user.id, vehicleId, file);
    return NextResponse.json({ url: result.url, path: result.path });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Upload failed";
    console.error("[vehicles/images POST] Upload error:", {
      vehicleId,
      userId: user.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      error: msg,
      stack: error instanceof Error ? error.stack?.slice(0, 500) : undefined,
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id: vehicleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return NextResponse.json({ error: "imageId is required" }, { status: 400 });
  }

  try {
    await deleteVehicleImage(user.id, imageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
