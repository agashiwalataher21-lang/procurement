import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, SESSION_COOKIE_NAME, ROLES } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json(
        { error: "Setup has already been completed. Contact an administrator to create more accounts." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        role: ROLES.ADMIN,
        status: "ACTIVE",
      },
    });

    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json(
      {
        message: "Administrator account created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );

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
    console.error("Setup error:", error);
    return NextResponse.json({ error: error.message || "Failed to initialize setup" }, { status: 500 });
  }
}
