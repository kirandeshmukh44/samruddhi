// app/src/lib/__tests__/gst.test.ts
import { calculateBillSummary, calcLineGst } from '../gst';

export function runGstEngineTests() {
  const results: { test: string; passed: boolean; details: string }[] = [];

  // Test 1: Intra-state 50/50 split (CGST + SGST)
  {
    const summary = calculateBillSummary(
      [{ qty: 2, pricePaise: 100000, gstRatePercent: 18 }], // 2 * 1,000 = 2,000 Rs, 18%
      0,
      true, // same state
      false
    );
    const expectedTax = 36000; // 360 Rs
    const passed =
      summary.taxableValue === 200000 &&
      summary.cgst === 18000 &&
      summary.sgst === 18000 &&
      summary.igst === 0 &&
      summary.cgst + summary.sgst === expectedTax;

    results.push({
      test: 'Intra-state (CGST+SGST 50/50 equal split)',
      passed,
      details: `Taxable: ${summary.taxableValue}, CGST: ${summary.cgst}, SGST: ${summary.sgst}, IGST: ${summary.igst}`,
    });
  }

  // Test 2: Inter-state (100% IGST, 0 CGST/SGST)
  {
    const summary = calculateBillSummary(
      [{ qty: 1, pricePaise: 500000, gstRatePercent: 12 }], // 5,000 Rs, 12%
      0,
      false, // inter-state
      false
    );
    const expectedTax = 60000; // 600 Rs
    const passed =
      summary.taxableValue === 500000 &&
      summary.cgst === 0 &&
      summary.sgst === 0 &&
      summary.igst === expectedTax;

    results.push({
      test: 'Inter-state (100% IGST, zero CGST/SGST)',
      passed,
      details: `Taxable: ${summary.taxableValue}, CGST: ${summary.cgst}, SGST: ${summary.sgst}, IGST: ${summary.igst}`,
    });
  }

  // Test 3: Invoice-level discount applied BEFORE tax and distributed proportionally
  {
    // Line 1: 1,000 Rs @ 18% = 180 Rs tax
    // Line 2: 3,000 Rs @ 12% = 360 Rs tax
    // Total subtotal: 4,000 Rs (400,000 paise).
    // Discount: 400 Rs (40,000 paise) = 10% discount across bill.
    // Line 1 taxable: 1,000 - 100 = 900 Rs (90,000 paise). Tax @ 18% = 162 Rs (16,200 paise).
    // Line 2 taxable: 3,000 - 300 = 2,700 Rs (270,000 paise). Tax @ 12% = 324 Rs (32,400 paise).
    const summary = calculateBillSummary(
      [
        { qty: 1, pricePaise: 100000, gstRatePercent: 18 },
        { qty: 1, pricePaise: 300000, gstRatePercent: 12 },
      ],
      40000, // 400 Rs discount
      true,
      false
    );

    const line1 = summary.lines[0];
    const line2 = summary.lines[1];

    const passed =
      summary.subtotal === 400000 &&
      summary.discount === 40000 &&
      summary.taxableValue === 360000 &&
      line1.discount === 10000 &&
      line1.taxable === 90000 &&
      line1.totalTax === 16200 &&
      line2.discount === 30000 &&
      line2.taxable === 270000 &&
      line2.totalTax === 32400 &&
      summary.totalTax === 48600;

    results.push({
      test: 'Pre-tax proportional discount distribution across line items',
      passed,
      details: `Taxable: ${summary.taxableValue}, Line1 tax: ${line1.totalTax}, Line2 tax: ${line2.totalTax}, Total tax: ${summary.totalTax}`,
    });
  }

  // Test 4: Round off to nearest rupee
  {
    // Taxable: 100.40 Rs (10040 paise), Grand total without rounding = 10040 paise
    // With auto round off: rounds down to 100.00 Rs (10000 paise), roundOff = -40 paise
    const s1 = calculateBillSummary(
      [{ qty: 1, pricePaise: 10040, gstRatePercent: 0 }],
      0,
      true,
      true
    );

    // Taxable: 100.60 Rs (10060 paise)
    // With auto round off: rounds up to 101.00 Rs (10100 paise), roundOff = +40 paise
    const s2 = calculateBillSummary(
      [{ qty: 1, pricePaise: 10060, gstRatePercent: 0 }],
      0,
      true,
      true
    );

    const passed =
      s1.grandTotal === 10000 &&
      s1.roundOff === -40 &&
      s2.grandTotal === 10100 &&
      s2.roundOff === 40;

    results.push({
      test: 'Round off to nearest integer rupee (+/- paise difference)',
      passed,
      details: `s1 grand: ${s1.grandTotal} (roundOff: ${s1.roundOff}), s2 grand: ${s2.grandTotal} (roundOff: ${s2.roundOff})`,
    });
  }

  return results;
}

