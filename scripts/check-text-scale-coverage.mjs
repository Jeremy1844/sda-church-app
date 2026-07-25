import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOTS = ['app', 'components', 'styles'];
const TYPESCRIPT_SOURCE = /\.(?:ts|tsx)$/;
const UNSCALED_TYPOGRAPHY_METRIC = /\b(?:fontSize|lineHeight)\s*:\s*\d+(?:\.\d+)?\b/g;

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolutePath);
    return TYPESCRIPT_SOURCE.test(entry.name) ? [absolutePath] : [];
  });
}

const violations = [];

for (const sourceRoot of SOURCE_ROOTS) {
  const absoluteRoot = path.join(REPOSITORY_ROOT, sourceRoot);
  for (const filePath of sourceFiles(absoluteRoot)) {
    const source = fs.readFileSync(filePath, 'utf8');
    for (const match of source.matchAll(UNSCALED_TYPOGRAPHY_METRIC)) {
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      violations.push(
        `${path.relative(REPOSITORY_ROOT, filePath)}:${line}: ${match[0]}`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(
    'Unscaled numeric typography metrics bypass the saved 100/125/150% preference:',
  );
  for (const violation of violations) console.error(`- ${violation}`);
  console.error('Use scaleTypographyMetric or a text-scale-aware style factory.');
  process.exitCode = 1;
} else {
  console.log(
    `Text-scale coverage check passed across ${SOURCE_ROOTS.join(', ')} (no raw numeric fontSize/lineHeight metrics).`,
  );
}
