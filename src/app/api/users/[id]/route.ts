import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, ROLES } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user: currentUser, errorResponse } = await requireAuth(request, [ROLES.ADMIN]);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { name, email, role, status } = body;

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        email: email !== undefined ? email.toLowerCase().trim() : existing.email,
        role: role !== undefined ? role : existing.role,
        status: status !== undefined ? status : existing.status,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: currentUser?.name || "Admin",
        module: "User Management",
        transactionNumber: updatedUser.id,
        action: "UPDATE_USER",
        updatedValue: `Updated user ${updatedUser.name} (${updatedUser.email}) - Role: ${updatedUser.role}, Status: ${updatedUser.status}`,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user: currentUser, errorResponse } = await requireAuth(request, [ROLES.ADMIN]);
    if (errorResponse) return errorResponse;

    if (currentUser?.id === params.id) {
      return NextResponse.json({ error: "Cannot delete your own active administrator account" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safe deactivation: set status to INACTIVE and invalidate sessions
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: params.id } });
      await tx.user.update({
        where: { id: params.id },
        data: { status: "INACTIVE" },
      });
      await tx.auditLog.create({
        data: {
          employeeName: currentUser?.name || "Admin",
          module: "User Management",
          transactionNumber: params.id,
          action: "DEACTIVATE_USER",
          updatedValue: `Deactivated user ${existing.name} (${existing.email})`,
        },
      });
    });

    return NextResponse.json({ message: "User successfully deactivated and sessions terminated" });
  } catch (error: any) {
    console.error("Error deactivating user:", error);
    return NextResponse.json({ error: error.message || "Failed to deactivate user" }, { status: 500 });
  }
}
