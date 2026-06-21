"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Calculator,
  ArrowDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { LocationCombobox } from "@/components/LocationCombobox";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import { CarInfoSection } from "@/components/offri/CarInfoSection";
import { PreferencesSection } from "@/components/offri/PreferencesSection";
import { StopsSection } from "@/components/offri/StopsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
};

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

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-bad">{message}</p>;
}

function OfferTopBar() {
  const router = useRouter();
  const t = useTranslations("offer");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 md:max-w-5xl md:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] text-fg transition-colors hover:bg-surface-2"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} />
        </button>
        <div>
          <p className="text-eyebrow">{t("newTrip")}</p>
          <h1 className="heading-editorial text-xl text-fg">{t("createRide")}</h1>
        </div>
      </div>
    </header>
  );
}

function RouteGroup({
  formData,
  errors,
  handleChange,
}: Pick<OfferViewProps, "formData" | "errors" | "handleChange">) {
  const t = useTranslations("offer");

  return (
    <motion.section {...fadeUp} className="space-y-4">
      <p className="text-eyebrow">{t("form.from")} / {t("form.to")}</p>

      <div className="space-y-3">
        <div>
          <label className="mb-2 block text-eyebrow lowercase">{t("form.from")}</label>
          <LocationCombobox
            value={formData.origin}
            onChange={(val) => handleChange("origin", val)}
            placeholder={t("departurePlaceholder")}
            buttonClassName={cn(
              (errors.origin || errors.sameCity) && "border-bad"
            )}
          />
          <FormError message={errors.origin} />
        </div>

        <div className="flex justify-center py-1">
          <ArrowDown className="size-4 text-dim" strokeWidth={1.5} />
        </div>

        <div>
          <label className="mb-2 block text-eyebrow lowercase">{t("form.to")}</label>
          <LocationCombobox
            value={formData.destination}
            onChange={(val) => handleChange("destination", val)}
            placeholder={t("arrivalPlaceholder")}
            buttonClassName={cn(
              (errors.destination || errors.sameCity) && "border-bad"
            )}
          />
          <FormError message={errors.destination} />
          <FormError message={errors.sameCity} />
        </div>
      </div>

      <Separator />
    </motion.section>
  );
}

function WhenGroup({
  formData,
  errors,
  today,
  handleChange,
}: Pick<OfferViewProps, "formData" | "errors" | "today" | "handleChange">) {
  const t = useTranslations("offer");

  return (
    <motion.section
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.04 }}
      className="space-y-4"
    >
      <p className="text-eyebrow">{t("form.date")} / {t("form.time")}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <PremiumDatePicker
            date={formData.date}
            onSelect={(d) => handleChange("date", d)}
            min={today}
            label={t("date")}
            className="w-full"
          />
          <FormError message={errors.date} />
        </div>
        <div>
          <label className="mb-2 block text-eyebrow lowercase">{t("time")}</label>
          <Input
            type="time"
            value={formData.time}
            onChange={(e) => handleChange("time", e.target.value)}
            className="font-mono tabular-nums"
          />
          <FormError message={errors.time} />
        </div>
      </div>

      <Separator />
    </motion.section>
  );
}

function DetailsGroup({
  formData,
  errors,
  suggestedPrice,
  distanceKm,
  calculatingPrice,
  handleChange,
}: Pick<
  OfferViewProps,
  | "formData"
  | "errors"
  | "suggestedPrice"
  | "distanceKm"
  | "calculatingPrice"
  | "handleChange"
>) {
  const t = useTranslations("offer");

  return (
    <motion.section
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.08 }}
      className="space-y-4"
    >
      <p className="text-eyebrow">{t("form.seats")} / {t("form.price")}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-2 block text-eyebrow lowercase">{t("availableSeats")}</label>
          <Input
            type="number"
            min={1}
            max={8}
            placeholder={t("seatsPlaceholder")}
            value={formData.seats}
            onChange={(e) => handleChange("seats", e.target.value)}
            className="font-mono tabular-nums"
          />
          <FormError message={errors.seats} />
        </div>
        <div>
          <label className="mb-2 block text-eyebrow lowercase">{t("travelMode")}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleChange("isFree", true)}
              className={cn(
                "flex-1 rounded-[var(--radius-sm)] border px-3 py-3 font-mono text-xs transition-colors",
                formData.isFree
                  ? "border-accent text-accent"
                  : "border-line text-muted hover:text-fg"
              )}
            >
              {t("free")}
            </button>
            <button
              type="button"
              onClick={() => handleChange("isFree", false)}
              className={cn(
                "flex-1 rounded-[var(--radius-sm)] border px-3 py-3 font-mono text-xs transition-colors",
                !formData.isFree
                  ? "border-accent text-accent"
                  : "border-line text-muted hover:text-fg"
              )}
            >
              {t("paid")}
            </button>
          </div>
        </div>
      </div>

      {!formData.isFree && (
        <div>
          <label className="mb-2 block text-eyebrow lowercase">{t("priceEuro")}</label>
          <Input
            type="number"
            min={1}
            placeholder={t("pricePlaceholder")}
            value={formData.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className="font-mono tabular-nums"
          />
          {calculatingPrice ? (
            <p className="mt-2 flex items-center gap-2 font-mono text-xs text-dim">
              <Calculator className="size-3.5 animate-pulse" strokeWidth={1.5} />
              {t("calculatingPrice")}
            </p>
          ) : distanceKm !== null && suggestedPrice !== null ? (
            <p className="mt-2 font-mono text-xs text-dim">
              {t("distanceLabel")} {distanceKm} km · {t("suggestedPrice")} €{suggestedPrice}
            </p>
          ) : null}
          <FormError message={errors.price} />
        </div>
      )}

      <div>
        <label className="mb-2 block text-eyebrow lowercase">{t("form.meetingPoint")}</label>
        <Input
          type="text"
          placeholder={t("meetingPointPlaceholder")}
          value={formData.meetingPoint}
          onChange={(e) => handleChange("meetingPoint", e.target.value)}
        />
      </div>

      <Separator />
    </motion.section>
  );
}

function NotesGroup({
  formData,
  handleChange,
}: Pick<OfferViewProps, "formData" | "handleChange">) {
  const t = useTranslations("offer");

  return (
    <motion.section
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.12 }}
      className="space-y-3"
    >
      <label className="block text-eyebrow lowercase">{t("form.notes")}</label>
      <textarea
        rows={4}
        placeholder={t("notesPlaceholder")}
        value={formData.notes}
        onChange={(e) => handleChange("notes", e.target.value)}
        className="w-full resize-none rounded-[var(--radius-sm)] border border-line bg-surface-2 px-4 py-3 text-base text-fg placeholder:text-dim focus-visible:border-accent focus-visible:outline-none"
      />
      <p className="text-right font-mono text-xs text-dim">{formData.notes.length}</p>
      <Separator />
    </motion.section>
  );
}

function RecurringGroup({
  formData,
  errors,
  handleChange,
}: Pick<OfferViewProps, "formData" | "errors" | "handleChange">) {
  const t = useTranslations("offer");

  return (
    <motion.section
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.2 }}
      className="space-y-4"
    >
      <p className="text-eyebrow">{t("repeat")}</p>

      <button
        type="button"
        onClick={() => handleChange("isRecurring", !formData.isRecurring)}
        className={cn(
          "w-full rounded-[var(--radius-sm)] border px-4 py-3 text-left text-sm font-medium transition-colors",
          formData.isRecurring
            ? "border-accent text-accent"
            : "border-line text-fg hover:border-line-strong"
        )}
      >
        {t("repeatWeekly")}
      </button>

      {formData.isRecurring && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {[
              { day: 1, label: "Lun" },
              { day: 2, label: "Mar" },
              { day: 3, label: "Mer" },
              { day: 4, label: "Gio" },
              { day: 5, label: "Ven" },
              { day: 6, label: "Sab" },
              { day: 0, label: "Dom" },
            ].map(({ day, label }) => {
              const selected = formData.recurrenceDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const next = selected
                      ? formData.recurrenceDays.filter((d) => d !== day)
                      : [...formData.recurrenceDays, day];
                    handleChange("recurrenceDays", next);
                  }}
                  className={cn(
                    "h-10 min-w-12 rounded-[var(--radius-sm)] border px-3 font-mono text-xs transition-colors",
                    selected
                      ? "border-accent text-accent"
                      : "border-line text-muted hover:text-fg"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <FormError message={errors.recurrenceDays} />
          <p className="text-xs text-dim">{t("recurringNote")}</p>
        </div>
      )}

      <Separator />
    </motion.section>
  );
}

function SubmitButton({
  formData,
  isSubmitting,
}: Pick<OfferViewProps, "formData" | "isSubmitting">) {
  const t = useTranslations("offer");

  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.24 }}
      className="pt-2 pb-8"
    >
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? formData.isRecurring
            ? t("creating")
            : t("publishing")
          : formData.isRecurring
            ? t("createRecurringRide")
            : t("publishRide")}
      </Button>
    </motion.div>
  );
}

export function OfferMobile(props: OfferViewProps) {
  const t = useTranslations("offer");

  return (
    <div className="min-h-screen bg-bg pb-24">
      <OfferTopBar />

      <main className="mx-auto max-w-2xl space-y-8 px-4 py-6">
        {props.submitError && (
          <p className="text-sm text-bad">{props.submitError}</p>
        )}

        <form onSubmit={props.handleSubmit} className="space-y-8">
          <RouteGroup
            formData={props.formData}
            errors={props.errors}
            handleChange={props.handleChange}
          />

          <StopsSection
            stops={props.formData.stops}
            onChange={(next) => props.handleChange("stops", next)}
            errors={props.errors}
          />

          <WhenGroup
            formData={props.formData}
            errors={props.errors}
            today={props.today}
            handleChange={props.handleChange}
          />

          <DetailsGroup
            formData={props.formData}
            errors={props.errors}
            suggestedPrice={props.suggestedPrice}
            distanceKm={props.distanceKm}
            calculatingPrice={props.calculatingPrice}
            handleChange={props.handleChange}
          />

          <PreferencesSection
            formData={props.formData}
            onChange={props.handleChange}
            errors={props.errors}
          />

          <CarInfoSection
            carModel={props.formData.carModel}
            carColor={props.formData.carColor}
            carYear={props.formData.carYear}
            carPlate={props.formData.carPlate}
            useSavedCar={props.formData.useSavedCar}
            savedCarInfo={props.savedCarInfo}
            onChange={props.handleChange}
          />

          <NotesGroup formData={props.formData} handleChange={props.handleChange} />

          <RecurringGroup
            formData={props.formData}
            errors={props.errors}
            handleChange={props.handleChange}
          />

          <SubmitButton formData={props.formData} isSubmitting={props.isSubmitting} />
        </form>

        <p className="text-center text-xs text-dim">{t("freeRideBonus")}</p>
      </main>
    </div>
  );
}

export function OfferDesktop(props: OfferViewProps) {
  const t = useTranslations("offer");

  return (
    <div className="min-h-screen bg-bg">
      <OfferTopBar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {props.submitError && (
          <p className="mb-6 text-sm text-bad">{props.submitError}</p>
        )}

        <form onSubmit={props.handleSubmit}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="space-y-8">
              <RouteGroup
                formData={props.formData}
                errors={props.errors}
                handleChange={props.handleChange}
              />
              <StopsSection
                stops={props.formData.stops}
                onChange={(next) => props.handleChange("stops", next)}
                errors={props.errors}
              />
              <WhenGroup
                formData={props.formData}
                errors={props.errors}
                today={props.today}
                handleChange={props.handleChange}
              />
              <DetailsGroup
                formData={props.formData}
                errors={props.errors}
                suggestedPrice={props.suggestedPrice}
                distanceKm={props.distanceKm}
                calculatingPrice={props.calculatingPrice}
                handleChange={props.handleChange}
              />
              <NotesGroup formData={props.formData} handleChange={props.handleChange} />
            </div>

            <div className="space-y-8">
              <PreferencesSection
                formData={props.formData}
                onChange={props.handleChange}
                errors={props.errors}
              />
              <CarInfoSection
                carModel={props.formData.carModel}
                carColor={props.formData.carColor}
                carYear={props.formData.carYear}
                carPlate={props.formData.carPlate}
                useSavedCar={props.formData.useSavedCar}
                savedCarInfo={props.savedCarInfo}
                onChange={props.handleChange}
              />
              <RecurringGroup
                formData={props.formData}
                errors={props.errors}
                handleChange={props.handleChange}
              />
              <SubmitButton
                formData={props.formData}
                isSubmitting={props.isSubmitting}
              />
              <p className="text-xs text-dim">{t("freeRideBonus")}</p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}