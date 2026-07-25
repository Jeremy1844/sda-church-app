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

export interface BibleChapterRequest {
  translationId: string;
  bookId: string;
  chapter: number;
}

interface BibleChapterResponseCoordinates {
  translation?: { id?: string };
  book?: { id?: string };
  chapter?: { number?: number };
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
    response.translation?.id === request.translationId &&
    response.book?.id === request.bookId &&
    response.chapter?.number === request.chapter
  );
}
