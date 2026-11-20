import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, trn, phone, email } = await request.json();
    const duplicates: string[] = [];

    if (name && name.trim()) {
      const existingName = await prisma.supplier.findFirst({
        where: { name: { equals: name.trim() } },
      });
      if (existingName) {
        duplicates.push(`Supplier name "${name.trim()}" is already registered (ID: ${existingName.supplierId})`);
      }
    }

    if (trn && trn.trim()) {
      const existingTrn = await prisma.supplier.findFirst({
        where: { trn: { equals: trn.trim() } },
      });
      if (existingTrn) {
        duplicates.push(`TRN "${trn.trim()}" is already registered under "${existingTrn.name}"`);
      }
    }

    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      const existingPhone = await prisma.supplier.findFirst({
        where: { phone: { contains: cleanPhone } },
      });
      if (existingPhone) {
        duplicates.push(`Phone number "${cleanPhone}" is already associated with "${existingPhone.name}"`);
      }
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const existingEmail = await prisma.supplier.findFirst({
        where: { email: { equals: cleanEmail } },
      });
      if (existingEmail) {
        duplicates.push(`Email "${cleanEmail}" is already registered under "${existingEmail.name}"`);
      }
    }

    return NextResponse.json({ duplicates });
  } catch (error: any) {
    console.error("Duplicate check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
