"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Check, MapPin, Search, X, ChevronDown, 
  Plane, Anchor, GraduationCap, Star, History, Loader2
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Location, getAllLocations } from "@/lib/server/actions/locations";
import { Analytics } from "@/lib/analytics";

interface LocationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  buttonClassName?: string;
}

const TYPE_ICONS = {
  city: MapPin,
  frazione: MapPin,
  airport: Plane,
  port: Anchor,
  university: GraduationCap,
};

const TYPE_LABELS = {
  city: "Città",
  frazione: "Località",
  airport: "Aeroporti",
  port: "Porti",
  university: "Università",
};

export function LocationCombobox({
  value,
  onChange,
  placeholder,
  label,
  disabled = false,
  buttonClassName,
}: LocationComboboxProps) {
  const t = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [recentLocations, setRecentLocations] = useState<Location[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const data = await getAllLocations();
      setAllLocations(data);
    }
    init();

    try {
      const stored = localStorage.getItem("andamus_recent_locations");
      if (stored) setRecentLocations(JSON.parse(stored));
    } catch (e) {}
  }, []);

  // Detect mobile keyboard via visualViewport
  useEffect(() => {
    if (!isOpen) {
      requestAnimationFrame(() => setKeyboardOpen(false));
      return;
    }
    const handleResize = () => {
      const isKeyboard = window.visualViewport
        ? window.visualViewport.height < window.innerHeight - 150
        : false;
      setKeyboardOpen(isKeyboard);
    };
    handleResize();
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) {
      // Group popular by type
      return allLocations.filter(l => l.popular);
    }

    return allLocations
      .map(loc => {
        const name = loc.name.toLowerCase();
        let score = 0;
        if (name === query) score = 100;
        else if (name.startsWith(query)) score = 80;
        else if (name.includes(query)) score = 50;
        // Basic fuzzy: check if all characters of query are in name in order
        else {
          let i = 0, j = 0;
          while (i < query.length && j < name.length) {
            if (query[i] === name[j]) i++;
            j++;
          }
          if (i === query.length) score = 30;
        }
        return { ...loc, score };
      })
      .filter(loc => loc.score > 0)
      .sort((a, b) => b.score - a.score || (b.population || 0) - (a.population || 0))
      .slice(0, 50);
  }, [allLocations, search]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, Location[]> = {};
    filtered.forEach(loc => {
      if (!groups[loc.type]) groups[loc.type] = [];
      groups[loc.type].push(loc);
    });
    return groups;
  }, [filtered]);

  const handleSelect = (location: Location) => {
    onChange(location.name);
    
    const updated = [location, ...recentLocations.filter(l => l.id !== location.id)].slice(0, 5);
    setRecentLocations(updated);
    try {
      localStorage.setItem("andamus_recent_locations", JSON.stringify(updated));
    } catch (e) {}

    Analytics.trackEvent("location_selected", {
      location_name: location.name,
      location_type: location.type,
      search_query: search,
      is_fuzzy: search && !location.name.toLowerCase().includes(search.toLowerCase())
    });

    setIsOpen(false);
    setSearch("");
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 100);
      Analytics.trackEvent("autocomplete_opened", { label: label || "location" });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearch("");
  };

  const selectedLocation = useMemo(
    () => allLocations.find(l => l.name === value),
    [allLocations, value]
  );

  const displayValue = useMemo(() => {
    if (selectedLocation) return selectedLocation.name;
    if (value) return value;
    return placeholder || t("selectCity");
  }, [selectedLocation, value, placeholder, t]);

  const sheet = (
    <div
      className={cn(
        "fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col",
        keyboardOpen ? "justify-start" : "justify-end"
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          "w-full sm:w-[30rem] sm:mx-auto bg-surface flex flex-col shadow-2xl transition-all duration-300 border border-line",
          keyboardOpen
            ? "h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:rounded-[var(--radius)]"
            : "max-h-[85%] sm:max-h-[85vh] rounded-t-[var(--radius)] sm:rounded-[var(--radius)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <span className="font-semibold text-fg text-lg lowercase">
            {placeholder || label || t("selectCity")}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full bg-surface-2 active:bg-surface-2/80 touch-manipulation"
          >
            <X size={18} strokeWidth={1.5} className="text-muted" />
          </button>
        </div>

        <div className="px-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3 bg-surface-2 border border-line rounded-[var(--radius-sm)] px-4 py-3 focus-within:border-accent transition-colors">
            <Search size={18} strokeWidth={1.5} className="text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search") + "..."}
              className="flex-1 bg-transparent text-fg placeholder:text-dim outline-none focus:outline-none focus-visible:outline-none text-base"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="p-1 rounded-full hover:bg-surface-2"
              >
                <X size={16} strokeWidth={1.5} className="text-muted" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto pb-8" style={{ flex: 1, minHeight: 0, overscrollBehavior: "contain" }}>
          {search === "" && recentLocations.length > 0 && (
            <div className="px-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <History size={14} strokeWidth={1.5} className="text-muted" />
                <h4 className="text-eyebrow">recenti</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentLocations.map(loc => (
                  <button 
                    key={`recent-${loc.id}`} 
                    type="button" 
                    onClick={() => handleSelect(loc)} 
                    className="px-3 py-1.5 rounded-full bg-surface-2 border border-line text-sm font-medium text-fg hover:border-line-strong transition-colors"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {Object.entries(groupedResults).map(([type, items]) => (
            <div key={type} className="mb-4">
              <div className="px-5 py-2 bg-surface-2/50 sticky top-0 backdrop-blur-sm z-10 flex items-center gap-2">
                {items[0] && TYPE_ICONS[type as keyof typeof TYPE_ICONS] && (
                  (() => {
                    const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS];
                    return <Icon size={12} strokeWidth={1.5} className="text-dim" />;
                  })()
                )}
                <h4 className="text-eyebrow">
                  {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}
                </h4>
              </div>
              {items.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 text-left transition-colors border-b border-line/50 last:border-0 min-h-[56px] touch-manipulation",
                    value === loc.name
                      ? "bg-accent-dim text-fg font-semibold"
                      : "text-fg active:bg-surface-2 hover:bg-surface-2"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-[var(--radius-sm)] flex-shrink-0",
                    value === loc.name ? "bg-accent-dim" : "bg-surface-2"
                  )}>
                    {(() => {
                      const Icon = TYPE_ICONS[loc.type as keyof typeof TYPE_ICONS] || MapPin;
                      return <Icon size={20} strokeWidth={1.5} className={value === loc.name ? "text-accent" : "text-muted"} />;
                    })()}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-base truncate">
                      {loc.name}
                      {loc.type === 'frazione' && loc.parent_municipality && (
                        <span className="text-sm text-muted font-normal ml-1.5">
                          ({loc.parent_municipality})
                        </span>
                      )}
                    </div>
                    {loc.province && <div className="text-xs text-dim">{loc.province}</div>}
                  </div>
                  {loc.popular && !search && <Star size={14} strokeWidth={1.5} className="text-dim fill-dim/40" />}
                  {value === loc.name && (
                    <Check size={20} strokeWidth={1.5} className="ml-auto text-accent flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-20 text-center text-muted">
              <MapPin size={48} strokeWidth={1.5} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">{t("noCityFound")}</p>
              <p className="text-sm text-dim">{t("retry")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-3 border border-line rounded-[var(--radius-sm)] bg-surface-2 px-4 h-12 text-left transition-colors touch-manipulation group hover:border-line-strong",
          disabled && "opacity-50 cursor-not-allowed",
          buttonClassName
        )}
      >
        <MapPin size={20} strokeWidth={1.5} className="text-muted flex-shrink-0" />
        <div className="flex-1 flex flex-col min-w-0">
          {label ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-dim -mb-1">{label}</span>
          ) : null}
          <span
            className={cn(
              "text-base truncate font-medium",
              selectedLocation || value ? "text-fg" : "text-dim"
            )}
          >
            {displayValue}
          </span>
        </div>
        {allLocations.length === 0 && !disabled && (
          <Loader2 size={16} strokeWidth={1.5} className="text-muted animate-spin mr-1" />
        )}
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          className="text-dim flex-shrink-0 group-hover:text-muted transition-colors"
        />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(sheet, document.body)}
    </>
  );
}