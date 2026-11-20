import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { supplierId: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      country,
      trn,
      currency,
      paymentTerms,
      bankDetails,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }

    // Auto-generate unique supplier ID: SUP-001, SUP-002, etc.
    const lastSupplier = await prisma.supplier.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const nextNum = lastSupplier && lastSupplier.supplierId.startsWith("SUP-")
      ? (parseInt(lastSupplier.supplierId.replace("SUP-", ""), 10) || 0) + 1
      : (await prisma.supplier.count()) + 1;
    let supplierId = `SUP-${String(nextNum).padStart(3, "0")}`;

    // Ensure uniqueness guarantee
    let exists = await prisma.supplier.findUnique({ where: { supplierId } });
    let safety = 0;
    while (exists && safety < 100) {
      safety++;
      supplierId = `SUP-${String(nextNum + safety).padStart(3, "0")}`;
      exists = await prisma.supplier.findUnique({ where: { supplierId } });
    }

    const supplier = await prisma.supplier.create({
      data: {
        supplierId,
        name,
        contactPerson,
        phone,
        email,
        address,
        country: country || "UAE",
        trn,
        currency: currency || "AED",
        paymentTerms: paymentTerms || "30 Days",
        bankDetails,
        notes,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        employeeName: "Taher",
        module: "Suppliers",
        transactionNumber: supplier.supplierId,
        action: "CREATE_SUPPLIER",
        updatedValue: `Created supplier ${supplier.name} (${supplier.supplierId})`,
      },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
