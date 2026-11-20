import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Money } from "@/lib/decimal";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const brand = searchParams.get("brand") || "";

    const where: any = { status: "ACTIVE" };

    if (search) {
      where.OR = [
        { itemCode: { contains: search } },
        { itemName: { contains: search } },
        { description: { contains: search } },
        { oemCode: { contains: search } },
        { barcode: { contains: search } },
        { altItemCode: { contains: search } },
        { modelCompatibility: { contains: search } },
      ];
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (brand && brand !== "ALL") {
      where.brand = brand;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { itemName: "asc" },
    });

    const serialized = products.map((p) => ({
      ...p,
      defaultPurchasePrice: p.defaultPurchasePrice / 100,
    }));

    return NextResponse.json({ products: serialized });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Admin";

    const body = await request.json();
    const {
      itemCode,
      itemName,
      description,
      brand,
      category,
      unitOfMeasurement,
      purchaseUnit,
      stockUnit,
      conversionFactor,
      defaultPurchasePrice = 0,
      currency,
      productPicture,
      minStock = 10,
      maxStock = 100,
      reorderLevel = 25,
      safetyStock = 15,
      supplierLeadTime = 14,
      avgDailyUsage = 0,
      oemCode,
      barcode,
      alternativeItemCode,
      modelCompatibility,
      preferredSupplierId,
    } = body;

    if (!itemCode || !itemName) {
      return NextResponse.json({ error: "Item Code and Item Name are required" }, { status: 400 });
    }

    const rawPrice = parseFloat(defaultPurchasePrice);
    if (!isNaN(rawPrice) && rawPrice < 0) {
      return NextResponse.json({ error: "Default purchase price cannot be negative" }, { status: 400 });
    }

    if (parseFloat(minStock) < 0 || parseFloat(maxStock) < 0 || parseFloat(reorderLevel) < 0) {
      return NextResponse.json({ error: "Stock levels cannot be negative" }, { status: 400 });
    }

    // Check unique itemCode
    const existing = await prisma.product.findUnique({
      where: { itemCode },
    });
    if (existing) {
      return NextResponse.json({ error: `Item code ${itemCode} already exists` }, { status: 400 });
    }

    const priceFils = Money.toFils(defaultPurchasePrice);

    const product = await prisma.product.create({
      data: {
        itemCode,
        itemName,
        description: description || null,
        brand: brand || "Generic",
        category: category || "Motorcycle Spare Parts",
        unitOfMeasurement: unitOfMeasurement || "PCS",
        purchaseUnit: purchaseUnit || unitOfMeasurement || "PCS",
        stockUnit: stockUnit || unitOfMeasurement || "PCS",
        conversionFactor: parseFloat(conversionFactor) || 1.0,
        defaultPurchasePrice: priceFils,
        currency: currency || "AED",
        productPicture: productPicture || null,
        minStock: parseFloat(minStock) || 10,
        maxStock: parseFloat(maxStock) || 100,
        reorderLevel: parseFloat(reorderLevel) || 25,
        safetyStock: parseFloat(safetyStock) || 15,
        supplierLeadTime: parseInt(supplierLeadTime, 10) || 14,
        avgDailyUsage: parseFloat(avgDailyUsage) || 0,
        oemCode: oemCode || null,
        barcode: barcode || null,
        altItemCode: alternativeItemCode || null,
        modelCompatibility: modelCompatibility || null,
        preferredSupplierId: preferredSupplierId || null,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Products",
        transactionNumber: product.itemCode,
        action: "CREATE_PRODUCT",
        updatedValue: `Created product ${product.itemName} (${product.itemCode})`,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
