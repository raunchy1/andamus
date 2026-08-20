"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle,
  Mail,
  IdCard,
  Car,
  Loader2,
  Upload,
  ArrowLeft,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { OWN_PROFILE_COLUMNS } from "@/lib/profile-columns";

interface VerificationStatus {
  email: "none" | "pending" | "verified";
  id: "none" | "pending" | "verified";
  driver: "none" | "pending" | "verified";
}

interface Verification {
  status: string;
  type: string;
}

export default function VerificationPage() {
  const router = useRouter();
  const t = useTranslations("profile");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [status, setStatus] = useState<VerificationStatus>({
    email: "none",
    id: "none",
    driver: "none",
  });

  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const loadData = async () => {
      setError(false);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }
        setUser(user);

        const { data: profileData } = await supabase
          .from("profiles")
          .select(OWN_PROFILE_COLUMNS)
          .eq("id", user.id)
          .single();

        // Load verification status
        const { data: verifications } = await supabase
          .from("verifications")
          .select("*")
          .eq("user_id", user.id);

        const newStatus: VerificationStatus = {
          email: profileData?.email_verified ? "verified" : "none",
          id: profileData?.id_verified ? "verified" : "none",
          driver: profileData?.driver_verified ? "verified" : "none",
        };

        verifications?.forEach((v: Verification) => {
          if (v.status === "approved") {
            if (v.type === "id_document") newStatus.id = "verified";
            if (v.type === "driver_license") newStatus.driver = "verified";
          } else if (v.status === "pending") {
            if (v.type === "id_document") newStatus.id = "pending";
            if (v.type === "driver_license") newStatus.driver = "pending";
          }
        });

        setStatus(newStatus);
      } catch (err) {
        console.error('[verifica] loadData error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  const handleFileUpload = async (type: "id" | "driver", file: File) => {
    if (!file || !user) return;

    // Validate file type (images and PDFs only)
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t("invalidFileType"));
      return;
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error(t("fileTooLarge"));
      return;
    }

    setUploading(type);

    try {
      // Upload to Supabase Storage (private bucket)
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("verifications")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      // CRIT-10 FIX: Use signed URL instead of public URL.
      // The signed URL expires after 15 minutes — enough for preview.
      // The DB stores the file path (not the URL) for admin access via server-side signed URLs.
      const { data: signedData, error: signedError } = await supabase.storage
        .from("verifications")
        .createSignedUrl(fileName, 900); // 900 seconds = 15 min

      if (signedError) {
        console.error("[verifica] Signed URL error:", signedError.message);
        // Document is uploaded successfully even if signed URL fails
      }

      // Create verification record — store the file PATH, not a public URL
      const { error: dbError } = await supabase.from("verifications").insert({
        user_id: user.id,
        type: type === "id" ? "id_document" : "driver_license",
        status: "pending",
        document_url: fileName, // Private path — admins use createSignedUrl server-side
      });

      if (dbError) throw dbError;

      toast.success(t("documentUploadedPending"));
      setStatus((s) => ({ ...s, [type]: "pending" }));
    } catch {
      toast.error(t("uploadError"));
    } finally {
      setUploading(null);
    }
  };

  const getVerificationLevel = () => {
    let level = 0;
    if (status.email === "verified") level++;
    if (status.id === "verified") level++;
    if (status.driver === "verified") level++;
    return level;
  };

  const getBadgeTitle = () => {
    const level = getVerificationLevel();
    if (level === 3) return t("userPlatinum");
    if (level === 2) return t("userGold");
    if (level === 1) return t("userSilver");
    return t("userBase");
  };

  if (error) {
    return <div className="p-8 text-center text-bad">Errore nel caricamento. Riprova.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg pt-20 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pt-20 pb-12">
      {/* Header */}
      <div className="bg-surface border-b border-line px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/profilo"
            className="flex items-center gap-2 text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            {t("backToProfile")}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Status Card */}
        <div className="mb-8 rounded-2xl bg-green p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sand-deep">
              <Shield className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{getBadgeTitle()}</h1>
              <p className="text-fg">
                {t("verificationLevel", { level: getVerificationLevel() })}
              </p>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-2 w-8 rounded-full ${
                      i <= getVerificationLevel() ? "bg-white" : "bg-sand-deep"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Email Verification */}
          <div className="rounded-2xl border border-line bg-elevated p-6">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  status.email === "verified"
                    ? "bg-green-tint text-green"
                    : "bg-sand-deep text-muted"
                }`}
              >
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">{t("email")}</h3>
                <p className="text-sm text-muted">
                  {status.email === "verified" ? t("verified") : t("notVerified")}
                </p>
              </div>
              {status.email === "verified" && (
                <CheckCircle className="ml-auto h-6 w-6 text-green" />
              )}
            </div>

            {status.email !== "verified" && (
              <div className="rounded-xl bg-sand-deep p-4">
                <p className="text-sm text-pending">
                  {t("emailVerifiedViaGoogle")}
                </p>
              </div>
            )}
          </div>

          {/* ID Document Verification */}
          <div className="rounded-2xl border border-line bg-elevated p-6">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  status.id === "verified"
                    ? "bg-green-tint text-green"
                    : status.id === "pending"
                    ? "bg-sand-deep text-pending"
                    : "bg-sand-deep text-muted"
                }`}
              >
                <IdCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">{t("idDocument")}</h3>
                <p className="text-sm text-muted">
                  {status.id === "verified"
                    ? t("verified")
                    : status.id === "pending"
                    ? t("underReview")
                    : t("notVerified")}
                </p>
              </div>
              {status.id === "verified" && (
                <CheckCircle className="ml-auto h-6 w-6 text-green" />
              )}
            </div>

            {status.id !== "verified" && status.id !== "pending" && (
              <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-line bg-surface p-6 transition-all hover:border-primary hover:bg-sand-deep">
                <Upload className="mb-2 h-8 w-8 text-muted" />
                <span className="text-sm text-fg">{t("uploadIdCard")}</span>
                <span className="mt-1 text-xs text-faint">{t("pngJpgUpTo5mb")}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileUpload("id", e.target.files[0])
                  }
                />
              </label>
            )}

            {uploading === "id" && (
              <div className="mt-3 flex items-center justify-center gap-2 text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("uploading")}
              </div>
            )}
          </div>

          {/* Driver License Verification */}
          <div className="rounded-2xl border border-line bg-elevated p-6">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  status.driver === "verified"
                    ? "bg-green-tint text-green"
                    : status.driver === "pending"
                    ? "bg-sand-deep text-pending"
                    : "bg-sand-deep text-muted"
                }`}
              >
                <Car className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">{t("driverLicense")}</h3>
                <p className="text-sm text-muted">
                  {status.driver === "verified"
                    ? t("verified")
                    : status.driver === "pending"
                    ? t("underReview")
                    : t("notVerified")}
                </p>
              </div>
              {status.driver === "verified" && (
                <CheckCircle className="ml-auto h-6 w-6 text-green" />
              )}
            </div>

            {status.driver !== "verified" && status.driver !== "pending" && (
              <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-line bg-surface p-6 transition-all hover:border-primary hover:bg-sand-deep">
                <Upload className="mb-2 h-8 w-8 text-muted" />
                <span className="text-sm text-fg">{t("uploadLicense")}</span>
                <span className="mt-1 text-xs text-faint">{t("pngJpgUpTo5mb")}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileUpload("driver", e.target.files[0])
                  }
                />
              </label>
            )}

            {uploading === "driver" && (
              <div className="mt-3 flex items-center justify-center gap-2 text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("uploading")}
              </div>
            )}
          </div>
        </div>

        {/* Benefits Info */}
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">
            {t("verificationBenefits")}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-pending" />
              <div>
                <p className="font-medium text-ink">{t("trustBadge")}</p>
                <p className="text-sm text-muted">
                  {t("othersSeeVerified")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green" />
              <div>
                <p className="font-medium text-ink">{t("moreSecurity")}</p>
                <p className="text-sm text-muted">
                  {t("moreProtectionForYouAndPassengers")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
