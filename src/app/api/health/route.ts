import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Bait Al Hadaf Procurement ERP",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "unhealthy", error: error.message },
      { status: 500 }
    );
  }
}
