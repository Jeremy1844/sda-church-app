import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['app', 'components', 'constants', 'services', 'public'];
const ignoredFiles = new Set([path.join('app', '(tabs)', 'bible', 'bible1.tsx')]);
const rules = [
  { label: 'placeholder URL', pattern: /\.\.\.placeholder/i },
  { label: 'empty press handler', pattern: /onPress=\{\(\)\s*=>\s*\{\s*\}\}/ },
  { label: 'public TBD value', pattern: /["']TBD["']|\(TBD\)/ },
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const errors = [];
for (const root of roots) {
  for (const filePath of walk(path.join(repoRoot, root))) {
    const relativePath = path.relative(repoRoot, filePath);
    if (ignoredFiles.has(relativePath)) continue;
    if (!/\.(?:js|mjs|ts|tsx|json)$/.test(filePath)) continue;

    const source = fs.readFileSync(filePath, 'utf8');
    for (const rule of rules) {
      if (rule.pattern.test(source)) errors.push(`${relativePath}: ${rule.label}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Production integrity check passed.');
