"use client"

import { RefreshCw, Bell, SlidersHorizontal, Search } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

import { LocationCombobox } from "@/components/LocationCombobox"
import { PremiumDatePicker } from "@/components/ui/premium-date-picker"
import { Button } from "@/components/ui/button"
import { RideCardSkeleton } from "@/components/cerca/RideCardSkeleton"
import { AlertModal } from "@/components/cerca/AlertModal"
import { EmptyStateSearch } from "@/components/EmptyState"
import { DiscoveryRideCard } from "@/components/discovery/DiscoveryRideCard"
import { SearchFiltersSheet } from "@/components/discovery/SearchFiltersSheet"
import { ActiveFilterPills, buildSearchFilterPills } from "@/components/discovery/ActiveFilterPills"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchViewProps = any

function getFilterOptions(t: (key: string) => string) {
  return [
    { id: "all", label: t("filterAll") },
    { id: "free", label: t("filterFree") },
    { id: "verified", label: t("filterVerified") },
    { id: "today", label: t("filterToday") },
  ]
}

export function SearchDesktopView(props: SearchViewProps) {
  const t = useTranslations("search")
  const locale = useLocale()
  const {
    activeFilter,
    setActiveFilter,
    origin,
    setOrigin,
    destination,
    setDestination,
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
    showFilters,
    setShowFilters,
    isRefreshing,
    showAlertModal,
    setShowAlertModal,
    alertSaving,
    setAlertSaving,
    rides,
    loading,
    hasError,
    today,
    handleRefresh,
    handleSearch,
    clearFilters,
    formatDate,
    activeFiltersCount,
    supabase,
    setShowCreateModal,
  } = props

  const filterPills = buildSearchFilterPills(props, t)

  return (
    <div className="text-fg max-w-5xl mx-auto w-full">
      <header className="mb-8 pt-2">
        <p className="text-eyebrow">// {t("resultsCount", { count: rides.length })}</p>
        <h1 className="mt-3 font-hero heading-editorial text-fg">cerca</h1>
      </header>

      <form
        onSubmit={handleSearch}
        className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-3 border border-line rounded-[var(--radius)] bg-surface p-5 items-end"
      >
        <div className="space-y-1">
          <label className="text-eyebrow lowercase">{t("fromLabel")}</label>
          <LocationCombobox
            value={origin}
            onChange={setOrigin}
            placeholder={t("departureLabel")}
            buttonClassName="w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="text-eyebrow lowercase">{t("toLabel")}</label>
          <LocationCombobox
            value={destination}
            onChange={setDestination}
            placeholder={t("destinationLabel")}
            buttonClassName="w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="text-eyebrow lowercase">{t("dateLabel")}</label>
          <PremiumDatePicker
            date={dateFrom}
            onSelect={setDateFrom}
            min={today}
            placeholder={t("fromDateShort")}
            label=""
            className="w-full"
          />
        </div>
        <Button type="submit" variant="primary" className="w-full">
          <Search size={20} strokeWidth={1.5} />
          {t("searchButton")}
        </Button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {getFilterOptions(t).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveFilter(activeFilter === option.id ? "all" : option.id)}
            className={`rounded-full border px-4 py-2 font-mono text-[11px] transition-colors ${
              activeFilter === option.id
                ? "border-accent bg-accent-dim text-fg"
                : "border-line text-muted hover:border-line-strong"
            }`}
          >
            {option.label}
          </button>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowAlertModal(true)}>
          <Bell size={16} strokeWidth={1.5} />
          {t("alertButton")}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowFilters(true)}>
          <SlidersHorizontal size={16} strokeWidth={1.5} />
          filtri
          {activeFiltersCount > 0 && (
            <span className="ml-1 font-mono text-[10px] text-accent">{activeFiltersCount}</span>
          )}
        </Button>
      </div>

      <ActiveFilterPills pills={filterPills} />

      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-sm text-muted">
          {loading ? t("loading") : t("resultsCount", { count: rides.length })}
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full text-muted hover:text-fg hover:bg-surface-2 transition-colors"
          aria-label={t("ariaRefresh")}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading && (
          <>
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
          </>
        )}

        {!loading && hasError && (
          <div className="col-span-full border border-line rounded-[var(--radius)] bg-surface py-12 text-center">
            <p className="text-muted mb-4">{t("searchError")}</p>
            <Button type="button" variant="primary" onClick={handleRefresh}>
              {t("retry")}
            </Button>
          </div>
        )}

        {!loading && !hasError && rides.length === 0 && (
          <div className="col-span-full">
            <EmptyStateSearch
              hasFilters={activeFiltersCount > 0}
              onClearFilters={clearFilters}
              onCreateAlert={() => setShowAlertModal(true)}
              onCreateRequest={() => setShowCreateModal?.(true)}
              fromCity={origin}
              toCity={destination}
              searchDate={dateFrom}
              onSelectSuggestion={(sFrom, sTo, sDate) => {
                if (sFrom !== undefined) setOrigin(sFrom)
                if (sTo !== undefined) setDestination(sTo)
                if (sDate !== undefined) setDateFrom(sDate || "")
              }}
            />
          </div>
        )}

        {!loading &&
          !hasError &&
          rides.map((ride: SearchViewProps["rides"][number], idx: number) => (
            <DiscoveryRideCard
              key={ride.id}
              ride={ride}
              locale={locale}
              index={idx}
              freeLabel={t("filterFree")}
              seatsFormatter={(count) => t("seats", { count })}
              formatDate={formatDate}
              today={today}
            />
          ))}
      </div>

      <SearchFiltersSheet
        open={showFilters}
        onOpenChange={setShowFilters}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        timeWindow={timeWindow}
        setTimeWindow={setTimeWindow}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        minSeats={minSeats}
        setMinSeats={setMinSeats}
        onlyVerified={onlyVerified}
        setOnlyVerified={setOnlyVerified}
        prefSmoking={prefSmoking}
        setPrefSmoking={setPrefSmoking}
        prefPets={prefPets}
        setPrefPets={setPrefPets}
        prefLuggage={prefLuggage}
        setPrefLuggage={setPrefLuggage}
        prefWomen={prefWomen}
        setPrefWomen={setPrefWomen}
        prefStudents={prefStudents}
        setPrefStudents={setPrefStudents}
        prefMusic={prefMusic}
        setPrefMusic={setPrefMusic}
        today={today}
        activeFiltersCount={activeFiltersCount}
        clearFilters={clearFilters}
      />

      <AlertModal
        showAlertModal={showAlertModal}
        setShowAlertModal={setShowAlertModal}
        alertSaving={alertSaving}
        setAlertSaving={setAlertSaving}
        origin={origin}
        destination={destination}
        date={dateFrom}
        minSeats={minSeats}
        maxPrice={maxPrice === 50 ? null : maxPrice}
        supabase={supabase}
      />
    </div>
  )
}