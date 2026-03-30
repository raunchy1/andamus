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
import { completeGamificationAction } from "@/lib/gamification";
import { toast } from "react-hot-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const sardinianCities = [
  "Cagliari", "Sassari", "Olbia", "Nuoro", "Oristano", "Tortolì", "Lanusei",
  "Iglesias", "Carbonia", "Alghero", "Tempio Pausania", "La Maddalena",
  "Siniscola", "Dorgali", "Muravera", "Villacidro", "Sanluri", "Macomer",
  "Bosa", "Castelsardo"
];

export default function OfferPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
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

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setSubmitError("Devi essere autenticato per pubblicare un passaggio.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
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
        setSubmitError("Errore durante la pubblicazione. Riprova più tardi.");
        return;
      }
      
      // Add gamification points
      if (currentUser) {
        const { count } = await supabase
          .from('rides')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', currentUser.id);
        
        const isFirstRide = (count || 0) === 1;
        
        const result = await completeGamificationAction(
          currentUser.id,
          'ride_published',
          isFirstRide
        );
        
        if (result.pointsAdded > 0) {
          toast.success(`+${result.pointsAdded} punti! 🎉`);
          if (result.leveledUp) {
            toast.success(`Congratulazioni! Sei salito a livello ${result.newLevel}!`);
          }
        }
      }
      
      setIsSubmitted(true);
    } catch {
      setSubmitError("Errore imprevisto. Riprova più tardi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // console.error("Login failed:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Car className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Offri un passaggio
          </h1>
          <p className="mb-8 text-muted-foreground">
            Devi accedere per pubblicare un passaggio.
          </p>
          <button
            onClick={handleLogin}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-accent/90"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Accedi con Google
          </button>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna alla home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Passaggio pubblicato!
          </h1>
          <p className="mb-8 text-muted-foreground">
            Presto potrai gestirlo dal tuo profilo.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/profilo"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              Vai al profilo
            </Link>
            <Link
              href="/cerca"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Cerca altri passaggi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-2 text-accent text-sm font-medium uppercase tracking-wide">
            <Car className="h-4 w-4" />
            <span>Offri un passaggio</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Pubblica la tua corsa
          </h1>
          <p className="mt-2 text-muted-foreground">
            Aiuta qualcuno a spostarsi in Sardegna
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Message */}
            {submitError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{submitError}</p>
                </div>
              </div>
            )}

            {/* Route Section */}
            <div className="space-y-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Percorso
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={formData.origin}
                      onChange={(e) => handleChange("origin", e.target.value)}
                      className={`h-14 w-full appearance-none rounded-2xl border bg-card pl-12 pr-10 text-foreground outline-none transition-colors [&>option]:bg-card ${
                        errors.origin || errors.sameCity
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-accent"
                      }`}
                    >
                      <option value="">Da dove parti?</option>
                      {sardinianCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  {errors.origin && (
                    <p className="mt-1 text-sm text-destructive">{errors.origin}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={formData.destination}
                      onChange={(e) => handleChange("destination", e.target.value)}
                      className={`h-14 w-full appearance-none rounded-2xl border bg-card pl-12 pr-10 text-foreground outline-none transition-colors [&>option]:bg-card ${
                        errors.destination || errors.sameCity
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-accent"
                      }`}
                    >
                      <option value="">Dove vai?</option>
                      {sardinianCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  {errors.destination && (
                    <p className="mt-1 text-sm text-destructive">{errors.destination}</p>
                  )}
                  {errors.sameCity && (
                    <p className="mt-1 text-sm text-destructive">{errors.sameCity}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Date & Time Section */}
            <div className="space-y-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Data e ora
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      min={today}
                      value={formData.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                      className={`h-14 w-full rounded-2xl border bg-card pl-12 pr-4 text-foreground outline-none transition-colors ${
                        errors.date
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-accent"
                      }`}
                    />
                  </div>
                  {errors.date && (
                    <p className="mt-1 text-sm text-destructive">{errors.date}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleChange("time", e.target.value)}
                      className={`h-14 w-full rounded-2xl border bg-card pl-12 pr-4 text-foreground outline-none transition-colors ${
                        errors.time
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-accent"
                      }`}
                    />
                  </div>
                  {errors.time && (
                    <p className="mt-1 text-sm text-destructive">{errors.time}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Seats */}
            <div className="space-y-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Posti disponibili
              </h2>
              <div>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    min="1"
                    max="8"
                    placeholder="1-8 posti"
                    value={formData.seats}
                    onChange={(e) => handleChange("seats", e.target.value)}
                    className={`h-14 w-full rounded-2xl border bg-card pl-12 pr-4 text-foreground outline-none transition-colors placeholder:text-muted-foreground ${
                      errors.seats
                        ? "border-destructive focus:border-destructive"
                        : "border-border focus:border-accent"
                    }`}
                  />
                </div>
                {errors.seats && (
                  <p className="mt-1 text-sm text-destructive">{errors.seats}</p>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Price Toggle */}
            <div className="space-y-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Contributo richiesto
              </h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleChange("isFree", true)}
                  className={`flex-1 rounded-2xl px-4 py-4 text-sm font-medium transition-all ${
                    formData.isFree
                      ? "bg-accent text-white"
                      : "border border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  Gratuito
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("isFree", false)}
                  className={`flex-1 rounded-2xl px-4 py-4 text-sm font-medium transition-all ${
                    !formData.isFree
                      ? "bg-accent text-white"
                      : "border border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  A pagamento
                </button>
              </div>

              {!formData.isFree && (
                <div>
                  <div className="relative">
                    <Banknote className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      min="1"
                      placeholder="Importo in euro"
                      value={formData.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                      className={`h-14 w-full rounded-2xl border bg-card pl-12 pr-12 text-foreground outline-none transition-colors placeholder:text-muted-foreground ${
                        errors.price
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-accent"
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-destructive">{errors.price}</p>
                  )}
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Optional Fields */}
            <div className="space-y-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Dettagli opzionali
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <MapPinned className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Punto di ritrovo (es. Piazza Matteotti)"
                      value={formData.meetingPoint}
                      onChange={(e) => handleChange("meetingPoint", e.target.value)}
                      className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                    <textarea
                      rows={3}
                      placeholder="Note aggiuntive (es. Ho posto per un bagaglio grande)"
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-accent py-4 text-base font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Pubblicazione in corso..." : "Pubblica il passaggio"}
            </button>

            {/* Back Link */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Torna indietro
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
