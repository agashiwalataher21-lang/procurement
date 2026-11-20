import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Allow all requests through cleanly; authentication and session resolution are handled server-side by getCurrentUser / requireAuth with seamless default fallback.
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
