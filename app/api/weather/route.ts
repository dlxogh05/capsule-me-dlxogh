import { NextRequest } from "next/server";
import { readLiveSky } from "@/lib/live-sky";

function optionalNumber(value: string | null) {
  if (value == null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const sky = await readLiveSky({
      headers: request.headers,
      lat: optionalNumber(request.nextUrl.searchParams.get("lat")),
      lon: optionalNumber(request.nextUrl.searchParams.get("lon")),
      place: request.nextUrl.searchParams.get("place")?.trim().slice(0, 40) || undefined,
    });

    return Response.json(sky, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch {
    return Response.json(
      { error: "날씨를 읽지 못했어요." },
      { status: 502 },
    );
  }
}
