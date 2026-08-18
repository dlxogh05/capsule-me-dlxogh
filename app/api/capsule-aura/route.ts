import { auraFromWeather } from "@/lib/capsule-aura";
import { composeCapsuleAura } from "@/lib/gemini";
import { readLiveSky } from "@/lib/live-sky";

type AuraRequest = {
  lat?: number;
  lon?: number;
  place?: string;
  letter?: string;
  recipient?: string;
};

export async function POST(request: Request) {
  let body: AuraRequest = {};

  try {
    body = (await request.json()) as AuraRequest;
  } catch {
    body = {};
  }

  const letter = typeof body.letter === "string" ? body.letter : "";
  const recipient = typeof body.recipient === "string" ? body.recipient.slice(0, 80) : "";
  const lat = typeof body.lat === "number" && Number.isFinite(body.lat) ? body.lat : undefined;
  const lon = typeof body.lon === "number" && Number.isFinite(body.lon) ? body.lon : undefined;
  const place = typeof body.place === "string" ? body.place.trim().slice(0, 40) : undefined;

  try {
    const sky = await readLiveSky({
      headers: request.headers,
      lat,
      lon,
      place,
    });

    try {
      const aura = await composeCapsuleAura({
        weather: sky.weather,
        letter,
        recipient,
      });
      return Response.json({ weather: sky.weather, aura, place: sky.place });
    } catch {
      return Response.json({
        weather: sky.weather,
        aura: auraFromWeather(sky.weather, recipient ? [recipient] : []),
        place: sky.place,
      });
    }
  } catch {
    return Response.json(
      { error: "날씨를 읽지 못했어요." },
      { status: 502 },
    );
  }
}
