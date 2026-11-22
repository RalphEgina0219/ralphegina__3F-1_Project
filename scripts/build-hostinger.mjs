#!/usr/bin/env node
// `npm run build:hostinger` (root package.json, docs/HOSTINGER.md): builds the React app for the
// real API and assembles what goes into Hostinger's public_html:
//   build/hostinger/public_html/       the folder (React build + .htaccess + laravel.php)
//   build/hostinger/public_html.zip    the same, for hPanel's File Manager (upload, then Extract)
// With --release (npm run release, in react-frontend or at the root) it also writes a zip whose name
// says what it is, react-frontend/release/laundryflow-frontend-v<version>-<date>-<commit>.zip, for
// laravel-backend/scripts/install-frontend.sh on the server (docs/RELEASE_NOTES_2026-11_wash-types-and-branding.md).
// Plain Node, no packages. It calls node directly: the "&" in this folder name breaks npm's shims.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontend = path.join(root, 'react-frontend');
const template = path.join(root, 'docs', 'hostinger', 'public_html');
const outDir = path.join(root, 'build', 'hostinger');
const publicHtml = path.join(outDir, 'public_html');
const zip = path.join(outDir, 'public_html.zip');

/** Runs node with a script from react-frontend/node_modules; stops the build if it fails. */
function node(script, args) {
  const result = spawnSync(process.execPath, [path.join(frontend, script), ...args], {
    cwd: frontend,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`[laundryflow] ${path.basename(script)} ${args.join(' ')} failed.`);
    process.exit(result.status ?? 1);
  }
}

if (!fs.existsSync(path.join(frontend, 'node_modules'))) {
  console.error('[laundryflow] Run npm install in react-frontend first.');
  process.exit(1);
}

console.log('[laundryflow] Type-checking and building the React app (mode production)...');
node('node_modules/typescript/bin/tsc', ['--noEmit']);
node('node_modules/vite/bin/vite.js', ['build', '--mode', 'production']);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.cpSync(path.join(frontend, 'dist'), publicHtml, { recursive: true });
for (const file of fs.readdirSync(template)) {
  fs.copyFileSync(path.join(template, file), path.join(publicHtml, file));
}

// The demo's mock worker must never reach a real server (vite.config.ts drops it; make sure).
if (fs.existsSync(path.join(publicHtml, 'mockServiceWorker.js'))) {
  console.error('[laundryflow] dist/ contains mockServiceWorker.js: this is a mock build. Stopping.');
  process.exit(1);
}

// Netlify's redirect file (the demo deploy) means nothing to Hostinger: .htaccess does that job.
fs.rmSync(path.join(publicHtml, '_redirects'), { force: true });

// Windows 10+ and macOS ship bsdtar, which writes .zip files; without it, upload the folder.
// On Windows call it by path: in Git Bash, "tar" is GNU tar, which cannot write a zip.
const bsdtar =
  process.platform === 'win32'
    ? path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe')
    : 'tar';
const entries = fs.readdirSync(publicHtml);
const tar = spawnSync(bsdtar, ['-a', '-c', '-f', zip, '-C', publicHtml, ...entries], { stdio: 'pipe' });
const zipped = tar.status === 0 && fs.existsSync(zip);

console.log('');
console.log(`[laundryflow] Ready: ${path.relative(root, publicHtml)}${path.sep}  (${entries.length} entries)`);
if (zipped) {
  console.log(`[laundryflow]        ${path.relative(root, zip)}  -> upload into public_html, then Extract.`);
} else {
  console.log('[laundryflow] No zip (tar could not write one): upload the folder contents instead.');
}
console.log('[laundryflow] Includes the hidden .htaccess: keep it when uploading.');

if (process.argv.includes('--release')) {
  if (!zipped) {
    console.error('[laundryflow] --release needs the zip, and tar could not write one.');
    process.exit(1);
  }
  const { version } = JSON.parse(fs.readFileSync(path.join(frontend, 'package.json'), 'utf8'));
  const sha =
    spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout?.trim() ||
    'nogit';
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const releaseDir = path.join(frontend, 'release');
  const name = `laundryflow-frontend-v${version}-${stamp}-${sha}.zip`;
  fs.mkdirSync(releaseDir, { recursive: true });
  fs.copyFileSync(zip, path.join(releaseDir, name));
  console.log('');
  console.log(`[laundryflow] Release zip: ${name}`);
  console.log(`[laundryflow] Path:        ${path.join(releaseDir, name)}`);
  console.log('[laundryflow] Upload it to domains/<your-domain>/ with hPanel File Manager, then on the server:');
  console.log(`[laundryflow]   bash scripts/install-frontend.sh ${name}`);
}
