"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { WeatherCapsule } from "@/components/weather-capsule";
import { formatSkyLine, weatherSourceLabel, type LiveSky } from "@/lib/live-sky";
import type { GeoPlace, PlaceHit } from "@/lib/place";
import { fetchLiveSky, searchPlaceHits } from "@/lib/seal-client";

const PLACE_KEY = "capsule-me.place";

const SkyContext = createContext<LiveSky | null>(null);

export function useSky() {
  return useContext(SkyContext);
}

function readSavedPlace(): GeoPlace | null {
  try {
    const raw = window.localStorage.getItem(PLACE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<GeoPlace>;
    if (
      typeof parsed.lat === "number" &&
      typeof parsed.lon === "number" &&
      typeof parsed.place === "string" &&
      parsed.place &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lon)
    ) {
      return { lat: parsed.lat, lon: parsed.lon, place: parsed.place };
    }
  } catch {
    return null;
  }

  return null;
}

function writeSavedPlace(place: GeoPlace) {
  window.localStorage.setItem(PLACE_KEY, JSON.stringify(place));
}

function readGrantedCoords(): Promise<GeoPlace | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  const locate = () =>
    new Promise<GeoPlace | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            place: "",
          });
        },
        () => resolve(null),
        { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 4000 },
      );
    });

  if (!navigator.permissions?.query) {
    return Promise.resolve(null);
  }

  return navigator.permissions
    .query({ name: "geolocation" as PermissionName })
    .then((status) => (status.state === "granted" ? locate() : null))
    .catch(() => null);
}

export function SkyProvider({ children }: { children: ReactNode }) {
  const [sky, setSky] = useState<LiveSky | null>(null);
  const anchorRef = useRef<GeoPlace | null>(null);

  async function load(next?: GeoPlace | null) {
    const anchor = next ?? anchorRef.current;
    const value = await fetchLiveSky(anchor ?? undefined);
    const resolved = {
      lat: value.lat,
      lon: value.lon,
      place: value.place,
    };
    anchorRef.current = resolved;
    setSky(value);
    return resolved;
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const saved = readSavedPlace();
      const granted = saved ? null : await readGrantedCoords();
      if (cancelled) {
        return;
      }

      try {
        const resolved = await load(saved ?? granted);
        if (!cancelled && (saved || granted)) {
          writeSavedPlace(resolved);
        }
      } catch {
        if (!cancelled) {
          setSky(null);
        }
      }
    })();

    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function choosePlace(place: GeoPlace) {
    writeSavedPlace(place);
    await load(place);
  }

  return (
    <SkyContext.Provider value={sky}>
      <NowSkyBar onChoose={choosePlace} sky={sky} />
      {children}
    </SkyContext.Provider>
  );
}

function NowSkyBar({
  sky,
  onChoose,
}: {
  sky: LiveSky | null;
  onChoose: (place: GeoPlace) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 1) {
      setHits([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void searchPlaceHits(q)
        .then((places) => {
          if (!cancelled) {
            setHits(places);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setHits([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <div className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 md:px-8">
        {sky ? (
          <>
            <WeatherCapsule aura={sky.aura} className="shrink-0" size="xs" />
            <div className="relative min-w-0 flex-1">
              <p className="text-[10px] font-medium tracking-[0.2em] text-mute uppercase">
                Now · {weatherSourceLabel(sky.weather.source)}
              </p>
              <button
                className="mt-0.5 block max-w-full truncate text-left text-sm text-ink underline-offset-4 hover:underline"
                onClick={() => setOpen((current) => !current)}
                type="button"
              >
                {formatSkyLine(sky)}
              </button>
              {open ? (
                <div className="absolute left-0 top-full z-30 mt-2 w-[min(100%,22rem)] rounded-2xl border border-line bg-white p-2 shadow-[0_20px_50px_-32px_rgb(28_25_23/0.35)]">
                  <input
                    autoFocus
                    className="min-h-10 w-full rounded-xl border border-line bg-[#faf8f4] px-3 text-sm text-ink outline-none focus:border-ink/25"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="동네 검색 · 해운대, 제주, 강남"
                    value={query}
                  />
                  <ul className="mt-2 max-h-56 overflow-auto">
                    {searching ? (
                      <li className="px-3 py-2 text-sm text-mute">찾는 중</li>
                    ) : null}
                    {!searching && query.trim() && hits.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-mute">없네요. 다른 지명을 적어 보세요.</li>
                    ) : null}
                    {hits.map((hit) => (
                      <li key={`${hit.lat},${hit.lon},${hit.place}`}>
                        <button
                          className="flex w-full flex-col items-start rounded-xl px-3 py-2 text-left hover:bg-[#faf8f4]"
                          onClick={() => {
                            setOpen(false);
                            setQuery("");
                            void onChoose(hit);
                          }}
                          type="button"
                        >
                          <span className="text-sm text-ink">{hit.place}</span>
                          {hit.region ? (
                            <span className="text-[11px] text-mute">{hit.region}</span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <p className="ml-auto hidden max-w-[16rem] truncate text-right text-sm text-mute sm:block">
              {sky.aura.quote}
            </p>
          </>
        ) : (
          <p className="text-sm text-mute">지금의 하늘을 읽고 있어요</p>
        )}
      </div>
    </div>
  );
}
