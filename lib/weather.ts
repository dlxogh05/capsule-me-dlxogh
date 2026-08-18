import type { WeatherSnapshot } from "@/lib/capsule-aura";

const SEOUL = { lat: 37.5665, lon: 126.978 };

type KmaItem = {
  category?: string;
  obsrValue?: string;
  fcstValue?: string;
  fcstDate?: string;
  fcstTime?: string;
};

function toGrid(lat: number, lon: number) {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

function kmaBase() {
  const now = new Date();
  const stamp = new Date(now.getTime() - 40 * 60 * 1000);
  const kst = new Date(stamp.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  const h = String(kst.getUTCHours()).padStart(2, "0");
  return { baseDate: `${y}${m}${d}`, baseTime: `${h}00` };
}

function asItems(value: unknown): KmaItem[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? (value as KmaItem[]) : [value as KmaItem];
}

function ptyLabel(code: string) {
  switch (code) {
    case "1":
    case "5":
      return "비";
    case "2":
    case "6":
      return "비/눈";
    case "3":
    case "7":
      return "눈";
    default:
      return "";
  }
}

function skyLabel(code: string) {
  switch (code) {
    case "1":
      return "맑음";
    case "3":
      return "구름많음";
    case "4":
      return "흐림";
    default:
      return "맑음";
  }
}

function wmoLabel(code: number) {
  if (code === 0) return "맑음";
  if (code <= 2) return "구름조금";
  if (code === 3) return "흐림";
  if (code === 45 || code === 48) return "안개";
  if (code >= 51 && code <= 57) return "이슬비";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "비";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "눈";
  if (code >= 95) return "뇌우";
  return "흐림";
}

async function fetchJson(url: string, timeoutMs = 8000) {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json" },
  });

  const text = await response.text();
  if (!response.ok || text.trimStart().startsWith("<")) {
    throw new Error(`weather http ${response.status}`);
  }

  return JSON.parse(text) as unknown;
}

async function fetchKma(lat: number, lon: number): Promise<WeatherSnapshot> {
  const key = process.env.DATA_GO_KR_KEY?.trim();
  if (!key) {
    throw new Error("DATA_GO_KR_KEY missing");
  }

  const { nx, ny } = toGrid(lat, lon);
  const { baseDate, baseTime } = kmaBase();
  const common = `serviceKey=${encodeURIComponent(key)}&pageNo=1&numOfRows=60&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

  const ncst = (await fetchJson(
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?${common}`,
  )) as {
    response?: {
      header?: { resultCode?: string; resultMsg?: string };
      body?: { items?: { item?: KmaItem | KmaItem[] } };
    };
  };

  const header = ncst?.response?.header;
  if (header?.resultCode && header.resultCode !== "00") {
    throw new Error(header.resultMsg ?? "kma header");
  }

  const items = asItems(ncst?.response?.body?.items?.item);
  const map = new Map(
    items
      .filter((item) => item.category && item.obsrValue != null)
      .map((item) => [item.category as string, item.obsrValue as string]),
  );

  const temperature = Number(map.get("T1H"));
  const humidity = Number(map.get("REH"));
  if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) {
    throw new Error("kma missing T1H/REH");
  }

  let condition = ptyLabel(map.get("PTY") ?? "0");
  if (!condition) {
    try {
      const fcst = (await fetchJson(
        `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?${common}`,
      )) as {
        response?: { body?: { items?: { item?: KmaItem | KmaItem[] } } };
      };
      const sky = asItems(fcst?.response?.body?.items?.item).find(
        (item) => item.category === "SKY" && item.fcstValue,
      );
      condition = skyLabel(sky?.fcstValue ?? "1");
    } catch {
      condition = "맑음";
    }
  }

  return {
    condition,
    temperature,
    humidity,
    source: "kma",
    capturedAt: new Date().toISOString(),
  };
}

async function fetchOpenMeteo(lat: number, lon: number): Promise<WeatherSnapshot> {
  const data = (await fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FSeoul`,
  )) as {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      weather_code?: number;
    };
  };

  const temperature = Number(data?.current?.temperature_2m);
  const humidity = Number(data?.current?.relative_humidity_2m);
  const code = Number(data?.current?.weather_code);

  if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) {
    throw new Error("open-meteo missing fields");
  }

  return {
    condition: wmoLabel(Number.isFinite(code) ? code : 3),
    temperature,
    humidity,
    source: "open-meteo",
    capturedAt: new Date().toISOString(),
  };
}

export function normalizeCoords(lat?: number, lon?: number) {
  if (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  ) {
    return { lat, lon };
  }

  return SEOUL;
}

export async function readWeather(lat?: number, lon?: number): Promise<WeatherSnapshot> {
  const coords = normalizeCoords(lat, lon);

  try {
    return await fetchKma(coords.lat, coords.lon);
  } catch {
    return fetchOpenMeteo(coords.lat, coords.lon);
  }
}
