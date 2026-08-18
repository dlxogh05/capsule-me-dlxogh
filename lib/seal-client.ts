import type { CapsuleAura, WeatherSnapshot } from "@/lib/capsule-aura";
import type { LiveSky } from "@/lib/live-sky";
import type { GeoPlace, PlaceHit } from "@/lib/place";

export type { LiveSky, PlaceHit };

export type SealPayload = {
  weather: WeatherSnapshot;
  aura: CapsuleAura;
  place?: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "요청에 실패했어요.");
  }
  return data;
}

export async function fetchLiveSky(anchor?: Pick<GeoPlace, "lat" | "lon" | "place">) {
  const params = new URLSearchParams();
  if (anchor) {
    params.set("lat", String(anchor.lat));
    params.set("lon", String(anchor.lon));
    if (anchor.place) {
      params.set("place", anchor.place);
    }
  }

  const query = params.toString();
  const response = await fetch(query ? `/api/weather?${query}` : "/api/weather", {
    cache: "no-store",
  });
  return readJson<LiveSky>(response);
}

export async function searchPlaceHits(query: string) {
  const response = await fetch(`/api/places?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
  });
  const data = await readJson<{ places: PlaceHit[] }>(response);
  return data.places;
}

export async function fetchCapsuleAura(input: {
  lat?: number;
  lon?: number;
  place?: string;
  letter: string;
  recipient: string;
}) {
  const response = await fetch("/api/capsule-aura", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<SealPayload>(response);
}
