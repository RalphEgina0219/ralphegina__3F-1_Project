/** The shop prints basket labels and reports only. There are no printed receipts. */
export type PrintMode = 'labels' | 'report';

const PAGE_RULES: Record<PrintMode, string> = {
  // A4 sheet of 3 × 8 labels, 64 × 34.5 mm each.
  labels: '@page { size: A4; margin: 10mm 8mm; }',
  // No fixed size or orientation: A4 portrait and landscape both work. Page numbers bottom right.
  report: `@page {
    margin: 14mm 12mm 16mm;
    @bottom-left { content: "LaundryFlow report"; font: 8pt sans-serif; color: #557380; }
    @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt sans-serif; color: #557380; }
  }`,
};

/** Opens the browser print dialog with the page size of the chosen layout. */
export function printAs(mode: PrintMode) {
  const style = document.createElement('style');
  style.textContent = PAGE_RULES[mode];
  document.head.appendChild(style);
  document.body.dataset.print = mode;

  const cleanUp = () => {
    style.remove();
    delete document.body.dataset.print;
    window.removeEventListener('afterprint', cleanUp);
  };
  window.addEventListener('afterprint', cleanUp);
  window.print();
}
