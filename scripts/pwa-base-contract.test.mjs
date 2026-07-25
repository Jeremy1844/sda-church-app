import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
const packageJson = readJson('package.json');
const appJson = readJson('app.json');
const manifest = readJson('public/manifest.json');
const expectedBasePath = new URL(packageJson.homepage).pathname.replace(/\/$/, '');
const require = createRequire(import.meta.url);
const worker = require('../public/sw.js');

test('PWA deployment base stays aligned across HTML, manifest, Expo, and worker', () => {
  const htmlSource = fs.readFileSync(path.join(repoRoot, 'app', '+html.tsx'), 'utf8');

  assert.equal(expectedBasePath, '/sda-church-app');
  assert.equal(appJson.expo.experiments.baseUrl, expectedBasePath);
  assert.equal(manifest.scope, `${expectedBasePath}/`);
  assert.equal(manifest.start_url, `${expectedBasePath}/`);
  assert.equal(worker.APP_BASE_PATH, expectedBasePath);
  assert.match(
    htmlSource,
    new RegExp(`href=["']${expectedBasePath}/manifest\\.json["']`),
  );
  assert.match(
    htmlSource,
    new RegExp(`href=["']${expectedBasePath}/icon-192x192\\.png["']`),
  );
});
