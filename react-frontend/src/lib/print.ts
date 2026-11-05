/** The shop prints basket labels and reports only. There are no printed receipts. */
export type PrintMode = 'labels' | 'report';

const PAGE_RULES: Record<PrintMode, string> = {
  // A4 sheet of 3 × 8 labels, 64 × 34.5 mm each.
  labels: '@page { size: A4; margin: 10mm 8mm; }',
  report: '@page { size: A4; margin: 12mm; }',
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
