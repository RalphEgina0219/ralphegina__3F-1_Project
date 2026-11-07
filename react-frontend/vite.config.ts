import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults } from 'vitest/config';

const INK = '#0B2E3F';
const FOAM = '#F3F8FA';

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8'),
) as { version: string };

/**
 * A real-API build ships no mock worker: nothing registers it, and it must never be precached.
 * (Workbox also ignores it, so the order of the two plugins does not matter.)
 */
function dropMockWorker(): Plugin {
  let outDir = '';
  return {
    name: 'laundryflow:drop-mock-worker',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      fs.rmSync(path.join(outDir, 'mockServiceWorker.js'), { force: true });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_');
  // One service worker per scope: with mocks on, MSW's worker owns "/" and Workbox stays out.
  const useMocks = env.VITE_USE_MOCKS === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // src/main.tsx decides which worker registers, so the plugin never injects a register script.
        injectRegister: false,
        registerType: 'prompt',
        // Mock builds emit a sw.js that only unregisters itself and clears its caches. It is never
        // registered by the app; it cleans up a Workbox worker left by an earlier real-API build.
        selfDestroying: useMocks,
        includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
        manifest: {
          id: '/',
          name: 'LaundryFlow — Laundry Shop Management',
          short_name: 'LaundryFlow',
          description:
            'A web-based laundry shop management system with basket QR tracking and customer accounts.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          orientation: 'any',
          theme_color: INK,
          background_color: FOAM,
          lang: 'en',
          dir: 'ltr',
          categories: ['business', 'productivity'],
          icons: [
            { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png', purpose: 'any' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          // Every shortcut still goes through sign-in.
          shortcuts: [
            {
              name: 'Scan QR',
              short_name: 'Scan',
              description: 'Scan a basket label',
              url: '/scan',
              icons: [{ src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' }],
            },
            {
              name: 'New order',
              short_name: 'New order',
              description: 'Record a new laundry order',
              url: '/orders/new',
              icons: [{ src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' }],
            },
            {
              name: 'My laundry',
              short_name: 'My laundry',
              description: 'Customer account: follow your laundry',
              url: '/my',
              icons: [{ src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' }],
            },
          ],
          screenshots: [
            {
              src: 'screenshots/home-narrow.png',
              sizes: '390x844',
              type: 'image/png',
              form_factor: 'narrow',
              label: "Today's laundry flow on a phone",
            },
            {
              src: 'screenshots/scan-narrow.png',
              sizes: '390x844',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Scanning a basket label',
            },
            {
              src: 'screenshots/dashboard-wide.png',
              sizes: '1440x900',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Shop dashboard',
            },
          ],
        },
        workbox: {
          // The app shell only. Never API data: it is private and changes all day.
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
          globIgnores: ['mockServiceWorker.js', 'screenshots/**'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/sanctum\//, /^\/mockServiceWorker\.js$/],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Whatever origin the API lives on: straight to the network, nothing stored.
              urlPattern: ({ url }) =>
                url.pathname.startsWith('/api/') || url.pathname.startsWith('/sanctum/'),
              handler: 'NetworkOnly',
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-css' },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-files',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ request, sameOrigin }) =>
                sameOrigin && request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
      ...(useMocks ? [] : [dropMockWorker()]),
    ],
    define: { __APP_VERSION__: JSON.stringify(version) },
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    // Lets a phone open the dev server through an HTTPS tunnel, which the camera requires.
    server: { allowedHosts: ['.trycloudflare.com'] },
    preview: { allowedHosts: ['.trycloudflare.com'] },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['src/test/setup.ts'],
      env: { VITE_API_URL: '/api', TZ: 'Asia/Manila' },
      // Playwright owns e2e/: those specs run against built previews, not jsdom.
      exclude: [...configDefaults.exclude, 'e2e/**', 'dist-e2e/**'],
    },
  };
});
