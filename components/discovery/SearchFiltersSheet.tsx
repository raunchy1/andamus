"use client"

import * as React from "react"

import { useTranslations } from "next-intl"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from "@/components/ui/sheet"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { PremiumDatePicker } from "@/components/ui/premium-date-picker"

interface SearchFiltersSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  timeWindow: string
  setTimeWindow: (v: string) => void
  maxPrice: number
  setMaxPrice: (v: number) => void
  minSeats: number | null
  setMinSeats: (v: number | null) => void
  onlyVerified: boolean
  setOnlyVerified: (v: boolean) => void
  prefSmoking: boolean
  setPrefSmoking: (v: boolean) => void
  prefPets: boolean
  setPrefPets: (v: boolean) => void
  prefLuggage: boolean
  setPrefLuggage: (v: boolean) => void
  prefWomen: boolean
  setPrefWomen: (v: boolean) => void
  prefStudents?: boolean
  setPrefStudents?: (v: boolean) => void
  prefMusic?: string
  setPrefMusic?: (v: string) => void
  today: string
  activeFiltersCount: number
  clearFilters: () => void
}

function PillToggle({
  active,
  label,
  onChange,
}: {
  active: boolean
  label: string
  onChange: (v: boolean) => void
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-2 font-mono text-[11px] transition-colors ${
        active
          ? "border-accent bg-accent-dim text-fg"
          : "border-line text-muted hover:border-line-strong hover:text-fg"
      }`}
    >
      <input
        type="checkbox"
        checked={active}
        onChange={(e) => onChange(e.target.checked)}
        className="hidden"
      />
      {label}
    </label>
  )
}

function SearchFiltersSheet({
  open,
  onOpenChange,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  timeWindow,
  setTimeWindow,
  maxPrice,
  setMaxPrice,
  minSeats,
  setMinSeats,
  onlyVerified,
  setOnlyVerified,
  prefSmoking,
  setPrefSmoking,
  prefPets,
  setPrefPets,
  prefLuggage,
  setPrefLuggage,
  prefWomen,
  setPrefWomen,
  prefStudents,
  setPrefStudents,
  prefMusic,
  setPrefMusic,
  today,
  activeFiltersCount,
  clearFilters,
}: SearchFiltersSheetProps) {
  const t = useTranslations("search")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("advancedFilters")}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-5">
          <div>
            <p className="text-eyebrow mb-2">{t("dateRange")}</p>
            <div className="grid grid-cols-2 gap-3">
              <PremiumDatePicker
                date={dateFrom}
                onSelect={setDateFrom}
                min={today}
                placeholder={t("fromDateShort")}
                label=""
                className="w-full"
              />
              <PremiumDatePicker
                date={dateTo}
                onSelect={setDateTo}
                min={dateFrom || today}
                placeholder={t("toDateShort")}
                label=""
                className="w-full"
              />
            </div>
          </div>

          <Select
            label={t("timeWindowLabel")}
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value)}
          >
            <option value="">{t("any")}</option>
            <option value="morning">{t("timeMorning")}</option>
            <option value="afternoon">{t("timeAfternoon")}</option>
            <option value="evening">{t("timeEvening")}</option>
            <option value="night">{t("timeNight")}</option>
          </Select>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-eyebrow">{t("maxPriceLabel")}</p>
              <span className="font-mono text-xs text-fg">
                {maxPrice === 50 ? t("priceAny") : `€${maxPrice}`}
              </span>
            </div>
            <Slider
              value={[maxPrice]}
              onValueChange={(v) => setMaxPrice(Array.isArray(v) ? v[0] : v)}
              max={50}
              step={1}
              className="py-2"
            />
          </div>

          <Select
            label={t("minSeatsLabel")}
            value={minSeats?.toString() || ""}
            onChange={(e) => setMinSeats(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">{t("any")}</option>
            <option value="1">{t("seats", { count: 1 })}</option>
            <option value="2">{t("seats", { count: 2 })}</option>
            <option value="3">{t("seats", { count: 3 })}</option>
            <option value="4">{t("seats", { count: 4 })}</option>
          </Select>

          {setPrefMusic && (
            <Select
              label={t("musicLabel")}
              value={prefMusic || ""}
              onChange={(e) => setPrefMusic(e.target.value)}
            >
              <option value="">{t("any")}</option>
              <option value="quiet">{t("musicQuiet")}</option>
              <option value="music">{t("musicMusic")}</option>
              <option value="talk">{t("musicTalk")}</option>
            </Select>
          )}

          <div className="flex flex-wrap gap-2">
            <PillToggle active={onlyVerified} label={t("verifiedFilter")} onChange={setOnlyVerified} />
            <PillToggle active={prefSmoking} label={t("smokingFilter")} onChange={setPrefSmoking} />
            <PillToggle active={prefPets} label={t("petsFilter")} onChange={setPrefPets} />
            <PillToggle active={prefLuggage} label={t("luggageFilter")} onChange={setPrefLuggage} />
            <PillToggle active={prefWomen} label={t("womenFilter")} onChange={setPrefWomen} />
            {setPrefStudents && (
              <PillToggle
                active={!!prefStudents}
                label={t("studentsFilter")}
                onChange={setPrefStudents}
              />
            )}
          </div>

          {activeFiltersCount > 0 && (
            <Button type="button" variant="secondary" className="w-full" onClick={clearFilters}>
              {t("clearFilters")}
            </Button>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

export { SearchFiltersSheet }