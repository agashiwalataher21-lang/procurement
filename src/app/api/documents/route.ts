import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "documents");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get("docType");
    const supplierId = searchParams.get("supplierId");
    const search = searchParams.get("search");

    const where: any = {};
    if (docType && docType !== "ALL") where.docType = docType;
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Purchase Manager";

    const contentType = request.headers.get("content-type") || "";

    // 1. Handle Multipart Form Data (Real File Upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const title = (formData.get("title") as string) || (file ? file.name : "Uploaded Document");
      const docType = (formData.get("docType") as string) || "OTHER";
      const supplierId = (formData.get("supplierId") as string) || null;
      const poId = (formData.get("poId") as string) || null;
      const invoiceId = (formData.get("invoiceId") as string) || null;
      const grnId = (formData.get("grnId") as string) || null;

      if (!file) {
        return NextResponse.json({ error: "No file was attached in form data" }, { status: 400 });
      }

      // Max 15MB
      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json({ error: "File exceeds maximum allowed size of 15 MB" }, { status: 400 });
      }

      ensureUploadDir();
      const fileExt = path.extname(file.name) || ".pdf";
      const sanitizedBaseName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `${sanitizedBaseName}-${Date.now()}${fileExt}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/documents/${filename}`;
      const fileSize = formatBytes(file.size);
      const mimeType = file.type || "application/octet-stream";

      const doc = await prisma.document.create({
        data: {
          title,
          docType,
          fileUrl,
          fileSize,
          mimeType,
          supplierId,
          poId,
          invoiceId,
          grnId,
          uploadedBy: actorName,
        },
        include: { supplier: true, po: true },
      });

      await prisma.auditLog.create({
        data: {
          employeeName: actorName,
          module: "Documents Vault",
          transactionNumber: doc.id,
          action: "UPLOAD_DOCUMENT",
          updatedValue: `Real file upload: ${title} (${fileSize}, ${mimeType})`,
        },
      });

      return NextResponse.json({ document: doc }, { status: 201 });
    }

    // 2. Fallback to JSON metadata payload
    const body = await request.json();
    const {
      title,
      docType = "OTHER",
      supplierId,
      poId,
      invoiceId,
      grnId,
      fileUrl = `/documents/${docType.toLowerCase()}/${Date.now()}.pdf`,
      fileSize = "512 KB",
      mimeType = "application/pdf",
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Document title is required" }, { status: 400 });
    }

    const doc = await prisma.document.create({
      data: {
        title,
        docType,
        fileUrl,
        fileSize,
        mimeType,
        supplierId: supplierId || null,
        poId: poId || null,
        invoiceId: invoiceId || null,
        grnId: grnId || null,
        uploadedBy: actorName,
      },
      include: {
        supplier: true,
        po: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Documents Vault",
        transactionNumber: doc.id,
        action: "RECORD_DOCUMENT",
        updatedValue: `Document recorded: ${title} (${docType})`,
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: error.message || "Failed to process document" }, { status: 500 });
  }
}
