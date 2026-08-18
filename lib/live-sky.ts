import { auraFromWeather, type CapsuleAura, type WeatherSnapshot } from "@/lib/capsule-aura";
import { resolvePlace, reversePlace, SEOUL, type GeoPlace } from "@/lib/place";
import { readWeather } from "@/lib/weather";

export type LiveSky = {
  weather: WeatherSnapshot;
  aura: CapsuleAura;
  place: string;
  lat: number;
  lon: number;
};

type CacheEntry = {
  at: number;
  value: LiveSky;
};

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function cacheKey(place: GeoPlace) {
  return `${place.lat.toFixed(2)},${place.lon.toFixed(2)}`;
}

function coordsFromQuery(lat?: number, lon?: number, place?: string): GeoPlace | null {
  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180 ||
    (lat === 0 && lon === 0)
  ) {
    return null;
  }

  return { lat, lon, place: place?.trim() || "" };
}

export async function readLiveSky(input: {
  headers: Headers;
  lat?: number;
  lon?: number;
  place?: string;
}): Promise<LiveSky> {
  const queried = coordsFromQuery(input.lat, input.lon, input.place);
  const geo = queried ?? (await resolvePlace(input.headers));
  const named =
    geo.place || (queried ? await reversePlace(geo.lat, geo.lon) : geo.place) || SEOUL.place;
  const resolved = { ...geo, place: named };
  const key = cacheKey(resolved);
  const hit = cache.get(key);

  if (hit && Date.now() - hit.at < TTL_MS) {
    return { ...hit.value, place: resolved.place, lat: resolved.lat, lon: resolved.lon };
  }

  const weather = await readWeather(resolved.lat, resolved.lon);
  const value: LiveSky = {
    weather,
    aura: auraFromWeather(weather),
    place: resolved.place,
    lat: resolved.lat,
    lon: resolved.lon,
  };

  cache.set(key, { at: Date.now(), value });
  return value;
}

export function formatSkyLine(sky: Pick<LiveSky, "weather" | "place">) {
  const { weather, place } = sky;
  return `${place} · ${weather.condition} · ${Math.round(weather.temperature)}° · 습도 ${Math.round(weather.humidity)}%`;
}

export function weatherSourceLabel(source: WeatherSnapshot["source"]) {
  return source === "kma" ? "기상청" : "열린 날씨";
}
