"use client";

import { useState, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import Image from "next/image";
import { MapPin, Navigation } from "lucide-react";
import { useTranslations } from "next-intl";
import { SARDINIA_CITIES, darkMapStyles } from "@/lib/sardinia-cities";

interface RouteMapProps {
  fromCity: string;
  toCity: string;
  height?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1rem",
};

const center = {
  lat: 40.1209,
  lng: 9.0129,
};

const mapOptions = {
  styles: darkMapStyles,
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

export function RouteMap({ fromCity, toCity, height = "400px" }: RouteMapProps) {
  const t = useTranslations("map");
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const calculateRoute = useCallback(() => {
    if (!isLoaded) return;

    const fromCoords = SARDINIA_CITIES[fromCity];
    const toCoords = SARDINIA_CITIES[toCity];

    if (!fromCoords || !toCoords) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: fromCoords.lat, lng: fromCoords.lng },
        destination: { lat: toCoords.lat, lng: toCoords.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          // Extract distance and duration
          const route = result.routes[0];
          if (route.legs[0]) {
            setDistance(route.legs[0].distance?.text || "");
            setDuration(route.legs[0].duration?.text || "");
          }
        }
      }
    );
  }, [isLoaded, fromCity, toCity]);

  useEffect(() => {
    if (isLoaded) {
      calculateRoute();
    }
  }, [isLoaded, calculateRoute]);

  // Fallback if Google Maps API key not set or error
  if (loadError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div 
        className="relative w-full rounded-2xl border border-white/10 bg-[#1e2a4a] flex items-center justify-center overflow-hidden"
        style={{ height }}
      >
        <div className="absolute inset-0 opacity-10">
          <div 
            className="h-full w-full" 
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(230,57,70,0.3) 1px, transparent 0)`,
              backgroundSize: "40px 40px"
            }}
          />
        </div>
        
        <div className="relative z-10 text-center px-8">
          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <MapPin className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-lg font-bold text-white">{fromCity}</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="h-0.5 w-20 bg-[#e63946]" />
              <Navigation className="h-5 w-5 text-[#e63946] my-1" />
              <div className="h-0.5 w-20 bg-[#e63946]" />
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <MapPin className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-lg font-bold text-white">{toCity}</p>
            </div>
          </div>
          
          {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
            <p className="text-sm text-white/40">
              {t("addApiKey")}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-[#1e2a4a]"
        style={{ height }}
      >
        <div className="flex items-center gap-3 text-white/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#e63946]" />
          {t("loadingMap")}
        </div>
      </div>
    );
  }

  const fromCoords = SARDINIA_CITIES[fromCity];
  const toCoords = SARDINIA_CITIES[toCity];

  if (!fromCoords || !toCoords) {
    return (
      <div 
        className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-[#1e2a4a]"
        style={{ height }}
      >
        <p className="text-white/50">{t("noCoordinates")}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Distance/Duration Badge */}
      {(distance || duration) && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {distance && (
            <div className="rounded-full bg-[#1e2a4a]/90 backdrop-blur px-4 py-2 text-sm font-medium text-white border border-white/10">
              {distance}
            </div>
          )}
          {duration && (
            <div className="rounded-full bg-[#e63946]/90 backdrop-blur px-4 py-2 text-sm font-medium text-white">
              {duration}
            </div>
          )}
        </div>
      )}

      {/* City Labels */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="rounded-lg bg-[#1e2a4a]/90 backdrop-blur px-3 py-2 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-white">{fromCity}</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10">
        <div className="rounded-lg bg-[#1e2a4a]/90 backdrop-blur px-3 py-2 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-white">{toCity}</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={{ ...mapContainerStyle, height }}
        center={center}
        zoom={8}
        options={mapOptions}
      >
        {/* Origin Marker */}
        <Marker
          position={{ lat: fromCoords.lat, lng: fromCoords.lng }}
          icon={{
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2322c55e' width='40' height='40'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/%3E%3Ccircle cx='12' cy='9' r='2.5' fill='white'/%3E%3C/svg%3E",
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          }}
        />

        {/* Destination Marker */}
        <Marker
          position={{ lat: toCoords.lat, lng: toCoords.lng }}
          icon={{
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e63946' width='40' height='40'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/%3E%3Ccircle cx='12' cy='9' r='2.5' fill='white'/%3E%3C/svg%3E",
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          }}
        />

        {/* Route */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#e63946",
                strokeWeight: 4,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}

// Simple static map component for cards
interface MiniMapProps {
  fromCity: string;
  toCity: string;
}

export function MiniMap({ fromCity, toCity }: MiniMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return (
      <div className="h-[120px] w-full rounded-xl bg-[#1e2a4a] flex items-center justify-center">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-green-400" />
          </div>
          <div className="h-0.5 w-12 bg-[#e63946]" />
          <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-red-400" />
          </div>
        </div>
      </div>
    );
  }

  const from = SARDINIA_CITIES[fromCity];
  const to = SARDINIA_CITIES[toCity];
  
  if (!from || !to) {
    return (
      <div className="h-[120px] w-full rounded-xl bg-[#1e2a4a] flex items-center justify-center">
        <p className="text-xs text-white/40">Mappa non disponibile</p>
      </div>
    );
  }

  const centerLat = (from.lat + to.lat) / 2;
  const centerLng = (from.lng + to.lng) / 2;
  
  // Calculate appropriate zoom based on distance
  const latDiff = Math.abs(from.lat - to.lat);
  const lngDiff = Math.abs(from.lng - to.lng);
  const maxDiff = Math.max(latDiff, lngDiff);
  const zoom = maxDiff > 2 ? 7 : maxDiff > 1 ? 8 : 9;

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=400x200&maptype=roadmap&markers=color:green%7Clabel:A%7C${from.lat},${from.lng}&markers=color:red%7Clabel:B%7C${to.lat},${to.lng}&key=${apiKey}&style=feature:all%7Celement:geometry%7Ccolor:0x0a0a0a&style=feature:all%7Celement:labels.text.stroke%7Ccolor:0x0a0a0a&style=feature:all%7Celement:labels.text.fill%7Ccolor:0xffffff&style=feature:water%7Ccolor:0x0a0a0a`;

  return (
    <div className="relative h-[120px] w-full overflow-hidden rounded-xl">
      <Image
        src={mapUrl}
        alt={`Mappa da ${fromCity} a ${toCity}`}
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/60 to-transparent" />
      
      {/* City labels */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-xs font-medium text-white drop-shadow-lg">{fromCity}</span>
      </div>
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-xs font-medium text-white drop-shadow-lg">{toCity}</span>
      </div>
    </div>
  );
}
