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

async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  const pathSeg = path?.length ? path.join("/") : "";
  const target = `${BACKEND}/api/${pathSeg ? `${pathSeg}/` : ""}${req.nextUrl.search}`;

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
