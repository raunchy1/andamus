"use client";

import Link from "next/link";
import { Car, Search, MessageCircle, Calendar, MapPin, PlusCircle } from "lucide-react";

interface EmptyStateProps {
  type: "rides" | "bookings" | "messages" | "search" | "notifications";
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  showAction?: boolean;
}

const configs = {
  rides: {
    icon: Car,
    defaultTitle: "Nessun passaggio trovato",
    defaultDescription: "Non ci sono corse disponibili per i filtri selezionati.",
    defaultActionLabel: "Offri un passaggio",
    defaultActionHref: "/offri",
    illustration: "🚗",
  },
  bookings: {
    icon: Calendar,
    defaultTitle: "Non hai ancora prenotato",
    defaultDescription: "Inizia a viaggiare con Andamus! Trova il tuo primo passaggio.",
    defaultActionLabel: "Cerca un passaggio",
    defaultActionHref: "/cerca",
    illustration: "📅",
  },
  messages: {
    icon: MessageCircle,
    defaultTitle: "Nessun messaggio",
    defaultDescription: "Inizia una conversazione con il conducente o il passeggero.",
    defaultActionLabel: "Torna al profilo",
    defaultActionHref: "/profilo",
    illustration: "💬",
  },
  search: {
    icon: Search,
    defaultTitle: "Nessun risultato",
    defaultDescription: "Prova a modificare i filtri di ricerca o cerca un'altra data.",
    defaultActionLabel: "Cancella filtri",
    defaultActionHref: "#",
    illustration: "🔍",
  },
  notifications: {
    icon: MapPin,
    defaultTitle: "Nessuna notifica",
    defaultDescription: "Le tue notifiche appariranno qui quando arriveranno.",
    defaultActionLabel: "Torna alla home",
    defaultActionHref: "/",
    illustration: "🔔",
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  showAction = true,
}: EmptyStateProps) {
  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Animated Illustration */}
      <div className="relative mb-8">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[#e63946]/20 rounded-full blur-3xl scale-150 animate-pulse" />
        
        {/* Main icon container */}
        <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-[#1e2a4a] to-[#1a2339] border border-white/10 empty-illustration">
          <span className="text-6xl">{config.illustration}</span>
        </div>
        
        {/* Floating elements */}
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#e63946]/20 animate-float" />
        <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-white/10 animate-float-delayed" />
      </div>

      {/* Text Content */}
      <h3 className="heading-premium text-2xl text-white mb-3">
        {title || config.defaultTitle}
      </h3>
      <p className="text-white/60 max-w-md mb-8 leading-relaxed">
        {description || config.defaultDescription}
      </p>

      {/* Action Button */}
      {showAction && (
        <Link
          href={actionHref || config.defaultActionHref}
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e63946] to-[#ff5a66] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#e63946]/25 transition-all hover:shadow-xl hover:shadow-[#e63946]/40 active:scale-[0.98] touch-manipulation btn-press"
        >
          {type === "rides" || type === "bookings" ? (
            <PlusCircle className="h-4 w-4 group-hover:rotate-90 transition-transform" />
          ) : type === "search" ? (
            <Search className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          {actionLabel || config.defaultActionLabel}
        </Link>
      )}

      {/* Decorative dots */}
      <div className="flex gap-2 mt-12">
        <div className="w-2 h-2 rounded-full bg-[#e63946]/50 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-[#e63946]/30 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 rounded-full bg-[#e63946]/10 animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}

// Specialized empty states for common use cases
export function EmptyRides() {
  return <EmptyState type="rides" />;
}

export function EmptyBookings() {
  return <EmptyState type="bookings" />;
}

export function EmptyMessages() {
  return <EmptyState type="messages" />;
}

export function EmptySearch() {
  return <EmptyState type="search" />;
}

export function EmptyNotifications() {
  return <EmptyState type="notifications" />;
}
