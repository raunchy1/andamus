// Open-Meteo API integration for weather data
// Free API, no API key required - https://open-meteo.com

export interface WeatherData {
  date: string;
  weatherCode: number;
  maxTemp: number;
  minTemp: number;
  rainProbability: number;
}

// WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs
export const WEATHER_CODES: Record<number, { icon: string; label: string; description: string }> = {
  0: { icon: '☀️', label: 'Soleggiato', description: 'Clear sky' },
  1: { icon: '🌤️', label: 'Prevalentemente soleggiato', description: 'Mainly clear' },
  2: { icon: '⛅', label: 'Parzialmente nuvoloso', description: 'Partly cloudy' },
  3: { icon: '☁️', label: 'Nuvoloso', description: 'Overcast' },
  45: { icon: '🌫️', label: 'Nebbia', description: 'Fog' },
  48: { icon: '🌫️', label: 'Nebbia con brina', description: 'Depositing rime fog' },
  51: { icon: '🌧️', label: 'Pioviggine leggera', description: 'Light drizzle' },
  53: { icon: '🌧️', label: 'Pioviggine moderata', description: 'Moderate drizzle' },
  55: { icon: '🌧️', label: 'Pioviggine intensa', description: 'Dense drizzle' },
  56: { icon: '🌧️', label: 'Pioviggine gelata leggera', description: 'Light freezing drizzle' },
  57: { icon: '🌧️', label: 'Pioviggine gelata intensa', description: 'Dense freezing drizzle' },
  61: { icon: '🌧️', label: 'Pioggia leggera', description: 'Slight rain' },
  63: { icon: '🌧️', label: 'Pioggia moderata', description: 'Moderate rain' },
  65: { icon: '🌧️', label: 'Pioggia intensa', description: 'Heavy rain' },
  66: { icon: '🌨️', label: 'Pioggia gelata leggera', description: 'Light freezing rain' },
  67: { icon: '🌨️', label: 'Pioggia gelata intensa', description: 'Heavy freezing rain' },
  71: { icon: '🌨️', label: 'Nevicate leggere', description: 'Slight snow fall' },
  73: { icon: '🌨️', label: 'Nevicate moderate', description: 'Moderate snow fall' },
  75: { icon: '🌨️', label: 'Nevicate intense', description: 'Heavy snow fall' },
  77: { icon: '🌨️', label: 'Granelli di neve', description: 'Snow grains' },
  80: { icon: '🌧️', label: 'Rovesci leggeri', description: 'Slight rain showers' },
  81: { icon: '🌧️', label: 'Rovesci moderati', description: 'Moderate rain showers' },
  82: { icon: '🌧️', label: 'Rovesci violenti', description: 'Violent rain showers' },
  85: { icon: '🌨️', label: 'Rovesci di neve leggeri', description: 'Slight snow showers' },
  86: { icon: '🌨️', label: 'Rovesci di neve intensi', description: 'Heavy snow showers' },
  95: { icon: '⛈️', label: 'Temporale', description: 'Thunderstorm' },
  96: { icon: '⛈️', label: 'Temporale con grandine leggera', description: 'Thunderstorm with slight hail' },
  99: { icon: '⛈️', label: 'Temporale con grandine intensa', description: 'Thunderstorm with heavy hail' },
};

export function getWeatherInfo(code: number): { icon: string; label: string; description: string } {
  return WEATHER_CODES[code] || { icon: '❓', label: 'Sconosciuto', description: 'Unknown' };
}

// Check if weather code indicates rain/snow
export function hasPrecipitation(code: number): boolean {
  return code >= 51 && code <= 67 || // Drizzle and rain
         code >= 71 && code <= 77 || // Snow
         code >= 80 && code <= 82 || // Rain showers
         code >= 85 && code <= 86 || // Snow showers
         code >= 95; // Thunderstorm
}

// Fetch weather data from Open-Meteo API
export async function getWeather(
  lat: number,
  lng: number,
  date: string
): Promise<WeatherData | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lng.toString());
    url.searchParams.append('daily', 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
    url.searchParams.append('timezone', 'Europe/Rome');
    url.searchParams.append('start_date', date);
    url.searchParams.append('end_date', date);

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.daily) {
      return null;
    }

    return {
      date,
      weatherCode: data.daily.weathercode[0],
      maxTemp: Math.round(data.daily.temperature_2m_max[0]),
      minTemp: Math.round(data.daily.temperature_2m_min[0]),
      rainProbability: data.daily.precipitation_probability_max[0],
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

// Get weather for a Sardinian city
export async function getWeatherForCity(
  city: string,
  date: string
): Promise<WeatherData | null> {
  const { SARDINIA_CITIES } = await import('./sardinia-cities');
  const coords = SARDINIA_CITIES[city];
  
  if (!coords) {
    console.warn(`Coordinates not found for city: ${city}`);
    return null;
  }

  return getWeather(coords.lat, coords.lng, date);
}
