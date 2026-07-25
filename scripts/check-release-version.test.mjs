import assert from 'node:assert/strict';
import test from 'node:test';
import { validateReleaseVersion } from './check-release-version.mjs';
import { compareSemver, parseSemver } from './semver.mjs';

test('strict SemVer parsing accepts releases and prereleases', () => {
  assert.deepEqual(parseSemver('0.23.0'), {
    major: 0,
    minor: 23,
    patch: 0,
    prerelease: [],
  });
  assert.equal(compareSemver('1.0.0-rc.2', '1.0.0-rc.1'), 1);
  assert.equal(compareSemver('1.0.0', '1.0.0-rc.9'), 1);
  assert.equal(compareSemver('1.0.0+build.2', '1.0.0+build.1'), 0);
});

test('strict SemVer parsing rejects leading zeros and partial versions', () => {
  assert.throws(() => parseSemver('01.2.3'), /Invalid strict SemVer/);
  assert.throws(() => parseSemver('1.2'), /Invalid strict SemVer/);
  assert.throws(() => parseSemver('v1.2.3'), /Invalid strict SemVer/);
});

test('release validation requires a strictly greater version', () => {
  assert.doesNotThrow(() => validateReleaseVersion('0.22.0', '0.23.0'));
  assert.throws(() => validateReleaseVersion('0.23.0', '0.23.0'), /strictly greater/);
  assert.throws(() => validateReleaseVersion('1.0.0', '0.99.0'), /strictly greater/);
});
