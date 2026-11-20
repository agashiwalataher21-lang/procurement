/**
 * High-precision financial arithmetic module for Bait Al Hadaf Procurement & ERP.
 * Standardizes currency (AED) rounding, VAT calculation, discount computation,
 * and ledger balance tracking to prevent floating point inaccuracies.
 *
 * NOTE (Phase 1.1 pre-migration): All monetary DB columns are still REAL (Float).
 * Once the Float→Int (fils) migration runs, this class will be updated to work
 * in integer minor units. Until then, keep 2-decimal rounding.
 */

export class Money {
  /**
   * Convert AED amount (e.g. 12.50) to integer fils (1250)
   */
  static toFils(val: number | string): number {
    const n = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(n)) return 0;
    return Math.round((n + Number.EPSILON) * 100);
  }

  /**
   * Convert integer fils (e.g. 1250) to AED decimal amount (12.50)
   */
  static fromFils(fils: number | string): number {
    const n = typeof fils === "string" ? parseInt(fils, 10) : fils;
    if (isNaN(n)) return 0;
    return Math.round(n) / 100;
  }

  /**
   * Round to nearest integer fils
   */
  static roundFils(val: number | string): number {
    const n = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(n)) return 0;
    return Math.round(n);
  }

  /**
   * Round to 2 decimal places using standard half-up (legacy AED format)
   */
  static round(val: number | string): number {
    const n = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(n)) return 0;
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculate VAT in UAE (5% standard rate)
   */
  static calculateVAT(principal: number, rate = 5): number {
    return Money.round((principal * rate) / 100);
  }

  /**
   * Safe addition of monetary amounts
   */
  static add(...amounts: (number | string)[]): number {
    return amounts.reduce<number>((sum, a) => Money.round(sum + Money.round(a)), 0);
  }

  /**
   * Safe subtraction (a - b)
   */
  static subtract(a: number | string, b: number | string): number {
    return Money.round(Money.round(a) - Money.round(b));
  }

  /**
   * Multiply quantity by unit price safely
   */
  static multiply(qty: number | string, unitPrice: number | string): number {
    const q = typeof qty === "string" ? parseFloat(qty) : qty;
    const p = typeof unitPrice === "string" ? parseFloat(unitPrice) : unitPrice;
    return Money.round((isNaN(q) ? 0 : q) * (isNaN(p) ? 0 : p));
  }

  /**
   * Format as currency string (e.g. "1,234.50 AED")
   */
  static format(val: number | string, currency = "AED"): string {
    const n = Money.round(val);
    return `${n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }

  /**
   * Check if two values are equal within 1 fils (handles floating point jitter)
   */
  static equals(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.009;
  }
}
