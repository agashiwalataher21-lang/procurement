/**
 * Double-entry posting engine.
 * Every financial event posts exactly one balanced JournalEntry inside the
 * same $transaction as the source record. Idempotency: (sourceType, sourceId)
 * unique in practice — if a posted journal already exists, helpers no-op.
 * Voiding never deletes journals; it writes a REVERSAL journal (Dr<->Cr swapped).
 */

export type TxClient = any;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function ensureBalanced(lines: { debit: number; credit: number }[]) {
  const d = round2(lines.reduce((s, l) => s + (l.debit || 0), 0));
  const c = round2(lines.reduce((s, l) => s + (l.credit || 0), 0));
  if (Math.abs(d - c) > 0.01 || d <= 0) {
    throw new Error(`Journal out of balance: debit ${d} vs credit ${c}`);
  }
}

async function nextJournalNumber(tx: TxClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `JV-${year}-`;
  const last = await tx.journalEntry.findFirst({
    where: { journalNumber: { startsWith: prefix } },
    orderBy: { journalNumber: "desc" },
  });
  const n = last ? parseInt(last.journalNumber.slice(prefix.length), 10) + 1 : 1;
  return prefix + String(n).padStart(4, "0");
}

async function accountByCode(tx: TxClient, code: string) {
  const a = await tx.account.findUnique({ where: { code } });
  if (!a) throw new Error(`Chart of Accounts missing account code ${code} — run seed-charts`);
  return a;
}

async function createJournal(
  tx: TxClient,
  opts: {
    date: Date;
    description: string;
    sourceType: string;
    sourceId?: string;
    lines: { accountId: string; debit?: number; credit?: number }[];
    createdBy?: string;
  }
) {
  ensureBalanced(opts.lines as any);
  const journalNumber = await nextJournalNumber(tx);
  return tx.journalEntry.create({
    data: {
      journalNumber,
      date: opts.date,
      description: opts.description,
      sourceType: opts.sourceType,
      sourceId: opts.sourceId ?? null,
      createdBy: opts.createdBy ?? "Taher",
      lines: {
        create: opts.lines.map((l) => ({
          accountId: l.accountId,
          debit: round2(l.debit || 0),
          credit: round2(l.credit || 0),
        })),
      },
    },
    include: { lines: true },
  });
}

async function alreadyPosted(tx: TxClient, sourceType: string, sourceId: string) {
  return tx.journalEntry.findFirst({ where: { sourceType, sourceId, status: "POSTED" } });
}

/**
 * GRN received → Dr Inventory, Cr AP? No: goods received, bill not yet made.
 * We credit a Purchase Clearing liability (account 2025) until the invoice
 * bills it, then the invoice posting credits real AP.
 * value = sum(receivedQty * unitPrice at PO price, discount-adjusted pro-rata)
 */
export async function postPurchaseGrn(
  tx: TxClient,
  args: { grn: any; po: any; items: { quantity: number; unitPrice: number }[] }
) {
  const { grn, po, items } = args;
  if (grn.status === "CANCELLED") return null;
  if (await alreadyPosted(tx, "GRN", grn.id)) return null;

  const rate = Number(po.exchangeRate) || 1.0;
  // Discount applies on principal: effective price factor
  const subtotal = (po.items || []).reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0) || 1;
  const principal = Math.max(0, (po.subtotalAmount ?? po.subtotal ?? subtotal) - (po.discountAmount ?? 0));
  const factor = subtotal > 0 ? principal / subtotal : 1.0;
  const valueForeignFils = Math.round(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) * factor);
  // Convert to AED fils for standard base GL posting
  const valueAedFils = Math.round(valueForeignFils * rate);
  if (valueAedFils <= 0) return null;

  const inventory = await accountByCode(tx, "1040");
  const clearing = await accountByCode(tx, "2025");
  return createJournal(tx, {
    date: grn.receivedDate ? new Date(grn.receivedDate) : new Date(),
    description: `GRN ${grn.grnNumber} — goods received against ${po.poNumber}${po.currency && po.currency !== "AED" ? ` (${po.currency} ${(valueForeignFils / 100).toFixed(2)} @ ${rate})` : ""}`,
    sourceType: "GRN",
    sourceId: grn.id,
    lines: [
      { accountId: inventory.id, debit: valueAedFils },
      { accountId: clearing.id, credit: valueAedFils },
    ],
  });
}

/**
 * Purchase invoice (bill) → Clears Purchase Clearing, updates Inventory to actual cost,
 * Dr VAT Input (vatAmount), Cr Accounts Payable (grandTotal).
 *
 * The GRN already posted: Dr Inventory (at PO price), Cr Purchase Clearing.
 * Now we need to:
 *   1. Clear the Purchase Clearing credit (Dr Purchase Clearing)
 *   2. Adjust Inventory to the actual bill principal (Dr or Cr difference)
 *   3. Dr VAT Input for vatAmount
 *   4. Cr Accounts Payable for grandTotal
 *
 * Net effect: Purchase Clearing = 0, Inventory = actual bill principal, AP = grandTotal.
 */
export async function postPurchaseInvoice(tx: TxClient, invoice: any) {
  if (!invoice) return null;
  if (invoice.status === "CANCELLED") return null;
  if (await alreadyPosted(tx, "INVOICE", invoice.id)) return null;

  const inventory = await accountByCode(tx, "1040");
  const vatInput = await accountByCode(tx, "1030");
  const ap = await accountByCode(tx, "2010");
  const clearing = await accountByCode(tx, "2025");

  const rate = Number(invoice.exchangeRate) || 1.0;
  const grandTotalForeignFils = invoice.grandTotal || 0;
  const vatAmountForeignFils = invoice.vatAmount || 0;

  // Convert to AED base currency (fils)
  const grandTotalAedFils = Math.round(grandTotalForeignFils * rate);
  const vatAmountAedFils = Math.round(vatAmountForeignFils * rate);
  const principalAedFils = grandTotalAedFils - vatAmountAedFils;

  if (grandTotalAedFils <= 0) return null;

  // Get the original GRN journal to determine the cleared amount
  const existingGrnJournal = invoice.grnId
    ? await tx.journalEntry.findFirst({
        where: { sourceType: "GRN", sourceId: invoice.grnId, status: "POSTED" },
        include: { lines: true },
      })
    : null;

  const clearingAmount = existingGrnJournal
    ? existingGrnJournal.lines.find((l: any) => l.accountId === clearing.id)?.credit || 0
    : 0;

  const lines: { accountId: string; debit?: number; credit?: number }[] = [];

  // Clear the Purchase Clearing account (Dr Clearing, Cr Inventory - reversal of GRN)
  if (clearingAmount > 0) {
    lines.push(
      { accountId: clearing.id, debit: clearingAmount },
      { accountId: inventory.id, credit: clearingAmount }
    );
  }

  // Add the inventory debit at actual bill principal
  lines.push({ accountId: inventory.id, debit: principalAedFils });

  // Add VAT Input if applicable
  if (vatAmountAedFils > 0) {
    lines.push({ accountId: vatInput.id, debit: vatAmountAedFils });
  }

  // Add Accounts Payable credit
  lines.push({ accountId: ap.id, credit: grandTotalAedFils });

  await createJournal(tx, {
    date: invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date(),
    description: `Purchase bill ${invoice.invoiceNumber} — ${invoice.supplier?.name ?? ""}${invoice.currency && invoice.currency !== "AED" ? ` (${invoice.currency} ${(grandTotalForeignFils / 100).toFixed(2)} @ ${rate})` : ""}`,
    sourceType: "INVOICE",
    sourceId: invoice.id,
    lines,
  });
}

export async function postSupplierPayment(
  tx: TxClient,
  args: { payment: any; supplierName?: string; bankAccountId?: string; method?: string }
) {
  const { payment, bankAccountId, method } = args;
  if (!payment || (payment.status && payment.status === "CANCELLED")) return null;
  if (await alreadyPosted(tx, "PAYMENT", payment.id)) return null;

  const rate = Number(payment.exchangeRate) || 1.0;
  const paymentForeignFils = payment.amount || 0;
  const paymentAedFils = Math.round(paymentForeignFils * rate);
  if (paymentAedFils <= 0) return null;

  const ap = await accountByCode(tx, "2010");
  const bankCode = bankAccountId ? "1020" : method === "CASH" ? "1010" : "1020";
  const bank = await accountByCode(tx, bankCode);

  const journal = await createJournal(tx, {
    date: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
    description: `Payment ${payment.paymentNumber ?? payment.id} to ${args.supplierName ?? "supplier"}${payment.currency && payment.currency !== "AED" ? ` (${payment.currency} ${(paymentForeignFils / 100).toFixed(2)} @ ${rate})` : ""}`,
    sourceType: "PAYMENT",
    sourceId: payment.id,
    lines: [
      { accountId: ap.id, debit: paymentAedFils },
      { accountId: bank.id, credit: paymentAedFils },
    ],
  });

  // Mirror into BankTransaction so Banking ledger/balance moves (existing gap fix)
  if (bankAccountId && tx.bankTransaction) {
    try {
      await tx.bankTransaction.create({
        data: {
          bankAccountId,
          type: "DEBIT",
          amount: paymentAedFils,
          category: "SUPPLIER_PAYMENT",
          description: `Supplier payment ${payment.paymentNumber ?? ""} ${args.supplierName ?? ""}`.trim(),
          date: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
          status: "RECONCILED",
          paymentId: payment.id,
        },
      });
      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { openingBalance: { decrement: paymentAedFils } },
      });
    } catch (e) {
      console.warn("Bank transaction mirror notice:", e);
    }
  }

  return journal;
}

export async function postExpense(tx: TxClient, expense: any) {
  if (!expense || expense.status === "CANCELLED") return null;
  if (await alreadyPosted(tx, "EXPENSE", expense.id)) return null;
  const amount = round2(expense.amount || 0);
  if (amount <= 0) return null;

  const expenseAccount = await tx.account.findUnique({ where: { id: expense.accountId } });
  if (!expenseAccount) throw new Error(`Expense account ${expense.accountId} not found`);
  const bank = await accountByCode(tx, expense.paymentMethod === "CASH" ? "1010" : "1020");
  const unpaid = expense.status === "UNPAID";
  const creditAccount = unpaid ? await accountByCode(tx, "2010") : bank;

  return createJournal(tx, {
    date: expense.date ? new Date(expense.date) : new Date(),
    description: `Expense ${expense.expenseNumber} — ${expense.category}: ${expense.description}`,
    sourceType: "EXPENSE",
    sourceId: expense.id,
    lines: [
      { accountId: expenseAccount.id, debit: amount },
      { accountId: creditAccount.id, credit: amount },
    ],
  });
}

/**
 * Sales invoice issued → Dr AR (customer owes), Cr Sales Revenue, Cr VAT Output.
 * Revenue recognition happens here (accrual), not when cash is received.
 */
export async function postSalesInvoice(tx: TxClient, invoice: any) {
  if (!invoice || invoice.status === "CANCELLED" || invoice.status === "DRAFT") return null;
  if (await alreadyPosted(tx, "SALES_INVOICE", invoice.id)) return null;

  const grandTotal = round2(invoice.grandTotal || 0);
  const vatAmount = round2(invoice.vatAmount || 0);
  const principal = round2(grandTotal - vatAmount);
  if (grandTotal <= 0) return null;

  const ar = await accountByCode(tx, "1050");
  const sales = await accountByCode(tx, invoice.salesAccountCode || "4010");
  const vatOutput = await accountByCode(tx, "2020");

  const lines: { accountId: string; debit?: number; credit?: number }[] = [
    { accountId: ar.id, debit: grandTotal },
    { accountId: sales.id, credit: principal },
  ];
  if (vatAmount > 0) {
    lines.push({ accountId: vatOutput.id, credit: vatAmount });
  }

  return createJournal(tx, {
    date: invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date(),
    description: `Sales invoice ${invoice.invoiceNumber} — ${invoice.customerName ?? ""}`,
    sourceType: "SALES_INVOICE",
    sourceId: invoice.id,
    lines,
  });
}

/**
 * Sales receipt (customer pays) → Dr Bank/Cash, Cr AR.
 * Optionally tied to a specific invoice to clear AR.
 */
export async function postSalesReceipt(tx: TxClient, receipt: any) {
  if (!receipt || receipt.status === "CANCELLED") return null;
  if (await alreadyPosted(tx, "SALES_RECEIPT", receipt.id)) return null;

  const amount = round2(receipt.amount || 0);
  if (amount <= 0) return null;

  const ar = await accountByCode(tx, "1050");
  const bankCode = receipt.paymentMethod === "CASH" ? "1010" : "1020";
  const bank = await accountByCode(tx, bankCode);

  return createJournal(tx, {
    date: receipt.receiptDate ? new Date(receipt.receiptDate) : new Date(),
    description: `Sales receipt ${receipt.receiptNumber ?? ""} — ${receipt.customerName ?? ""}`,
    sourceType: "SALES_RECEIPT",
    sourceId: receipt.id,
    lines: [
      { accountId: bank.id, debit: amount },
      { accountId: ar.id, credit: amount },
    ],
  });
}

/** Reverse AR for a voided sales invoice. */
export async function reverseSalesInvoice(tx: TxClient, invoiceId: string) {
  return reverseJournal(tx, "SALES_INVOICE", invoiceId, "sales invoice voided");
}

export async function postBankTransaction(tx: TxClient, bt: any) {
  if (!bt || bt.status === "CANCELLED") return null;
  if (await alreadyPosted(tx, "BANK", bt.id)) return null;
  const amount = round2(bt.amount || 0);
  if (amount <= 0) return null;

  const bank = await accountByCode(tx, bt.type === "CREDIT" ? "1020" : "1020");
  let otherCode = "6050"; // Other/Office default
  const cat = bt.category || "";
  if (cat === "SUPPLIER_PAYMENT") otherCode = "2010";
  else if (cat === "EXPENSE" || cat === "EXPENSE_PAYMENT") otherCode = "6050";
  else if (cat === "INVOICE_PAYMENT") otherCode = "2010";
  const other = await accountByCode(tx, otherCode);

  // CREDIT = money in (Dr Bank, Cr other); DEBIT = money out (Dr other, Cr Bank)
  const lines = bt.type === "CREDIT"
    ? [{ accountId: bank.id, debit: amount }, { accountId: other.id, credit: amount }]
    : [{ accountId: other.id, debit: amount }, { accountId: bank.id, credit: amount }];

  return createJournal(tx, {
    date: bt.transactionDate ? new Date(bt.transactionDate) : new Date(),
    description: `Bank transaction ${bt.transactionNumber ?? ""} — ${bt.description ?? ""}`.trim(),
    sourceType: "BANK",
    sourceId: bt.id,
    lines,
  });
}

/**
 * Write a mirrored REVERSAL journal for the original (sourceType+sourceId).
 * Never deletes the original — status of the original is set to VOIDED.
 */
export async function reverseJournal(tx: TxClient, sourceType: string, sourceId: string, reason?: string) {
  const original = await tx.journalEntry.findFirst({
    where: { sourceType, sourceId, status: "POSTED" },
    include: { lines: true },
  });
  if (!original) return null;
  if (await alreadyPosted(tx, "REVERSAL", original.id)) return null;

  const mirrored = original.lines.map((l: any) => ({
    accountId: l.accountId,
    debit: l.credit,
    credit: l.debit,
  }));
  ensureBalanced(mirrored as any);

  const reversal = await createJournal(tx, {
    date: new Date(),
    description: `Reversal of ${original.journalNumber} (${original.description})${reason ? " — " + reason : ""}`,
    sourceType: "REVERSAL",
    sourceId: original.id,
    lines: mirrored,
  });

  await tx.journalEntry.update({ where: { id: original.id }, data: { status: "VOIDED" } });
  return reversal;
}

/** Reverse every posted journal for a source entity (PO void cascade). */
export async function reverseAllForSource(tx: TxClient, sourceTypes: string[], sourceId: string) {
  const journals = await tx.journalEntry.findMany({
    where: { sourceType: { in: sourceTypes }, sourceId, status: "POSTED" },
  });
  const out = [];
  for (const j of journals) {
    const r = await reverseJournal(tx, j.sourceType, j.sourceId!, "void cascade");
    if (r) out.push(r);
  }
  return out;
}

/** Balance of an account in its normal direction (+ debit-normal, - credit-normal shown as negative) — returns signed normal balance. */
export async function getAccountBalance(tx: TxClient, accountId: string) {
  const lines = await tx.journalLine.findMany({ where: { accountId } });
  const debit = lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
  const credit = lines.reduce((s: number, l: any) => s + (l.credit || 0), 0);
  const account = await tx.account.findUnique({ where: { id: accountId } });
  const opening = account?.openingBalance || 0;
  if (account?.balanceType === "NORMAL_CREDIT") return round2(opening + credit - debit);
  return round2(opening + debit - credit);
}

/** Ledger entries ASC (oldest first) with running balance, opening included. */
export async function getLedgerTransactions(tx: TxClient, accountId: string, filters: { from?: Date; to?: Date; sourceType?: string; search?: string } = {}) {
  const account = await tx.account.findUnique({ where: { id: accountId } });
  if (!account) return null;
  const where: any = { accountId };
  if (filters.sourceType) where.journal = { sourceType: filters.sourceType };
  const lines = await tx.journalLine.findMany({
    where,
    include: { journal: true },
    orderBy: [{ journal: { date: "asc" } }, { journal: { journalNumber: "asc" } }],
  });
  const isCreditNormal = account.balanceType === "NORMAL_CREDIT";
  let running = account.openingBalance || 0;
  const rows = lines
    .filter((l: any) => {
      if (filters.from && new Date(l.journal.date) < filters.from) return false;
      if (filters.to && new Date(l.journal.date) > filters.to) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = `${l.journal.journalNumber} ${l.journal.description} ${l.journal.sourceType} ${l.journal.sourceId ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map((l: any) => {
      const delta = isCreditNormal ? (l.credit - l.debit) : (l.debit - l.credit);
      running = round2(running + delta);
      return {
        date: l.journal.date,
        journalNumber: l.journal.journalNumber,
        journalId: l.journal.id,
        sourceType: l.journal.sourceType,
        sourceId: l.journal.sourceId,
        description: l.journal.description,
        debit: l.debit,
        credit: l.credit,
        runningBalance: running,
      };
    });
  const totalDebit = round2(lines.reduce((s: number, l: any) => s + (l.debit || 0), 0));
  const totalCredit = round2(lines.reduce((s: number, l: any) => s + (l.credit || 0), 0));
  const closing = round2((account.openingBalance || 0) + (isCreditNormal ? totalCredit - totalDebit : totalDebit - totalCredit));
  return { account, openingBalance: account.openingBalance || 0, rows, totalDebit, totalCredit, closingBalance: closing };
}
