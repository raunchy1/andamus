"use client";

import Link from "next/link";
import { Check } from "lucide-react";

interface BookingConfirmationProps {
  locale: string;
  bookingId: string;
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  meetingPoint: string | null;
  driverName: string;
}

export function BookingConfirmation({
  locale,
  bookingId,
  fromCity,
  toCity,
  date,
  time,
  meetingPoint,
  driverName,
}: BookingConfirmationProps) {
  const departure = time?.slice(0, 5) ?? "";
  const dateLabel = new Date(date).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const subtitle = [
    `${dateLabel}, ${departure}`,
    meetingPoint ? `da ${meetingPoint}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      style={{
        background: "var(--green)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        textAlign: "center",
      }}
    >
      {/* cerchio con check */}
      <div
        className="animate-pop"
        style={{
          width: 88,
          height: 88,
          borderRadius: 999,
          background: "var(--sand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <Check size={40} strokeWidth={3} style={{ color: "var(--green)" }} />
      </div>

      <h1
        className="animate-rise-1"
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-1px",
          color: "var(--sand)",
          margin: "0 0 8px",
        }}
      >
        Posto confermato
      </h1>

      <p
        className="animate-rise-1"
        style={{
          fontSize: 17,
          fontWeight: 500,
          color: "rgba(244,241,234,.9)",
          margin: "0 0 14px",
        }}
      >
        {fromCity} → {toCity}
      </p>

      <p
        className="animate-rise-2"
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          color: "rgba(244,241,234,.75)",
          margin: "0 0 40px",
          maxWidth: 320,
          textWrap: "pretty",
        }}
      >
        {subtitle}. {driverName} ti scriverà la sera prima.
      </p>

      <Link
        href={`/${locale}/chat/${bookingId}`}
        className="animate-rise-3"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 320,
          height: 56,
          borderRadius: 999,
          background: "var(--sand)",
          color: "var(--ink)",
          fontSize: 17,
          fontWeight: 600,
        }}
      >
        Vai al viaggio
      </Link>

      <Link
        href={`/${locale}`}
        className="animate-rise-3"
        style={{
          marginTop: 18,
          fontSize: 15,
          color: "rgba(244,241,234,.65)",
        }}
      >
        Torna alla home
      </Link>
    </div>
  );
}
