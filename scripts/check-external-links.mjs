import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateExternalLinks } from './external-link-policy.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeSourceRoots = ['app', 'components', 'constants', 'services', 'styles'];
const runtimeExtensions = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx']);

function collectRuntimeSources(rootName, extensions = runtimeExtensions) {
  const root = path.join(repoRoot, rootName);
  const sources = [];
  const pending = [root];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolutePath);
      } else if (
        extensions.has(path.extname(entry.name)) &&
        !/\.(?:test|spec)\.[^.]+$/.test(entry.name)
      ) {
        sources.push({
          fileName: path.relative(repoRoot, absolutePath).replaceAll('\\', '/'),
          source: fs.readFileSync(absolutePath, 'utf8'),
        });
      }
    }
  }
  return sources;
}

const sources = [
  ...runtimeSourceRoots.flatMap((rootName) => collectRuntimeSources(rootName)),
  ...collectRuntimeSources('public/data', new Set(['.json'])),
];
const policy = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'constants', 'external-host-policy.json'), 'utf8'),
);
const errors = validateExternalLinks(sources, policy);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const inventory = policy.allowedHosts
  .map(({ host, mode }) => `${host} (${mode})`)
  .join(', ');
console.log(
  `External-link policy check passed across ${sources.length} runtime files: ${inventory}`,
);
