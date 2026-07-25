import assert from 'node:assert/strict';
import test from 'node:test';
import { validateLocaleRegistry } from './locale-registry.mjs';

const validRegistry = {
  schemaVersion: 1,
  fallback: 'en',
  supported: ['en', 'zh', 'zh-cn', 'es'].map((id) => ({
    id,
    bcp47: [id],
    script: 'Latn',
    textDirection: 'ltr',
    contentReview: 'existing-production-copy',
  })),
  candidates: ['bo', 'de', 'id', 'ja'].map((id) => ({
    id,
    script: 'Latn',
    status: 'blocked-pending-review',
  })),
};

test('accepts the complete supported and gated locale registry', () => {
  assert.deepEqual(validateLocaleRegistry(validRegistry), []);
});

test('rejects enabling a candidate without the release gates', () => {
  const registry = structuredClone(validRegistry);
  registry.supported.push({
    id: 'ja',
    bcp47: ['ja'],
    script: 'Jpan',
    textDirection: 'ltr',
    contentReview: 'existing-production-copy',
  });
  registry.candidates = registry.candidates.filter(({ id }) => id !== 'ja');
  assert.match(validateLocaleRegistry(registry).join('\n'), /Supported locale IDs/);
});
