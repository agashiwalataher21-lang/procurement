import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        po: true,
        invoice: true,
        grn: true,
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, docType, supplierId, uploadedBy = "Taher" } = body;

    if (!title) {
      return NextResponse.json({ error: "Document title is required" }, { status: 400 });
    }

    const existing = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = await prisma.document.update({
      where: { id: params.id },
      data: {
        title,
        docType,
        supplierId: supplierId || null,
      },
      include: {
        supplier: true,
        po: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        employeeName: uploadedBy,
        module: "Documents Repository",
        transactionNumber: title,
        action: "UPDATE_DOCUMENT",
        updatedValue: `Document updated: ${title} (${docType})`,
      },
    });

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.document.delete({
      where: { id: params.id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        employeeName: "Taher",
        module: "Documents Repository",
        transactionNumber: doc.title,
        action: "DELETE_DOCUMENT",
        updatedValue: `Document deleted: ${doc.title} (${doc.docType})`,
      },
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
