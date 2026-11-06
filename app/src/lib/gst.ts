// app/src/lib/gst.ts
// BiLU ERP GST calculation engine.
// Rules:
// 1. Discount is applied before tax and distributed proportionally across line items.
// 2. Intra-state (seller state == buyer state): CGST (50%) + SGST (50%).
// 3. Inter-state: IGST (100%).
// 4. Round off: nearest integer rupee (nearest 100 paise).

export interface GstBreakup {
  taxable: number; // paise
  cgst: number;    // paise
  sgst: number;    // paise
  igst: number;    // paise
  total: number;   // paise
}

export interface InvoiceLineInput {
  qty: number;
  pricePaise: number;
  gstRatePercent: number;
}

export interface InvoiceLineResult {
  subtotal: number; // gross qty * pricePaise
  discount: number; // proportional discount allocated
  taxable: number;  // subtotal - discount
  cgst: number;     // 50% intra-state
  sgst: number;     // 50% intra-state
  igst: number;     // 100% inter-state
  totalTax: number;
  total: number;    // taxable + totalTax
}

export interface InvoiceBillSummary {
  subtotal: number;       // Gross sum before discount (paise)
  discount: number;       // Total invoice-level discount (paise)
  taxableValue: number;   // subtotal - discount (paise)
  cgst: number;           // Sum of CGST (paise)
  sgst: number;           // Sum of SGST (paise)
  igst: number;           // Sum of IGST (paise)
  totalTax: number;       // cgst + sgst + igst (paise)
  unroundedTotal: number; // taxableValue + totalTax (paise)
  roundOff: number;       // Difference to nearest rupee (paise)
  grandTotal: number;     // Final payable total in paise (multiple of 100)
  lines: InvoiceLineResult[];
}

/**
 * Calculates complete bill summary with pre-tax proportional discount,
 * intra/inter-state tax splitting, and nearest-rupee round off.
 */
export function calculateBillSummary(
  lines: InvoiceLineInput[],
  discountPaise: number = 0,
  sameState: boolean = true,
  autoRoundOff: boolean = true
): InvoiceBillSummary {
  if (!lines || lines.length === 0) {
    return {
      subtotal: 0,
      discount: 0,
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      unroundedTotal: 0,
      roundOff: 0,
      grandTotal: 0,
      lines: [],
    };
  }

  // Step 1: Gross subtotal per line
  const lineSubtotals = lines.map((l) => Math.round(l.qty * l.pricePaise));
  const grossSubtotal = lineSubtotals.reduce((sum, val) => sum + val, 0);

  // Cap discount at gross subtotal
  const effectiveDiscount = Math.min(Math.max(0, discountPaise), grossSubtotal);

  // Step 2: Distribute discount proportionally across lines before tax
  let allocatedDiscount = 0;
  const lineResults: InvoiceLineResult[] = lines.map((line, idx) => {
    const sub = lineSubtotals[idx];
    let lineDisc = 0;
    if (grossSubtotal > 0 && effectiveDiscount > 0) {
      if (idx === lines.length - 1) {
        // Last line absorbs remaining discount to prevent fractional paise loss
        lineDisc = effectiveDiscount - allocatedDiscount;
      } else {
        lineDisc = Math.round((sub / grossSubtotal) * effectiveDiscount);
        allocatedDiscount += lineDisc;
      }
    }

    const taxable = Math.max(0, sub - lineDisc);
    const tax = Math.round((taxable * line.gstRatePercent) / 100);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (sameState) {
      cgst = Math.floor(tax / 2);
      sgst = tax - cgst; // guarantees cgst + sgst === tax
    } else {
      igst = tax;
    }

    const totalTax = cgst + sgst + igst;
    return {
      subtotal: sub,
      discount: lineDisc,
      taxable,
      cgst,
      sgst,
      igst,
      totalTax,
      total: taxable + totalTax,
    };
  });

  // Step 3: Accumulate bill totals
  const totalTaxable = lineResults.reduce((sum, l) => sum + l.taxable, 0);
  const totalCgst = lineResults.reduce((sum, l) => sum + l.cgst, 0);
  const totalSgst = lineResults.reduce((sum, l) => sum + l.sgst, 0);
  const totalIgst = lineResults.reduce((sum, l) => sum + l.igst, 0);
  const totalTax = totalCgst + totalSgst + totalIgst;
  const unroundedTotal = totalTaxable + totalTax;

  // Step 4: Round off to nearest integer rupee (nearest 100 paise)
  let roundOff = 0;
  let grandTotal = unroundedTotal;

  if (autoRoundOff) {
    grandTotal = Math.round(unroundedTotal / 100) * 100;
    roundOff = grandTotal - unroundedTotal;
  }

  return {
    subtotal: grossSubtotal,
    discount: effectiveDiscount,
    taxableValue: totalTaxable,
    cgst: totalCgst,
    sgst: totalSgst,
    igst: totalIgst,
    totalTax,
    unroundedTotal,
    roundOff,
    grandTotal,
    lines: lineResults,
  };
}

// Backward compatible helper for single line calculations
export function calcLineGst(
  qty: number,
  pricePaise: number,
  gstRatePercent: number,
  sameState: boolean
): GstBreakup {
  const taxable = Math.round(qty * pricePaise);
  const tax = Math.round((taxable * gstRatePercent) / 100);
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (sameState) {
    cgst = Math.floor(tax / 2);
    sgst = tax - cgst;
  } else {
    igst = tax;
  }
  return { taxable, cgst, sgst, igst, total: taxable + tax };
}

// Backward compatible sum helper
export function sumGst(lines: GstBreakup[]): GstBreakup {
  return lines.reduce(
    (acc, l) => ({
      taxable: acc.taxable + l.taxable,
      cgst: acc.cgst + l.cgst,
      sgst: acc.sgst + l.sgst,
      igst: acc.igst + l.igst,
      total: acc.total + l.total,
    }),
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
  );
}
