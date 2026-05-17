"use client";

import Image from "next/image";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  ArrowRight,
  Check,
  Copy,
  Crown,
  Loader2,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

type SubmitState = "idle" | "loading" | "success" | "error";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
  "https://andamus.vercel.app";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function copyToClipboard(text: string): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
  document.body.appendChild(el);
  el.focus();
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function Benefit({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="border-t border-[#1f2a24]/10 pt-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#14382b] text-[#f7f2e8]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-[#171614]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#5f625a]">{description}</p>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#767166]"
    >
      {children}
    </label>
  );
}

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref") ?? "";

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zona, setZona] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [position, setPosition] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCount = useCallback(async () => {
    const { count: c } = await supabase
      .from("waiting_list")
      .select("*", { count: "exact", head: true });
    if (c !== null) setCount(c);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchCount);

    const channel = supabase
      .channel("waiting_list_inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "waiting_list" },
        () => {
          setCount((prev) => (prev !== null ? prev + 1 : null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waiting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim() || null,
          zona: zona || null,
          referred_by: refParam || null,
        }),
      });

      const data: {
        success: boolean;
        position?: number;
        referral_code?: string;
        error?: string;
      } = await res.json();

      if (data.success && data.position && data.referral_code) {
        setPosition(data.position);
        setReferralCode(data.referral_code);
        setState("success");
      } else {
        if (data.error === "email_exists") {
          setErrorMsg("Questa email e gia in lista. Controlla la tua casella.");
        } else if (data.error === "invalid_email") {
          setErrorMsg("Inserisci un indirizzo email valido.");
        } else {
          setErrorMsg("Si e verificato un errore. Riprova tra qualche istante.");
        }
        setState("error");
      }
    } catch {
      setErrorMsg("Errore di connessione. Riprova.");
      setState("error");
    }
  };

  const referralLink = `${BASE_URL}/coming-soon?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await copyToClipboard(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Browser did not grant clipboard access.
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f1e8] text-[#171614]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.76),rgba(246,241,232,0.78)_42%,rgba(21,56,43,0.12))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#171614]/10" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-12 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-10">
        <div className="flex flex-col justify-between gap-12">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#171614] text-[#f7f2e8] shadow-[0_14px_40px_rgba(23,22,20,0.18)]">
                <Route className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-lg font-extrabold uppercase tracking-tight">
                Andamus
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[#171614]/10 bg-white/55 px-3 py-1.5 text-xs font-medium text-[#4e514a] backdrop-blur sm:flex">
              <MapPin className="h-3.5 w-3.5 text-[#bb152c]" aria-hidden="true" />
              Sardegna, Italia
            </div>
          </header>

          <div className="max-w-2xl py-4 lg:py-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#bb152c]/15 bg-white/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#7a1d2c] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Accesso anticipato
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.92] tracking-tight text-[#171614] sm:text-6xl lg:text-7xl">
              Il carpooling sardo, senza rumore.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#55584f] sm:text-xl">
              Andamus mette in contatto chi offre e chi cerca passaggi in Sardegna:
              tratte chiare, profili verificati, chat integrata e una community
              costruita per l&apos;isola.
            </p>

            <div className="mt-9 grid max-w-xl grid-cols-3 divide-x divide-[#171614]/10 border-y border-[#171614]/10">
              <div className="py-5 pr-4">
                <p className="text-2xl font-black tracking-tight">
                  {count === null ? "..." : count.toLocaleString("it")}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[#73766e] sm:text-xs sm:tracking-[0.14em]">
                  in lista
                </p>
              </div>
              <div className="px-4 py-5">
                <p className="text-2xl font-black tracking-tight">50</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[#73766e] sm:text-xs sm:tracking-[0.14em]">
                  beta slot
                </p>
              </div>
              <div className="py-5 pl-4">
                <p className="text-2xl font-black tracking-tight">0%</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[#73766e] sm:text-xs sm:tracking-[0.14em]">
                  commissioni
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Benefit
              icon={Trophy}
              title="Primi 50"
              description="Ingresso beta prioritario per testare le tratte prima del lancio pubblico."
            />
            <Benefit
              icon={Users}
              title="Invita 3 amici"
              description="Badge Fondatore permanente sul profilo Andamus."
            />
            <Benefit
              icon={Crown}
              title="Invita 10 amici"
              description="Sei mesi di Premium gratis quando il piano sara attivo."
            />
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <div className="relative mb-6 hidden h-80 overflow-hidden rounded-[2rem] border border-white/70 bg-[#171614] p-4 shadow-[0_32px_90px_rgba(23,22,20,0.22)] sm:block">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_12%,rgba(255,179,177,0.18),transparent_34%),linear-gradient(160deg,rgba(23,22,20,0),rgba(20,56,43,0.42))]" />
              <div className="relative flex h-full items-end justify-between gap-6">
                <div className="pb-4 pl-2 text-[#f7f2e8]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffb3b1]">
                    Anteprima app
                  </p>
                  <p className="mt-3 max-w-[12rem] text-3xl font-black leading-none tracking-tight">
                    Cerca, prenota, parti.
                  </p>
                </div>
                <div className="relative h-[17.5rem] w-[9.8rem] shrink-0 overflow-hidden rounded-[1.55rem] border border-white/15 bg-black shadow-2xl">
                  <Image
                    src="/screenshot-mobile.png"
                    alt="Anteprima mobile di Andamus"
                    fill
                    sizes="160px"
                    className="object-cover object-top"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/75 bg-white/72 p-4 shadow-[0_28px_90px_rgba(45,40,31,0.17)] backdrop-blur-xl sm:p-6">
              {state === "success" ? (
                <div className="p-2">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#14382b] text-[#f7f2e8]">
                    <Check className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#767166]">
                    Iscrizione confermata
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-[#171614]">
                    Sei il numero{" "}
                    <span className="text-[#bb152c]">#{position}</span>.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#5f625a]">
                    Condividi il tuo link personale. Ogni invito valido migliora
                    la tua priorita nella lista.
                  </p>

                  <div className="mt-7 rounded-xl border border-[#171614]/10 bg-[#f7f2e8]/80 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#767166]">
                      Link personale
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm text-[#4e514a]">
                        {referralLink}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#171614] px-3 text-sm font-semibold text-white transition hover:bg-[#2a2925] active:scale-[0.98]"
                      >
                        {copied ? (
                          <Check className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        )}
                        {copied ? "Copiato" : "Copia"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                  noValidate
                >
                  <div className="mb-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#767166]">
                      Waiting list
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight">
                      Prenota il tuo posto.
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#63665e]">
                      Ti avvisiamo appena Andamus apre nella tua zona. Nessuna
                      newsletter inutile.
                    </p>
                  </div>

                  <div>
                    <FieldLabel htmlFor="email">Email *</FieldLabel>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="mario@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 w-full rounded-xl border border-[#171614]/10 bg-white px-4 text-sm text-[#171614] outline-none transition placeholder:text-[#9b978e] focus:border-[#14382b] focus:ring-4 focus:ring-[#14382b]/10"
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="phone">Telefono opzionale</FieldLabel>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+39 333 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 w-full rounded-xl border border-[#171614]/10 bg-white px-4 text-sm text-[#171614] outline-none transition placeholder:text-[#9b978e] focus:border-[#14382b] focus:ring-4 focus:ring-[#14382b]/10"
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="zona">La tua zona</FieldLabel>
                    <select
                      id="zona"
                      value={zona}
                      onChange={(e) => setZona(e.target.value)}
                      className="h-12 w-full rounded-xl border border-[#171614]/10 bg-white px-4 text-sm text-[#171614] outline-none transition focus:border-[#14382b] focus:ring-4 focus:ring-[#14382b]/10"
                    >
                      <option value="">Seleziona la tua zona</option>
                      <option value="Cagliari">Cagliari</option>
                      <option value="Sassari">Sassari</option>
                      <option value="Olbia">Olbia</option>
                      <option value="Nuoro">Nuoro</option>
                      <option value="Oristano">Oristano</option>
                      <option value="Altra">Altra</option>
                    </select>
                  </div>

                  {state === "error" && errorMsg && (
                    <p className="rounded-xl border border-[#bb152c]/20 bg-[#bb152c]/8 px-4 py-3 text-sm text-[#8f1225]">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="mt-2 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#bb152c] px-5 text-sm font-bold text-white shadow-[0_18px_38px_rgba(187,21,44,0.22)] transition hover:bg-[#9f1025] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {state === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Iscrizione in corso
                      </>
                    ) : (
                      <>
                        Unisciti alla lista
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <p className="flex items-start gap-2 text-xs leading-5 text-[#767166]">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#14382b]" />
                    Usiamo i dati solo per accesso anticipato, aggiornamenti di
                    lancio e priorita referral.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Skeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f1e8]">
      <Loader2 className="h-8 w-8 animate-spin text-[#bb152c]" aria-hidden="true" />
    </main>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ComingSoonContent />
    </Suspense>
  );
}
