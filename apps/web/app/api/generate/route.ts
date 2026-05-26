import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const payload = await req.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json(
      { error: `cannot reach backend (${API_BASE_URL}): ${message}` },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return Response.json(
      { error: `upstream ${upstream.status}: ${text.slice(0, 500)}` },
      { status: 502 }
    );
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
