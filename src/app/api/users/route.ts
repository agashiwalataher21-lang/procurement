import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth, hashPassword, ROLES } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(request, [ROLES.ADMIN]);
    if (errorResponse) return errorResponse;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user: currentUser, errorResponse } = await requireAuth(request, [ROLES.ADMIN]);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { name, email, password = "TempPassword123!", role = "VIEWER", status = "ACTIVE" } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: `User with email ${email} already exists` }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const createdUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        status,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: currentUser?.name || "Admin",
        module: "User Management",
        transactionNumber: createdUser.id,
        action: "CREATE_USER",
        updatedValue: `Created user ${createdUser.name} (${createdUser.email}) with role ${createdUser.role}`,
      },
    });

    return NextResponse.json({ user: createdUser }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}
