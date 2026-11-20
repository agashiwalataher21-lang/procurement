import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, getCurrentUser, requireAuth, ROLES } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, targetUserId } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 });
    }

    // Admin can reset any user's password; regular users can only reset their own and must provide current password
    if (targetUserId && targetUserId !== user.id) {
      if (user.role !== ROLES.ADMIN) {
        return NextResponse.json({ error: "Forbidden: Only administrators can reset other users' passwords" }, { status: 403 });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
      }

      const passwordHash = hashPassword(newPassword);
      await prisma.user.update({
        where: { id: targetUserId },
        data: { passwordHash },
      });

      // Invalidate target user's active sessions
      await prisma.session.deleteMany({ where: { userId: targetUserId } });

      return NextResponse.json({ message: `Password reset successfully for ${targetUser.email}` });
    } else {
      // Self password reset
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isValid = verifyPassword(currentPassword, dbUser.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      const passwordHash = hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      return NextResponse.json({ message: "Password updated successfully" });
    }
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 500 });
  }
}
