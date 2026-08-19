"use client"

import { ArrowRight, RefreshCw, Bell, SlidersHorizontal } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

import { LocationCombobox } from "@/components/LocationCombobox"
import { PageHeader } from "@/components/PageHeader"
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

  const routeTitle = [origin, destination].filter(Boolean).join(" → ") || t("title")
  const subtitleParts = [
    dateFrom ? formatDate?.(dateFrom) : null,
    minSeats > 1 ? t("seats", { count: minSeats }) : null,
  ].filter(Boolean)

  return (
    <div style={{ background: "var(--sand)", minHeight: "100dvh" }} className="overflow-x-hidden">
      {/* ── Sticky header ──────────────────────────────── */}
      <PageHeader
        sticky
        eyebrow={rides.length > 0 ? t("resultsFound", { count: rides.length }) : undefined}
        title={
          origin || destination ? (
            <span className="flex items-center gap-2">
              <span className="truncate">{origin || t("fromLabel")}</span>
              <ArrowRight className="size-[15px] shrink-0 text-faint" strokeWidth={1.8} />
              <span className="truncate">{destination || t("toLabel")}</span>
            </span>
          ) : (
            t("title")
          )
        }
        subtitle={subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined}
        action={
          <button
            type="button"
            onClick={handleRefresh}
            aria-label={t("loading")}
            className="flex size-[38px] items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-line-strong"
          >
            <RefreshCw
              className={`size-[17px] ${isRefreshing ? "animate-spin" : ""}`}
              strokeWidth={1.6}
            />
          </button>
        }
      />

      {/* ── Chip filter row ────────────────────────────── */}
      <div
        style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 16px" }}
        className="no-scrollbar"
      >
        {/* Filtri (dark) */}
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          style={{
            flexShrink: 0,
            height: 34,
            padding: "0 14px",
            borderRadius: 999,
            background: "var(--ink)",
            color: "var(--sand)",
            fontSize: 13,
            fontWeight: 500,
            border: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <SlidersHorizontal size={13} strokeWidth={1.7} />
          Filtri
          {activeFiltersCount > 0 && (
            <span
              style={{
                background: "var(--green)",
                color: "#fff",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                padding: "1px 6px",
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Dynamic filter chips */}
        {getFilterOptions(t)
          .filter((o) => o.id !== "all")
          .map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveFilter(activeFilter === option.id ? "all" : option.id)}
              style={{
                flexShrink: 0,
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                background: activeFilter === option.id ? "var(--green-tint)" : "var(--surface)",
                color: activeFilter === option.id ? "var(--green)" : "var(--muted)",
                fontSize: 13,
                fontWeight: 500,
                border: `1px solid ${activeFilter === option.id ? "var(--green-tint)" : "var(--line)"}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {option.label}
            </button>
          ))}
      </div>

      {/* ── Pull-to-refresh indicator ──────────────────── */}
      {pullDistance > 0 && (
        <div
          style={{ height: pullDistance, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <RefreshCw
            className={isRefreshing ? "animate-spin" : ""}
            size={18}
            strokeWidth={1.5}
            style={{ color: "var(--muted)", transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      )}

      {/* ── Results list ──────────────────────────────── */}
      <main
        style={{ padding: "0 16px 96px", display: "flex", flexDirection: "column", gap: 10 }}
        ref={resultsRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {loading && (
          <>
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
          </>
        )}

        {!loading && hasError && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 22,
              padding: "40px 20px",
              textAlign: "center",
              border: "1px solid var(--line)",
              marginTop: 8,
            }}
          >
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>{t("searchError")}</p>
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