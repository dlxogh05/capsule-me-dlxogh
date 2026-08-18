export const CAPSULE_SHAPES = [
  "orb",
  "drop",
  "crystal",
  "cloud",
  "petal",
  "shard",
] as const;

export type CapsuleShape = (typeof CAPSULE_SHAPES)[number];

export type WeatherSource = "kma" | "open-meteo";

export type WeatherSnapshot = {
  condition: string;
  temperature: number;
  humidity: number;
  source: WeatherSource;
  capturedAt: string;
};

export type CapsuleAura = {
  quote: string;
  keywords: string[];
  shape: CapsuleShape;
  fill: string;
  accent: string;
  glow: string;
};

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isCapsuleShape(value: string): value is CapsuleShape {
  return (CAPSULE_SHAPES as readonly string[]).includes(value);
}

export function isHexColor(value: string) {
  return HEX.test(value);
}

export function clampQuote(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.slice(0, 48);
}

export function clampKeywords(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const unique: string[] = [];

  for (const item of values) {
    if (typeof item !== "string") {
      continue;
    }

    const keyword = item.replace(/\s+/g, " ").trim().slice(0, 16);
    if (!keyword || unique.includes(keyword)) {
      continue;
    }

    unique.push(keyword);
    if (unique.length === 5) {
      break;
    }
  }

  return unique;
}

export function parseWeather(value: unknown): WeatherSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  const source = data.source;
  const temperature = Number(data.temperature);
  const humidity = Number(data.humidity);

  if (
    typeof data.condition !== "string" ||
    !data.condition ||
    !Number.isFinite(temperature) ||
    !Number.isFinite(humidity) ||
    (source !== "kma" && source !== "open-meteo") ||
    typeof data.capturedAt !== "string"
  ) {
    return null;
  }

  return {
    condition: data.condition.slice(0, 40),
    temperature,
    humidity,
    source,
    capturedAt: data.capturedAt.slice(0, 40),
  };
}

export function parseAura(value: unknown): CapsuleAura | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  if (
    typeof data.quote !== "string" ||
    typeof data.shape !== "string" ||
    !isCapsuleShape(data.shape) ||
    typeof data.fill !== "string" ||
    typeof data.accent !== "string" ||
    typeof data.glow !== "string" ||
    !isHexColor(data.fill) ||
    !isHexColor(data.accent) ||
    !isHexColor(data.glow)
  ) {
    return null;
  }

  const keywords = clampKeywords(data.keywords);
  if (keywords.length === 0) {
    return null;
  }

  return {
    quote: clampQuote(data.quote),
    keywords,
    shape: data.shape,
    fill: data.fill,
    accent: data.accent,
    glow: data.glow,
  };
}

export function auraFromWeather(
  weather: WeatherSnapshot,
  extraKeywords: string[] = [],
): CapsuleAura {
  const raining = /비|뇌우|이슬비/.test(weather.condition);
  const snowing = /눈/.test(weather.condition);
  const storm = /뇌우|번개/.test(weather.condition);
  const cloudy = /흐림|구름|안개/.test(weather.condition);
  const humid = weather.humidity >= 70;
  const dry = weather.humidity <= 40;
  const hot = weather.temperature >= 28;
  const cold = weather.temperature <= 5;

  let shape: CapsuleShape = "orb";
  let fill = "#e4c48a";
  let accent = "#c4924a";
  let glow = "#f7e4c4";
  let quote = "오늘의 공기가 캡슐 안에 스며들었어요.";

  if (snowing) {
    shape = "crystal";
    fill = "#e8eef7";
    accent = "#8aa3c2";
    glow = "#ffffff";
    quote = "고요한 흰 공기가 잠시 머물다 가요.";
  } else if (storm) {
    shape = "shard";
    fill = "#5c5370";
    accent = "#2e2840";
    glow = "#9b90b8";
    quote = "하늘이 크게 숨 쉬는 날이에요.";
  } else if (raining) {
    shape = "drop";
    fill = "#6d8eaa";
    accent = "#3d5d78";
    glow = "#c5d7e8";
    quote = "물기가 창을 지나며 하루를 적셔요.";
  } else if (cloudy) {
    shape = "cloud";
    fill = "#c2bbb0";
    accent = "#8a8276";
    glow = "#ebe6dc";
    quote = "구름 아래, 오늘은 조금 느려도 좋아요.";
  } else if (hot && humid) {
    shape = "petal";
    fill = "#d9a07a";
    accent = "#b56a48";
    glow = "#f3d3b8";
    quote = "더운 공기가 꽃잎처럼 몸을 감싸요.";
  } else if (cold) {
    shape = "shard";
    fill = "#9eb8d4";
    accent = "#5d7fa3";
    glow = "#dce8f4";
    quote = "찬 공기가 하루의 윤곽을 선명하게 해요.";
  } else if (hot) {
    shape = "orb";
    fill = "#f0c36a";
    accent = "#d4923a";
    glow = "#ffe7b0";
    quote = "볕이 오래 머문 하루를 둥글게 담아요.";
  } else if (humid) {
    shape = "petal";
    fill = "#7fb8aa";
    accent = "#4d8a7c";
    glow = "#cfe8e0";
    quote = "습한 공기가 부드럽게 감겨들어요.";
  }

  const keywords = clampKeywords([
    ...extraKeywords,
    weather.condition,
    `${Math.round(weather.temperature)}°`,
    humid ? "습함" : dry ? "건조" : "산뜻",
  ]);

  return {
    quote,
    keywords,
    shape,
    fill,
    accent,
    glow,
  };
}

export function formatWeatherLine(weather: WeatherSnapshot, place?: string) {
  const line = `${weather.condition} · ${Math.round(weather.temperature)}° · 습도 ${Math.round(weather.humidity)}%`;
  return place ? `${place} · ${line}` : line;
}
