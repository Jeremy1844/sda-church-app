/**
 * Identifies cancellation failures without relying on DOMException being available in
 * every React Native runtime.
 */
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

export function shouldSurfaceBibleLoadError(
  signal: AbortSignal,
  error: unknown,
): boolean {
  return !signal.aborted && !isAbortError(error);
}

export interface BibleChapterRequest {
  translationId: string;
  bookId: string;
  chapter: number;
}

interface BibleChapterResponseCoordinates {
  translation?: { id?: string };
  book?: { id?: string };
  chapter?: {
    number?: number;
    content?: ReadonlyArray<{ type?: string; number?: number }>;
  };
}

export function isSameChapterRequest(
  left: BibleChapterRequest | null | undefined,
  right: BibleChapterRequest | null | undefined,
): boolean {
  return !!(
    left &&
    right &&
    left.translationId === right.translationId &&
    left.bookId === right.bookId &&
    left.chapter === right.chapter
  );
}

export function chapterResponseMatchesRequest(
  response: BibleChapterResponseCoordinates | null | undefined,
  request: BibleChapterRequest,
): boolean {
  return !!(
    response &&
    response.translation?.id === request.translationId &&
    response.book?.id === request.bookId &&
    response.chapter?.number === request.chapter
  );
}

export function chapterResponseContainsVerse(
  response: BibleChapterResponseCoordinates | null | undefined,
  verse: number,
): boolean {
  return !!(
    Number.isSafeInteger(verse) &&
    verse > 0 &&
    response?.chapter?.content?.some(
      (item) => item.type === 'verse' && item.number === verse,
    )
  );
}

/**
 * Guards delayed reader work (for example autoplay and verse scrolling) against
 * both stale UI selection and stale chapter payloads.
 */
export function canRunChapterAction(
  active: boolean,
  expected: BibleChapterRequest,
  current: BibleChapterRequest | null | undefined,
  response: BibleChapterResponseCoordinates | null | undefined,
): boolean {
  return (
    active &&
    isSameChapterRequest(expected, current) &&
    chapterResponseMatchesRequest(response, expected)
  );
}

/**
 * A chapter response is safe to publish only while its request remains active and
 * the API payload identifies the exact coordinates that were requested.
 */
export function canApplyChapterResponse(
  signal: AbortSignal,
  response: BibleChapterResponseCoordinates,
  request: BibleChapterRequest,
): boolean {
  return (
    !signal.aborted &&
    chapterResponseMatchesRequest(response, request)
  );
}
