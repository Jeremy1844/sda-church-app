import assert from 'node:assert/strict';
import test from 'node:test';
import { validateExternalLinks } from './external-link-policy.mjs';

const policy = {
  schemaVersion: 1,
  allowedHosts: [{ host: 'approved.example', purpose: 'test' }],
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
  assert.match(validateExternalLinks("'https://approved.example/...placeholder'", policy).join('\n'), /placeholder/);
});
