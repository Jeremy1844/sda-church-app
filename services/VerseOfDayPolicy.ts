import type { SupportedLanguage } from '../constants/LanguageContext';

export const VOTD_CONFIG_KEY = 'votd_selection_config';

const BOOK_ID_PATTERN = /^[0-9A-Z]{3,8}$/;
const MAX_CHAPTER = 200;
const MAX_VERSE = 200;
const MAX_TEXT_LENGTH = 10_000;
const MAX_REFERENCE_LENGTH = 200;

export interface VerseOfDaySelection {
  bookId: string;
  chapter: number;
  verse: number;
  dateKey: string;
}

export interface RenderedVerseOfDay extends VerseOfDaySelection {
  text: string;
  reference: string;
  language: SupportedLanguage;
  requestedTranslationId: string;
  translationId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBoundedPositiveInteger(value: unknown, maximum: number): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0 && Number(value) <= maximum;
}

function parseJsonObject(raw: string | null): Record<string, unknown> | null {
  if (!raw || raw.length > MAX_TEXT_LENGTH + MAX_REFERENCE_LENGTH + 1_000) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseSelectionObject(
  value: Record<string, unknown>,
  expectedDateKey: string,
): VerseOfDaySelection | null {
  const [year, month, day] = expectedDateKey.split('-');
  const legacyDateKey = `${year}-${Number(month)}-${Number(day)}`;
  if (
    (value.dateKey !== expectedDateKey && value.dateKey !== legacyDateKey) ||
    typeof value.bookId !== 'string' ||
    !BOOK_ID_PATTERN.test(value.bookId) ||
    !isBoundedPositiveInteger(value.chapter, MAX_CHAPTER) ||
    !isBoundedPositiveInteger(value.verse, MAX_VERSE)
  ) {
    return null;
  }

  return {
    bookId: value.bookId,
    chapter: value.chapter,
    verse: value.verse,
    dateKey: expectedDateKey,
  };
}

/**
 * Uses the local 06:00 boundary promised by the Home screen. Date construction is
 * deliberately local rather than UTC so the displayed daily verse does not roll over
 * early or late for the person using the app.
 */
export function getVerseOfDayDateKey(now: Date): string {
  const effectiveDate = new Date(now);
  if (effectiveDate.getHours() < 6) {
    effectiveDate.setDate(effectiveDate.getDate() - 1);
  }

  const year = effectiveDate.getFullYear();
  const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
  const day = String(effectiveDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Safely parses the one language-independent master coordinate for a given day. */
export function parseVerseOfDaySelection(
  raw: string | null,
  expectedDateKey: string,
): VerseOfDaySelection | null {
  const parsed = parseJsonObject(raw);
  return parsed ? parseSelectionObject(parsed, expectedDateKey) : null;
}

export function getRenderedVerseOfDayCacheKey(language: SupportedLanguage): string {
  return `votd_cache_${language}`;
}

/**
 * A rendered cache is usable only when it belongs to the current language, requested
 * translation, date, and exact master coordinate. This prevents a stale language cache
 * from becoming a second source of truth for the daily selection.
 */
export function parseRenderedVerseOfDay(
  raw: string | null,
  masterSelection: VerseOfDaySelection,
  expectedLanguage: SupportedLanguage,
  expectedTranslationId: string,
): RenderedVerseOfDay | null {
  const parsed = parseJsonObject(raw);
  if (!parsed) return null;

  const selection = parseSelectionObject(parsed, masterSelection.dateKey);
  if (
    !selection ||
    selection.bookId !== masterSelection.bookId ||
    selection.chapter !== masterSelection.chapter ||
    selection.verse !== masterSelection.verse ||
    parsed.language !== expectedLanguage ||
    parsed.requestedTranslationId !== expectedTranslationId ||
    typeof parsed.translationId !== 'string' ||
    parsed.translationId.length === 0 ||
    parsed.translationId.length > 64 ||
    typeof parsed.text !== 'string' ||
    parsed.text.length === 0 ||
    parsed.text.length > MAX_TEXT_LENGTH ||
    typeof parsed.reference !== 'string' ||
    parsed.reference.length === 0 ||
    parsed.reference.length > MAX_REFERENCE_LENGTH
  ) {
    return null;
  }

  return {
    ...selection,
    text: parsed.text,
    reference: parsed.reference,
    language: expectedLanguage,
    requestedTranslationId: expectedTranslationId,
    translationId: parsed.translationId,
  };
}

/**
 * Returns a stable pseudo-random index for a date/coordinate seed. If overlapping
 * language loads both have to create a missing master selection, they converge on the
 * same result instead of racing two calls to Math.random().
 */
export function selectStableDailyIndex(seed: string, itemCount: number): number | null {
  if (!Number.isSafeInteger(itemCount) || itemCount <= 0) return null;

  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0) % itemCount;
}
