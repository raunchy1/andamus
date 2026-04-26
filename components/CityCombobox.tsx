"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, MapPin, Search, X, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface City {
  id: string;
  name: string;
}

interface CityComboboxProps {
  cities: City[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  buttonClassName?: string;
}

export function CityCombobox({
  cities,
  value,
  onChange,
  placeholder,
  label,
  disabled = false,
  buttonClassName,
}: CityComboboxProps) {
  const t = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect mobile keyboard via visualViewport
  useEffect(() => {
    if (!isOpen) {
      setKeyboardOpen(false);
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
    if (!query) return cities.slice(0, 50);
    return cities
      .filter((city) => city.name.toLowerCase().includes(query))
      .slice(0, 50);
  }, [cities, search]);

  const handleSelect = (cityName: string) => {
    onChange(cityName === value ? "" : cityName);
    setIsOpen(false);
    setSearch("");
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const selectedCity = useMemo(
    () => cities.find((city) => city.name === value),
    [cities, value]
  );

  const handleClose = () => {
    setIsOpen(false);
    setSearch("");
  };

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
          "w-full sm:w-[28rem] sm:mx-auto bg-surface-container flex flex-col shadow-2xl",
          keyboardOpen
            ? "h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl"
            : "max-h-[85%] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-outline/40 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <span className="font-semibold text-on-surface text-lg">
            {placeholder || label || t("selectCity")}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full bg-surface-variant active:bg-surface-variant/80 touch-manipulation"
          >
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3 bg-surface border border-outline/30 rounded-2xl px-4 py-3">
            <Search
              size={18}
              className="text-on-surface-variant flex-shrink-0"
            />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t("search")} ${
                label ? label.toLowerCase() : t("city").toLowerCase()
              }...`}
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant focus:outline-none text-base"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="touch-manipulation"
              >
                <X size={16} className="text-on-surface-variant" />
              </button>
            )}
          </div>
        </div>

        {/* Cities list */}
        <div
          className="overflow-y-auto pb-8"
          style={{ flex: 1, minHeight: 0, overscrollBehavior: "contain" }}
        >
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              <MapPin size={32} className="mx-auto mb-2 opacity-40" />
              <p>{t("noCityFound")}</p>
            </div>
          ) : (
            filtered.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelect(city.name)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 text-left transition-colors border-b border-outline/10 last:border-0 min-h-[44px] touch-manipulation",
                  value === city.name
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-on-surface active:bg-primary/20 hover:bg-surface-variant"
                )}
              >
                <MapPin
                  size={18}
                  className={
                    value === city.name
                      ? "text-primary"
                      : "text-on-surface-variant"
                  }
                />
                <span className="text-base truncate">{city.name}</span>
                {value === city.name && (
                  <Check size={18} className="ml-auto text-primary flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-2 bg-surface-container border border-outline/30 rounded-xl px-4 py-3.5 text-left hover:border-primary transition-colors min-h-[44px] touch-manipulation",
          disabled && "opacity-50 cursor-not-allowed",
          buttonClassName
        )}
      >
        <MapPin size={18} className="text-primary flex-shrink-0" />
        <span
          className={cn(
            "flex-1 truncate",
            selectedCity ? "text-on-surface" : "text-on-surface-variant"
          )}
        >
          {selectedCity ? selectedCity.name : placeholder || t("selectCity")}
        </span>
        <ChevronDown
          size={16}
          className="text-on-surface-variant flex-shrink-0"
        />
      </button>

      {/* Bottom sheet — portal to document.body to escape all containing blocks */}
      {isOpen && typeof document !== "undefined" &&
        createPortal(sheet, document.body)}
    </>
  );
}
