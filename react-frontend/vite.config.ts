import { lookup } from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';
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

/** The Docker backend (compose.yaml), and also `php artisan serve`: both answer on port 8000. */
const DOCKER_API = 'http://localhost:8000';
/** Laragon's virtual host for laravel-backend/public (see laravel-backend/README.md). */
const LARAGON_API = 'http://laundryflow.test';

interface ApiTarget {
  url: string;
  /** Which backend that is, for the startup line. */
  label: string;
  /** Whether GET /api/v1/health answered at startup. */
  healthy: boolean;
}

/** One GET /api/v1/health, given at most 1.5 seconds. Never throws. */
async function isHealthy(origin: string) {
  try {
    const response = await fetch(`${origin}/api/v1/health`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Where /api is proxied to:
 * 1. VITE_API_PROXY_TARGET (or the older API_PROXY_TARGET) when set;
 * 2. else port 8000 when it answers (Docker, or `php artisan serve`);
 * 3. else Laragon's laundryflow.test when that name resolves and answers;
 * 4. else port 8000 anyway: the Docker default, with a hint to start it.
 */
async function apiTarget(configured: string | undefined): Promise<ApiTarget> {
  if (configured) {
    return {
      url: configured,
      label: 'VITE_API_PROXY_TARGET',
      healthy: await isHealthy(configured),
    };
  }
  if (await isHealthy(DOCKER_API)) {
    return { url: DOCKER_API, label: 'Docker or php artisan serve', healthy: true };
  }
  try {
    await lookup(new URL(LARAGON_API).hostname);
    if (await isHealthy(LARAGON_API)) {
      return { url: LARAGON_API, label: 'Laragon', healthy: true };
    }
  } catch {
    // No hosts entry for laundryflow.test: not a Laragon setup.
  }
  return { url: DOCKER_API, label: 'Docker', healthy: false };
}

/** Says once, under Vite's own URLs, which backend /api goes to, or how to start one. */
function apiStatus(target: ApiTarget): Plugin {
  const report = (server: ViteDevServer | PreviewServer) => {
    server.httpServer?.once('listening', () => {
      // After Vite has printed its "Local:" line.
      setTimeout(() => {
        const { logger } = server.config;
        if (target.healthy) {
          logger.info(`  ➜  API:     ${target.url} (${target.label}) is up`);
          return;
        }
        logger.warn(
          [
            `  ⚠  Backend not running at ${target.url}.`,
            '     Start Docker Desktop, then run: docker compose up -d   (or: npm run backend:up)',
            '     Laragon or php artisan serve instead? See docs/DOCKER.md. Restart npm run dev after.',
          ].join('\n'),
        );
      }, 100);
    });
  };
  return {
    name: 'laundryflow:api-status',
    configureServer: report,
    configurePreviewServer: report,
  };
}

export default defineConfig(async ({ mode, command }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_');
  const allEnv = loadEnv(mode, import.meta.dirname, '');
  const configured = allEnv.VITE_API_PROXY_TARGET || allEnv.API_PROXY_TARGET || undefined;
  // Only the dev and preview servers proxy, so builds and Vitest never probe the network.
  const probe = command === 'serve' && !process.env.VITEST;
  const target: ApiTarget = probe
    ? await apiTarget(configured)
    : { url: configured ?? DOCKER_API, label: 'not checked', healthy: true };
  const apiProxy = { target: target.url, changeOrigin: true };
  // One service worker per scope: with mocks on, MSW's worker owns "/" and Workbox stays out.
  const useMocks = env.VITE_USE_MOCKS === 'true';
  const proxies = {
    '/api': apiProxy,
    ...(useMocks ? {} : { '/manifest.webmanifest': apiProxy, '/storage/branding': apiProxy }),
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(probe ? [apiStatus(target)] : []),
      VitePWA({
        // src/main.tsx decides which worker registers, so the plugin never injects a register script.
        injectRegister: false,
        registerType: 'prompt',
        // Mock builds emit a sw.js that only unregisters itself and clears its caches. It is never
        // registered by the app; it cleans up a Workbox worker left by an earlier real-API build.
        selfDestroying: useMocks,
        includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
        // A real build has no static manifest: Laravel serves /manifest.webmanifest from the shop's
        // branding (name, colors, icons). Only the mock/demo build, which has no Laravel, ships one.
        manifest: !useMocks
          ? false
          : {
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
          // Never the manifest (Laravel serves it from the branding) and never uploaded branding.
          globPatterns: [`**/*.{js,css,html,svg,png,ico,woff2${useMocks ? ',webmanifest' : ''}}`],
          globIgnores: [
            'mockServiceWorker.js',
            'screenshots/**',
            'manifest.webmanifest',
            'storage/**',
          ],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/sanctum\//,
            /^\/mockServiceWorker\.js$/,
            /^\/manifest\.webmanifest$/,
            /^\/storage\//,
          ],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Whatever origin the API lives on: straight to the network, nothing stored.
              urlPattern: ({ url }) =>
                url.pathname.startsWith('/api/') || url.pathname.startsWith('/sanctum/'),
              handler: 'NetworkOnly',
            },
            {
              // The shop's logo and icons change when the owner uploads new ones (the file name is
              // a content hash, so a changed logo is a new URL): ask the network first, fall back to
              // the last copy offline. Before the generic image rule below, which would pin them.
              urlPattern: ({ url }) => url.pathname.startsWith('/storage/branding/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'branding-images',
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              // The installed-app manifest follows the branding: never stored by the worker.
              urlPattern: ({ url }) => url.pathname === '/manifest.webmanifest',
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
    // /api goes to Laravel (Laragon or php artisan serve), so the browser sees one origin: no CORS.
    // The manifest and the uploaded logos are served by Laravel too, so they are proxied as well.
    server: { allowedHosts: ['.trycloudflare.com'], proxy: proxies },
    preview: { allowedHosts: ['.trycloudflare.com'], proxy: proxies },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['src/test/setup.ts'],
      // Unit and integration tests run against the in-memory mock API.
      env: { VITE_API_URL: '/api', VITE_USE_MOCKS: 'true', TZ: 'Asia/Manila' },
      // Playwright owns e2e/: those specs run against built previews, not jsdom.
      exclude: [...configDefaults.exclude, 'e2e/**', 'dist-e2e/**'],
    },
  };
});
