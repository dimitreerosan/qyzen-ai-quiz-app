import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND =
  process.env.BACKEND_ORIGIN?.replace(/\/$/, "") || "https://qyzen-ai-quiz-app.onrender.com";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade"
]);

/** Build Render URL from the incoming path (params can be empty on some hosts; pathname is reliable). */
function upstreamTarget(req: NextRequest): string {
  let rest = req.nextUrl.pathname;
  if (rest.startsWith("/api")) {
    rest = rest.slice(4) || "/";
  }
  if (!rest.startsWith("/")) rest = `/${rest}`;
  if (rest !== "/" && !rest.endsWith("/")) rest = `${rest}/`;
  return `${BACKEND}/api${rest}${req.nextUrl.search}`;
}

async function proxy(req: NextRequest, _ctx: { params: Promise<{ path?: string[] }> }) {
  const target = upstreamTarget(req);

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || HOP_BY_HOP.has(lower)) return;
    headers.set(key, value);
  });

  const method = req.method;
  const body =
    method !== "GET" && method !== "HEAD" && method !== "OPTIONS" ? await req.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store"
    });
  } catch {
    return NextResponse.json(
      { detail: "Upstream API unreachable. Set BACKEND_ORIGIN on Vercel if the Render URL changed." },
      { status: 502 }
    );
  }

  const outHeaders = new Headers(upstream.headers);
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
