"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Minus, Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Analytics } from "@/lib/analytics";

/** Commissione di servizio applicata al passeggero (€). */
const SERVICE_FEE = 1.2;

/**
 * Il backend prenota un solo posto per booking:
 * la tabella `bookings` non ha una colonna posti e Stripe usa `quantity: 1`.
 * Finché non c'è supporto lato schema + checkout, lo stepper resta limitato a 1
 * per non mostrare un totale diverso da quello effettivamente addebitato.
 */
const MAX_BOOKABLE_SEATS = 1;

function formatEuro(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

interface BookingClientProps {
  locale: string;
  rideId: string;
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  price: number;
  maxSeats: number;
  meetingPoint: string | null;
  driverName: string;
}

export function BookingClient({
  locale,
  rideId,
  fromCity,
  toCity,
  date,
  time,
  price,
  maxSeats,
  meetingPoint,
  driverName,
}: BookingClientProps) {
  const router = useRouter();
  const [seats, setSeats] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const seatCap = Math.min(maxSeats, MAX_BOOKABLE_SEATS);
  const isFree = price === 0;
  const subtotal = price * seats;
  const total = isFree ? 0 : subtotal + SERVICE_FEE;

  const departure = time?.slice(0, 5) ?? "";
  const dateLabel = new Date(date).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handleConfirm = async () => {
    setSubmitting(true);
    Analytics.trackEvent("booking_confirm_submitted", { ride_id: rideId, seats });

    try {
      const res = await fetch("/api/stripe/connect/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId, locale }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data.error === "Driver has not set up payments"
            ? "Il conducente non ha ancora configurato i pagamenti."
            : data.error || "Prenotazione non riuscita."
        );
        setSubmitting(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Prenotazione non riuscita. Riprova.");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "var(--sand)", minHeight: "100dvh" }} className="pb-32">
      {/* ── Header ─────────────────────────────────────── */}
      <header style={{ padding: "60px 22px 20px" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginBottom: 18,
          }}
          aria-label="Indietro"
        >
          <ChevronLeft size={20} strokeWidth={1.7} style={{ color: "var(--ink)" }} />
        </button>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.8px",
            color: "var(--ink)",
            margin: "0 0 6px",
          }}
        >
          Conferma prenotazione
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
          {fromCity} → {toCity} · {dateLabel}, {departure}
        </p>
      </header>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* ── Card posti ──────────────────────────────── */}
        <section
          style={{
            background: "var(--surface)",
            borderRadius: 22,
            padding: 20,
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: "0 0 2px" }}>
                Quanti posti?
              </p>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                {seatCap === 1
                  ? "Una prenotazione per passeggero"
                  : `Massimo ${seatCap} disponibili`}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                type="button"
                onClick={() => setSeats((s) => Math.max(1, s - 1))}
                disabled={seats <= 1}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: "1px solid var(--line)",
                  background: "transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: seats <= 1 ? "not-allowed" : "pointer",
                  opacity: seats <= 1 ? 0.4 : 1,
                }}
                aria-label="Rimuovi un posto"
              >
                <Minus size={16} strokeWidth={2} style={{ color: "var(--ink)" }} />
              </button>

              <span
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--ink)",
                  minWidth: 22,
                  textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {seats}
              </span>

              <button
                type="button"
                onClick={() => setSeats((s) => Math.min(seatCap, s + 1))}
                disabled={seats >= seatCap}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: 0,
                  background: "var(--green)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: seats >= seatCap ? "not-allowed" : "pointer",
                  opacity: seats >= seatCap ? 0.4 : 1,
                }}
                aria-label="Aggiungi un posto"
              >
                <Plus size={16} strokeWidth={2} color="#fff" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Card pagamento ──────────────────────────── */}
        {!isFree && (
          <section
            style={{
              background: "var(--surface)",
              borderRadius: 22,
              padding: 20,
              border: "1px solid var(--line)",
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: "0 0 14px" }}>
              Pagamento
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 28,
                  borderRadius: 6,
                  background: "var(--ink)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CreditCard size={16} strokeWidth={1.7} color="var(--sand)" />
              </div>
              <span style={{ fontSize: 15, color: "var(--ink)", flex: 1 }}>
                Carta di credito o debito
              </span>
              <Check size={20} strokeWidth={2.1} style={{ color: "var(--green)" }} />
            </div>
            <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "10px 0 0" }}>
              Il pagamento viene gestito da Stripe al passaggio successivo.
            </p>
          </section>
        )}

        {/* ── Card riepilogo ──────────────────────────── */}
        <section
          style={{
            background: "var(--surface)",
            borderRadius: 22,
            padding: 20,
            border: "1px solid var(--line)",
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: "0 0 14px" }}>
            Riepilogo
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 14.5, color: "var(--muted)" }}>
              {seats} × posto
            </span>
            <span style={{ fontSize: 14.5, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
              {isFree ? "Gratis" : formatEuro(subtotal)}
            </span>
          </div>

          {!isFree && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 14.5, color: "var(--muted)" }}>Commissione servizio</span>
              <span style={{ fontSize: 14.5, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {formatEuro(SERVICE_FEE)}
              </span>
            </div>
          )}

          <div style={{ height: 1, background: "var(--line-soft)", margin: "0 0 14px" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 19, fontWeight: 600, color: "var(--ink)" }}>Totale</span>
            <span
              style={{
                fontSize: 19,
                fontWeight: 600,
                color: "var(--ink)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {isFree ? "Gratis" : formatEuro(total)}
            </span>
          </div>
        </section>

        {/* ── Testo legale ────────────────────────────── */}
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--muted)",
            padding: "4px 6px 0",
            textWrap: "pretty",
          }}
        >
          Cancellazione gratuita fino a 24 ore prima della partenza.{" "}
          {driverName} riceve il tuo numero solo a prenotazione confermata.
          {meetingPoint ? ` Punto d'incontro: ${meetingPoint}.` : ""}
        </p>
      </div>

      {/* ── Barra azione fissa ─────────────────────────── */}
      <div
        style={{
          position: "fixed",
          insetInline: 0,
          bottom: 0,
          zIndex: 40,
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          background: "rgba(255,255,255,.93)",
          borderTop: "1px solid var(--line)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 999,
            background: "var(--green)",
            color: "#fff",
            fontSize: 17,
            fontWeight: 600,
            border: 0,
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.7 : 1,
            transition: "background .2s, opacity .2s",
          }}
        >
          {submitting
            ? "Attendi…"
            : isFree
              ? "Conferma prenotazione"
              : `Conferma e paga ${formatEuro(total)}`}
        </button>
      </div>
    </div>
  );
}
