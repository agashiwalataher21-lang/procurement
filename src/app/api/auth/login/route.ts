import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
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
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}
