import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";

    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { customerId: { contains: search } },
              { phone: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : undefined,
      include: {
        salesInvoices: {
          select: {
            id: true,
            grandTotal: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = customers.map((c) => {
      const totalInvoiced = c.salesInvoices.reduce((s, i) => s + i.grandTotal, 0) / 100;
      return {
        ...c,
        totalInvoiced,
        openingBalance: c.openingBalance / 100,
        invoicesCount: c.salesInvoices.length,
      };
    });

    return NextResponse.json({ customers: serialized });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const {
      name,
      contactPerson,
      phone,
      email,
      country = "UAE",
      address,
      trn,
      paymentTerms = "Net 30",
      creditLimit = 50000,
      currency = "AED",
      openingBalance = 0,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    // Auto-generate customerId: CUST-001, CUST-002, etc.
    const count = await prisma.customer.count();
    const customerId = `CUST-${String(count + 1).padStart(3, "0")}`;

    const customer = await prisma.customer.create({
      data: {
        customerId,
        name: name.trim(),
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email ? email.toLowerCase().trim() : null,
        country,
        address: address || null,
        trn: trn || null,
        paymentTerms,
        creditLimit: parseFloat(creditLimit) || 50000,
        currency,
        openingBalance: Math.round((parseFloat(openingBalance) || 0) * 100), // in fils
        status: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: user?.name || "Admin",
        module: "Customers",
        transactionNumber: customer.customerId,
        action: "CREATE_CUSTOMER",
        updatedValue: `Created customer ${customer.name} (${customer.customerId}) - Country: ${customer.country}`,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: error.message || "Failed to create customer" }, { status: 500 });
  }
}
