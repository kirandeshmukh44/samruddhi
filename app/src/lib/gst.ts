// app/src/lib/gst.ts
// GST line tax calculation.

export interface GstBreakup {
  taxable: number; // paise
  cgst: number; // paise
  sgst: number; // paise
  igst: number; // paise
  total: number; // paise
}

// If seller state == buyer state: CGST+SGST (split equally).
// Else: IGST (full rate).
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
    cgst = Math.round(tax / 2);
    sgst = tax - cgst;
  } else {
    igst = tax;
  }
  return { taxable, cgst, sgst, igst, total: taxable + tax };
}

// Sum multiple line breakups.
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
