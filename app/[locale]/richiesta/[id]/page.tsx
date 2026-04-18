"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface RideRequest {
  id: string;
  user_id: string;
  from_city: string;
  to_city: string;
  date: string;
  time: string | null;
  time_flexibility: string;
  seats_needed: number;
  max_price: number | null;
  notes: string | null;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;
  const supabase = createClient();

  const [request, setRequest] = useState<RideRequest | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId) return;
      setLoading(true);

      const [{ data: { user: currentUser } }, { data: reqData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("ride_requests")
          .select(`*, profiles(name, avatar_url)`)
          .eq("id", requestId)
          .single(),
      ]);

      setUser(currentUser);
      setRequest(reqData);
      setLoading(false);
    };

    fetchData();
  }, [requestId, supabase]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  };

  const flexibilityLabel = (val: string) => {
    switch (val) {
      case "1h": return "Flessibile ±1h";
      case "3h": return "Flessibile ±3h";
      case "any": return "Orario qualsiasi";
      default: return "Orario preciso";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Richiesta non trovata</h1>
        <Link href="/richieste" className="mt-6 flex items-center gap-2 text-accent">
          <ArrowLeft className="h-4 w-4" /> Torna alle richieste
        </Link>
      </div>
    );
  }

  const isMyRequest = user?.id === request.user_id;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/richieste" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Indietro</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              {request.from_city} → {request.to_city}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">{formatDate(request.date)}</span>
              </div>
              {request.time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{request.time.slice(0, 5)}</span>
                  <span className="text-sm">({flexibilityLabel(request.time_flexibility)})</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 py-4 border-y border-border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted overflow-hidden">
              <span className="text-lg font-bold text-muted-foreground">
                {request.profiles.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{request.profiles.name}</p>
              <p className="text-sm text-muted-foreground">Cerca un passaggio</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Posti necessari</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{request.seats_needed}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Budget max</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {request.max_price !== null ? `${request.max_price}€` : "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Flessibilità</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{flexibilityLabel(request.time_flexibility)}</p>
            </div>
          </div>

          {request.notes && (
            <div className="flex gap-3">
              <FileText className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Note</p>
                <p className="text-muted-foreground">{request.notes}</p>
              </div>
            </div>
          )}

          {!isMyRequest && user && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-foreground font-medium mb-2">Hai un passaggio per questo tragitto?</p>
              <Link
                href={`/offri?from=${request.from_city}&to=${request.to_city}&date=${request.date}`}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent/90"
              >
                <MapPin className="h-4 w-4" />
                Pubblica una corsa
              </Link>
            </div>
          )}

          {isMyRequest && (
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-muted-foreground">Questa è la tua richiesta</p>
              <p className="text-sm text-muted-foreground mt-1">Riceverai una notifica quando un autista pubblica una corsa compatibile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
