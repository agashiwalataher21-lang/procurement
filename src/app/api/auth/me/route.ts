import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const userCount = await prisma.user.count();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        setupRequired: userCount === 0,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user,
      setupRequired: false,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ error: "Failed to check session" }, { status: 500 });
  }
}
