import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GLOBAL_CURRENCIES } from "@/lib/countryRules";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    let currencies = await prisma.currency.findMany({
      orderBy: [{ isBase: "desc" }, { code: "asc" }],
    });

    // Auto-seed if empty
    if (currencies.length === 0) {
      const defaultRates: Record<string, { rate: number; units: number }> = {
        AED: { rate: 1.0, units: 1.0 },
        USD: { rate: 3.6725, units: 0.2723 },
        EUR: { rate: 3.98, units: 0.2513 },
        GBP: { rate: 4.65, units: 0.215 },
        INR: { rate: 0.0438, units: 22.83 }, // 1 AED = 22.83 INR => 1 INR = 0.0438 AED
        CNY: { rate: 0.51, units: 1.96 },   // 1 AED = 1.96 CNY => 1 CNJ = 0.51 AED
        SAR: { rate: 0.98, units: 1.02 },
        QAR: { rate: 1.01, units: 0.99 },
        OMR: { rate: 9.54, units: 0.1048 },
        KWD: { rate: 11.95, units: 0.0837 },
        BHD: { rate: 9.75, units: 0.1026 },
        JPY: { rate: 0.024, units: 41.67 },
        SGD: { rate: 2.75, units: 0.3636 },
        AUD: { rate: 2.38, units: 0.4202 },
        CAD: { rate: 2.65, units: 0.3774 },
        TRY: { rate: 0.11, units: 9.09 },
        CHF: { rate: 4.15, units: 0.241 },
      };

      for (const gc of GLOBAL_CURRENCIES) {
        const entry = defaultRates[gc.code] || { rate: 1.0, units: 1.0 };
        await prisma.currency.create({
          data: {
            code: gc.code,
            name: gc.name,
            symbol: gc.symbol,
            rateToAED: entry.rate,
            unitsPerAED: entry.units,
            isBase: gc.code === "AED",
            status: "ACTIVE",
          },
        }).catch(() => {});
      }

      currencies = await prisma.currency.findMany({
        orderBy: [{ isBase: "desc" }, { code: "asc" }],
      });
    }

    return NextResponse.json({ currencies });
  } catch (error: any) {
    console.error("Error fetching currencies:", error);
    return NextResponse.json({ error: "Failed to fetch currencies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Admin";

    const body = await request.json();
    const { code, name, symbol, rateToAED, unitsPerAED } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "Currency code and name are required" }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();
    const existing = await prisma.currency.findUnique({ where: { code: upperCode } });
    if (existing) {
      return NextResponse.json({ error: `Currency ${upperCode} already exists` }, { status: 400 });
    }

    let calculatedRate = parseFloat(rateToAED);
    let calculatedUnits = parseFloat(unitsPerAED);

    if (isNaN(calculatedRate) && !isNaN(calculatedUnits) && calculatedUnits > 0) {
      calculatedRate = 1 / calculatedUnits;
    } else if (isNaN(calculatedUnits) && !isNaN(calculatedRate) && calculatedRate > 0) {
      calculatedUnits = 1 / calculatedRate;
    } else if (isNaN(calculatedRate) && isNaN(calculatedUnits)) {
      calculatedRate = 1.0;
      calculatedUnits = 1.0;
    }

    const currency = await prisma.currency.create({
      data: {
        code: upperCode,
        name: name.trim(),
        symbol: symbol ? symbol.trim() : upperCode,
        rateToAED: calculatedRate,
        unitsPerAED: calculatedUnits,
        isBase: upperCode === "AED",
        status: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Currencies",
        transactionNumber: upperCode,
        action: "CREATE_CURRENCY",
        updatedValue: `Added currency ${upperCode} (${name}) with rate 1 unit = ${calculatedRate} AED (1 AED = ${calculatedUnits} ${upperCode})`,
      },
    });

    return NextResponse.json({ currency }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating currency:", error);
    return NextResponse.json({ error: error.message || "Failed to create currency" }, { status: 500 });
  }
}
