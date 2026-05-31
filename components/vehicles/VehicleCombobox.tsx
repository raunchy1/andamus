"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, Check, X, Loader2 } from "lucide-react";
import type { VehicleMake, VehicleModel } from "@/lib/types/vehicle";

// ─── Make Combobox ─────────────────────────────────────────────────────────

interface MakeComboboxProps {
  value: VehicleMake | null;
  onChange: (make: VehicleMake | null) => void;
  placeholder?: string;
  className?: string;
}

export function VehicleMakeCombobox({
  value,
  onChange,
  placeholder = "Cerca marca...",
  className = "",
}: MakeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchMakes = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/makes?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setMakes(data.makes ?? []);
    } catch {
      setMakes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) fetchMakes(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, open, fetchMakes]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      fetchMakes("");
    }
  }, [open, fetchMakes]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (make: VehicleMake) => {
    onChange(make);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery("");
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3.5 rounded-2xl bg-surface-container-highest border border-transparent focus-within:border-primary/50 text-left transition-all"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-5 h-5 text-on-surface/30 shrink-0" />
          {value ? (
            <span className="font-semibold text-on-surface truncate">{value.name}</span>
          ) : (
            <span className="text-on-surface/40">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-surface-container-high text-on-surface/40 hover:text-on-surface transition-all"
            >
              <X className="w-4 h-4" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-on-surface/40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 w-full mt-2 z-50 bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-outline-variant/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Volkswagen, BMW, Fiat..."
                className="w-full bg-surface-container-highest rounded-xl py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface/30 border-none focus:outline-none"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-on-surface/40" />
              </div>
            ) : makes.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface/40">
                Nessuna marca trovata
              </div>
            ) : (
              <div className="py-2">
                {/* Popular section */}
                {!query && makes.some((m) => m.is_popular) && (
                  <>
                    <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface/30">
                      Popolari
                    </p>
                    {makes
                      .filter((m) => m.is_popular)
                      .map((make) => (
                        <MakeOption
                          key={make.id}
                          make={make}
                          isSelected={value?.id === make.id}
                          onSelect={handleSelect}
                        />
                      ))}
                    <div className="mx-4 my-1 border-t border-outline-variant/20" />
                    <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface/30">
                      Tutte le marche
                    </p>
                    {makes
                      .filter((m) => !m.is_popular)
                      .map((make) => (
                        <MakeOption
                          key={make.id}
                          make={make}
                          isSelected={value?.id === make.id}
                          onSelect={handleSelect}
                        />
                      ))}
                  </>
                )}
                {(query || !makes.some((m) => m.is_popular)) &&
                  makes.map((make) => (
                    <MakeOption
                      key={make.id}
                      make={make}
                      isSelected={value?.id === make.id}
                      onSelect={handleSelect}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MakeOption({
  make,
  isSelected,
  onSelect,
}: {
  make: VehicleMake;
  isSelected: boolean;
  onSelect: (make: VehicleMake) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(make)}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all hover:bg-surface-container-high ${
        isSelected ? "text-primary bg-primary/5" : "text-on-surface"
      }`}
    >
      <span className="font-medium">{make.name}</span>
      <div className="flex items-center gap-2">
        {make.country && (
          <span className="text-[10px] text-on-surface/40 font-bold">{make.country}</span>
        )}
        {isSelected && <Check className="w-4 h-4 text-primary" />}
      </div>
    </button>
  );
}

// ─── Model Combobox ────────────────────────────────────────────────────────

interface ModelComboboxProps {
  makeId: string | null;
  value: VehicleModel | null;
  onChange: (model: VehicleModel | null) => void;
  placeholder?: string;
  className?: string;
}

export function VehicleModelCombobox({
  makeId,
  value,
  onChange,
  placeholder = "Cerca modello...",
  className = "",
}: ModelComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchModels = useCallback(
    async (q: string) => {
      if (!makeId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/vehicles/models?makeId=${encodeURIComponent(makeId)}&q=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        setModels(data.models ?? []);
      } catch {
        setModels([]);
      } finally {
        setLoading(false);
      }
    },
    [makeId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) fetchModels(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, open, fetchModels]);

  useEffect(() => {
    if (open && makeId) {
      inputRef.current?.focus();
      fetchModels("");
    }
  }, [open, makeId, fetchModels]);

  // Reset when makeId changes
  useEffect(() => {
    onChange(null);
    setQuery("");
  }, [makeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const disabled = !makeId;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3.5 rounded-2xl border border-transparent text-left transition-all ${
          disabled
            ? "bg-surface-container-high/50 cursor-not-allowed opacity-50"
            : "bg-surface-container-highest hover:border-primary/30 focus-within:border-primary/50"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-5 h-5 text-on-surface/30 shrink-0" />
          {value ? (
            <span className="font-semibold text-on-surface truncate">{value.name}</span>
          ) : (
            <span className="text-on-surface/40">
              {disabled ? "Seleziona prima la marca" : placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-on-surface/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute top-full left-0 w-full mt-2 z-50 bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-outline-variant/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Golf, Panda, Clio..."
                className="w-full bg-surface-container-highest rounded-xl py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface/30 border-none focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-on-surface/40" />
              </div>
            ) : models.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface/40">
                Nessun modello trovato
              </div>
            ) : (
              <div className="py-2">
                {models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onChange(model);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all hover:bg-surface-container-high ${
                      value?.id === model.id ? "text-primary bg-primary/5" : "text-on-surface"
                    }`}
                  >
                    <span className="font-medium">{model.name}</span>
                    <div className="flex items-center gap-2">
                      {model.body_type && (
                        <span className="text-[10px] text-on-surface/40 capitalize">
                          {model.body_type}
                        </span>
                      )}
                      {value?.id === model.id && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
