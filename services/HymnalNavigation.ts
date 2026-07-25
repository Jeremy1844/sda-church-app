export const MAX_HYMN_NUMBER_PARAM_LENGTH = 8;
export const MAX_HYMN_SCROLL_RECOVERY_ATTEMPTS = 3;

export interface NumberedHymn {
  number: number;
}

export interface HymnListScrollFailure {
  index: number;
  highestMeasuredFrameIndex: number;
  averageItemLength: number;
}

export interface HymnListScrollRecovery {
  index: number;
  offset: number;
}

/** Resolves an exact, bounded hymn parameter against the list actually on screen. */
export function resolveExactHymnIndex(
  value: unknown,
  displayedHymns: readonly NumberedHymn[],
): number | null {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_HYMN_NUMBER_PARAM_LENGTH ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return null;
  }

  const hymnNumber = Number(value);
  if (!Number.isSafeInteger(hymnNumber)) return null;

  const index = displayedHymns.findIndex(({ number }) => number === hymnNumber);
  return index >= 0 ? index : null;
}

/**
 * Produces the bounded approximate offset recommended by VirtualizedList after an
 * unmeasured `scrollToIndex` target. Scrolling there lets the target mount before
 * the caller retries the exact index.
 */
export function resolveHymnScrollRecovery(
  failure: HymnListScrollFailure,
  expectedIndex: number | null,
  itemCount: number,
): HymnListScrollRecovery | null {
  if (
    expectedIndex === null ||
    !Number.isSafeInteger(expectedIndex) ||
    expectedIndex < 0 ||
    !Number.isSafeInteger(itemCount) ||
    itemCount <= 0 ||
    expectedIndex >= itemCount ||
    !Number.isSafeInteger(failure.index) ||
    failure.index !== expectedIndex ||
    typeof failure.averageItemLength !== 'number' ||
    !Number.isFinite(failure.averageItemLength) ||
    failure.averageItemLength <= 0
  ) {
    return null;
  }

  const offset = failure.averageItemLength * expectedIndex;
  if (!Number.isFinite(offset) || offset < 0 || offset > Number.MAX_SAFE_INTEGER) {
    return null;
  }

  return Object.freeze({ index: expectedIndex, offset });
}
