import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { compareSemver, parseSemver } from './semver.mjs';

function readVersion(source, label) {
  let manifest;
  try {
    manifest = JSON.parse(source);
  } catch (error) {
    throw new Error(`${label} package.json is not valid JSON: ${error.message}`);
  }

  parseSemver(manifest.version);
  return manifest.version;
}

export function validateReleaseVersion(baseVersion, releaseVersion) {
  if (compareSemver(releaseVersion, baseVersion) <= 0) {
    throw new Error(
      `Release version ${releaseVersion} must be strictly greater than base version ${baseVersion}.`,
    );
  }
}

export function main(args = process.argv.slice(2)) {
  const baseRef = args[0];
  if (!baseRef || args.length !== 1) {
    throw new Error('Usage: node scripts/check-release-version.mjs <base-git-ref>');
  }

  const baseSource = execFileSync('git', ['show', `${baseRef}:package.json`], {
    encoding: 'utf8',
  });
  const headSource = fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8');
  const baseVersion = readVersion(baseSource, baseRef);
  const releaseVersion = readVersion(headSource, 'working tree');

  validateReleaseVersion(baseVersion, releaseVersion);
  console.log(`Release version check passed: ${baseVersion} -> ${releaseVersion}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
