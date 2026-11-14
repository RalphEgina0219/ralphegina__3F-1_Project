#!/usr/bin/env node
// The Docker backend commands behind `npm run backend:*` (root package.json, docs/DOCKER.md).
// Plain Node, no packages: it works the same in PowerShell, cmd.exe and Git Bash.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [command, ...rest] = process.argv.slice(2);

/** A port from the root .env (optional), else its default. */
function setting(name, fallback) {
  try {
    const line = fs
      .readFileSync(path.join(root, '.env'), 'utf8')
      .split(/\r?\n/)
      .find((text) => text.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim() || fallback;
  } catch {
    return fallback;
  }
}

const apiPort = setting('LAUNDRYFLOW_API_PORT', '8000');
const pmaPort = setting('LAUNDRYFLOW_PMA_PORT', '8080');

/** Runs a command in the project root, showing its output. Returns its exit code. */
function run(program, args, options = {}) {
  const result = spawnSync(program, args, { cwd: root, stdio: 'inherit', ...options });
  if (result.error) {
    console.error(`[laundryflow] Could not run ${program}: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

/** Stops with a friendly message when Docker is missing or Docker Desktop is not running. */
function requireDocker() {
  const result = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.error) {
    console.error('[laundryflow] Docker is not installed. Install Docker Desktop: docs/DOCKER.md');
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error('[laundryflow] Docker Desktop is not running. Start it, wait for "Engine running", then try again.');
    process.exit(1);
  }
}

/** `docker compose exec` needs -T when there is no terminal (scripts, CI). */
const exec = (...args) =>
  run('docker', ['compose', 'exec', ...(process.stdin.isTTY ? [] : ['-T']), 'app', ...args]);

/** The same, with the test database as DB_DATABASE (phpunit.xml forces it too). */
const execTests = (...args) =>
  run('docker', [
    'compose', 'exec', ...(process.stdin.isTTY ? [] : ['-T']),
    '-e', 'DB_DATABASE=laundryflow_test', 'app', ...args,
  ]);

async function confirm(question) {
  if (rest.includes('--yes') || rest.includes('-y')) return true;
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(`${question} Type "yes" to continue: `);
  prompt.close();
  return answer.trim().toLowerCase() === 'yes';
}

const commands = {
  up() {
    requireDocker();
    const code = run('docker', ['compose', 'up', '-d', '--build']);
    if (code === 0) {
      run('docker', ['compose', 'ps']);
      console.log(`\n[laundryflow] API: http://localhost:${apiPort}/api/v1  Docs: http://localhost:${apiPort}/docs`);
      console.log('[laundryflow] Frontend: npm run dev, then open http://localhost:5173');
    }
    return code;
  },
  down() {
    requireDocker();
    console.log('[laundryflow] Stopping the backend. The database is kept (docker compose down -v would delete it).');
    // --profile tools: phpMyAdmin too, or it keeps the network in use.
    return run('docker', ['compose', '--profile', 'tools', 'down']);
  },
  logs() {
    requireDocker();
    return run('docker', ['compose', 'logs', '-f', '--tail', '100', 'app', 'web']);
  },
  status() {
    requireDocker();
    return run('docker', ['compose', 'ps']);
  },
  async reset() {
    requireDocker();
    if (!(await confirm('This deletes every order, customer and change in the Docker database and reloads the demo data.'))) {
      console.log('[laundryflow] Cancelled. Nothing was changed.');
      return 0;
    }
    return exec('php', 'artisan', 'migrate:fresh', '--seed', '--force');
  },
  test() {
    requireDocker();
    // laundryflow_test twice over (here and in phpunit.xml): the demo data is never touched.
    return execTests('composer', 'test', ...rest);
  },
  shell() {
    requireDocker();
    return run('docker', ['compose', 'exec', 'app', 'bash']);
  },
  'db-admin'() {
    requireDocker();
    const code = run('docker', ['compose', '--profile', 'tools', 'up', '-d', 'phpmyadmin']);
    if (code === 0) console.log(`\n[laundryflow] phpMyAdmin: http://localhost:${pmaPort} (signed in as laundryflow)`);
    return code;
  },
  /**
   * The frontend's contract tests against the Docker backend: reseed it (they expect the fresh
   * demo data), then run them reusing the API on port 8000 instead of starting php artisan serve.
   */
  contract() {
    requireDocker();
    console.log('[laundryflow] Reseeding the Docker database for the contract tests...');
    let code = exec('php', 'artisan', 'migrate:fresh', '--seed', '--force');
    if (code !== 0) return code;
    // Playwright directly, without a shell: arguments such as -g "a|b" reach it unchanged.
    const playwright = path.join('node_modules', '@playwright', 'test', 'cli.js');
    code = run(process.execPath, [playwright, 'test', '--config=playwright.contract.config.ts', ...rest], {
      cwd: path.join(root, 'react-frontend'),
      env: { ...process.env, CONTRACT_REUSE: '1', VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` },
    });
    return code;
  },
};

if (!commands[command]) {
  console.error(`Usage: node scripts/backend.mjs <${Object.keys(commands).join('|')}>`);
  process.exit(1);
}
process.exit(await commands[command]());
