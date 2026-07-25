import type { BibleChapterRequest } from './BibleRequestIntegrity';

export const BIBLE_AUDIO_ORIGIN = 'https://audio.bible.helloao.org';
export const MAX_BIBLE_AUDIO_READERS = 8;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;
const READER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;

interface ProviderAudioFields {
  thisChapterAudioLinks?: unknown;
  nextChapterAudioLinks?: unknown;
  previousChapterAudioLinks?: unknown;
}

type SanitizedProviderAudioFields<T extends ProviderAudioFields> = Omit<
  T,
  keyof ProviderAudioFields
> & {
  thisChapterAudioLinks: Record<string, string>;
  nextChapterAudioLinks: null;
  previousChapterAudioLinks: null;
};

function hasSafeCoordinates(request: BibleChapterRequest): boolean {
  return (
    IDENTIFIER_PATTERN.test(request.translationId) &&
    IDENTIFIER_PATTERN.test(request.bookId) &&
    Number.isSafeInteger(request.chapter) &&
    request.chapter >= 1 &&
    request.chapter <= 999
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Keeps only exact, coordinate-bound HelloAO audio URLs. Comparing against the
 * complete canonical string intentionally rejects credentials, ports (including an
 * explicitly-written :443), query strings, fragments, encoded path tricks, and
 * sibling/lookalike hosts.
 */
export function sanitizeBibleChapterAudioLinks(
  value: unknown,
  request: BibleChapterRequest,
): Record<string, string> {
  if (!hasSafeCoordinates(request) || !isRecord(value)) return {};

  const entries = Object.entries(value);
  if (entries.length > MAX_BIBLE_AUDIO_READERS) return {};

  const sanitized: Record<string, string> = {};
  for (const [reader, candidate] of entries) {
    if (!READER_PATTERN.test(reader) || typeof candidate !== 'string') continue;
    const expected =
      `${BIBLE_AUDIO_ORIGIN}/api/${request.translationId}/${request.bookId}/` +
      `${request.chapter}/audio/${reader}.mp3`;
    if (candidate === expected) sanitized[reader] = candidate;
  }
  return sanitized;
}

/**
 * Returns a text-identical payload with only approved current-chapter audio. The
 * provider's adjacent-chapter maps are dropped because they are not bound to the
 * coordinates of this response and the reader does not consume them.
 */
export function enforceBibleChapterAudioPolicy<T extends ProviderAudioFields>(
  payload: T,
  request: BibleChapterRequest,
): SanitizedProviderAudioFields<T> {
  return {
    ...payload,
    thisChapterAudioLinks: sanitizeBibleChapterAudioLinks(
      payload.thisChapterAudioLinks,
      request,
    ),
    nextChapterAudioLinks: null,
    previousChapterAudioLinks: null,
  };
}
