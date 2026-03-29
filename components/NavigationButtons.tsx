"use client";

import { MapPin, Navigation } from "lucide-react";
import { getCityCoordinates } from "@/lib/sardinia-cities";

interface NavigationButtonsProps {
  destination: string;
  label?: string;
  variant?: "default" | "compact";
}

export function NavigationButtons({ 
  destination, 
  label = "Destinazione",
  variant = "default" 
}: NavigationButtonsProps) {
  const coords = getCityCoordinates(destination);

  if (!coords) {
    console.warn(`Coordinates not found for destination: ${destination}`);
    return null;
  }

  const { lat, lng } = coords;

  // Navigation URLs
  const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  const googleMapsUrl = `https://maps.google.com/?daddr=${lat},${lng}`;

  const openNavigation = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openNavigation(wazeUrl)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#33ccff]/20 text-[#33ccff] hover:bg-[#33ccff]/30 transition-colors text-sm font-medium"
          title="Apri in Waze"
        >
          <Navigation className="w-4 h-4" />
          Waze
        </button>
        <button
          onClick={() => openNavigation(googleMapsUrl)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium"
          title="Apri in Google Maps"
        >
          <MapPin className="w-4 h-4" />
          Maps
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <Navigation className="w-5 h-5 text-[#e63946]" />
        Navigazione verso {destination}
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Waze Button */}
        <button
          onClick={() => openNavigation(wazeUrl)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#33ccff] text-white font-semibold hover:bg-[#2ab8e6] transition-colors"
        >
          <svg 
            viewBox="0 0 24 24" 
            className="w-5 h-5 fill-current"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          Apri in Waze
        </button>

        {/* Google Maps Button */}
        <button
          onClick={() => openNavigation(googleMapsUrl)}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
        >
          <svg 
            viewBox="0 0 24 24" 
            className="w-5 h-5 fill-current"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Apri in Maps
        </button>
      </div>

      <p className="text-white/50 text-xs mt-3 text-center">
        Si aprirà in una nuova scheda o nell&apos;app sul tuo dispositivo
      </p>
    </div>
  );
}

// Mini button for ride cards - just shows a navigation icon
export function NavigationMiniButton({ destination }: { destination: string }) {
  const coords = getCityCoordinates(destination);

  if (!coords) return null;

  const { lat, lng } = coords;
  const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

  return (
    <button
      onClick={() => window.open(wazeUrl, '_blank', 'noopener,noreferrer')}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#33ccff]/20 text-[#33ccff] hover:bg-[#33ccff]/30 transition-colors text-xs font-medium"
      title={`Naviga verso ${destination}`}
    >
      <Navigation className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Naviga</span>
    </button>
  );
}
