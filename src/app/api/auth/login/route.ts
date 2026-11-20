import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword, createSession, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If no users exist in the database (e.g. fresh install/deployment), auto-bootstrap initial Admin
    const userCount = await prisma.user.count();
    if (!user && userCount === 0) {
      const passwordHash = hashPassword(password);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: "Admin",
          passwordHash,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
    }

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid email or password. Default user: admin@baitalhadaf.ae" }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Failed to authenticate" }, { status: 500 });
  }
}
