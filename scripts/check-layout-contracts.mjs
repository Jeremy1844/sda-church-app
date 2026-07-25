import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = path.join(repoRoot, 'app');
const screenPattern = /<(?:Stack|Tabs)\.Screen\s+[\s\S]*?name=["']([^"']+)["'][\s\S]*?(?:\/>|<\/\s*(?:Stack|Tabs)\.Screen\s*>)/g;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function screenExists(layoutDirectory, name) {
  const target = path.join(layoutDirectory, ...name.split('/'));
  return [
    `${target}.tsx`,
    `${target}.ts`,
    path.join(target, 'index.tsx'),
    path.join(target, 'index.ts'),
    path.join(target, '_layout.tsx'),
    path.join(target, '_layout.ts'),
  ].some((candidate) => fs.existsSync(candidate));
}

const errors = [];
for (const layoutPath of walk(appRoot).filter((file) => path.basename(file) === '_layout.tsx')) {
  const source = fs.readFileSync(layoutPath, 'utf8');
  const layoutDirectory = path.dirname(layoutPath);

  for (const match of source.matchAll(screenPattern)) {
    if (!screenExists(layoutDirectory, match[1])) {
      errors.push(
        `${path.relative(repoRoot, layoutPath)} declares missing screen "${match[1]}"`,
      );
    }
  }
}

const forbiddenRoutes = [path.join(appRoot, '(tabs)', 'bible', 'bible1.tsx')];
for (const forbiddenRoute of forbiddenRoutes) {
  if (fs.existsSync(forbiddenRoute)) {
    errors.push(`${path.relative(repoRoot, forbiddenRoute)} is an obsolete Community screen`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Layout contract check passed.');
