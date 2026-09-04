import { type NextRequest, NextResponse } from "next/server";

// server side only, so the instance address never reaches the browser
const BACKEND = (process.env.BACKEND_ORIGIN ?? "http://localhost:8000").replace(/\/$/, "");

// generating four posts takes a few seconds, and the whole call sits inside this function;
// the platform default is far too short for that
export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const target = `${BACKEND}/${path.join("/")}${req.nextUrl.search}`;

  // what backend needs
  const headers = new Headers();
  const authorization = req.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
    });
  } catch (e) {
    console.error(`proxy: ${req.method} ${target} failed`, e);
    return NextResponse.json(
      { detail: "Can't reach PoZt right now. Try again in a moment." },
      { status: 502 },
    );
  }

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
