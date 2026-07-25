import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canApplyChapterResponse,
  isAbortError,
} from './BibleRequestIntegrity.ts';

const request = {
  translationId: 'BSB',
  bookId: 'GEN',
  chapter: 1,
};

const response = {
  translation: { id: 'BSB' },
  book: { id: 'GEN' },
  chapter: { number: 1 },
};

test('accepts only an active response for the exact requested chapter coordinates', () => {
  const controller = new AbortController();

  assert.equal(canApplyChapterResponse(controller.signal, response, request), true);
  assert.equal(
    canApplyChapterResponse(
      controller.signal,
      { ...response, translation: { id: 'eng_kjv' } },
      request,
    ),
    false,
  );
  assert.equal(
    canApplyChapterResponse(
      controller.signal,
      { ...response, book: { id: 'EXO' } },
      request,
    ),
    false,
  );
  assert.equal(
    canApplyChapterResponse(
      controller.signal,
      { ...response, chapter: { number: 2 } },
      request,
    ),
    false,
  );
});

test('rejects an exact response after its request has been aborted', () => {
  const controller = new AbortController();
  controller.abort();

  assert.equal(canApplyChapterResponse(controller.signal, response, request), false);
});

test('recognizes AbortError by its cross-runtime error name only', () => {
  assert.equal(isAbortError(Object.assign(new Error('cancelled'), { name: 'AbortError' })), true);
  assert.equal(isAbortError({ name: 'AbortError' }), true);
  assert.equal(isAbortError(new Error('network failure')), false);
  assert.equal(isAbortError('AbortError'), false);
});
