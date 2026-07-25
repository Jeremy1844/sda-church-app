import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_TEXT_SCALE,
  isTextScale,
  isStandaloneMode,
  normalizeTextScale,
  parseStoredTextScale,
  resolvePwaInstallStatus,
  scaleTypographyRecord,
  serializeTextScale,
} from './AppPreferences.mjs';

test('text-scale storage accepts the full 100%-200% range in 5% steps', () => {
  assert.equal(parseStoredTextScale('1'), 1);
  assert.equal(parseStoredTextScale('1.05'), 1.05);
  assert.equal(parseStoredTextScale('1.25'), 1.25);
  assert.equal(parseStoredTextScale('1.5'), 1.5);
  assert.equal(parseStoredTextScale('1.95'), 1.95);
  assert.equal(parseStoredTextScale('2'), 2);
  assert.equal(parseStoredTextScale('1.1'), 1.1);
  assert.equal(parseStoredTextScale('1.11'), DEFAULT_TEXT_SCALE);
  assert.equal(parseStoredTextScale('0.95'), DEFAULT_TEXT_SCALE);
  assert.equal(parseStoredTextScale('2.05'), DEFAULT_TEXT_SCALE);
  assert.equal(parseStoredTextScale('not-a-number'), DEFAULT_TEXT_SCALE);
  assert.equal(parseStoredTextScale(null), DEFAULT_TEXT_SCALE);
  assert.equal(normalizeTextScale(1.25), 1.25);
  assert.equal(normalizeTextScale(1.1500000000000001), 1.15);
  assert.equal(normalizeTextScale('1.25'), DEFAULT_TEXT_SCALE);
  assert.equal(serializeTextScale(1.1500000000000001), '1.15');
  assert.equal(serializeTextScale(2), '2');
});

test('text-scale validation rejects non-finite, out-of-range, and off-step values', () => {
  for (const value of [1, 1.05, 1.5, 1.95, 2]) {
    assert.equal(isTextScale(value), true);
  }
  for (const value of [NaN, Infinity, -Infinity, 0.99, 1.01, 1.999, 2.01, '1.5']) {
    assert.equal(isTextScale(value), false);
  }
  assert.throws(() => serializeTextScale(1.01), /100% and 200% in 5% steps/);
  assert.throws(() => serializeTextScale(Number.NaN), /100% and 200% in 5% steps/);
});

test('text-scale validation normalizes every native Float32 slider step', () => {
  for (let index = 0; index <= 20; index += 1) {
    const exact = Number((1 + index * 0.05).toFixed(2));
    const nativeValue = Math.fround(exact);
    assert.equal(isTextScale(nativeValue), true, `${exact} Float32 value is accepted`);
    assert.equal(normalizeTextScale(nativeValue), exact);
    assert.equal(serializeTextScale(nativeValue), String(exact));
  }

  assert.equal(isTextScale(1.00001), false);
  assert.equal(isTextScale(1.04999), false);
});

test('typography scaling changes font metrics without mutating the source', () => {
  const source = {
    body: { fontFamily: 'NotoSans-Regular', fontSize: 16, lineHeight: 24 },
    icon: { fontFamily: 'material-community' },
  };

  const scaled = scaleTypographyRecord(source, 1.5);

  assert.deepEqual(scaled, {
    body: { fontFamily: 'NotoSans-Regular', fontSize: 24, lineHeight: 36 },
    icon: { fontFamily: 'material-community' },
  });
  assert.deepEqual(source.body, {
    fontFamily: 'NotoSans-Regular',
    fontSize: 16,
    lineHeight: 24,
  });
});

test('standalone detection uses display-mode and navigator capability signals', () => {
  assert.equal(isStandaloneMode(false, undefined), false);
  assert.equal(isStandaloneMode(true, false), true);
  assert.equal(isStandaloneMode(false, true), true);
});

test('install state prioritizes platform, standalone mode, and a live prompt', () => {
  const base = {
    canPrompt: false,
    isStandalone: false,
    isWeb: true,
    lastPromptOutcome: null,
  };

  assert.equal(resolvePwaInstallStatus({ ...base, isWeb: false }), 'not-applicable');
  assert.equal(resolvePwaInstallStatus({ ...base, isStandalone: true }), 'standalone');
  assert.equal(resolvePwaInstallStatus({ ...base, canPrompt: true }), 'prompt-available');
  assert.equal(
    resolvePwaInstallStatus({
      ...base,
      canPrompt: true,
      lastPromptOutcome: 'dismissed',
    }),
    'prompt-available',
  );
});

test('install state honestly distinguishes accepted, dismissed, and unavailable guidance', () => {
  const base = {
    canPrompt: false,
    isStandalone: false,
    isWeb: true,
    lastPromptOutcome: null,
  };

  assert.equal(resolvePwaInstallStatus(base), 'unavailable');
  assert.equal(
    resolvePwaInstallStatus({ ...base, lastPromptOutcome: 'accepted' }),
    'accepted',
  );
  assert.equal(
    resolvePwaInstallStatus({ ...base, lastPromptOutcome: 'dismissed' }),
    'dismissed',
  );
});
