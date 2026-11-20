import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    if (token) {
      await prisma.session.delete({ where: { token } }).catch(() => {});
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 });
  }
}
