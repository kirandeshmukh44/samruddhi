// app/src/lib/money.ts
// Money helpers. All money stored as integer paise.

// Format paise as Indian rupees string: "₹ 1,23,456.78"
export function formatMoney(paise: number): string {
  const rupees = paise / 100;
  const negative = rupees < 0;
  const abs = Math.abs(rupees);
  const [intPart, decPart] = abs.toFixed(2).split('.');

  // Indian grouping: first 3 digits, then groups of 2.
  let grouped = '';
  const len = intPart.length;
  if (len <= 3) {
    grouped = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    // group rest into 2-digit groups
    const groups: string[] = [];
    for (let i = rest.length; i > 0; i -= 2) {
      groups.unshift(rest.slice(Math.max(0, i - 2), i));
    }
    grouped = groups.join(',') + (groups.length ? ',' : '') + last3;
  }

  const sign = negative ? '-' : '';
  return `${sign}₹ ${grouped}.${decPart}`;
}

// Convert rupees number to paise integer (safe).
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
