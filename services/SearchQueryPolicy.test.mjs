import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_SEARCH_QUERY_LENGTH,
  normalizeSingleQueryParam,
} from './SearchQueryPolicy.ts';

test('single query parameters accept bounded strings only', () => {
  assert.equal(normalizeSingleQueryParam('John 3:16'), 'John 3:16');
  assert.equal(normalizeSingleQueryParam(''), '');
  assert.equal(normalizeSingleQueryParam(['John', 'Romans']), null);
  assert.equal(normalizeSingleQueryParam({ value: 'John' }), null);
  assert.equal(normalizeSingleQueryParam('x'.repeat(MAX_SEARCH_QUERY_LENGTH + 1)), null);
});

test('invalid caller-supplied limits fail closed', () => {
  assert.equal(normalizeSingleQueryParam('x', -1), null);
  assert.equal(normalizeSingleQueryParam('x', 1.5), null);
});
