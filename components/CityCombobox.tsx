"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
  const [open, setOpen] = useState(false);

  const selectedCity = useMemo(
    () => cities.find((city) => city.name === value),
    [cities, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal min-h-[44px] touch-manipulation",
            !value && "text-muted-foreground",
            buttonClassName
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">
              {selectedCity ? selectedCity.name : (placeholder || t("selectCity"))}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command
          filter={(value, search) => {
            const cityName = value.toLowerCase();
            const query = search.toLowerCase();
            if (cityName.startsWith(query)) return 1;
            if (cityName.includes(query)) return 0.5;
            return 0;
          }}
        >
          <CommandInput
            placeholder={`${t("search")} ${label ? label.toLowerCase() : t("city").toLowerCase()}...`}
            className="h-11"
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>{t("noCityFound")}</CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  value={city.name}
                  onSelect={() => {
                    onChange(city.name === value ? "" : city.name);
                    setOpen(false);
                  }}
                  className="cursor-pointer touch-manipulation"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === city.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{city.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
