import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const ROLES = {
  ADMIN: "ADMIN",
  PURCHASER: "PURCHASER",
  ACCOUNTANT: "ACCOUNTANT",
  STOREKEEPER: "STOREKEEPER",
  VIEWER: "VIEWER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
}

const SESSION_COOKIE_NAME = "bah_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash password with salt using scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a new DB session for a user
 */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  try {
    await prisma.session.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  } catch (e) {
    console.warn("Session table creation notice:", e);
  }

  return { token, expiresAt };
}

/**
 * Resolve session from token string
 */
export async function resolveSession(token: string): Promise<SessionUser | null> {
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) return null;

    // Check expiration
    if (session.expiresAt.getTime() < Date.now()) {
      // Delete expired session
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Check user status
    if (session.user.status !== "ACTIVE") {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as Role,
      status: session.user.status,
    };
  } catch (e) {
    console.error("Resolve session notice:", e);
    return null;
  }
}

/**
 * Extract token from Request (via Cookie header or Authorization: Bearer)
 */
export function getTokenFromRequest(req: Request | NextRequest): string | null {
  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7).trim();
  }

  // 2. Cookie header: bah_session=<token>
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

/**
 * Get current session user from an incoming Request.
 * Strictly resolves from database session token.
 * Returns null if unauthenticated, expired, or invalid.
 */
export async function getCurrentUser(req: Request | NextRequest): Promise<SessionUser | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  return await resolveSession(token);
}

/**
 * Require a valid authenticated user and optional role authorization from a request.
 * Returns 401 if unauthenticated or session invalid.
 * Returns 403 if role is not permitted.
 */
export async function requireAuth(
  req: Request | NextRequest,
  allowedRoles?: Role[]
): Promise<{ user: SessionUser | null; errorResponse?: Response }> {
  const user = await getCurrentUser(req);

  if (!user) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ error: "Unauthorized: Valid session required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({
          error: `Forbidden: Requires one of [${allowedRoles.join(", ")}], but your role is ${user.role}`,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { user };
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
