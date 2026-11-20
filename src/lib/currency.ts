/**
 * Central Multi-Currency Engine for Bait Al Hadaf Procurement ERP.
 * Standardizes currency conversion, exchange rates (1 foreign currency unit = X AED),
 * and AED reporting conversions across POs, Invoices, Payments, and Reports.
 */

export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  AED: 1.0,
  USD: 3.6725,
  EUR: 3.98,
  GBP: 4.65,
  INR: 0.0438, // 1 INR = 0.0438 AED (approx 1 AED = 22.83 INR)
  CNY: 0.51,  // 1 CNY = 0.51 AED (approx 1 AED = 1.96 CNY)
  SAR: 0.98,
  QAR: 1.01,
  OMR: 9.54,
  KWD: 11.95,
  BHD: 9.75,
  JPY: 0.024,
  SGD: 2.75,
  AUD: 2.38,
  CAD: 2.65,
  TRY: 0.11,
  CHF: 4.15,
};

export class CurrencyEngine {
  /**
   * Get default exchange rate to AED for a given currency code
   */
  static getDefaultRate(currency: string): number {
    if (!currency) return 1.0;
    const upper = currency.toUpperCase().trim();
    return DEFAULT_EXCHANGE_RATES[upper] ?? 1.0;
  }

  /**
   * Convert an amount in a foreign currency (expressed in decimal units or minor units) to AED base currency.
   * Rate format: 1 foreign currency unit = X AED.
   * @param amount Original amount (in standard currency units, e.g. 1000 INR)
   * @param exchangeRate Exchange rate (1 foreign = X AED)
   */
  static toAED(amount: number, exchangeRate: number = 1.0): number {
    const amt = isNaN(Number(amount)) ? 0 : Number(amount);
    const rate = isNaN(Number(exchangeRate)) || Number(exchangeRate) <= 0 ? 1.0 : Number(exchangeRate);
    return Math.round((amt * rate + Number.EPSILON) * 100) / 100;
  }

  /**
   * Convert an amount in AED base currency to a target foreign currency.
   * @param aedAmount Amount in AED
   * @param targetExchangeRate Target exchange rate (1 foreign = X AED)
   */
  static fromAED(aedAmount: number, targetExchangeRate: number = 1.0): number {
    const amt = isNaN(Number(aedAmount)) ? 0 : Number(aedAmount);
    const rate = isNaN(Number(targetExchangeRate)) || Number(targetExchangeRate) <= 0 ? 1.0 : Number(targetExchangeRate);
    return Math.round((amt / rate + Number.EPSILON) * 100) / 100;
  }

  /**
   * Convert between any two currencies via AED base reporting currency.
   */
  static convert(amount: number, fromRate: number = 1.0, toRate: number = 1.0): number {
    const aed = CurrencyEngine.toAED(amount, fromRate);
    return CurrencyEngine.fromAED(aed, toRate);
  }

  /**
   * Calculate exchange gain / (loss) when paying or settling an invoice at a different rate.
   * Gain/loss = (Invoice Rate - Payment Rate) * Foreign Amount
   */
  static calculateExchangeDifference(foreignAmount: number, invoiceRate: number, paymentRate: number): number {
    return Math.round(((invoiceRate - paymentRate) * foreignAmount + Number.EPSILON) * 100) / 100;
  }
}
