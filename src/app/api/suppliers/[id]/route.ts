import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrders: {
          orderBy: { orderDate: "desc" },
          take: 10,
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 10,
        },
        invoices: {
          orderBy: { invoiceDate: "desc" },
          take: 10,
        },
        grns: {
          orderBy: { receivedDate: "desc" },
          take: 10,
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Calculate balances
    const totalPOValue = supplier.purchaseOrders.reduce((sum, po) => sum + po.grandTotal, 0);
    const totalPayments = supplier.payments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalInvoiceValue = supplier.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const poBalance = totalPOValue - totalPayments;
    const invoiceBalance = totalInvoiceValue - totalPayments;

    return NextResponse.json({
      supplier,
      metrics: {
        totalPOValue,
        totalPayments,
        totalInvoiceValue,
        poBalance,
        invoiceBalance,
      },
    });
  } catch (error) {
    console.error("Error fetching supplier details:", error);
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      status,
    } = body;

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: params.id },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : existingSupplier.name,
        contactPerson: contactPerson !== undefined ? contactPerson : existingSupplier.contactPerson,
        phone: phone !== undefined ? phone : existingSupplier.phone,
        email: email !== undefined ? email : existingSupplier.email,
        address: address !== undefined ? address : existingSupplier.address,
        country: country !== undefined ? country : existingSupplier.country,
        trn: trn !== undefined ? trn : existingSupplier.trn,
        currency: currency !== undefined ? currency : existingSupplier.currency,
        paymentTerms: paymentTerms !== undefined ? paymentTerms : existingSupplier.paymentTerms,
        bankDetails: bankDetails !== undefined ? bankDetails : existingSupplier.bankDetails,
        notes: notes !== undefined ? notes : existingSupplier.notes,
        status: status !== undefined ? status : existingSupplier.status,
      },
    });

    // If name changed, record in Audit Log specifically highlighting the requirement
    if (name && name !== existingSupplier.name) {
      await prisma.auditLog.create({
        data: {
          employeeName: "Taher",
          module: "Suppliers",
          transactionNumber: updatedSupplier.supplierId,
          action: "UPDATE_SUPPLIER_NAME",
          previousValue: existingSupplier.name,
          updatedValue: updatedSupplier.name,
        },
      });
    }

    return NextResponse.json({ supplier: updatedSupplier });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Check if supplier has related records
    const poCount = await prisma.purchaseOrder.count({ where: { supplierId: params.id } });
    const invoiceCount = await prisma.purchaseInvoice.count({ where: { supplierId: params.id } });
    const paymentCount = await prisma.payment.count({ where: { supplierId: params.id } });
    const grnCount = await prisma.goodsReceivedNote.count({ where: { supplierId: params.id } });

    if (poCount > 0 || invoiceCount > 0 || paymentCount > 0 || grnCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete supplier with existing transactions. Archive instead." },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id: params.id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        employeeName: "Taher",
        module: "Suppliers",
        transactionNumber: supplier.supplierId,
        action: "DELETE_SUPPLIER",
        updatedValue: `Deleted supplier ${supplier.name} (${supplier.supplierId})`,
      },
    });

    return NextResponse.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
