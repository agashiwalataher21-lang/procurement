import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get("docType");
    const supplierId = searchParams.get("supplierId");
    const search = searchParams.get("search");

    const where: any = {};
    if (docType) where.docType = docType;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { uploadedBy: { contains: search } },
        { supplier: { name: { contains: search } } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: true,
        po: true,
        invoice: true,
        grn: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      docType = "OTHER",
      supplierId,
      poId,
      invoiceId,
      grnId,
      uploadedBy = "Purchase Manager",
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Document title is required" }, { status: 400 });
    }

    const doc = await prisma.document.create({
      data: {
        title,
        docType,
        fileUrl: `/documents/${docType.toLowerCase()}/${Date.now()}.pdf`,
        fileSize: "512 KB",
        mimeType: "application/pdf",
        supplierId: supplierId || null,
        poId: poId || null,
        invoiceId: invoiceId || null,
        grnId: grnId || null,
        uploadedBy,
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
        action: "UPLOAD_DOCUMENT",
        updatedValue: `Document uploaded: ${title} (${docType})`,
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
