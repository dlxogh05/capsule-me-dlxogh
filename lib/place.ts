export const SEOUL = { lat: 37.5665, lon: 126.978, place: "서울" };

const CITY_KO: Record<string, string> = {
  Seoul: "서울",
  Busan: "부산",
  Pusan: "부산",
  Incheon: "인천",
  Daegu: "대구",
  Daejeon: "대전",
  Gwangju: "광주",
  Suwon: "수원",
  Ulsan: "울산",
  Seongnam: "성남",
  Goyang: "고양",
  Yongin: "용인",
  Changwon: "창원",
  Cheongju: "청주",
  Jeonju: "전주",
  Cheonan: "천안",
  Gimhae: "김해",
  Pohang: "포항",
  Jeju: "제주",
};

export type GeoPlace = {
  lat: number;
  lon: number;
  place: string;
};

function localizeCity(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return SEOUL.place;
  }

  return CITY_KO[trimmed] ?? CITY_KO[trimmed.replace(/-si$/i, "")] ?? trimmed;
}

function isPrivateIp(ip: string) {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("::ffff:127.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

function clientIp(headerList: Headers) {
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = headerList.get("x-real-ip")?.trim();
  const vercel = headerList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || real || vercel;

  if (!ip || isPrivateIp(ip)) {
    return null;
  }

  return ip;
}

function parseCoord(value: string | null) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fromVercel(headerList: Headers): GeoPlace | null {
  const lat = parseCoord(headerList.get("x-vercel-ip-latitude"));
  const lon = parseCoord(headerList.get("x-vercel-ip-longitude"));
  const rawCity = headerList.get("x-vercel-ip-city");

  if (lat == null || lon == null || (lat === 0 && lon === 0)) {
    return null;
  }

  let city = "";
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }

  return {
    lat,
    lon,
    place: localizeCity(city || SEOUL.place),
  };
}

async function fromIp(ip: string): Promise<GeoPlace | null> {
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      success?: boolean;
      city?: string;
      latitude?: number;
      longitude?: number;
    };

    if (data.success === false || !Number.isFinite(Number(data.latitude)) || !Number.isFinite(Number(data.longitude))) {
      return null;
    }

    return {
      lat: Number(data.latitude),
      lon: Number(data.longitude),
      place: localizeCity(data.city || SEOUL.place),
    };
  } catch {
    return null;
  }
}

export async function resolvePlace(headerList: Headers): Promise<GeoPlace> {
  const vercel = fromVercel(headerList);
  if (vercel) {
    return vercel;
  }

  const ip = clientIp(headerList);
  if (ip) {
    const looked = await fromIp(ip);
    if (looked) {
      return looked;
    }
  }

  return SEOUL;
}

export type PlaceHit = GeoPlace & {
  region?: string;
};

export async function searchPlaces(query: string): Promise<PlaceHit[]> {
  const q = query.trim().slice(0, 40);
  if (q.length < 1) {
    return [];
  }

  const data = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=ko`,
    { cache: "no-store", signal: AbortSignal.timeout(6000) },
  ).then((response) => {
    if (!response.ok) {
      throw new Error(`geocode ${response.status}`);
    }
    return response.json() as Promise<{
      results?: Array<{
        name?: string;
        latitude?: number;
        longitude?: number;
        country_code?: string;
        admin1?: string;
        admin2?: string;
      }>;
    }>;
  });

  const ranked = (data.results ?? [])
    .flatMap((item) => {
      const lat = Number(item.latitude);
      const lon = Number(item.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return [];
      }

      const place = localizeCity(item.name || "");
      const region = [item.admin2, item.admin1].filter(Boolean).join(" · ");
      return [
        {
          lat,
          lon,
          place,
          region,
          korea: item.country_code === "KR",
        },
      ];
    })
    .sort((left, right) => Number(right.korea) - Number(left.korea));

  return ranked.map((item) => ({
    lat: item.lat,
    lon: item.lon,
    place: item.place,
    region: item.region,
  }));
}

export async function reversePlace(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=ko&zoom=12`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "capsule-me-dlxogh/weather" },
      },
    );
    if (!response.ok) {
      return SEOUL.place;
    }

    const data = (await response.json()) as {
      address?: {
        city?: string;
        town?: string;
        county?: string;
        city_district?: string;
        suburb?: string;
        quarter?: string;
        state?: string;
      };
    };
    const address = data.address ?? {};
    const district = address.city_district || address.suburb || address.quarter;
    const city = localizeCity(address.city || address.town || address.county || address.state || "");
    const label = [district, city].filter(Boolean).join(" · ");
    return label || city || SEOUL.place;
  } catch {
    return SEOUL.place;
  }
}
