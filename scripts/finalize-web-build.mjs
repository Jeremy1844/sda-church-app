import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectPrecacheUrls, selectPrecacheUrls } from './web-build-manifest.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(repoRoot, 'dist');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

if (!fs.existsSync(distRoot)) throw new Error('dist does not exist; run the Expo export first.');
const workerPath = path.join(distRoot, 'sw.js');
if (!fs.existsSync(workerPath)) throw new Error('dist/sw.js is missing.');

const filePaths = walk(distRoot).map((filePath) => path.relative(distRoot, filePath));
const urls = selectPrecacheUrls(filePaths);
const workerSource = fs.readFileSync(workerPath, 'utf8');
fs.writeFileSync(workerPath, injectPrecacheUrls(workerSource, urls), 'utf8');
console.log(`Injected ${urls.length} same-origin app-shell URLs into dist/sw.js.`);
