import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_TEXT_SCALE,
  isStandaloneMode,
  normalizeTextScale,
  parseStoredTextScale,
  resolvePwaInstallStatus,
  scaleTypographyRecord,
  serializeTextScale,
} from './AppPreferences.mjs';

test('text-scale storage accepts only supported choices', () => {
  assert.equal(parseStoredTextScale('1'), 1);
  assert.equal(parseStoredTextScale('1.25'), 1.25);
  assert.equal(parseStoredTextScale('1.5'), 1.5);
  assert.equal(parseStoredTextScale('1.2'), DEFAULT_TEXT_SCALE);
  assert.equal(parseStoredTextScale('not-a-number'), DEFAULT_TEXT_SCALE);
  assert.equal(parseStoredTextScale(null), DEFAULT_TEXT_SCALE);
  assert.equal(normalizeTextScale(1.25), 1.25);
  assert.equal(normalizeTextScale('1.25'), DEFAULT_TEXT_SCALE);
  assert.equal(serializeTextScale(1.5), '1.5');
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
