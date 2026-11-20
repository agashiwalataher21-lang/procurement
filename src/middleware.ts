import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/setup",
  "/api/auth/logout",
  "/api/health",
  "/api/auth/me",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("bah_session")?.value;
  const authHeader = request.headers.get("authorization");

  // 1. API Route Protection
  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API_PATHS.some((path) => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    if (!sessionCookie && !authHeader) {
      return NextResponse.json(
        { error: "Unauthorized: Valid session required" },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // 2. Page Navigation Protection: redirect to /login if unauthenticated
  if (
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/setup") &&
    !pathname.includes(".")
  ) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf|xlsx|csv)).*)",
  ],
};
