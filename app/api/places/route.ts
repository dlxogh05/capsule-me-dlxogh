import { NextRequest } from "next/server";
import { searchPlaces } from "@/lib/place";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 1) {
    return Response.json({ places: [] });
  }

  try {
    const places = await searchPlaces(query);
    return Response.json(
      { places },
      { headers: { "Cache-Control": "private, max-age=120" } },
    );
  } catch {
    return Response.json({ error: "장소를 찾지 못했어요." }, { status: 502 });
  }
}
