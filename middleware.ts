import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

function fromBase64Url(input: string) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function verifySession(cookieValue: string | undefined) {
  if (!cookieValue) return null;

  const dotIndex = cookieValue.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const encoded = cookieValue.slice(0, dotIndex);
  const signature = cookieValue.slice(dotIndex + 1);

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(encoded));
    const expected = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expected !== signature) return null;

    const json = new TextDecoder().decode(fromBase64Url(encoded));
    return JSON.parse(json) as { userId: number; role: string; nickname: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("session")?.value;
    const session = await verifySession(sessionCookie);

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/hub", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
