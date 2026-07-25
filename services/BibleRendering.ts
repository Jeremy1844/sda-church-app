/**
 * Pure helpers for turning structured Bible API tokens into stable render runs.
 *
 * These helpers operate on token structure only. They never inspect a book,
 * chapter, verse, or translation identifier, and they do not rewrite Scripture
 * characters. The caller supplies the translation-aware marker predicate.
 */

export type TextBearingToken = { text: string; [key: string]: unknown };

export type IndexedRenderToken<T> = {
  item: T;
  index: number;
};

export type VerseRenderRun<T> =
  | { kind: 'inline'; entries: IndexedRenderToken<T>[] }
  | { kind: 'marker'; entry: IndexedRenderToken<T> };

const LEADING_CLOSING_PUNCTUATION =
  /^(\s*)([.,;!?:\u3001\u3002\uff0c\uff0e\uff01\uff1f\uff1b\uff1a\u2019\u201d\u00bb\u203a\u3009\u300b\u300d\u300f\u3011\u3015\u3017\u3019\u301b\uff09\uff3d\uff5d]+)/u;

const TRAILING_CLOSING_PUNCTUATION =
  /([.,;!?:'"\u3001\u3002\uff0c\uff0e\uff01\uff1f\uff1b\uff1a\u2019\u201d\u00bb\u203a\u3009\u300b\u300d\u300f\u3011\u3015\u3017\u3019\u301b\uff09\uff3d\uff5d]*)(\s*)$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getRenderTokenText(token: unknown): string {
  if (typeof token === 'string') return token;
  return isRecord(token) && typeof token.text === 'string' ? token.text : '';
}

function withRenderTokenText<T>(token: T, text: string): T {
  if (typeof token === 'string') return text as T;
  return { ...(token as TextBearingToken), text } as T;
}

function isFootnoteToken(token: unknown): boolean {
  return isRecord(token) && 'noteId' in token;
}

function isLineBreakToken(token: unknown): boolean {
  return isRecord(token) && 'lineBreak' in token;
}

/**
 * Rebinds a split run of closing punctuation to the preceding text token.
 *
 * API tokenization can place a footnote and an inline line-break between a word
 * and its closing punctuation. We cross metadata freely, and cross an explicit
 * inline line-break only when the remaining token is a standalone liturgical
 * marker. That narrow structural rule preserves intentional prose line breaks.
 */
export function anchorSplitClosingPunctuation<T>(
  content: readonly T[],
  isMarker: (text: string) => boolean,
): T[] {
  const result: T[] = [];

  for (const sourceToken of content) {
    let current = sourceToken;
    const text = getRenderTokenText(current);
    const punctuationMatch = text.match(LEADING_CLOSING_PUNCTUATION);

    if (punctuationMatch) {
      const leadingWhitespace = punctuationMatch[1];
      const punctuation = punctuationMatch[2];
      const remainder = text.slice(punctuationMatch[0].length);
      const allowLineBreakCrossing = isMarker(remainder.trimStart());
      let anchorIndex = -1;

      for (let index = result.length - 1; index >= 0; index -= 1) {
        const previous = result[index];
        if (isFootnoteToken(previous)) continue;
        if (isLineBreakToken(previous)) {
          if (allowLineBreakCrossing) continue;
          break;
        }

        const previousText = getRenderTokenText(previous);
        if (previousText.includes('\n')) {
          if (allowLineBreakCrossing) continue;
          break;
        }
        if (previousText.trim().length === 0) continue;
        if (previousText) anchorIndex = index;
        break;
      }

      if (anchorIndex !== -1) {
        const anchor = result[anchorIndex];
        const anchorText = getRenderTokenText(anchor);
        const trailingHorizontalWhitespace = anchorText.match(/[ \t]*$/u)?.[0] ?? '';
        const anchorCore = anchorText.slice(
          0,
          anchorText.length - trailingHorizontalWhitespace.length,
        );
        result[anchorIndex] = withRenderTokenText(
          anchor,
          anchorCore + punctuation + trailingHorizontalWhitespace,
        );
        current = withRenderTokenText(current, leadingWhitespace + remainder);
      }
    }

    if (getRenderTokenText(current) !== '' || typeof current !== 'string') {
      result.push(current);
    }
  }

  return result;
}

/** Creates platform-neutral inline and full-width marker runs for a verse. */
export function createVerseRenderPlan<T>(
  content: readonly T[],
  isMarker: (text: string) => boolean,
): VerseRenderRun<T>[] {
  const runs: VerseRenderRun<T>[] = [];
  let inlineEntries: IndexedRenderToken<T>[] = [];

  const flushInlineEntries = () => {
    if (inlineEntries.length === 0) return;
    runs.push({ kind: 'inline', entries: inlineEntries });
    inlineEntries = [];
  };

  content.forEach((item, index) => {
    const entry = { item, index };
    if (isMarker(getRenderTokenText(item))) {
      flushInlineEntries();
      runs.push({ kind: 'marker', entry });
      return;
    }
    inlineEntries.push(entry);
  });

  flushInlineEntries();
  return runs;
}

/** Splits display text without detaching closing punctuation from its core run. */
export function segmentDisplayText(text: string) {
  const leadingMatch = text.match(/^\s*/u);
  const leading = leadingMatch?.[0] ?? '';
  const afterLeading = text.slice(leading.length);
  const trailingMatch = afterLeading.match(TRAILING_CLOSING_PUNCTUATION);
  const trailingPunct = trailingMatch?.[1] ?? '';
  const trailingSpace = trailingMatch?.[2] ?? '';
  const core = afterLeading.slice(
    0,
    afterLeading.length - trailingPunct.length - trailingSpace.length,
  );

  return { leading, core, trailingPunct, trailingSpace };
}
