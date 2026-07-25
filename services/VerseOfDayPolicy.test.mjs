import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  getRenderedVerseOfDayCacheKey,
  getVerseOfDayDateKey,
  parseRenderedVerseOfDay,
  parseVerseOfDaySelection,
  resolveVerseOfDayFailure,
  selectStableDailyIndex,
} from './VerseOfDayPolicy.ts';

const dateKey = '2026-07-25';
const master = {
  bookId: 'JHN',
  chapter: 3,
  verse: 16,
  dateKey,
};

test('the daily key rolls over at 06:00 local time', () => {
  assert.equal(getVerseOfDayDateKey(new Date(2026, 6, 25, 5, 59)), '2026-07-24');
  assert.equal(getVerseOfDayDateKey(new Date(2026, 6, 25, 6, 0)), '2026-07-25');
});

test('master selection parsing rejects stale and malformed coordinates', () => {
  assert.deepEqual(parseVerseOfDaySelection(JSON.stringify(master), dateKey), master);
  assert.deepEqual(
    parseVerseOfDaySelection(
      JSON.stringify({ ...master, dateKey: '2026-7-25' }),
      dateKey,
    ),
    master,
  );
  assert.equal(
    parseVerseOfDaySelection(JSON.stringify({ ...master, dateKey: '2026-07-24' }), dateKey),
    null,
  );
  assert.equal(
    parseVerseOfDaySelection(JSON.stringify({ ...master, chapter: 0 }), dateKey),
    null,
  );
  assert.equal(
    parseVerseOfDaySelection(JSON.stringify({ ...master, bookId: '../JHN' }), dateKey),
    null,
  );
  assert.equal(parseVerseOfDaySelection('{not json', dateKey), null);
});

test('a rendered language cache cannot replace or drift from the master coordinate', () => {
  const rendered = {
    ...master,
    text: '"For God so loved the world..."',
    reference: 'John 3:16',
    language: 'en',
    requestedTranslationId: 'eng_kjv',
    translationId: 'eng_kjv',
  };

  assert.deepEqual(
    parseRenderedVerseOfDay(JSON.stringify(rendered), master, 'en', 'eng_kjv'),
    rendered,
  );
  assert.equal(
    parseRenderedVerseOfDay(
      JSON.stringify({ ...rendered, verse: 17 }),
      master,
      'en',
      'eng_kjv',
    ),
    null,
  );
  assert.equal(
    parseRenderedVerseOfDay(JSON.stringify(rendered), master, 'es', 'spa_r09'),
    null,
  );
});

test('a same-coordinate BSB fallback remains a valid language-specific rendered cache', () => {
  const fallback = {
    ...master,
    text: '"For God so loved the world..."',
    reference: 'John 3:16',
    language: 'es',
    requestedTranslationId: 'spa_r09',
    translationId: 'BSB',
  };

  assert.deepEqual(
    parseRenderedVerseOfDay(JSON.stringify(fallback), master, 'es', 'spa_r09'),
    fallback,
  );
  assert.equal(getRenderedVerseOfDayCacheKey('es'), 'votd_cache_es');
});

test('stable daily selection indexes converge for overlapping language loads', () => {
  const first = selectStableDailyIndex(`${dateKey}:book`, 66);
  assert.equal(first, selectStableDailyIndex(`${dateKey}:book`, 66));
  assert.equal(selectStableDailyIndex(`${dateKey}:book`, 0), null);
});

test('daily verse failure state preserves validated cache and ignores stale cancellation', () => {
  assert.equal(
    resolveVerseOfDayFailure({
      requestIsCurrent: true,
      cancelled: false,
      hasValidatedVerse: true,
    }),
    'ready',
  );
  assert.equal(
    resolveVerseOfDayFailure({
      requestIsCurrent: true,
      cancelled: false,
      hasValidatedVerse: false,
    }),
    'unavailable',
  );
  assert.equal(
    resolveVerseOfDayFailure({
      requestIsCurrent: false,
      cancelled: false,
      hasValidatedVerse: false,
    }),
    'ignore',
  );
  assert.equal(
    resolveVerseOfDayFailure({
      requestIsCurrent: true,
      cancelled: true,
      hasValidatedVerse: false,
    }),
    'ignore',
  );
});

test('Home renders a localized unavailable state with an explicit retry action', () => {
  const source = fs.readFileSync(
    new URL('../app/(tabs)/index.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /displayedVerseLoadStatus === 'unavailable'/);
  assert.match(source, /setVerseRetryNonce\(\(value\) => value \+ 1\)/);
  assert.match(source, /verseUnavailable:/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
});
