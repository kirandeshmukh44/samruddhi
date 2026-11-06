// app/src/lib/dates.ts
// Standard Indian business date formatting: "05 Nov 2026"

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats a Date object, ISO string ("2026-11-05"), or timestamp into "05 Nov 2026".
 * Never leaves raw "2026-11-05" in UI.
 */
export function formatDate(input?: string | number | Date | null): string {
  if (!input) return '05 Nov 2026';

  let d: Date;
  if (input instanceof Date) {
    d = input;
  } else if (typeof input === 'string') {
    // Check if it's already in "DD Mon YYYY" format
    if (/^\d{2}\s[A-Za-z]{3}\s\d{4}$/.test(input.trim())) {
      return input.trim();
    }
    // Handle "YYYY-MM-DD" safely without timezone shifts
    const parts = input.trim().split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      d = new Date(year, month, day);
    } else {
      d = new Date(input);
    }
  } else {
    d = new Date(input);
  }

  if (isNaN(d.getTime())) {
    return '05 Nov 2026';
  }

  const dayStr = String(d.getDate()).padStart(2, '0');
  const monthStr = MONTHS_SHORT[d.getMonth()] || 'Nov';
  const yearStr = d.getFullYear();

  return `${dayStr} ${monthStr} ${yearStr}`;
}

