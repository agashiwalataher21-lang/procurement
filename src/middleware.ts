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

  // Allow public API routes
  if (PUBLIC_API_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for session cookie or authorization header
  const sessionCookie = request.cookies.get("bah_session")?.value;
  const authHeader = request.headers.get("authorization");

  if (!sessionCookie && !authHeader) {
    return NextResponse.json(
      { error: "Unauthorized: Valid session required" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
