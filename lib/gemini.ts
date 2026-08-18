import {
  auraFromWeather,
  clampKeywords,
  clampQuote,
  isCapsuleShape,
  isHexColor,
  type CapsuleAura,
  type WeatherSnapshot,
} from "@/lib/capsule-aura";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.7-flash";

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
  }>;
  error?: { message?: string };
};

function readText(payload: GeminiResponse) {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => part.text)
    .filter((text): text is string => Boolean(text))
    .join("")
    .trim();
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const stripped = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(stripped) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function toAura(raw: Record<string, unknown>, fallback: CapsuleAura): CapsuleAura {
  const shape = typeof raw.shape === "string" && isCapsuleShape(raw.shape) ? raw.shape : fallback.shape;
  const fill = typeof raw.fill === "string" && isHexColor(raw.fill) ? raw.fill : fallback.fill;
  const accent = typeof raw.accent === "string" && isHexColor(raw.accent) ? raw.accent : fallback.accent;
  const glow = typeof raw.glow === "string" && isHexColor(raw.glow) ? raw.glow : fallback.glow;
  const quote = typeof raw.quote === "string" ? clampQuote(raw.quote) : fallback.quote;
  const keywords = clampKeywords([
    ...(Array.isArray(raw.keywords) ? raw.keywords : []),
    ...fallback.keywords,
  ]);

  return {
    quote: quote || fallback.quote,
    keywords: keywords.length > 0 ? keywords : fallback.keywords,
    shape,
    fill,
    accent,
    glow,
  };
}

export async function composeCapsuleAura(input: {
  weather: WeatherSnapshot;
  letter: string;
  recipient: string;
}): Promise<CapsuleAura> {
  const fallback = auraFromWeather(input.weather, input.recipient ? [input.recipient] : []);
  const key = process.env.GEMINI_API_KEY?.trim();

  if (!key) {
    return fallback;
  }

  const letter = input.letter.trim().slice(0, 1500);
  const prompt = [
    "타임캡슐을 봉인한다. 편지는 열람일까지 비밀이다.",
    `날씨: ${input.weather.condition}, 기온 ${input.weather.temperature}°C, 습도 ${input.weather.humidity}%`,
    input.recipient ? `받는 사람: ${input.recipient}` : "",
    letter ? `편지(비밀, 인용 금지):\n${letter}` : "편지 없음",
    "",
    "JSON 필드:",
    "- quote: 한국어 한 문장, 40자 이내. 그날 날씨의 기운. 편지 문장을 그대로 쓰지 말 것.",
    "- keywords: 3~5개. 열리기 전 힌트가 되는 짧은 단어. 편지 문장 금지. 날씨 단어 1개 포함.",
    "- shape: orb(맑음) drop(비) crystal(눈) cloud(흐림) petal(습하고 따뜻) shard(차갑거나 뇌우)",
    "- fill, accent, glow: #RRGGBB. 형광 금지. 물감처럼 차분한 색. 기온이 높으면 따뜻, 낮으면 차갑, 습하면 청록.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You design weather-bound time capsules. Reply with JSON only.",
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: "LOW" },
          maxOutputTokens: 2048,
          responseSchema: {
            type: "OBJECT",
            properties: {
              quote: { type: "STRING" },
              keywords: { type: "ARRAY", items: { type: "STRING" } },
              shape: {
                type: "STRING",
                enum: ["orb", "drop", "crystal", "cloud", "petal", "shard"],
              },
              fill: { type: "STRING" },
              accent: { type: "STRING" },
              glow: { type: "STRING" },
            },
            required: ["quote", "keywords", "shape", "fill", "accent", "glow"],
          },
        },
      }),
    },
  );

  const payload = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "gemini request failed");
  }

  const raw = parseJsonObject(readText(payload));
  if (!raw) {
    return fallback;
  }

  return toAura(raw, fallback);
}
