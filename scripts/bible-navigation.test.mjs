import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createStableVerseId,
  getAdjacentChapter,
  parseStableVerseId,
} from '../services/BibleNavigation.ts';

const books = [
  { id: 'AAA', numberOfChapters: 2 },
  { id: 'BBB', numberOfChapters: 3 },
];

test('chapter navigation crosses book boundaries without wrapping the canon', () => {
  assert.deepEqual(getAdjacentChapter(books, { bookId: 'AAA', chapter: 2 }, 'next'), {
    bookId: 'BBB',
    chapter: 1,
  });
  assert.deepEqual(getAdjacentChapter(books, { bookId: 'BBB', chapter: 1 }, 'prev'), {
    bookId: 'AAA',
    chapter: 2,
  });
  assert.equal(getAdjacentChapter(books, { bookId: 'AAA', chapter: 1 }, 'prev'), null);
  assert.equal(getAdjacentChapter(books, { bookId: 'BBB', chapter: 3 }, 'next'), null);
});

test('stable verse IDs round-trip and reject malformed coordinates', () => {
  const coordinate = { translationId: 'cmn_cuv', bookId: 'PSA', chapter: 9, verse: 16 };
  const id = createStableVerseId(coordinate);
  assert.equal(id, 'cmn_cuv:PSA:9:16');
  assert.deepEqual(parseStableVerseId(id), coordinate);
  assert.equal(parseStableVerseId('cmn_cuv:PSA:0:16'), null);
  assert.throws(
    () => createStableVerseId({ ...coordinate, bookId: 'PSA:9' }),
    /stable ASCII identifiers/,
  );
});
