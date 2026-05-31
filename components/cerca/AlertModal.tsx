"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import { LocationCombobox } from "@/components/LocationCombobox";

interface AlertModalProps {
  showAlertModal: boolean;
  setShowAlertModal: (v: boolean) => void;
  alertSaving: boolean;
  setAlertSaving: (v: boolean) => void;
  origin: string;
  destination: string;
  date: string;
  minSeats: number | null;
  maxPrice: number | null;
  supabase: ReturnType<typeof createClient>;
}

export function AlertModal({
  showAlertModal,
  setShowAlertModal,
  alertSaving,
  setAlertSaving,
  origin: initialOrigin,
  destination: initialDestination,
  date,
  minSeats,
  maxPrice,
  supabase,
}: AlertModalProps) {
  const t = useTranslations("search");
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState("");
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);

  if (!showAlertModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-low p-6">
        <h3 className="mb-1 text-xl font-extrabold tracking-tight text-on-surface">{t("saveAlert")}</h3>
        <p className="mb-4 text-sm text-on-surface-variant">{t("alertDescription")}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setAlertSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              toast.error(t("loginToSaveAlert"));
              setAlertSaving(false);
              return;
            }
            const form = e.target as HTMLFormElement;
            const fd = new FormData(form);
            const { error } = await supabase.from("ride_alerts").insert({
              user_id: user.id,
              from_city: origin,
              to_city: destination,
              start_date: (fd.get("alertStartDate") as string) || null,
              end_date: (fd.get("alertEndDate") as string) || null,
              min_seats: fd.get("alertMinSeats") ? parseInt(fd.get("alertMinSeats") as string) : null,
              max_price: fd.get("alertMaxPrice") ? parseInt(fd.get("alertMaxPrice") as string) : null,
            });
            setAlertSaving(false);
            if (error) {
              toast.error(t("alertSaveError"));
            } else {
              toast.success(t("alertSaved"));
              setShowAlertModal(false);
            }
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">{t("fromLabel")}</label>
              <LocationCombobox
                value={origin}
                onChange={setOrigin}
                placeholder={t("any")}
                buttonClassName="bg-surface-container-high border-none h-12"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">{t("toLabel")}</label>
              <LocationCombobox
                value={destination}
                onChange={setDestination}
                placeholder={t("any")}
                buttonClassName="bg-surface-container-high border-none h-12"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">{t("fromDateShort")}</label>
              <PremiumDatePicker
                date={startDate}
                onSelect={setStartDate}
                placeholder="Da"
                label=""
                className="w-full"
              />
              <input type="hidden" name="alertStartDate" value={startDate} />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">{t("toDateShort")}</label>
              <PremiumDatePicker
                date={endDate}
                onSelect={setEndDate}
                placeholder="A"
                label=""
                className="w-full"
              />
              <input type="hidden" name="alertEndDate" value={endDate} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">{t("minSeatsLabel")}</label>
              <input type="number" name="alertMinSeats" min="1" placeholder={t("any")} defaultValue={minSeats ?? ""} className="h-12 w-full rounded-xl border-none bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">{t("maxPriceLabel")}</label>
              <input type="number" name="alertMaxPrice" min="0" placeholder={t("any")} defaultValue={maxPrice ?? ""} className="h-12 w-full rounded-xl border-none bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button"
              onClick={() => setShowAlertModal(false)}
              className="flex-1 rounded-xl bg-surface-container-high py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              {t("cancel")}
            </button>
            <button type="submit"
              disabled={alertSaving}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {alertSaving ? t("saving") : t("saveAlert")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
