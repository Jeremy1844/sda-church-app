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
