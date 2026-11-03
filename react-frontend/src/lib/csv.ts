type Cell = string | number | null | undefined;

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  // A text cell starting with these would run as a formula when the file opens in Excel.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: readonly (readonly Cell[])[]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/** Downloads a CSV that Excel opens directly. The BOM keeps the ₱ sign and accents intact. */
export function downloadCsv(filename: string, rows: readonly (readonly Cell[])[]) {
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
