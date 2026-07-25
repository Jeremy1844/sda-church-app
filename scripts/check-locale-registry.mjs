import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLocaleRegistry } from './locale-registry.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'constants', 'locales.json'), 'utf8'),
);
const errors = validateLocaleRegistry(registry);

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Locale registry check passed (4 supported, 4 gated candidates).');
