export const MAX_SEARCH_QUERY_LENGTH = 200;

/**
 * Expo URL parameters can be arrays at runtime when a key is repeated, even when a
 * component's TypeScript annotation says `string`. Search accepts only one modest,
 * bounded string so malformed links cannot reach string methods or expensive matching.
 */
export function normalizeSingleQueryParam(
  value: unknown,
  maximumLength = MAX_SEARCH_QUERY_LENGTH,
): string | null {
  if (
    typeof value !== 'string' ||
    !Number.isSafeInteger(maximumLength) ||
    maximumLength < 0 ||
    value.length > maximumLength
  ) {
    return null;
  }

  return value;
}
