import type {
  ChapterContent,
  ChapterData,
  ChapterFootnote,
  ChapterHebrewSubtitle,
  ChapterVerse,
  Translation,
  TranslationBook,
} from './BibleService';

export const MAX_BIBLE_BOOKS = 100;
export const MAX_BIBLE_CHAPTERS_PER_BOOK = 200;
export const MAX_BIBLE_VERSES_PER_BOOK = 10_000;
export const MAX_BIBLE_VERSES_PER_CHAPTER = 300;
export const MAX_BIBLE_CHAPTER_CONTENT_ITEMS = 4_096;
export const MAX_BIBLE_INLINE_ITEMS = 2_048;
export const MAX_BIBLE_FOOTNOTES = 2_048;
export const MAX_BIBLE_TEXT_LENGTH = 16_384;
export const MAX_BIBLE_CHAPTER_TEXT_LENGTH = 1_048_576;

const MAX_IDENTIFIER_LENGTH = 32;
const MAX_NAME_LENGTH = 256;
const MAX_TITLE_LENGTH = 512;
const MAX_HEADING_PARTS = 64;
const MAX_POETRY_INDENT = 32;
const MAX_FOOTNOTE_CALLER_LENGTH = 32;
const SAFE_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

type JsonRecord = Record<string, unknown>;

export interface BibleChapterCoordinates {
  translationId: string;
  bookId: string;
  chapter: number;
}

export interface BibleChapterCorePayload {
  translation: Translation;
  book: TranslationBook;
  numberOfVerses: number;
  chapter: ChapterData;
}

export class BiblePayloadValidationError extends Error {
  constructor(path: string, reason: string) {
    super(`Invalid Bible payload at ${path}: ${reason}`);
    this.name = 'BiblePayloadValidationError';
  }
}

function invalid(path: string, reason: string): never {
  throw new BiblePayloadValidationError(path, reason);
}

function record(value: unknown, path: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return invalid(path, 'expected an object');
  }
  return value as JsonRecord;
}

function boundedArray(
  value: unknown,
  path: string,
  maximum: number,
  minimum = 0,
): unknown[] {
  if (!Array.isArray(value)) invalid(path, 'expected an array');
  if (value.length < minimum || value.length > maximum) {
    invalid(path, `expected ${minimum}-${maximum} items`);
  }
  return value;
}

function boundedString(
  value: unknown,
  path: string,
  maximum: number,
  allowEmpty = false,
): string {
  if (typeof value !== 'string') invalid(path, 'expected a string');
  if (value.length > maximum || (!allowEmpty && value.trim().length === 0)) {
    invalid(path, `expected ${allowEmpty ? 'at most' : '1-'}${maximum} characters`);
  }
  return value;
}

function identifier(value: unknown, path: string): string {
  const parsed = boundedString(value, path, MAX_IDENTIFIER_LENGTH);
  if (!SAFE_IDENTIFIER.test(parsed)) invalid(path, 'expected a safe identifier');
  return parsed;
}

function integerInRange(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < minimum ||
    (value as number) > maximum
  ) {
    invalid(path, `expected an integer from ${minimum} through ${maximum}`);
  }
  return value as number;
}

function exactKeys(value: JsonRecord, path: string, allowed: readonly string[]): void {
  const allowedKeys = new Set(allowed);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    invalid(path, 'contains unsupported fields');
  }
}

function validateExpectedCoordinates(expected: BibleChapterCoordinates): void {
  identifier(expected.translationId, 'request.translationId');
  identifier(expected.bookId, 'request.bookId');
  integerInRange(
    expected.chapter,
    'request.chapter',
    1,
    MAX_BIBLE_CHAPTERS_PER_BOOK,
  );
}

function parseBook(
  value: unknown,
  path: string,
  expectedTranslationId: string,
): TranslationBook {
  const source = record(value, path);
  const translationId = identifier(source.translationId, `${path}.translationId`);
  if (translationId !== expectedTranslationId) {
    invalid(`${path}.translationId`, 'does not match the requested translation');
  }

  const rawTitle = source.title;
  const title =
    rawTitle === null
      ? null
      : boundedString(rawTitle, `${path}.title`, MAX_TITLE_LENGTH);

  return {
    id: identifier(source.id, `${path}.id`),
    name: boundedString(source.name, `${path}.name`, MAX_NAME_LENGTH),
    commonName: boundedString(
      source.commonName,
      `${path}.commonName`,
      MAX_NAME_LENGTH,
    ),
    title,
    numberOfChapters: integerInRange(
      source.numberOfChapters,
      `${path}.numberOfChapters`,
      1,
      MAX_BIBLE_CHAPTERS_PER_BOOK,
    ),
    totalNumberOfVerses: integerInRange(
      source.totalNumberOfVerses,
      `${path}.totalNumberOfVerses`,
      1,
      MAX_BIBLE_VERSES_PER_BOOK,
    ),
  };
}

function parseTranslation(
  value: unknown,
  path: string,
  expectedTranslationId: string,
): Translation {
  const source = record(value, path);
  const id = identifier(source.id, `${path}.id`);
  if (id !== expectedTranslationId) {
    invalid(`${path}.id`, 'does not match the requested translation');
  }

  if (source.textDirection !== 'ltr' && source.textDirection !== 'rtl') {
    invalid(`${path}.textDirection`, 'expected ltr or rtl');
  }

  const parsed: Translation = {
    id,
    name: boundedString(source.name, `${path}.name`, MAX_NAME_LENGTH),
    englishName: boundedString(
      source.englishName,
      `${path}.englishName`,
      MAX_NAME_LENGTH,
    ),
    language: identifier(source.language, `${path}.language`),
    textDirection: source.textDirection,
  };

  if (source.languageName !== undefined) {
    parsed.languageName = boundedString(
      source.languageName,
      `${path}.languageName`,
      MAX_NAME_LENGTH,
    );
  }
  if (source.attribution !== undefined) {
    parsed.attribution = boundedString(
      source.attribution,
      `${path}.attribution`,
      MAX_TITLE_LENGTH,
      true,
    );
  }
  return parsed;
}

/**
 * Validates and copies the bounded book-list fields consumed by the reader.
 * Provider-only metadata is deliberately not published into application state.
 */
export function parseBibleBooksPayload(
  value: unknown,
  expectedTranslationId: string,
): TranslationBook[] {
  const requestedTranslation = identifier(
    expectedTranslationId,
    'request.translationId',
  );
  const source = record(value, 'payload');
  const translation = record(source.translation, 'payload.translation');
  const responseTranslationId = identifier(
    translation.id,
    'payload.translation.id',
  );
  if (responseTranslationId !== requestedTranslation) {
    invalid(
      'payload.translation.id',
      'does not match the requested translation',
    );
  }

  const books = boundedArray(
    source.books,
    'payload.books',
    MAX_BIBLE_BOOKS,
    1,
  );
  const declaredBookCount = integerInRange(
    translation.numberOfBooks,
    'payload.translation.numberOfBooks',
    1,
    MAX_BIBLE_BOOKS,
  );
  if (declaredBookCount !== books.length) {
    invalid('payload.books', 'does not match the declared book count');
  }

  const seenIds = new Set<string>();
  return books.map((book, index) => {
    const parsed = parseBook(
      book,
      `payload.books[${index}]`,
      requestedTranslation,
    );
    if (seenIds.has(parsed.id)) {
      invalid(`payload.books[${index}].id`, 'duplicate book identifier');
    }
    seenIds.add(parsed.id);
    return parsed;
  });
}

interface TextBudget {
  used: number;
}

function chapterText(
  value: unknown,
  path: string,
  budget: TextBudget,
  allowEmpty = true,
): string {
  const parsed = boundedString(
    value,
    path,
    MAX_BIBLE_TEXT_LENGTH,
    allowEmpty,
  );
  budget.used += parsed.length;
  if (budget.used > MAX_BIBLE_CHAPTER_TEXT_LENGTH) {
    invalid(path, 'chapter text exceeds the total size limit');
  }
  return parsed;
}

function parseInlineContent(
  value: unknown,
  path: string,
  budget: TextBudget,
  allowInlineHeadingAndBreak: false,
): ChapterHebrewSubtitle['content'][number];
function parseInlineContent(
  value: unknown,
  path: string,
  budget: TextBudget,
  allowInlineHeadingAndBreak: true,
): ChapterVerse['content'][number];
function parseInlineContent(
  value: unknown,
  path: string,
  budget: TextBudget,
  allowInlineHeadingAndBreak: boolean,
): string | { text: string; poem?: number } | { heading: string } | {
  lineBreak: true;
} | { noteId: number } {
  if (typeof value === 'string') return chapterText(value, path, budget);

  const source = record(value, path);
  if ('text' in source) {
    exactKeys(source, path, ['text', 'poem']);
    const parsed: { text: string; poem?: number } = {
      text: chapterText(source.text, `${path}.text`, budget),
    };
    if (source.poem !== undefined) {
      parsed.poem = integerInRange(
        source.poem,
        `${path}.poem`,
        1,
        MAX_POETRY_INDENT,
      );
    }
    return parsed;
  }

  if ('noteId' in source) {
    exactKeys(source, path, ['noteId']);
    return {
      // HelloAO's production payloads use zero-based footnote identifiers.
      noteId: integerInRange(source.noteId, `${path}.noteId`, 0, Number.MAX_SAFE_INTEGER),
    };
  }

  if (allowInlineHeadingAndBreak && 'heading' in source) {
    exactKeys(source, path, ['heading']);
    return {
      heading: chapterText(source.heading, `${path}.heading`, budget, false),
    };
  }

  if (allowInlineHeadingAndBreak && 'lineBreak' in source) {
    exactKeys(source, path, ['lineBreak']);
    if (source.lineBreak !== true) invalid(`${path}.lineBreak`, 'expected true');
    return { lineBreak: true };
  }

  return invalid(path, 'unsupported inline content');
}

function parseContent(
  value: unknown,
  budget: TextBudget,
  verseIds: Set<number>,
  inlineNoteIds: Set<number>,
): ChapterContent[] {
  const items = boundedArray(
    value,
    'payload.chapter.content',
    MAX_BIBLE_CHAPTER_CONTENT_ITEMS,
    1,
  );

  return items.map((item, index) => {
    const path = `payload.chapter.content[${index}]`;
    const source = record(item, path);

    if (source.type === 'line_break') {
      exactKeys(source, path, ['type']);
      return { type: 'line_break' };
    }

    if (source.type === 'heading') {
      exactKeys(source, path, ['type', 'content']);
      const parts = boundedArray(
        source.content,
        `${path}.content`,
        MAX_HEADING_PARTS,
        1,
      );
      return {
        type: 'heading',
        content: parts.map((part, partIndex) =>
          chapterText(
            part,
            `${path}.content[${partIndex}]`,
            budget,
            false,
          ),
        ),
      };
    }

    if (source.type === 'verse' || source.type === 'hebrew_subtitle') {
      exactKeys(
        source,
        path,
        source.type === 'verse' ? ['type', 'number', 'content'] : ['type', 'content'],
      );
      const rawInline = boundedArray(
        source.content,
        `${path}.content`,
        MAX_BIBLE_INLINE_ITEMS,
        1,
      );
      const trackNote = (
        parsed: ChapterVerse['content'][number],
        partPath: string,
      ) => {
        if (typeof parsed === 'object' && 'noteId' in parsed) {
          if (inlineNoteIds.has(parsed.noteId)) {
            invalid(`${partPath}.noteId`, 'duplicate inline footnote identifier');
          }
          inlineNoteIds.add(parsed.noteId);
        }
      };

      if (source.type === 'hebrew_subtitle') {
        const inline = rawInline.map((part, partIndex) => {
          const partPath = `${path}.content[${partIndex}]`;
          const parsed = parseInlineContent(part, partPath, budget, false);
          trackNote(parsed, partPath);
          return parsed;
        });
        return { type: 'hebrew_subtitle', content: inline };
      }

      const inline = rawInline.map((part, partIndex) => {
        const partPath = `${path}.content[${partIndex}]`;
        const parsed = parseInlineContent(part, partPath, budget, true);
        trackNote(parsed, partPath);
        return parsed;
      });

      const number = integerInRange(
        source.number,
        `${path}.number`,
        1,
        MAX_BIBLE_VERSES_PER_CHAPTER,
      );
      if (verseIds.has(number)) {
        invalid(`${path}.number`, 'duplicate verse identifier');
      }
      verseIds.add(number);
      return { type: 'verse', number, content: inline };
    }

    return invalid(`${path}.type`, 'unsupported chapter content type');
  });
}

function parseFootnotes(
  value: unknown,
  expectedChapter: number,
  numberOfVerses: number,
  verseIds: ReadonlySet<number>,
  inlineNoteIds: ReadonlySet<number>,
  budget: TextBudget,
): ChapterFootnote[] {
  const source = boundedArray(
    value,
    'payload.chapter.footnotes',
    MAX_BIBLE_FOOTNOTES,
  );
  const footnoteIds = new Set<number>();

  const parsed = source.map((footnote, index) => {
    const path = `payload.chapter.footnotes[${index}]`;
    const entry = record(footnote, path);
    exactKeys(entry, path, ['noteId', 'text', 'caller', 'reference']);

    const noteId = integerInRange(
      entry.noteId,
      `${path}.noteId`,
      0,
      Number.MAX_SAFE_INTEGER,
    );
    if (footnoteIds.has(noteId)) {
      invalid(`${path}.noteId`, 'duplicate footnote identifier');
    }
    footnoteIds.add(noteId);

    let caller: string | null;
    if (entry.caller === null) {
      caller = null;
    } else {
      caller = boundedString(
        entry.caller,
        `${path}.caller`,
        MAX_FOOTNOTE_CALLER_LENGTH,
        true,
      );
    }

    const result: ChapterFootnote = {
      noteId,
      text: chapterText(entry.text, `${path}.text`, budget, false),
      caller,
    };

    if (entry.reference !== undefined) {
      const reference = record(entry.reference, `${path}.reference`);
      exactKeys(reference, `${path}.reference`, ['chapter', 'verse']);
      const referenceChapter = integerInRange(
        reference.chapter,
        `${path}.reference.chapter`,
        1,
        MAX_BIBLE_CHAPTERS_PER_BOOK,
      );
      if (referenceChapter !== expectedChapter) {
        invalid(`${path}.reference.chapter`, 'does not match the requested chapter');
      }
      const referenceVerse = integerInRange(
        reference.verse,
        `${path}.reference.verse`,
        0,
        numberOfVerses,
      );
      // Verse zero is how the provider associates notes with a chapter subtitle.
      if (referenceVerse !== 0 && !verseIds.has(referenceVerse)) {
        invalid(`${path}.reference.verse`, 'does not identify a validated verse');
      }
      result.reference = { chapter: referenceChapter, verse: referenceVerse };
    }

    return result;
  });

  if (footnoteIds.size !== inlineNoteIds.size) {
    invalid(
      'payload.chapter.footnotes',
      'must correspond exactly to inline footnote references',
    );
  }
  for (const noteId of inlineNoteIds) {
    if (!footnoteIds.has(noteId)) {
      invalid(
        'payload.chapter.footnotes',
        'must correspond exactly to inline footnote references',
      );
    }
  }
  return parsed;
}

/**
 * Validates and copies the non-audio chapter fields consumed by the reader.
 * Callers should independently apply the Bible audio policy to response-derived URLs.
 */
export function parseBibleChapterCorePayload(
  value: unknown,
  expected: BibleChapterCoordinates,
): BibleChapterCorePayload {
  validateExpectedCoordinates(expected);
  const source = record(value, 'payload');
  const translation = parseTranslation(
    source.translation,
    'payload.translation',
    expected.translationId,
  );
  const book = parseBook(source.book, 'payload.book', expected.translationId);
  if (book.id !== expected.bookId) {
    invalid('payload.book.id', 'does not match the requested book');
  }

  const chapter = record(source.chapter, 'payload.chapter');
  const chapterNumber = integerInRange(
    chapter.number,
    'payload.chapter.number',
    1,
    MAX_BIBLE_CHAPTERS_PER_BOOK,
  );
  if (chapterNumber !== expected.chapter) {
    invalid('payload.chapter.number', 'does not match the requested chapter');
  }
  if (chapterNumber > book.numberOfChapters) {
    invalid('payload.chapter.number', 'exceeds the validated book chapter count');
  }

  const numberOfVerses = integerInRange(
    source.numberOfVerses,
    'payload.numberOfVerses',
    1,
    MAX_BIBLE_VERSES_PER_CHAPTER,
  );
  const budget: TextBudget = { used: 0 };
  const verseIds = new Set<number>();
  const inlineNoteIds = new Set<number>();
  const content = parseContent(
    chapter.content,
    budget,
    verseIds,
    inlineNoteIds,
  );

  if (verseIds.size !== numberOfVerses) {
    invalid(
      'payload.numberOfVerses',
      'does not match the number of validated verses',
    );
  }
  for (let number = 1; number <= numberOfVerses; number += 1) {
    if (!verseIds.has(number)) {
      invalid('payload.chapter.content', 'verse identifiers are not contiguous');
    }
  }

  const footnotes = parseFootnotes(
    chapter.footnotes,
    chapterNumber,
    numberOfVerses,
    verseIds,
    inlineNoteIds,
    budget,
  );

  return {
    translation,
    book,
    numberOfVerses,
    chapter: { number: chapterNumber, content, footnotes },
  };
}
