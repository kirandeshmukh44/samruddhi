// app/src/lib/invoiceNo.ts
// Financial year auto-incrementing invoice numbering: INV-2026-27-0001 / PB-2026-27-0001

export function getCurrentFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 is Jan, 3 is April
  const year = date.getFullYear();
  if (month >= 3) {
    // April to Dec: e.g. 2026 -> 2026-27
    const nextShort = String((year + 1) % 100).padStart(2, '0');
    return `${year}-${nextShort}`;
  } else {
    // Jan to March: e.g. 2027 -> 2026-27
    const currentShort = String(year % 100).padStart(2, '0');
    return `${year - 1}-${currentShort}`;
  }
}

export function generateNextInvoiceNumber(
  type: 'sale' | 'purchase',
  existingInvoices: { invoice_no: string; type?: string }[] = [],
  customPrefix?: string
): string {
  const fy = getCurrentFinancialYear();
  const defaultPrefix = type === 'sale' ? 'INV' : 'PB';
  const prefix = customPrefix || defaultPrefix;
  const baseTag = `${prefix}-${fy}-`;

  let maxNum = 0;
  for (const inv of existingInvoices) {
    if (!inv || !inv.invoice_no) continue;
    const no = inv.invoice_no.trim();
    if (no.startsWith(baseTag)) {
      const suffix = no.substring(baseTag.length);
      const parsed = parseInt(suffix, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  const nextCount = maxNum + 1;
  return `${baseTag}${String(nextCount).padStart(4, '0')}`;
}

