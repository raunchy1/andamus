"use client"

import { RefreshCw, Bell, SlidersHorizontal } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

import { LocationCombobox } from "@/components/LocationCombobox"
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

export function SearchMobileView(props: SearchViewProps) {
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
    showFilters,
    setShowFilters,
    isRefreshing,
    showAlertModal,
    setShowAlertModal,
    alertSaving,
    setAlertSaving,
    pullDistance,
    rides,
    loading,
    hasError,
    today,
    resultsRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    handleRefresh,
    clearFilters,
    formatDate,
    activeFiltersCount,
    supabase,
    setShowCreateModal,
  } = props

  const filterPills = buildSearchFilterPills(props, t)

  return (
    <div className="min-h-screen bg-bg text-fg overflow-x-hidden">
      <header className="px-4 sm:px-6 pt-6 pb-4 border-b border-line">
        <p className="text-eyebrow">// {t("resultsCount", { count: rides.length })}</p>
        <h1 className="mt-2 font-h2 heading-editorial text-fg">cerca</h1>
      </header>

      <main
        className="px-4 sm:px-6 max-w-2xl mx-auto overflow-x-hidden pb-8"
        ref={resultsRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div
          className="flex justify-center items-center h-0 overflow-visible transition-all duration-200 -mt-2 mb-2"
          style={{ height: pullDistance > 0 ? pullDistance : 0 }}
        >
          <div className={`flex items-center gap-2 text-dim transition-opacity ${pullDistance > 60 ? "opacity-100" : "opacity-50"}`}>
            <RefreshCw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              strokeWidth={1.5}
              style={{ transform: `rotate(${pullDistance * 2}deg)` }}
            />
            <span className="font-mono text-xs">{pullDistance > 60 ? t("releaseToRefresh") : t("pullToRefresh")}</span>
          </div>
        </div>

        <div className="sticky top-16 z-30 mb-3 border border-line rounded-[var(--radius)] bg-surface/95 backdrop-blur-sm p-3">
          <div className="grid grid-cols-2 gap-2">
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
          </div>
        </div>

        <div className="mb-3 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {getFilterOptions(t).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveFilter(activeFilter === option.id ? "all" : option.id)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors ${
                  activeFilter === option.id
                    ? "border-accent bg-accent-dim text-fg"
                    : "border-line text-muted hover:border-line-strong"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" size="sm" className="h-9 px-3 text-xs" onClick={() => setShowAlertModal(true)}>
              <Bell size={14} strokeWidth={1.5} />
              {t("alertButton")}
            </Button>
            <Button type="button" variant="secondary" size="sm" className="h-9 px-3 text-xs" onClick={() => setShowFilters(true)}>
              <SlidersHorizontal size={14} strokeWidth={1.5} />
              filtri
              {activeFiltersCount > 0 && (
                <span className="ml-1 font-mono text-[10px] text-accent">{activeFiltersCount}</span>
              )}
            </Button>
          </div>
        </div>

        <ActiveFilterPills pills={filterPills} />

        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-xs text-muted">
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

        <div className="space-y-3">
          {loading && (
            <>
              <RideCardSkeleton />
              <RideCardSkeleton />
              <RideCardSkeleton />
            </>
          )}

          {!loading && hasError && (
            <div className="border border-line rounded-[var(--radius)] bg-surface py-12 text-center">
              <p className="text-sm text-muted mb-4">{t("searchError")}</p>
              <Button type="button" variant="primary" onClick={handleRefresh}>
                {t("retry")}
              </Button>
            </div>
          )}

          {!loading && !hasError && rides.length === 0 && (
            <EmptyStateSearch
              hasFilters={activeFiltersCount > 0}
              onClearFilters={clearFilters}
              onCreateRequest={() => setShowCreateModal?.(true)}
              onCreateAlert={() => setShowAlertModal(true)}
              fromCity={origin}
              toCity={destination}
              searchDate={dateFrom}
              onSelectSuggestion={(sFrom, sTo, sDate) => {
                if (sFrom !== undefined) setOrigin(sFrom)
                if (sTo !== undefined) setDestination(sTo)
                if (sDate !== undefined) setDateFrom(sDate || "")
              }}
            />
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
      </main>

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