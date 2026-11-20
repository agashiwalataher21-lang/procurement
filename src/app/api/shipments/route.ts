import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poId = searchParams.get("poId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (poId) {
      where.purchaseOrders = {
        some: { id: poId },
      };
    }
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { shipmentNumber: { contains: search } },
        { containerNumber: { contains: search } },
        { billOfLading: { contains: search } },
        { shippingCompany: { contains: search } },
      ];
    }

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { eta: "desc" },
      include: {
        purchaseOrders: {
          include: { supplier: true },
        },
        landedCosts: true,
      },
    });

    // Calculate summary statistics
    const totalShipments = shipments.length;
    const pendingShipments = shipments.filter((s) => s.status === "IN_TRANSIT").length;
    const deliveredShipments = shipments.filter((s) => s.status === "DELIVERED").length;

    return NextResponse.json({
      shipments,
      summary: {
        totalShipments,
        pendingShipments,
        deliveredShipments,
      },
    });
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json({ error: "Failed to fetch shipments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      poId,
      shipmentNumber,
      trackingNumber,
      carrier,
      etd,
      eta,
      actualArrivalDate,
      status = "IN_TRANSIT",
      notes,
      shippingCost = 0,
    } = body;

    if (!poId || !shipmentNumber) {
      return NextResponse.json(
        { error: "Purchase Order ID and shipment number are required" },
        { status: 400 }
      );
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { supplier: true },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        containerNumber: body.containerNumber || null,
        billOfLading: body.billOfLading || null,
        shippingCompany: carrier || null,
        portOfLoading: body.portOfLoading || null,
        portOfDischarge: body.portOfDischarge || "Jebel Ali Port, Dubai",
        etd: etd ? new Date(etd) : null,
        eta: eta ? new Date(eta) : null,
        actualArrivalDate: actualArrivalDate ? new Date(actualArrivalDate) : null,
        status,
        shippingCost: parseFloat(String(shippingCost)) || 0,
        notes: notes || null,
        purchaseOrders: {
          connect: { id: poId },
        },
      },
      include: {
        purchaseOrders: {
          include: { supplier: true },
        },
        landedCosts: true,
      },
    });

    // Update PO with shipmentId
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { shipmentId: shipment.id },
    });

    // Update PO status if delivery confirmed
    if (status === "DELIVERED" && actualArrivalDate) {
      await prisma.purchaseOrder.update({
        where: { id: poId },
        data: { status: "FULLY_RECEIVED" },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        employeeName: body.recordedBy || "Taher",
        module: "Shipments",
        transactionNumber: shipmentNumber,
        action: status === "DELIVERED" ? "DELIVERED_SHIPMENT" : "CREATE_SHIPMENT",
        updatedValue: `${carrier || "Unknown Carrier"} - ${trackingNumber || "No tracking"}`,
      },
    });

    return NextResponse.json({ shipment }, { status: 201 });
  } catch (error) {
    console.error("Error creating shipment:", error);
    return NextResponse.json({ error: "Failed to create shipment" }, { status: 500 });
  }
}
