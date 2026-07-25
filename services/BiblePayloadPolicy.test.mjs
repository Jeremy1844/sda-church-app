import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BiblePayloadValidationError,
  MAX_BIBLE_BOOKS,
  MAX_BIBLE_INLINE_ITEMS,
  MAX_BIBLE_TEXT_LENGTH,
  parseBibleBooksPayload,
  parseBibleChapterCorePayload,
} from './BiblePayloadPolicy.ts';

const request = { translationId: 'BSB', bookId: 'PSA', chapter: 9 };

const book = (id = 'PSA') => ({
  id,
  translationId: 'BSB',
  name: id === 'PSA' ? 'Psalms' : 'Genesis',
  commonName: id === 'PSA' ? 'Psalms' : 'Genesis',
  title: id === 'PSA' ? null : 'Genesis',
  numberOfChapters: id === 'PSA' ? 150 : 50,
  totalNumberOfVerses: id === 'PSA' ? 2461 : 1533,
  ignoredProviderMetadata: 'not published',
});

const translation = (id = 'BSB') => ({
  id,
  name: 'Berean Standard Bible',
  englishName: 'Berean Standard Bible',
  language: 'eng',
  languageName: 'English',
  textDirection: 'ltr',
  ignoredProviderMetadata: 'not published',
});

const validBooksPayload = () => ({
  translation: { id: 'BSB', numberOfBooks: 2 },
  books: [book('GEN'), book('PSA')],
});

const validChapterPayload = () => ({
  translation: translation(),
  book: book(),
  numberOfVerses: 2,
  chapter: {
    number: 9,
    content: [
      { type: 'heading', content: ['A representative heading'] },
      {
        type: 'hebrew_subtitle',
        content: ['For the choirmaster.', { noteId: 0 }],
      },
      { type: 'line_break' },
      {
        type: 'verse',
        number: 1,
        content: [
          { heading: 'Inline heading' },
          { text: 'I will give thanks', poem: 1, wordsOfJesus: false },
          { text: 'A descriptive line', descriptive: true },
          { lineBreak: true },
          'with all my heart.',
          { noteId: 1 },
        ],
      },
      { type: 'verse', number: 2, content: ['I will be glad and rejoice.'] },
    ],
    footnotes: [
      {
        noteId: 0,
        caller: '+',
        text: 'A subtitle note.',
        reference: { chapter: 9, verse: 0 },
      },
      {
        noteId: 1,
        caller: null,
        text: 'A verse note.',
        reference: { chapter: 9, verse: 1 },
      },
    ],
  },
  thisChapterAudioLinks: { ignoredHere: 'https://example.invalid/audio.mp3' },
});

const rejects = (action) =>
  assert.throws(action, (error) => error instanceof BiblePayloadValidationError);

test('validates and sanitizes a representative book list', () => {
  assert.deepEqual(parseBibleBooksPayload(validBooksPayload(), 'BSB'), [
    {
      id: 'GEN',
      name: 'Genesis',
      commonName: 'Genesis',
      title: 'Genesis',
      numberOfChapters: 50,
      totalNumberOfVerses: 1533,
    },
    {
      id: 'PSA',
      name: 'Psalms',
      commonName: 'Psalms',
      title: null,
      numberOfChapters: 150,
      totalNumberOfVerses: 2461,
    },
  ]);
});

test('rejects malformed, mismatched, oversized, and duplicate book lists', () => {
  rejects(() => parseBibleBooksPayload(null, 'BSB'));
  rejects(() =>
    parseBibleBooksPayload(
      { translation: { id: 'BSB', numberOfBooks: 1 }, books: null },
      'BSB',
    ),
  );
  rejects(() =>
    parseBibleBooksPayload(
      { ...validBooksPayload(), translation: { id: 'eng_kjv', numberOfBooks: 2 } },
      'BSB',
    ),
  );
  rejects(() =>
    parseBibleBooksPayload(
      { ...validBooksPayload(), translation: { id: 'BSB', numberOfBooks: 1 } },
      'BSB',
    ),
  );
  rejects(() =>
    parseBibleBooksPayload(
      {
        translation: { id: 'BSB', numberOfBooks: MAX_BIBLE_BOOKS },
        books: Array.from({ length: MAX_BIBLE_BOOKS + 1 }, (_, index) =>
          book(`B${index}`),
        ),
      },
      'BSB',
    ),
  );
  rejects(() =>
    parseBibleBooksPayload(
      {
        translation: { id: 'BSB', numberOfBooks: 2 },
        books: [book('GEN'), book('GEN')],
      },
      'BSB',
    ),
  );
});

test('validates and sanitizes every renderer-supported chapter shape', () => {
  const result = parseBibleChapterCorePayload(validChapterPayload(), request);

  assert.deepEqual(result.translation, {
    id: 'BSB',
    name: 'Berean Standard Bible',
    englishName: 'Berean Standard Bible',
    language: 'eng',
    languageName: 'English',
    textDirection: 'ltr',
  });
  assert.equal(result.book.id, 'PSA');
  assert.equal(result.numberOfVerses, 2);
  assert.equal(result.chapter.content[1].type, 'hebrew_subtitle');
  assert.deepEqual(result.chapter.content[3].content[1], {
    text: 'I will give thanks',
    poem: 1,
    wordsOfJesus: false,
  });
  assert.deepEqual(result.chapter.content[3].content[2], {
    text: 'A descriptive line',
    descriptive: true,
  });
  assert.deepEqual(result.chapter.footnotes.map(({ noteId }) => noteId), [0, 1]);
  assert.equal('thisChapterAudioLinks' in result, false);
  assert.equal('ignoredProviderMetadata' in result.translation, false);
});

test('accepts a provider verse object whose translation text is intentionally empty', () => {
  const payload = validChapterPayload();
  payload.chapter.content[4].content = [];
  const result = parseBibleChapterCorePayload(payload, request);
  assert.deepEqual(result.chapter.content[4], {
    type: 'verse',
    number: 2,
    content: [],
  });
});

test('rejects translation, book, and chapter coordinate mismatches', () => {
  const wrongTranslation = validChapterPayload();
  wrongTranslation.translation.id = 'eng_kjv';
  rejects(() => parseBibleChapterCorePayload(wrongTranslation, request));

  const wrongBook = validChapterPayload();
  wrongBook.book.id = 'GEN';
  rejects(() => parseBibleChapterCorePayload(wrongBook, request));

  const wrongChapter = validChapterPayload();
  wrongChapter.chapter.number = 10;
  rejects(() => parseBibleChapterCorePayload(wrongChapter, request));
});

test('rejects non-array chapter content and footnotes', () => {
  const invalidContent = validChapterPayload();
  invalidContent.chapter.content = null;
  rejects(() => parseBibleChapterCorePayload(invalidContent, request));

  const invalidFootnotes = validChapterPayload();
  invalidFootnotes.chapter.footnotes = null;
  rejects(() => parseBibleChapterCorePayload(invalidFootnotes, request));
});

test('rejects malformed or unsupported nested content', () => {
  for (const malformed of [
    { type: 'unknown', content: [] },
    { type: 'verse', number: 1, content: [{ unknown: true }] },
    { type: 'verse', number: 1, content: [{ lineBreak: false }] },
    { type: 'verse', number: 1, content: [{ text: 'text', poem: 0 }] },
    { type: 'verse', number: 1, content: [{ text: 'text', wordsOfJesus: 'yes' }] },
    { type: 'verse', number: 1, content: [{ text: 'text', descriptive: 1 }] },
    { type: 'verse', number: 1, content: [{ text: 'text', noteId: 1 }] },
    { type: 'heading', content: [42] },
    { type: 'hebrew_subtitle', content: [{ heading: 'not supported here' }] },
  ]) {
    const payload = validChapterPayload();
    payload.chapter.content[3] = malformed;
    rejects(() => parseBibleChapterCorePayload(payload, request));
  }

  const oversizedText = validChapterPayload();
  oversizedText.chapter.content[3].content = ['x'.repeat(MAX_BIBLE_TEXT_LENGTH + 1)];
  rejects(() => parseBibleChapterCorePayload(oversizedText, request));

  const oversizedInlineList = validChapterPayload();
  oversizedInlineList.chapter.content[3].content = Array.from(
    { length: MAX_BIBLE_INLINE_ITEMS + 1 },
    () => 'x',
  );
  rejects(() => parseBibleChapterCorePayload(oversizedInlineList, request));
});

test('accepts unique sparse provider verse numbering but rejects duplicates and bad totals', () => {
  const duplicateVerse = validChapterPayload();
  duplicateVerse.chapter.content[4].number = 1;
  rejects(() => parseBibleChapterCorePayload(duplicateVerse, request));

  const sparseVerse = validChapterPayload();
  sparseVerse.chapter.content[4].number = 3;
  const sparseResult = parseBibleChapterCorePayload(sparseVerse, request);
  assert.deepEqual(
    sparseResult.chapter.content
      .filter(({ type }) => type === 'verse')
      .map(({ number }) => number),
    [1, 3],
  );

  const wrongTotal = validChapterPayload();
  wrongTotal.numberOfVerses = 3;
  rejects(() => parseBibleChapterCorePayload(wrongTotal, request));

  const referenceToMissingNumber = validChapterPayload();
  referenceToMissingNumber.chapter.content[4].number = 3;
  referenceToMissingNumber.chapter.footnotes[1].reference.verse = 2;
  rejects(() => parseBibleChapterCorePayload(referenceToMissingNumber, request));
});

test('rejects duplicate, orphaned, and malformed footnotes', () => {
  const duplicateFootnote = validChapterPayload();
  duplicateFootnote.chapter.footnotes[1].noteId = 0;
  rejects(() => parseBibleChapterCorePayload(duplicateFootnote, request));

  const orphanedInlineReference = validChapterPayload();
  orphanedInlineReference.chapter.content[3].content.at(-1).noteId = 99;
  rejects(() => parseBibleChapterCorePayload(orphanedInlineReference, request));

  const malformedReference = validChapterPayload();
  malformedReference.chapter.footnotes[1].reference.chapter = 8;
  rejects(() => parseBibleChapterCorePayload(malformedReference, request));
});
