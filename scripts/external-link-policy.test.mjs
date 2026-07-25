import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractHttpsReferences,
  validateExternalLinks,
} from './external-link-policy.mjs';

const policy = {
  schemaVersion: 2,
  allowedHosts: [
    { host: 'approved.example', purpose: 'test-destination', mode: 'user-initiated' },
  ],
  disabledIntegrations: ['unapproved-feature'],
};

test('allows credential-free HTTPS links on registered hosts', () => {
  assert.deepEqual(
    validateExternalLinks("const url = 'https://approved.example/path';", policy),
    [],
  );
});

test('rejects unregistered, credential-bearing, and placeholder links', () => {
  assert.match(
    validateExternalLinks("'https://other.example/path'", policy).join('\n'),
    /not approved/,
  );
  assert.match(
    validateExternalLinks("'https://user:secret@approved.example/path'", policy).join('\n'),
    /contains credentials/,
  );
  assert.match(
    validateExternalLinks("'https://approved.example/...placeholder'", policy).join('\n'),
    /placeholder/,
  );
});

test('extracts dynamic URL hosts but ignores documentation comments', () => {
  const references = extractHttpsReferences(
    `
      // Reference only: https://docs.example/not-runtime
      const endpoint = \`https://approved.example/items/\${itemId}\`;
    `,
    'services/example.ts',
  );
  assert.deepEqual(references, [
    { fileName: 'services/example.ts', rawUrl: 'https://approved.example/items/' },
  ]);
});

test('requires exact policy inventory and an interaction mode for every host', () => {
  const missingMode = {
    ...policy,
    allowedHosts: [{ host: 'approved.example', purpose: 'test-destination' }],
  };
  assert.match(
    validateExternalLinks("'https://approved.example/path'", missingMode).join('\n'),
    /mode is invalid/,
  );

  const stalePolicy = {
    ...policy,
    allowedHosts: [
      ...policy.allowedHosts,
      { host: 'unused.example', purpose: 'stale-destination', mode: 'automatic' },
    ],
  };
  assert.match(
    validateExternalLinks("'https://approved.example/path'", stalePolicy).join('\n'),
    /not used by runtime source/,
  );
});

test('permits an explicit non-network mode for bundled metadata URLs', () => {
  const metadataPolicy = {
    ...policy,
    allowedHosts: [
      {
        host: 'approved.example',
        purpose: 'local-metadata-validation',
        mode: 'local-metadata-only',
      },
    ],
  };
  assert.deepEqual(validateExternalLinks("'https://approved.example/path'", metadataPolicy), []);
});
