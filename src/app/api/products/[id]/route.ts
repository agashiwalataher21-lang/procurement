import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Money } from "@/lib/decimal";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        poItems: {
          include: {
            purchaseOrder: {
              include: {
                supplier: true,
              },
            },
          },
          take: 15,
        },
        grnItems: {
          include: {
            goodsReceivedNote: true,
          },
          take: 15,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      defaultPurchasePrice: product.defaultPurchasePrice / 100,
    });
  } catch (error: any) {
    console.error("Error fetching product details:", error);
    return NextResponse.json({ error: "Failed to fetch product details" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Admin";

    const body = await request.json();
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const {
      itemCode,
      altItemCode,
      oemCode,
      barcode,
      itemName,
      description,
      brand,
      category,
      modelCompatibility,
      unitOfMeasurement,
      purchaseUnit,
      stockUnit,
      conversionFactor,
      defaultPurchasePrice,
      currency,
      minStock,
      maxStock,
      reorderLevel,
      safetyStock,
      supplierLeadTime,
      avgDailyUsage,
      productPicture,
      status,
    } = body;

    const priceFils = defaultPurchasePrice !== undefined ? Money.toFils(defaultPurchasePrice) : undefined;

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(itemCode !== undefined && { itemCode }),
        ...(altItemCode !== undefined && { altItemCode: altItemCode || null }),
        ...(oemCode !== undefined && { oemCode: oemCode || null }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(itemName !== undefined && { itemName }),
        ...(description !== undefined && { description }),
        ...(brand !== undefined && { brand }),
        ...(category !== undefined && { category }),
        ...(modelCompatibility !== undefined && { modelCompatibility: modelCompatibility || null }),
        ...(unitOfMeasurement !== undefined && { unitOfMeasurement }),
        ...(purchaseUnit !== undefined && { purchaseUnit }),
        ...(stockUnit !== undefined && { stockUnit }),
        ...(conversionFactor !== undefined && { conversionFactor: Number(conversionFactor) || 1 }),
        ...(priceFils !== undefined && { defaultPurchasePrice: priceFils }),
        ...(currency !== undefined && { currency }),
        ...(minStock !== undefined && { minStock: Number(minStock) || 0 }),
        ...(maxStock !== undefined && { maxStock: Number(maxStock) || 0 }),
        ...(reorderLevel !== undefined && { reorderLevel: Number(reorderLevel) || 0 }),
        ...(safetyStock !== undefined && { safetyStock: Number(safetyStock) || 0 }),
        ...(supplierLeadTime !== undefined && { supplierLeadTime: Number(supplierLeadTime) || 14 }),
        ...(avgDailyUsage !== undefined && { avgDailyUsage: Number(avgDailyUsage) || 0 }),
        ...(productPicture !== undefined && { productPicture: productPicture || null }),
        ...(status !== undefined && { status }),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Products",
        transactionNumber: updated.itemCode,
        action: "UPDATE_PRODUCT",
        previousValue: `Product: ${existing.itemName} (${existing.itemCode})`,
        updatedValue: `Updated: ${updated.itemName} (${updated.itemCode})`,
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Admin";

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Unlink foreign key relations safely so product can be deleted without FK constraint errors
      await tx.purchaseOrderItem.updateMany({ where: { productId: params.id }, data: { productId: null } });
      await tx.grnItem.updateMany({ where: { productId: params.id }, data: { productId: null } });
      await tx.invoiceItem.updateMany({ where: { productId: params.id }, data: { productId: null } });
      await tx.salesInvoiceItem.updateMany({ where: { productId: params.id }, data: { productId: null } });
      await tx.storeStock.deleteMany({ where: { productId: params.id } });
      await tx.stockTransferItem.deleteMany({ where: { productId: params.id } });
      await tx.stockMovement.deleteMany({ where: { productId: params.id } });
      await tx.supplierQuotation.deleteMany({ where: { productId: params.id } });
      await tx.product.delete({ where: { id: params.id } });
    });

    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Products",
        transactionNumber: product.itemCode,
        action: "DELETE_PRODUCT",
        updatedValue: `Deleted product ${product.itemName} (${product.itemCode})`,
      },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
