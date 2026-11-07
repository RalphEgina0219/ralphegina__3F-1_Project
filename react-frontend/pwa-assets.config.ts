import { defineConfig } from '@vite-pwa/assets-generator/config';

const INK = '#0B2E3F';

/**
 * Every app icon comes from public/logo.svg, the Logo component's droplet and wave.
 * Run `npm run icons` after changing the logo; the PNGs are committed.
 */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: {
      // 96 px for the long-press shortcuts, the others for the manifest.
      sizes: [64, 96, 192, 512],
      favicons: [[48, 'favicon.ico']],
      padding: 0,
    },
    maskable: {
      sizes: [512],
      // A rounded tile 64 % wide keeps its corners inside the 80 % safe circle.
      padding: 0.36,
      resizeOptions: { background: INK },
    },
    apple: {
      sizes: [180],
      // iOS fills transparency with black and rounds the corners itself.
      padding: 0.18,
      resizeOptions: { background: INK },
    },
  },
  images: ['public/logo.svg'],
});
