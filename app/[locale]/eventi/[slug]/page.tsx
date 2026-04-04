"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, MapPin, Search, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EventItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  start_date: string;
  end_date: string | null;
  location: string;
  city: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = useMemo(() => createClient(), []);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;
      const { data } = await supabase.from("events").select("*").eq("slug", slug).single();
      setEvent(data);
      setLoading(false);
    };
    fetchEvent();
  }, [slug, supabase]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Evento non trovato</h1>
        <Link href="/eventi" className="mt-6 flex items-center gap-2 text-accent">
          <ArrowLeft className="h-4 w-4" /> Torna agli eventi
        </Link>
      </div>
    );
  }

  const searchUrl = `/cerca?to=${encodeURIComponent(event.city)}&date=${event.start_date}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-64 w-full overflow-hidden sm:h-80">
        {event.image_url ? (
          <Image src={event.image_url} alt={event.name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6">
          <div className="mx-auto max-w-3xl">
            <Link href="/eventi" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Torna agli eventi
            </Link>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{event.name}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">
              {formatDate(event.start_date)}
              {event.end_date && event.end_date !== event.start_date && (
                <> - {formatDate(event.end_date)}</>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>{event.location}, {event.city}</span>
          </div>
        </div>

        <p className="text-foreground leading-relaxed whitespace-pre-line">{event.description}</p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Cerchi un passaggio?</h2>
          <p className="text-muted-foreground mb-4">Trova o offri un passaggio per {event.name}.</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={searchUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent/90"
            >
              <Search className="h-4 w-4" />
              Cerca passaggi
            </Link>
            <Link
              href={`/offri?to=${encodeURIComponent(event.city)}&date=${event.start_date}`}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Offri un passaggio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
