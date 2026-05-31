"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Check, MapPin, Search, X, ChevronDown, 
  Plane, Anchor, GraduationCap, Star, History
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
  airport: Plane,
  port: Anchor,
  university: GraduationCap,
};

const TYPE_LABELS = {
  city: "Città",
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
          "w-full sm:w-[30rem] sm:mx-auto bg-surface-container flex flex-col shadow-2xl transition-all duration-300",
          keyboardOpen
            ? "h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl"
            : "max-h-[85%] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-outline/40 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <span className="font-semibold text-on-surface text-lg">
            {placeholder || label || "Seleziona località"}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full bg-surface-variant active:bg-surface-variant/80 touch-manipulation"
          >
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="px-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3 bg-surface border border-outline/30 rounded-2xl px-4 py-3 focus-within:border-primary transition-colors">
            <Search size={18} className="text-on-surface-variant flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca città, aeroporto o porto..."
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant focus:outline-none text-base"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="p-1 rounded-full hover:bg-surface-variant"
              >
                <X size={16} className="text-on-surface-variant" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto pb-8" style={{ flex: 1, minHeight: 0, overscrollBehavior: "contain" }}>
          {search === "" && recentLocations.length > 0 && (
            <div className="px-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <History size={14} className="text-primary" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Recenti</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentLocations.map(loc => (
                  <button 
                    key={`recent-${loc.id}`} 
                    type="button" 
                    onClick={() => handleSelect(loc)} 
                    className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {Object.entries(groupedResults).map(([type, items]) => (
            <div key={type} className="mb-4">
              <div className="px-5 py-2 bg-surface-variant/30 sticky top-0 backdrop-blur-sm z-10 flex items-center gap-2">
                {items[0] && TYPE_ICONS[type as keyof typeof TYPE_ICONS] && (
                  (() => {
                    const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS];
                    return <Icon size={12} className="text-on-surface-variant/70" />;
                  })()
                )}
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
                  {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}
                </h4>
              </div>
              {items.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 text-left transition-colors border-b border-outline/5 last:border-0 min-h-[56px] touch-manipulation",
                    value === loc.name
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface active:bg-primary/20 hover:bg-surface-variant"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl flex-shrink-0",
                    value === loc.name ? "bg-primary/20" : "bg-surface-variant/50"
                  )}>
                    {(() => {
                      const Icon = TYPE_ICONS[loc.type as keyof typeof TYPE_ICONS] || MapPin;
                      return <Icon size={20} className={value === loc.name ? "text-primary" : "text-on-surface-variant"} />;
                    })()}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-base truncate">{loc.name}</div>
                    {loc.province && <div className="text-xs text-on-surface-variant opacity-70">{loc.province}</div>}
                  </div>
                  {loc.popular && !search && <Star size={14} className="text-primary/40 fill-primary/40" />}
                  {value === loc.name && (
                    <Check size={20} className="ml-auto text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-20 text-center text-on-surface-variant">
              <MapPin size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nessuna località trovata</p>
              <p className="text-sm opacity-60">Prova con un nome diverso</p>
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
          "w-full flex items-center gap-3 bg-surface-container border border-outline/30 rounded-2xl px-4 py-4 text-left hover:border-primary transition-all min-h-[56px] touch-manipulation group",
          disabled && "opacity-50 cursor-not-allowed",
          buttonClassName
        )}
      >
        <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <MapPin size={20} className="text-primary flex-shrink-0" />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          {label && <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 -mb-1">{label}</span>}
          <span
            className={cn(
              "text-base truncate font-medium",
              selectedLocation ? "text-on-surface" : "text-on-surface-variant"
            )}
          >
            {selectedLocation ? selectedLocation.name : placeholder || "Seleziona località"}
          </span>
        </div>
        <ChevronDown
          size={18}
          className="text-on-surface-variant flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
        />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(sheet, document.body)}
    </>
  );
}
