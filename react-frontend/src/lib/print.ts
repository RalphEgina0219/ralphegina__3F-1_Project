export type PrintMode = 'receipt-58' | 'receipt-a4' | 'tag' | 'report';

const PAGE_RULES: Record<PrintMode, string> = {
  // Thermal drivers feed continuously and cut after the content; the height only bounds the page.
  'receipt-58': '@page { size: 58mm 297mm; margin: 0; }',
  'receipt-a4': '@page { size: A4; margin: 15mm; }',
  tag: '@page { size: 58mm 58mm; margin: 2mm; }',
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
