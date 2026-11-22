import { defineConfig } from '@playwright/test';
import contract from './playwright.contract.config';

/**
 * `npm run screenshots:branding`: recaptures docs/screenshots/branding/ against Laravel (the logo
 * upload needs the real API, with PHP's gd). The same servers as the contract run, but its own
 * config, so `npm run test:contract` never rewrites the committed screenshots.
 */
export default defineConfig({
  ...contract,
  projects: [{ name: 'shots', testMatch: /branding-shots\.spec\.ts$/ }],
});
