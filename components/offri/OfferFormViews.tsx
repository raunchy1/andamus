"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpDown, ChevronLeft, Loader2, MapPin, Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { LocationCombobox } from "@/components/LocationCombobox";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import { CarInfoSection } from "@/components/offri/CarInfoSection";
import { PreferencesSection } from "@/components/offri/PreferencesSection";
import { StopsSection } from "@/components/offri/StopsSection";
import { ToggleRow } from "@/components/offri/ToggleRow";

const TOTAL_STEPS = 3;
const MAX_SEATS = 8;

export interface OfferViewProps {
  user: SupabaseUser;
  formData: {
    origin: string;
    destination: string;
    date: string;
    time: string;
    seats: string;
    isFree: boolean;
    price: string;
    meetingPoint: string;
    notes: string;
    smokingAllowed: boolean;
    petsAllowed: boolean;
    largeLuggage: boolean;
    musicPreference: string;
    womenOnly: boolean;
    studentsOnly: boolean;
    isRecurring: boolean;
    recurrenceDays: number[];
    stops: string[];
    useSavedCar: boolean;
    carModel: string;
    carColor: string;
    carPlate: string;
    carYear: string;
  };
  errors: Record<string, string>;
  submitError: string;
  isSubmitting: boolean;
  suggestedPrice: number | null;
  distanceKm: number | null;
  calculatingPrice: boolean;
  today: string;
  handleChange: (field: string, value: string | boolean | number[] | string[]) => void;
  handleSubmit: (e: React.FormEvent) => void;
  savedCarInfo: {
    car_model?: string | null;
    car_color?: string | null;
    car_plate?: string | null;
    car_year?: number | null;
  } | null;
}

type StepProps = OfferViewProps & { stepErrors: Record<string, string> };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-bad">{message}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[15px] font-semibold text-ink">{children}</h2>;
}

/* ── Step 1 — the route ──────────────────────────────────────────── */

function RouteStep({ formData, errors, stepErrors, handleChange, distanceKm }: StepProps) {
  const t = useTranslations("offer");
  const originError = stepErrors.origin || errors.origin;
  const destinationError = stepErrors.destination || errors.destination;
  const sameCityError = stepErrors.sameCity || errors.sameCity;

  const swap = () => {
    const { origin, destination } = formData;
    handleChange("origin", destination);
    handleChange("destination", origin);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-ink">
          {t("step1.title")}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">{t("step1.subtitle")}</p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-line bg-surface px-4">
          <div className="flex items-center gap-3.5 py-1">
            <span className="flex w-3 justify-center">
              <span className="size-[9px] rounded-full border-2 border-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <LocationCombobox
                value={formData.origin}
                onChange={(val) => handleChange("origin", val)}
                label={t("step1.from")}
                placeholder={t("step1.chooseCity")}
                showIcon={false}
                buttonClassName={cn(
                  "h-auto border-0 bg-transparent px-0 py-3 hover:border-0",
                  (originError || sameCityError) && "text-bad"
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <span className="flex w-3 justify-center">
              <span className="h-[18px] w-px bg-line" />
            </span>
            <span className="h-px flex-1 bg-line-soft" />
          </div>

          <div className="flex items-center gap-3.5 py-1">
            <span className="flex w-3 justify-center">
              <span className="size-[9px] rounded-full bg-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <LocationCombobox
                value={formData.destination}
                onChange={(val) => handleChange("destination", val)}
                label={t("step1.to")}
                placeholder={t("step1.chooseCity")}
                showIcon={false}
                buttonClassName={cn(
                  "h-auto border-0 bg-transparent px-0 py-3 hover:border-0",
                  (destinationError || sameCityError) && "text-bad"
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={swap}
            disabled={!formData.origin && !formData.destination}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent disabled:opacity-40"
          >
            <ArrowUpDown className="size-[15px]" strokeWidth={1.7} />
            {t("step1.swap")}
          </button>
          {distanceKm !== null && (
            <span className="font-mono text-[11px] text-muted">
              {t("step1.distance", { km: distanceKm })}
            </span>
          )}
        </div>

        <FieldError message={originError} />
        <FieldError message={destinationError} />
        <FieldError message={sameCityError} />
      </div>

      <StopsSection
        stops={formData.stops}
        onChange={(next) => handleChange("stops", next)}
        errors={errors}
      />
    </div>
  );
}

/* ── Step 2 — when, seats, contribution ──────────────────────────── */

function SeatsStepper({
  seats,
  onChange,
}: {
  seats: string;
  onChange: (next: string) => void;
}) {
  const value = parseInt(seats, 10);
  const current = Number.isNaN(value) ? 0 : value;

  const step = (delta: number) => {
    const next = Math.min(MAX_SEATS, Math.max(1, current + delta));
    onChange(String(next));
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="-"
        onClick={() => step(-1)}
        disabled={current <= 1}
        className="flex size-[38px] items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong disabled:opacity-35"
      >
        <Minus className="size-4" strokeWidth={1.8} />
      </button>
      <span className="min-w-[18px] text-center text-[19px] font-bold tabular-nums text-ink">
        {current || "—"}
      </span>
      <button
        type="button"
        aria-label="+"
        onClick={() => step(1)}
        disabled={current >= MAX_SEATS}
        className="flex size-[38px] items-center justify-center rounded-full border border-accent bg-accent-dim text-accent transition-opacity disabled:opacity-35"
      >
        <Plus className="size-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}

function WhenStep({
  formData,
  errors,
  stepErrors,
  today,
  handleChange,
  suggestedPrice,
  distanceKm,
  calculatingPrice,
}: StepProps) {
  const t = useTranslations("offer");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-ink">
          {t("step2.title")}
        </h1>
      </header>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1.4fr_1fr] gap-2.5">
          <div>
            <PremiumDatePicker
              date={formData.date}
              onSelect={(d) => handleChange("date", d)}
              min={today}
              label={t("step2.date")}
              placeholder={t("step2.chooseDate")}
              className="w-full"
              triggerClassName="h-[62px] rounded-xl border-line bg-surface"
            />
          </div>
          <label className="flex h-[62px] flex-col justify-center gap-0.5 rounded-xl border border-line bg-surface px-3.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
              {t("step2.time")}
            </span>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => handleChange("time", e.target.value)}
              className="w-full bg-transparent text-[17px] font-semibold tabular-nums text-ink outline-none"
            />
          </label>
        </div>
        <FieldError message={stepErrors.date || errors.date} />
        <FieldError message={stepErrors.time || errors.time} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-ink">{t("step2.seats")}</span>
            <span className="text-xs text-faint">{t("step2.seatsHint")}</span>
          </span>
          <SeatsStepper seats={formData.seats} onChange={(next) => handleChange("seats", next)} />
        </div>
        <FieldError message={stepErrors.seats || errors.seats} />
      </div>

      <section className="flex flex-col gap-2.5">
        <SectionTitle>{t("step2.contribution")}</SectionTitle>

        <div className="grid grid-cols-2 gap-0.5 rounded-xl bg-surface-2 p-[3px]">
          {[
            { free: true, label: t("step2.free") },
            { free: false, label: t("step2.paid") },
          ].map((option) => {
            const active = formData.isFree === option.free;
            return (
              <button
                key={String(option.free)}
                type="button"
                onClick={() => handleChange("isFree", option.free)}
                className={cn(
                  "flex h-10 items-center justify-center rounded-[9px] text-sm transition-colors",
                  active
                    ? "bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(22,33,28,0.08)]"
                    : "font-medium text-muted"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {formData.isFree ? (
          <p className="text-xs leading-relaxed text-faint">{t("step2.freeNote")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0"
                className="w-[52px] bg-transparent text-2xl font-bold tabular-nums tracking-[-0.02em] text-ink outline-none placeholder:text-faint"
              />
              <span className="-ml-1 flex-1 text-[17px] font-medium text-muted">
                {t("step2.perPassenger")}
              </span>
              {calculatingPrice ? (
                <Loader2 className="size-4 animate-spin text-faint" strokeWidth={1.6} />
              ) : suggestedPrice !== null ? (
                <button
                  type="button"
                  onClick={() => handleChange("price", String(suggestedPrice))}
                  className="flex-shrink-0 rounded-lg bg-accent-dim px-2.5 py-1.5 font-mono text-[11px] text-accent"
                >
                  {t("step2.suggested", { price: suggestedPrice })}
                </button>
              ) : null}
            </div>
            <FieldError message={stepErrors.price || errors.price} />
            <p className="text-xs leading-relaxed text-faint">
              {distanceKm !== null
                ? t("step2.priceNote", { km: distanceKm })
                : t("step2.priceNoteShort")}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Step 3 — everything optional ────────────────────────────────── */

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

function DetailsStep({ formData, errors, handleChange, savedCarInfo }: StepProps) {
  const t = useTranslations("offer");
  const locale = useLocale();

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2026-05-25 is a Monday; index 0..6 maps to Mon..Sun.
    return WEEKDAYS.map((_, i) => {
      const label = formatter.format(new Date(2026, 4, 25 + i)).replace(/\.$/, "");
      return label.charAt(0).toUpperCase() + label.slice(1);
    });
  }, [locale]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-ink">
          {t("step3.title")}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">{t("step3.subtitle")}</p>
      </header>

      <section className="flex flex-col gap-2">
        <SectionTitle>{t("step3.meetingPoint")}</SectionTitle>
        <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 focus-within:border-accent">
          <MapPin className="size-[18px] flex-shrink-0 text-faint" strokeWidth={1.6} />
          <input
            type="text"
            value={formData.meetingPoint}
            onChange={(e) => handleChange("meetingPoint", e.target.value)}
            placeholder={t("step3.meetingPointPlaceholder")}
            className="h-[52px] w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
        </div>
      </section>

      <PreferencesSection formData={formData} onChange={handleChange} errors={errors} />

      <CarInfoSection
        carModel={formData.carModel}
        carColor={formData.carColor}
        carYear={formData.carYear}
        carPlate={formData.carPlate}
        useSavedCar={formData.useSavedCar}
        savedCarInfo={savedCarInfo}
        onChange={handleChange}
      />

      <section className="flex flex-col gap-2">
        <SectionTitle>{t("step3.notes")}</SectionTitle>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder={t("step3.notesPlaceholder")}
          className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3.5 text-[15px] leading-relaxed text-ink transition-colors placeholder:text-faint focus-visible:border-accent focus-visible:outline-none"
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="rounded-2xl border border-line bg-surface px-4">
          <ToggleRow
            label={t("step3.recurring")}
            hint={t("step3.recurringHint")}
            checked={formData.isRecurring}
            onChange={(next) => handleChange("isRecurring", next)}
            last
          />
        </div>

        {formData.isRecurring && (
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs font-medium text-muted">{t("step3.recurringDays")}</span>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day, i) => {
                const selected = formData.recurrenceDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      handleChange(
                        "recurrenceDays",
                        selected
                          ? formData.recurrenceDays.filter((d) => d !== day)
                          : [...formData.recurrenceDays, day]
                      )
                    }
                    className={cn(
                      "h-10 min-w-[46px] rounded-xl border px-2 text-[13px] font-medium transition-colors",
                      selected
                        ? "border-accent bg-accent-dim text-accent"
                        : "border-line bg-surface text-muted hover:border-line-strong"
                    )}
                  >
                    {weekdayLabels[i]}
                  </button>
                );
              })}
            </div>
            <FieldError message={errors.recurrenceDays} />
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Shell ───────────────────────────────────────────────────────── */

function useStepValidation(props: OfferViewProps) {
  const t = useTranslations("offer");

  return (step: number): Record<string, string> => {
    const { formData, today } = props;
    const next: Record<string, string> = {};

    if (step === 1) {
      if (!formData.origin) next.origin = t("errorOriginRequired");
      if (!formData.destination) next.destination = t("errorDestinationRequired");
      if (formData.origin && formData.destination && formData.origin === formData.destination) {
        next.sameCity = t("errors.sameCity");
      }
    }

    if (step === 2) {
      if (!formData.date) next.date = t("errorDateRequired");
      else if (formData.date < today) next.date = t("errorDatePast");
      if (!formData.time) next.time = t("errorTimeRequired");
      if (!formData.seats) next.seats = t("errorSeatsRequired");
      if (!formData.isFree && !formData.price) next.price = t("errorPriceRequired");
    }

    return next;
  };
}

function StepHeader({
  step,
  onBack,
  desktop,
}: {
  step: number;
  onBack: () => void;
  desktop?: boolean;
}) {
  const t = useTranslations("offer");

  return (
    <div className={cn("flex flex-col gap-4", desktop ? "pb-6" : "px-5 pb-5 pt-5")}>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("back")}
          className="flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-line-strong"
        >
          <ChevronLeft className="size-[18px]" strokeWidth={1.7} />
        </button>
        <span className="font-mono text-[11px] tracking-[0.1em] text-muted">
          {t("stepOf", { current: step, total: TOTAL_STEPS })}
        </span>
      </div>

      <div className="flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-[3px] flex-1 rounded-full transition-colors",
              i < step ? "bg-accent" : "bg-line"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ActionBar({
  step,
  isSubmitting,
  formData,
  onBack,
  onContinue,
  fixed,
}: {
  step: number;
  isSubmitting: boolean;
  formData: OfferViewProps["formData"];
  onBack: () => void;
  onContinue: () => void;
  fixed: boolean;
}) {
  const t = useTranslations("offer");
  const locale = useLocale();
  const isLast = step === TOTAL_STEPS;

  const submitLabel = isSubmitting
    ? formData.isRecurring
      ? t("creating")
      : t("publishing")
    : formData.isRecurring
      ? t("createRecurring")
      : t("publish");

  const recap = useMemo(() => {
    if (!isLast) return null;
    const parts: string[] = [];
    if (formData.origin && formData.destination) {
      parts.push(`${formData.origin} → ${formData.destination}`);
    }
    if (formData.date) {
      const [y, m, d] = formData.date.split("-").map(Number);
      const label = new Date(y, m - 1, d).toLocaleDateString(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      parts.push(formData.time ? `${label}, ${formData.time}` : label);
    }
    return parts.join(" · ");
  }, [isLast, formData.origin, formData.destination, formData.date, formData.time, locale]);

  const price = formData.isFree
    ? t("summaryFree")
    : formData.price
      ? `${formData.price} €`
      : null;

  const seatsLabel = formData.seats ? t("summarySeats", { seats: formData.seats }) : null;
  const trailing = [seatsLabel, price].filter(Boolean).join(" · ");

  return (
    <div
      className={cn(
        "border-t border-line bg-surface",
        fixed
          ? "fixed inset-x-0 bottom-0 z-40 px-5 pb-[calc(18px+env(safe-area-inset-bottom,0px))] pt-3.5"
          : "rounded-b-2xl px-6 pb-6 pt-4"
      )}
    >
      {isLast && (recap || trailing) && (
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <span className="truncate text-sm text-muted">{recap}</span>
          {trailing && (
            <span className="flex-shrink-0 text-sm font-semibold text-ink">{trailing}</span>
          )}
        </div>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-[52px] items-center justify-center rounded-xl border border-line px-5 text-base font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          {step === 1 ? t("cancel") : t("back")}
        </button>
        <button
          type={isLast ? "submit" : "button"}
          onClick={isLast ? undefined : onContinue}
          disabled={isSubmitting}
          className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-base font-semibold text-accent-fg transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {isLast ? (
            <>
              {isSubmitting && <Loader2 className="size-4 animate-spin" strokeWidth={2} />}
              {submitLabel}
            </>
          ) : (
            <>
              {t("continue")}
              <ArrowRight className="size-[17px]" strokeWidth={1.8} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function OfferWizard({ props, layout }: { props: OfferViewProps; layout: "mobile" | "desktop" }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);
  const validateStep = useStepValidation(props);

  const goBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setDirection(-1);
    setStepErrors({});
    setStep((s) => s - 1);
  };

  const goNext = () => {
    const found = validateStep(step);
    setStepErrors(found);
    if (Object.keys(found).length > 0) return;
    setDirection(1);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = { ...validateStep(1), ...validateStep(2) };
    if (Object.keys(found).length > 0) {
      setStepErrors(found);
      setStep(Object.keys(validateStep(1)).length > 0 ? 1 : 2);
      return;
    }
    props.handleSubmit(e);
  };

  // The page clears its own `errors` entry as soon as a field changes, but
  // stepErrors was only reset by goBack() — so once a step failed validation,
  // "Seleziona la città di partenza" stayed on screen in red even after the
  // driver had picked a city. Clear the field's error as it is corrected.
  const handleChange: OfferViewProps["handleChange"] = (field, value) => {
    setStepErrors((prev) => {
      if (!(field in prev) && !("sameCity" in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      if (field === "origin" || field === "destination") delete next.sameCity;
      return next;
    });
    props.handleChange(field, value);
  };

  const stepProps: StepProps = { ...props, handleChange, stepErrors };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -28 : 28, opacity: 0 }),
  };

  const body = (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {step === 1 && <RouteStep {...stepProps} />}
        {step === 2 && <WhenStep {...stepProps} />}
        {step === 3 && <DetailsStep {...stepProps} />}
      </motion.div>
    </AnimatePresence>
  );

  if (layout === "desktop") {
    return (
      <div className="min-h-screen bg-bg py-12">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-[560px] flex-col rounded-2xl border border-line bg-bg"
        >
          <div className="px-6 pt-6">
            <StepHeader step={step} onBack={goBack} desktop />
            {props.submitError && (
              <p className="mb-4 text-sm text-bad">{props.submitError}</p>
            )}
            <div className="pb-6">{body}</div>
          </div>
          <ActionBar
            step={step}
            isSubmitting={props.isSubmitting}
            formData={props.formData}
            onBack={goBack}
            onContinue={goNext}
            fixed={false}
          />
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-bg pb-[132px]">
      <StepHeader step={step} onBack={goBack} />
      <main className="px-5">
        {props.submitError && <p className="mb-4 text-sm text-bad">{props.submitError}</p>}
        {body}
      </main>
      <ActionBar
        step={step}
        isSubmitting={props.isSubmitting}
        formData={props.formData}
        onBack={goBack}
        onContinue={goNext}
        fixed
      />
    </form>
  );
}

export function OfferMobile(props: OfferViewProps) {
  return <OfferWizard props={props} layout="mobile" />;
}

export function OfferDesktop(props: OfferViewProps) {
  return <OfferWizard props={props} layout="desktop" />;
}
