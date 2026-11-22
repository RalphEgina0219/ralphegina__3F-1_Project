import { UI } from './chartTheme';
import { brandSlug } from '@/features/branding/branding';

const STYLE_PROPS = [
  'font-family',
  'font-size',
  'font-weight',
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'opacity',
];

/** The chart's drawing: the largest SVG inside the plot (icons in legends are tiny). */
export function chartSvg(container: HTMLElement): SVGSVGElement | null {
  const svgs = [...container.querySelectorAll('svg')];
  let best: SVGSVGElement | null = null;
  let area = 0;
  for (const svg of svgs) {
    const box = svg.getBoundingClientRect();
    if (box.width * box.height > area) {
      area = box.width * box.height;
      best = svg;
    }
  }
  return best;
}

/**
 * Saves the chart as a PNG by serializing its SVG: no screenshot library. Text styles that come
 * from CSS are copied onto the clone so the image looks like the screen. 2× for sharp printing.
 */
export async function downloadChartPng(container: HTMLElement, filename: string, title: string) {
  const source = chartSvg(container);
  if (!source) return;
  const { width, height } = source.getBoundingClientRect();
  const clone = source.cloneNode(true) as SVGSVGElement;
  const originals = [source, ...source.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  originals.forEach((node, index) => {
    if (!(node instanceof SVGElement)) return;
    const copy = copies[index] as SVGElement;
    const computed = getComputedStyle(node);
    for (const prop of STYLE_PROPS) {
      const value = computed.getPropertyValue(prop);
      if (value) copy.style.setProperty(prop, value);
    }
  });

  const titleHeight = 32;
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  wrapper.setAttribute('width', String(width + 32));
  wrapper.setAttribute('height', String(height + titleHeight + 24));
  const background = document.createElementNS(wrapper.namespaceURI, 'rect');
  background.setAttribute('width', '100%');
  background.setAttribute('height', '100%');
  background.setAttribute('fill', UI.surface);
  const heading = document.createElementNS(wrapper.namespaceURI, 'text');
  heading.setAttribute('x', '16');
  heading.setAttribute('y', '26');
  heading.setAttribute('fill', UI.text);
  heading.setAttribute('font-family', 'Plus Jakarta Sans, Arial, sans-serif');
  heading.setAttribute('font-size', '17');
  heading.setAttribute('font-weight', '700');
  heading.textContent = title;
  clone.setAttribute('x', '16');
  clone.setAttribute('y', String(titleHeight + 8));
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  wrapper.append(background, heading, clone);

  const markup = new XMLSerializer().serializeToString(wrapper);
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The chart could not be drawn.'));
      image.src = url;
    });
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = (width + 32) * scale;
    canvas.height = (height + titleHeight + 24) * scale;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(scale, scale);
    context.drawImage(image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** "Sales trend" → "laundryflow-sales-trend-2026-11-01-to-2026-11-30". */
export function chartFilename(title: string, range?: { from: string; to: string }) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${brandSlug()}-${slug}${range ? `-${range.from}-to-${range.to}` : ''}`;
}
