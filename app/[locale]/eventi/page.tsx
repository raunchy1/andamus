"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, ArrowLeft, Loader2 } from "lucide-react";
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

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .gte("start_date", new Date().toISOString().split("T")[0])
        .order("start_date", { ascending: true });
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, [supabase]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Eventi in Sardegna</h1>
          <p className="mt-2 text-muted-foreground">Trova un passaggio per le tradizioni e i festival più importanti dell&apos;isola.</p>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-accent" />
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-foreground">Nessun evento in programma</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((evt) => (
                <Link
                  key={evt.id}
                  href={`/eventi/${evt.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:bg-muted/30"
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    {evt.image_url ? (
                      <Image
                        src={evt.image_url}
                        alt={evt.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-foreground">{evt.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(evt.start_date)}
                        {evt.end_date && evt.end_date !== evt.start_date && (
                          <> - {formatDate(evt.end_date)}</>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{evt.city}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
