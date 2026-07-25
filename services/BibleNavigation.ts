export interface BibleBookBoundary {
  id: string;
  numberOfChapters: number;
}

export interface BibleChapterCoordinate {
  bookId: string;
  chapter: number;
}

export interface BibleVerseCoordinate extends BibleChapterCoordinate {
  translationId: string;
  verse: number;
}

export function parsePositiveSafeInteger(value: string | null | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseChapterAndVerse(
  chapterValue: string,
  verseValue?: string,
): { chapter: number; verse?: number } | null {
  const chapter = parsePositiveSafeInteger(chapterValue);
  const verse = verseValue === undefined ? undefined : parsePositiveSafeInteger(verseValue);
  if (chapter === null || verse === null) return null;
  return { chapter, verse };
}

export function clampChapterNumber(chapter: number, numberOfChapters: number): number {
  if (!Number.isSafeInteger(numberOfChapters) || numberOfChapters < 1) return 1;
  if (!Number.isSafeInteger(chapter) || chapter < 1) return 1;
  return Math.min(chapter, numberOfChapters);
}

export function getChapterCoordinateIfInBounds(
  book: BibleBookBoundary | null | undefined,
  chapter: number,
): BibleChapterCoordinate | null {
  if (
    !book ||
    !Number.isSafeInteger(book.numberOfChapters) ||
    book.numberOfChapters < 1 ||
    !Number.isSafeInteger(chapter) ||
    chapter < 1 ||
    chapter > book.numberOfChapters
  ) {
    return null;
  }
  return { bookId: book.id, chapter };
}

export type ReaderChapterParamResolution =
  | { status: 'absent' | 'invalid' }
  | { status: 'deferred'; chapter: number }
  | { status: 'ready'; chapter: number };

export function resolveReaderChapterParam(
  value: string | undefined,
  requestedBook: boolean,
  resolvedBook: BibleBookBoundary | null | undefined,
): ReaderChapterParamResolution {
  if (value === undefined) return { status: 'absent' };
  const chapter = parsePositiveSafeInteger(value);
  if (chapter === null) return { status: 'invalid' };
  if (requestedBook && !resolvedBook) return { status: 'deferred', chapter };
  return {
    status: 'ready',
    chapter: resolvedBook
      ? clampChapterNumber(chapter, resolvedBook.numberOfChapters)
      : chapter,
  };
}

const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{2,40}$/;

export function getAdjacentChapter(
  books: readonly BibleBookBoundary[],
  current: BibleChapterCoordinate,
  direction: 'prev' | 'next',
): BibleChapterCoordinate | null {
  const bookIndex = books.findIndex(({ id }) => id === current.bookId);
  if (bookIndex < 0 || !Number.isInteger(current.chapter) || current.chapter < 1) return null;

  const book = books[bookIndex];
  if (!Number.isInteger(book.numberOfChapters) || book.numberOfChapters < 1) return null;

  if (direction === 'next') {
    if (current.chapter < book.numberOfChapters) {
      return { bookId: book.id, chapter: current.chapter + 1 };
    }
    const nextBook = books[bookIndex + 1];
    return nextBook ? { bookId: nextBook.id, chapter: 1 } : null;
  }

  if (current.chapter > 1) return { bookId: book.id, chapter: current.chapter - 1 };
  const previousBook = books[bookIndex - 1];
  return previousBook
    ? { bookId: previousBook.id, chapter: previousBook.numberOfChapters }
    : null;
}

export function createStableVerseId(coordinate: BibleVerseCoordinate) {
  const { translationId, bookId, chapter, verse } = coordinate;
  if (!IDENTIFIER_PATTERN.test(translationId) || !IDENTIFIER_PATTERN.test(bookId)) {
    throw new Error('Translation and book identifiers must be stable ASCII identifiers.');
  }
  if (!Number.isInteger(chapter) || chapter < 1 || !Number.isInteger(verse) || verse < 1) {
    throw new Error('Chapter and verse must be positive integers.');
  }
  return `${translationId}:${bookId}:${chapter}:${verse}`;
}

export function parseStableVerseId(value: string): BibleVerseCoordinate | null {
  const [translationId, bookId, chapterValue, verseValue, extra] = value.split(':');
  const chapter = Number(chapterValue);
  const verse = Number(verseValue);
  if (
    extra !== undefined ||
    !IDENTIFIER_PATTERN.test(translationId ?? '') ||
    !IDENTIFIER_PATTERN.test(bookId ?? '') ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    !Number.isInteger(verse) ||
    verse < 1
  ) {
    return null;
  }
  return { translationId, bookId, chapter, verse };
}
