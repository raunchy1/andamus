"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Car, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Banknote,
  MapPinned,
  FileText,
  Check,
  ArrowLeft,
  AlertCircle,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth";

const sardinianCities = [
  "Cagliari",
  "Sassari", 
  "Olbia",
  "Nuoro",
  "Oristano",
  "Tortolì",
  "Lanusei",
  "Iglesias",
  "Carbonia",
  "Alghero",
  "Tempio Pausania",
  "La Maddalena",
  "Siniscola",
  "Dorgali",
  "Muravera",
  "Villacidro",
  "Sanluri",
  "Macomer",
  "Bosa",
  "Castelsardo"
];

export default function OfferPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    date: "",
    time: "",
    seats: "",
    isFree: true,
    price: "",
    meetingPoint: "",
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const supabase = createClient();

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors; });
    }
    if (field === "origin" || field === "destination") {
      if (errors.sameCity) {
        setErrors(prev => { const newErrors = { ...prev }; delete newErrors.sameCity; return newErrors; });
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.origin) newErrors.origin = "Seleziona la città di partenza";
    if (!formData.destination) newErrors.destination = "Seleziona la destinazione";
    if (formData.origin && formData.destination && formData.origin === formData.destination) {
      newErrors.sameCity = "Partenza e destinazione non possono essere uguali";
    }
    if (!formData.date) newErrors.date = "Seleziona una data";
    if (!formData.time) newErrors.time = "Seleziona un orario";
    if (!formData.seats) newErrors.seats = "Inserisci il numero di posti";
    if (!formData.isFree && !formData.price) newErrors.price = "Inserisci il contributo richiesto";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!validateForm()) return;

    // Double check user is logged in
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setSubmitError("Devi essere autenticato per pubblicare un passaggio.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("rides")
        .insert({
          driver_id: currentUser.id,
          from_city: formData.origin,
          to_city: formData.destination,
          date: formData.date,
          time: formData.time,
          seats: parseInt(formData.seats),
          price: formData.isFree ? 0 : parseFloat(formData.price),
          meeting_point: formData.meetingPoint || null,
          notes: formData.notes || null,
          status: "active"
        })
        .select();

      if (error) {
        console.error("Error inserting ride:", error);
        setSubmitError("Errore durante la pubblicazione. Riprova più tardi.");
        return;
      }

      console.log("Ride created:", data);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Unexpected error:", err);
      setSubmitError("Errore imprevisto. Riprova più tardi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e]">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#e63946]" />
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#1a1a2e]">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e63946]/10">
              <Car className="h-10 w-10 text-[#e63946]" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white">
              Offri un passaggio
            </h1>
            <p className="mb-8 text-white/60">
              Devi accedere per pubblicare un passaggio.
            </p>
            <button
              onClick={handleLogin}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#c92a37] hover:shadow-lg hover:shadow-[#e63946]/25"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Accedi con Google
            </button>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Torna alla home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#1a1a2e]">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white">
              Passaggio pubblicato!
            </h1>
            <p className="mb-8 text-white/60">
              Presto potrai gestirlo dal tuo profilo.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/profilo"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#c92a37]"
              >
                Vai al profilo
              </Link>
              <Link
                href="/cerca"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Cerca altri passaggi
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#12121e] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 text-[#e63946]">
            <Car className="h-5 w-5" />
            <span className="text-sm font-medium">Offri un passaggio</span>
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Offri un passaggio
          </h1>
          <p className="mt-2 text-white/60">
            Aiuta qualcuno a spostarsi in Sardegna
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {submitError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-sm text-red-400">{submitError}</p>
                </div>
              </div>
            )}

            {/* Form Container */}
            <div className="rounded-2xl border border-white/10 bg-[#1e2a4a] p-6 sm:p-8">
              
              {/* Route Section */}
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-white">Percorso</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Partenza */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Partenza *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e63946]" />
                      <select
                        value={formData.origin}
                        onChange={(e) => handleChange("origin", e.target.value)}
                        className={`h-12 w-full appearance-none rounded-xl border bg-[#0f1729] pl-10 pr-10 text-sm text-white outline-none transition-colors [&>option]:bg-[#1a1a2e] [&>option]:text-white ${
                          errors.origin || errors.sameCity
                            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            : "border-white/10 focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                        }`}
                      >
                        <option value="">Seleziona città</option>
                        {sardinianCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="h-4 w-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.origin && (
                      <p className="mt-1 text-sm text-red-400">{errors.origin}</p>
                    )}
                  </div>

                  {/* Destinazione */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Destinazione *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e63946]" />
                      <select
                        value={formData.destination}
                        onChange={(e) => handleChange("destination", e.target.value)}
                        className={`h-12 w-full appearance-none rounded-xl border bg-[#0f1729] pl-10 pr-10 text-sm text-white outline-none transition-colors [&>option]:bg-[#1a1a2e] [&>option]:text-white ${
                          errors.destination || errors.sameCity
                            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            : "border-white/10 focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                        }`}
                      >
                        <option value="">Seleziona città</option>
                        {sardinianCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="h-4 w-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.destination && (
                      <p className="mt-1 text-sm text-red-400">{errors.destination}</p>
                    )}
                    {errors.sameCity && (
                      <p className="mt-1 text-sm text-red-400">{errors.sameCity}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Date & Time Section */}
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-white">Data e ora</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Data */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Data *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e63946]" />
                      <input
                        type="date"
                        min={today}
                        value={formData.date}
                        onChange={(e) => handleChange("date", e.target.value)}
                        className={`h-12 w-full rounded-xl border bg-[#0f1729] pl-10 pr-4 text-sm text-white outline-none transition-colors [&::-webkit-calendar-picker-indicator]:invert ${
                          errors.date
                            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            : "border-white/10 focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                        }`}
                      />
                    </div>
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-400">{errors.date}</p>
                    )}
                  </div>

                  {/* Ora */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Ora di partenza *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e63946]" />
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleChange("time", e.target.value)}
                        className={`h-12 w-full rounded-xl border bg-[#0f1729] pl-10 pr-4 text-sm text-white outline-none transition-colors [&::-webkit-calendar-picker-indicator]:invert ${
                          errors.time
                            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            : "border-white/10 focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                        }`}
                      />
                    </div>
                    {errors.time && (
                      <p className="mt-1 text-sm text-red-400">{errors.time}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Seats */}
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-white">Dettagli</h2>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Posti disponibili *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e63946]" />
                    <input
                      type="number"
                      min="1"
                      max="8"
                      placeholder="1-8"
                      value={formData.seats}
                      onChange={(e) => handleChange("seats", e.target.value)}
                      className={`h-12 w-full rounded-xl border bg-[#0f1729] pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 ${
                        errors.seats
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-white/10 focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                      }`}
                    />
                  </div>
                  {errors.seats && (
                    <p className="mt-1 text-sm text-red-400">{errors.seats}</p>
                  )}
                </div>
              </div>

              {/* Price Toggle */}
              <div className="mb-8">
                <label className="mb-3 block text-sm font-medium text-white/70">
                  Contributo richiesto *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange("isFree", true)}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      formData.isFree
                        ? "bg-[#e63946] text-white"
                        : "border border-white/10 bg-[#0f1729] text-white/70 hover:bg-white/5"
                    }`}
                  >
                    Gratuito
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("isFree", false)}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      !formData.isFree
                        ? "bg-[#e63946] text-white"
                        : "border border-white/10 bg-[#0f1729] text-white/70 hover:bg-white/5"
                    }`}
                  >
                    A pagamento
                  </button>
                </div>

                {/* Price Input (conditional) */}
                {!formData.isFree && (
                  <div className="mt-4">
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e63946]" />
                      <input
                        type="number"
                        min="1"
                        placeholder="Importo in euro"
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                        className={`h-12 w-full rounded-xl border bg-[#0f1729] pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 ${
                          errors.price
                            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            : "border-white/10 focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">€</span>
                    </div>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-400">{errors.price}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Optional Fields */}
              <div className="space-y-6">
                {/* Meeting Point */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Punto di ritrovo <span className="text-white/40">(opzionale)</span>
                  </label>
                  <div className="relative">
                    <MapPinned className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e63946]" />
                    <input
                      type="text"
                      placeholder="Es. Piazza Matteotti, davanti al bar"
                      value={formData.meetingPoint}
                      onChange={(e) => handleChange("meetingPoint", e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#0f1729] pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Note aggiuntive <span className="text-white/40">(opzionale)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-[#e63946]" />
                    <textarea
                      rows={3}
                      placeholder="Es. Ho posto per un bagaglio grande"
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0f1729] py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#e63946] py-4 text-base font-semibold text-white shadow-lg shadow-[#e63946]/25 transition-all hover:bg-[#c92a37] hover:shadow-xl hover:shadow-[#e63946]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Pubblicazione in corso..." : "Pubblica il passaggio"}
            </button>

            {/* Back Link */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Torna indietro
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a12] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-white/40">
            Fatto con <span className="text-[#e63946]">♥</span> in Sardegna
          </p>
        </div>
      </footer>
    </div>
  );
}
