"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Sparkles, MapPin, Calendar, Clock, Euro, Users, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { LocationCombobox } from "@/components/LocationCombobox";
import { Analytics } from "@/lib/analytics";

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
  onSuccess?: () => void;
}

export function CreateRequestModal({
  isOpen,
  onClose,
  initialFrom = "",
  initialTo = "",
  initialDate = "",
  onSuccess,
}: CreateRequestModalProps) {
  const t = useTranslations("requests");
  const locale = useLocale();
  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(false);
  const [fromCity, setFromCity] = useState(initialFrom);
  const [toCity, setToCity] = useState(initialTo);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [timeFlexibility, setTimeFlexibility] = useState("exact");
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [maxPrice, setMaxPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setFromCity(initialFrom);
      setToCity(initialTo);
      setDate(initialDate || new Date().toISOString().split("T")[0]);
      setTime("");
      setTimeFlexibility("exact");
      setSeatsNeeded(1);
      setMaxPrice("");
      setNotes("");

      // Fetch current user
      supabase.auth.getUser().then((res: any) => {
        setUser(res.data?.user || null);
      });
    }
  }, [isOpen, initialFrom, initialTo, initialDate, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Devi effettuare l'accesso per pubblicare una richiesta.");
      return;
    }

    if (!fromCity || !toCity) {
      toast.error("Inserisci sia la partenza che la destinazione.");
      return;
    }

    if (fromCity === toCity) {
      toast.error("La partenza e la destinazione non possono coincidere.");
      return;
    }

    if (!date) {
      toast.error("Inserisci la data del viaggio.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("ride_requests").insert({
        user_id: user.id,
        from_city: fromCity,
        to_city: toCity,
        date,
        time: time || null,
        time_flexibility: timeFlexibility,
        seats_needed: seatsNeeded,
        max_price: maxPrice ? parseFloat(maxPrice) : null,
        notes: notes.trim() || null,
        status: "active",
      });

      if (error) throw error;

      toast.success("Richiesta di passaggio pubblicata con successo!");
      Analytics.trackEvent("ride_request_created", {
        from_city: fromCity,
        to_city: toCity,
        date,
        seats_needed: seatsNeeded,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("[CreateRequestModal] submit error:", err);
      toast.error("Errore durante l'invio della richiesta. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div
        className="w-full max-w-lg rounded-[28px] border border-line bg-surface/95 p-6 sm:p-8 shadow-[0_0_50px_rgba(45,106,79,0.15)] relative overflow-y-auto max-h-[90vh]"
        style={{
          boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Glow */}
        <div className="absolute -top-24 -right-24 pointer-events-none w-48 h-48 rounded-full bg-primary/10 blur-[80px]" />

        {/* Header */}
        <div className="mb-6 flex items-start justify-between relative">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
              <Sparkles className="h-3 w-3" />
              Cerco passaggio
            </span>
            <h3 className="text-2xl font-black tracking-tight text-ink">Chiedi un passaggio</h3>
            <p className="text-xs text-muted mt-1">
              Lascia che la community ti trovi un passaggio. Gli autisti ti vedranno!
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-line text-muted transition-all hover:bg-sand-deep hover:text-ink"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative">
          {/* Route Selector Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">
                {t("from")}
              </label>
              <LocationCombobox
                value={fromCity}
                onChange={setFromCity}
                placeholder={t("any")}
                buttonClassName="h-12 border-line bg-surface text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">
                {t("to")}
              </label>
              <LocationCombobox
                value={toCity}
                onChange={setToCity}
                placeholder={t("any")}
                buttonClassName="h-12 border-line bg-surface text-sm"
              />
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">
                Data del viaggio
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-faint" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none focus:border-green/40 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">
                Orario Indicativo (Opzionale)
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-faint" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none focus:border-green/40 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Time Flexibility */}
          {time && (
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">
                Flessibilità oraria
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "exact", label: "Preciso" },
                  { value: "1h", label: "±1h" },
                  { value: "3h", label: "±3h" },
                  { value: "any", label: "Qualsiasi" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTimeFlexibility(item.value)}
                    className={`h-10 rounded-lg text-xs font-semibold border transition-all ${
                      timeFlexibility === item.value
                        ? "bg-primary border-primary text-white"
                        : "bg-surface border-line text-fg hover:bg-sand-deep"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seats Needed & Max Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">
                Posti richiesti
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSeatsNeeded(num)}
                    className={`flex-1 h-12 rounded-xl text-sm font-bold border transition-all ${
                      seatsNeeded === num
                        ? "bg-primary border-primary text-white"
                        : "bg-surface border-line text-fg hover:bg-sand-deep"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">
                Budget Massimo (Opzionale)
              </label>
              <div className="relative">
                <Euro className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-faint" />
                <input
                  type="number"
                  placeholder="Nessun limite"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                  className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none focus:border-green/40 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-primary">
              Note Aggiuntive (Dettagli, bagagli, etc.)
            </label>
            <textarea
              placeholder="Esempio: Devo portare una valigia grande. Flessibile anche a viaggiare in tarda mattinata."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-line bg-surface p-4 text-sm text-ink outline-none focus:border-green/40 transition-colors placeholder:text-faint"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Pubblica richiesta
                <ArrowRight className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
