"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Shield,
  CheckCircle,
  Phone,
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

interface VerificationStatus {
  phone: "none" | "pending" | "verified";
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [status, setStatus] = useState<VerificationStatus>({
    phone: "none",
    email: "none",
    id: "none",
    driver: "none",
  });

  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setPhoneNumber(profileData?.phone_number || "");

      // Load verification status
      const { data: verifications } = await supabase
        .from("verifications")
        .select("*")
        .eq("user_id", user.id);

      const newStatus: VerificationStatus = {
        phone: profileData?.phone_verified ? "verified" : "none",
        email: profileData?.email_verified ? "verified" : "none",
        id: profileData?.id_verified ? "verified" : "none",
        driver: profileData?.driver_verified ? "verified" : "none",
      };

      verifications?.forEach((v: Verification) => {
        if (v.status === "approved") {
          if (v.type === "phone") newStatus.phone = "verified";
          if (v.type === "id_document") newStatus.id = "verified";
          if (v.type === "driver_license") newStatus.driver = "verified";
        } else if (v.status === "pending") {
          if (v.type === "phone") newStatus.phone = "pending";
          if (v.type === "id_document") newStatus.id = "pending";
          if (v.type === "driver_license") newStatus.driver = "pending";
        }
      });

      setStatus(newStatus);
      setLoading(false);
    };

    loadData();
  }, [router, supabase]);

  const handlePhoneVerify = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Inserisci un numero di telefono valido");
      return;
    }

    // Simulate OTP send
    toast.success("Codice OTP inviato! (Demo: usa 123456)");
    setShowOtpInput(true);
  };

  const handleOtpVerify = async () => {
    if (otpCode !== "123456") {
      toast.error("Codice OTP non valido");
      return;
    }

    if (!user) {
      toast.error("Utente non autenticato");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ phone_verified: true, phone_number: phoneNumber })
      .eq("id", user.id);

    if (error) {
      toast.error("Errore nella verifica");
    } else {
      toast.success("Numero di telefono verificato!");
      setStatus((s) => ({ ...s, phone: "verified" }));
      setShowOtpInput(false);
    }
  };

  const handleFileUpload = async (type: "id" | "driver", file: File) => {
    if (!file || !user) return;

    setUploading(type);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("verifications")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("verifications")
        .getPublicUrl(fileName);

      // Create verification record
      const { error: dbError } = await supabase.from("verifications").insert({
        user_id: user.id,
        type: type === "id" ? "id_document" : "driver_license",
        status: "pending",
        document_url: publicUrl,
      });

      if (dbError) throw dbError;

      toast.success("Documento caricato! In attesa di approvazione.");
      setStatus((s) => ({ ...s, [type]: "pending" }));
    } catch {
      toast.error("Errore nel caricamento");
    } finally {
      setUploading(null);
    }
  };

  const getVerificationLevel = () => {
    let level = 0;
    if (status.phone === "verified") level++;
    if (status.email === "verified") level++;
    if (status.id === "verified") level++;
    if (status.driver === "verified") level++;
    return level;
  };

  const getBadgeTitle = () => {
    const level = getVerificationLevel();
    if (level === 4) return "Utente Platinum";
    if (level === 3) return "Utente Gold";
    if (level === 2) return "Utente Silver";
    if (level === 1) return "Utente Bronze";
    return "Utente Base";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] pt-20 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#e63946]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] pt-20 pb-12">
      {/* Header */}
      <div className="bg-[#12121e] border-b border-white/10 px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/profilo"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Torna al profilo
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Status Card */}
        <div className="mb-8 rounded-3xl bg-gradient-to-br from-[#e63946] to-[#c92a37] p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
              <Shield className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{getBadgeTitle()}</h1>
              <p className="text-white/80">
                Livello di verifica: {getVerificationLevel()}/4
              </p>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-2 w-8 rounded-full ${
                      i <= getVerificationLevel() ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Phone Verification */}
          <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  status.phone === "verified"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/10 text-white"
                }`}
              >
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Telefono</h3>
                <p className="text-sm text-white/50">
                  {status.phone === "verified"
                    ? "Verificato"
                    : "Non verificato"}
                </p>
              </div>
              {status.phone === "verified" && (
                <CheckCircle className="ml-auto h-6 w-6 text-green-400" />
              )}
            </div>

            {status.phone !== "verified" && (
              <div className="space-y-3">
                {!showOtpInput ? (
                  <>
                    <input
                      type="tel"
                      placeholder="+39 333 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0f1729] px-4 py-3 text-white outline-none focus:border-[#e63946]"
                    />
                    <button
                      onClick={handlePhoneVerify}
                      className="w-full rounded-xl bg-[#e63946] py-3 text-sm font-semibold text-white transition-all hover:bg-[#c92a37]"
                    >
                      Invia codice OTP
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Codice OTP (123456)"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0f1729] px-4 py-3 text-white outline-none focus:border-[#e63946]"
                    />
                    <button
                      onClick={handleOtpVerify}
                      className="w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-white transition-all hover:bg-green-600"
                    >
                      Verifica codice
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Email Verification */}
          <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  status.email === "verified"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/10 text-white"
                }`}
              >
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Email</h3>
                <p className="text-sm text-white/50">
                  {status.email === "verified" ? "Verificata" : "Non verificata"}
                </p>
              </div>
              {status.email === "verified" && (
                <CheckCircle className="ml-auto h-6 w-6 text-green-400" />
              )}
            </div>

            {status.email !== "verified" && (
              <div className="rounded-xl bg-yellow-500/10 p-4">
                <p className="text-sm text-yellow-400">
                  La tua email è stata verificata tramite Google OAuth
                </p>
              </div>
            )}
          </div>

          {/* ID Document Verification */}
          <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  status.id === "verified"
                    ? "bg-green-500/20 text-green-400"
                    : status.id === "pending"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-white/10 text-white"
                }`}
              >
                <IdCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Documento d&apos;identit&agrave;</h3>
                <p className="text-sm text-white/50">
                  {status.id === "verified"
                    ? "Verificato"
                    : status.id === "pending"
                    ? "In revisione"
                    : "Non verificato"}
                </p>
              </div>
              {status.id === "verified" && (
                <CheckCircle className="ml-auto h-6 w-6 text-green-400" />
              )}
            </div>

            {status.id !== "verified" && status.id !== "pending" && (
              <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 transition-all hover:border-[#e63946] hover:bg-white/10">
                <Upload className="mb-2 h-8 w-8 text-white/50" />
                <span className="text-sm text-white/70">Carica carta d&apos;identit&agrave;</span>
                <span className="mt-1 text-xs text-white/40">PNG, JPG fino a 5MB</span>
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
              <div className="mt-3 flex items-center justify-center gap-2 text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                Caricamento...
              </div>
            )}
          </div>

          {/* Driver License Verification */}
          <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  status.driver === "verified"
                    ? "bg-green-500/20 text-green-400"
                    : status.driver === "pending"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-white/10 text-white"
                }`}
              >
                <Car className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Patente di guida</h3>
                <p className="text-sm text-white/50">
                  {status.driver === "verified"
                    ? "Verificata"
                    : status.driver === "pending"
                    ? "In revisione"
                    : "Non verificata"}
                </p>
              </div>
              {status.driver === "verified" && (
                <CheckCircle className="ml-auto h-6 w-6 text-green-400" />
              )}
            </div>

            {status.driver !== "verified" && status.driver !== "pending" && (
              <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 transition-all hover:border-[#e63946] hover:bg-white/10">
                <Upload className="mb-2 h-8 w-8 text-white/50" />
                <span className="text-sm text-white/70">Carica patente</span>
                <span className="mt-1 text-xs text-white/40">PNG, JPG fino a 5MB</span>
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
              <div className="mt-3 flex items-center justify-center gap-2 text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                Caricamento...
              </div>
            )}
          </div>
        </div>

        {/* Benefits Info */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#12121e] p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Vantaggi della verifica
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="font-medium text-white">Badge di fiducia</p>
                <p className="text-sm text-white/50">
                  Gli altri utenti vedranno che sei verificato
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-400" />
              <div>
                <p className="font-medium text-white">Più sicurezza</p>
                <p className="text-sm text-white/50">
                  Maggiore protezione per te e i passeggeri
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
