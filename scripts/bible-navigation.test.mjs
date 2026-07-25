import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clampChapterNumber,
  createStableVerseId,
  getAdjacentChapter,
  getChapterCoordinateIfInBounds,
  parseChapterAndVerse,
  parsePositiveSafeInteger,
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

test('reader coordinates accept only positive safe integers and clamp to book bounds', () => {
  assert.equal(parsePositiveSafeInteger('1'), 1);
  assert.equal(parsePositiveSafeInteger('150'), 150);
  assert.equal(parsePositiveSafeInteger('0'), null);
  assert.equal(parsePositiveSafeInteger('-1'), null);
  assert.equal(parsePositiveSafeInteger('2abc'), null);
  assert.equal(parsePositiveSafeInteger('9007199254740992'), null);
  assert.deepEqual(parseChapterAndVerse('3', '16'), { chapter: 3, verse: 16 });
  assert.deepEqual(parseChapterAndVerse('3'), { chapter: 3, verse: undefined });
  assert.equal(parseChapterAndVerse('0', '1'), null);
  assert.equal(parseChapterAndVerse('1', '0'), null);
  assert.equal(parseChapterAndVerse('1', '9007199254740992'), null);

  assert.equal(clampChapterNumber(0, 50), 1);
  assert.equal(clampChapterNumber(51, 50), 50);
  assert.equal(clampChapterNumber(25, 50), 25);
  assert.equal(clampChapterNumber(Number.NaN, 50), 1);

  assert.deepEqual(
    getChapterCoordinateIfInBounds({ id: 'PSA', numberOfChapters: 150 }, 150),
    { bookId: 'PSA', chapter: 150 },
  );
  assert.equal(
    getChapterCoordinateIfInBounds({ id: 'JUD', numberOfChapters: 1 }, 2),
    null,
  );
});
