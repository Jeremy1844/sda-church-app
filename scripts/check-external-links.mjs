import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateExternalLinks } from './external-link-policy.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(repoRoot, 'constants', 'ExternalLinks.ts'), 'utf8');
const policy = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'constants', 'external-host-policy.json'), 'utf8'),
);
const errors = validateExternalLinks(source, policy);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('External-link policy check passed.');
