"use client"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface FilterPill {
  id: string
  label: string
  onClear: () => void
}

function ActiveFilterPills({ pills }: { pills: FilterPill[] }) {
  if (pills.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {pills.map((pill) => (
        <button
          key={pill.id}
          type="button"
          onClick={pill.onClear}
          className="group inline-flex items-center gap-1.5"
        >
          <Badge className="transition-colors group-hover:border-line-strong group-hover:text-fg">
            {pill.label}
            <X size={12} strokeWidth={1.5} className="text-dim group-hover:text-muted" />
          </Badge>
        </button>
      ))}
    </div>
  )
}

function buildSearchFilterPills(
  props: {
    origin: string
    setOrigin: (v: string) => void
    destination: string
    setDestination: (v: string) => void
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
    prefStudents: boolean
    setPrefStudents: (v: boolean) => void
    prefMusic: string
    setPrefMusic: (v: string) => void
    activeFilter: string
    setActiveFilter: (v: string) => void
  },
  t: (key: string, values?: Record<string, string | number>) => string
): FilterPill[] {
  const pills: FilterPill[] = []

  if (props.origin) pills.push({ id: "origin", label: props.origin, onClear: () => props.setOrigin("") })
  if (props.destination) pills.push({ id: "destination", label: props.destination, onClear: () => props.setDestination("") })
  if (props.dateFrom) pills.push({ id: "dateFrom", label: props.dateFrom, onClear: () => props.setDateFrom("") })
  if (props.dateTo) pills.push({ id: "dateTo", label: props.dateTo, onClear: () => props.setDateTo("") })
  if (props.timeWindow) {
    const labels: Record<string, string> = {
      morning: t("timeMorning"),
      afternoon: t("timeAfternoon"),
      evening: t("timeEvening"),
      night: t("timeNight"),
    }
    pills.push({
      id: "timeWindow",
      label: labels[props.timeWindow] || props.timeWindow,
      onClear: () => props.setTimeWindow(""),
    })
  }
  if (props.maxPrice < 50) {
    pills.push({ id: "maxPrice", label: `≤ €${props.maxPrice}`, onClear: () => props.setMaxPrice(50) })
  }
  if (props.minSeats != null) {
    pills.push({
      id: "minSeats",
      label: t("seats", { count: props.minSeats }),
      onClear: () => props.setMinSeats(null),
    })
  }
  if (props.onlyVerified) pills.push({ id: "verified", label: t("verifiedFilter"), onClear: () => props.setOnlyVerified(false) })
  if (props.prefSmoking) pills.push({ id: "smoking", label: t("smokingFilter"), onClear: () => props.setPrefSmoking(false) })
  if (props.prefPets) pills.push({ id: "pets", label: t("petsFilter"), onClear: () => props.setPrefPets(false) })
  if (props.prefLuggage) pills.push({ id: "luggage", label: t("luggageFilter"), onClear: () => props.setPrefLuggage(false) })
  if (props.prefWomen) pills.push({ id: "women", label: t("womenFilter"), onClear: () => props.setPrefWomen(false) })
  if (props.prefStudents) pills.push({ id: "students", label: t("studentsFilter"), onClear: () => props.setPrefStudents(false) })
  if (props.prefMusic) pills.push({ id: "music", label: props.prefMusic, onClear: () => props.setPrefMusic("") })
  if (props.activeFilter !== "all") {
    const filterLabels: Record<string, string> = {
      free: t("filterFree"),
      verified: t("filterVerified"),
      today: t("filterToday"),
    }
    pills.push({
      id: "activeFilter",
      label: filterLabels[props.activeFilter] || props.activeFilter,
      onClear: () => props.setActiveFilter("all"),
    })
  }

  return pills
}

export { ActiveFilterPills, buildSearchFilterPills }