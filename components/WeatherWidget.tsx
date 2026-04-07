"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, Snowflake, CloudLightning, CloudFog } from "lucide-react";
import { getWeatherForCity, getWeatherInfo, WeatherData } from "@/lib/weather";

interface WeatherWidgetProps {
  city: string;
  date: string;
  variant?: "compact" | "full";
}

// Get Lucide icon based on weather code
function getWeatherIcon(code: number, className: string = "w-5 h-5") {
  // WMO Weather interpretation codes
  if (code === 0 || code === 1) return <Sun className={`${className} text-yellow-400`} />;
  if (code === 2) return <Cloud className={`${className} text-gray-400`} />;
  if (code === 3) return <Cloud className={`${className} text-gray-500`} />;
  if (code === 45 || code === 48) return <CloudFog className={`${className} text-gray-400`} />;
  if (code >= 51 && code <= 67) return <CloudRain className={`${className} text-blue-400`} />;
  if (code >= 71 && code <= 77) return <Snowflake className={`${className} text-blue-300`} />;
  if (code >= 80 && code <= 82) return <CloudRain className={`${className} text-blue-500`} />;
  if (code >= 85 && code <= 86) return <Snowflake className={`${className} text-blue-300`} />;
  if (code >= 95) return <CloudLightning className={`${className} text-purple-400`} />;
  return <Cloud className={`${className} text-gray-400`} />;
}

// Compact version for ride cards
function CompactWeatherWidget({ weather, rainWarning }: { weather: WeatherData; rainWarning: boolean }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
      {getWeatherIcon(weather.weatherCode, "w-4 h-4")}
      <span className="text-white text-xs font-medium">
        {weather.maxTemp}°
      </span>
      {rainWarning && (
        <span className="text-yellow-400 text-xs" title="Possibile pioggia">⚠️</span>
      )}
    </div>
  );
}

// Full version for ride detail page
function FullWeatherWidget({ weather, city, rainWarning }: { weather: WeatherData; city: string; rainWarning: boolean }) {
  const weatherInfo = getWeatherInfo(weather.weatherCode);
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-400" />
          Meteo a {city}
        </h3>
        <span className="text-white/50 text-sm">
          {new Date(weather.date).toLocaleDateString('it-IT', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
          })}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            {getWeatherIcon(weather.weatherCode, "w-7 h-7")}
          </div>
          <div>
            <p className="text-white font-bold text-lg">{weather.maxTemp}° / {weather.minTemp}°</p>
            <p className="text-white/60 text-sm">{weatherInfo.label}</p>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="text-right">
            <p className="text-white/60 text-xs">Probabilità pioggia</p>
            <p className={`font-semibold ${rainWarning ? 'text-yellow-400' : 'text-white'}`}>
              {weather.rainProbability}%
            </p>
          </div>
        </div>
      </div>
      
      {rainWarning && (
        <div className="mt-3 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          <span className="text-yellow-400">⚠️</span>
          <p className="text-yellow-400 text-sm font-medium">
            Possibile pioggia - Porta un ombrello!
          </p>
        </div>
      )}
    </div>
  );
}

export function WeatherWidget({ city, date, variant = "full" }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await getWeatherForCity(city, date);
        setWeather(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (city && date) {
      fetchWeather();
    }
  }, [city, date]);

  if (loading) {
    if (variant === "compact") {
      return (
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 border border-white/10 animate-pulse">
          <Cloud className="w-4 h-4 text-white/30" />
          <span className="text-white/30 text-xs">--°</span>
        </div>
      );
    }
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
        <div className="h-16 bg-white/5 rounded-lg" />
      </div>
    );
  }

  if (error || !weather) {
    return null; // Don't show widget if weather data is unavailable
  }

  const rainWarning = weather.rainProbability > 60;

  if (variant === "compact") {
    return <CompactWeatherWidget weather={weather} rainWarning={rainWarning} />;
  }

  return <FullWeatherWidget weather={weather} city={city} rainWarning={rainWarning} />;
}
