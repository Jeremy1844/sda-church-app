export type SunsetCoordinates = Readonly<{
  lat: number;
  lng: number;
}>;

export type SunsetLocationSelection = Readonly<{
  coordinates: SunsetCoordinates;
  source: 'elmhurst' | 'device';
}>;

export type SunsetTimesState =
  | Readonly<{
      status: 'loading' | 'unavailable';
      requestId: number;
      dateKey: string;
      location: SunsetLocationSelection;
    }>
  | Readonly<{
      status: 'ready';
      requestId: number;
      dateKey: string;
      location: SunsetLocationSelection;
      fri: Date;
      sat: Date;
      fridayDate: string;
      saturdayDate: string;
      tzid: string;
      range: VerifiedSunsetRange;
    }>;

export type SabbathWindow = Readonly<{
  isSabbath: boolean;
  target: Date;
  millisecondsRemaining: number;
}>;

export type SunsetRangeRequest = Readonly<{
  dateStart: string;
  dateEnd: string;
  expectedDates: readonly string[];
}>;

export type VerifiedSunsetRangeDay = Readonly<{
  date: string;
  sunset: Date | null;
}>;

export type VerifiedSunsetRange = Readonly<{
  tzid: string;
  lat: number;
  lng: number;
  days: readonly VerifiedSunsetRangeDay[];
}>;

export type VerifiedSunsetPair = Readonly<{
  tzid: string;
  fridayDate: string;
  saturdayDate: string;
  fri: Date;
  sat: Date;
}>;

export const SUNSET_LOCATION_PROVIDER_HOST = 'api.sunrise-sunset.org';
export const SUNSET_PROVIDER_ATTRIBUTION_URL = 'https://sunrise-sunset.org/';
export const SUNSET_REQUEST_TIMEOUT_MS = 8_000;
/** v2 echoes coordinates rounded to four decimal places (maximum half-unit delta). */
export const SUNSET_COORDINATE_ECHO_TOLERANCE = 0.000_051;

export const getSunsetApiRangeUrl = (
  lat: number,
  lng: number,
  dateStart: string,
  dateEnd: string,
) =>
  `https://api.sunrise-sunset.org/v2?lat=${lat}&lng=${lng}&date_start=${dateStart}&date_end=${dateEnd}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * This privacy disclosure is intentionally English-only until fluent reviewers approve
 * Chinese and Spanish translations. It must be shown before the browser permission prompt.
 */
export const SUNSET_LOCATION_PRIVACY_COPY = Object.freeze({
  action: 'Use my location',
  retryAction: 'Try location again',
  resetAction: 'Use Elmhurst times',
  title: 'Use my location for sunset times?',
  englishOnlyNotice: 'Privacy notice (English only)',
  disclosure:
    'If you continue, your browser will ask for location access. When permission is granted, your current latitude and longitude are sent directly to api.sunrise-sunset.org to calculate sunset times. This app does not save or log your coordinates. You can keep using Elmhurst times without sharing your location.',
  keepDefaultAction: 'Keep Elmhurst',
  continueAction: 'Continue',
  requesting: 'Waiting for your browser\u2019s location permission\u2026',
  unavailable:
    'Location is unavailable, so Elmhurst remains the selected sunset location. Verified times appear only when provider data is available. Check this site\u2019s location permission in your browser settings, then try again.',
  localSession:
    'Using your current location. This app keeps the coordinates in memory only until you leave or reload the app. Sunrise-Sunset.org determines the local calendar and time zone for those coordinates.',
});

export function normalizeSunsetCoordinates(
  lat: unknown,
  lng: unknown,
): SunsetCoordinates | null {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return Object.freeze({ lat, lng });
}

export function formatLocalCalendarDate(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Sunset date is invalid.');
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatUtcCalendarDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDaysToCalendarDate(dateKey: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match || !Number.isSafeInteger(days)) {
    throw new Error('Calendar date or offset is invalid.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error('Calendar date or offset is invalid.');
  }
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcCalendarDate(date);
}

export function createSunsetRangeRequest(now: Date): SunsetRangeRequest {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('Sunset date is invalid.');
  }

  const utcToday = formatUtcCalendarDate(now);
  const expectedDates = Object.freeze(
    // Two weeks ahead plus a one-day location/UTC margin guarantees that the
    // verified response contains both the current and following Fri/Sat pair.
    Array.from({ length: 17 }, (_, index) =>
      addDaysToCalendarDate(utcToday, index - 2),
    ),
  );
  return Object.freeze({
    dateStart: expectedDates[0],
    dateEnd: expectedDates[expectedDates.length - 1],
    expectedDates,
  });
}

function isValidTimeZoneId(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 100) {
    return false;
  }
  if (value === 'UTC' || value === 'GMT') return true;

  const segments = value.split('/');
  return (
    segments.length >= 2 &&
    segments.every(
      (segment) =>
        segment !== '.' &&
        segment !== '..' &&
        /^[A-Za-z0-9._+-]+$/.test(segment),
    )
  );
}

function parseV2Sunset(value: unknown, expectedDate: string): Date | null | undefined {
  if (value === null) return null;
  if (
    typeof value !== 'string' ||
    value.length > 50 ||
    !value.startsWith(`${expectedDate}T`) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  ) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
}

/**
 * Validates the complete v2 range response, including coordinate/timezone echoes and
 * every exact requested calendar day, before any value can reach the countdown.
 */
export function parseSunsetV2Range(
  value: unknown,
  expectedCoordinates: SunsetCoordinates,
  expectedDates: readonly string[],
): VerifiedSunsetRange | null {
  if (
    !isRecord(value) ||
    typeof value.lat !== 'number' ||
    !Number.isFinite(value.lat) ||
    typeof value.lng !== 'number' ||
    !Number.isFinite(value.lng) ||
    Math.abs(value.lat - expectedCoordinates.lat) >
      SUNSET_COORDINATE_ECHO_TOLERANCE ||
    Math.abs(value.lng - expectedCoordinates.lng) >
      SUNSET_COORDINATE_ECHO_TOLERANCE ||
    !isValidTimeZoneId(value.tzid) ||
    !Array.isArray(value.days) ||
    value.days.length !== expectedDates.length ||
    expectedDates.length === 0 ||
    new Set(expectedDates).size !== expectedDates.length
  ) {
    return null;
  }

  const days: VerifiedSunsetRangeDay[] = [];
  for (let index = 0; index < expectedDates.length; index += 1) {
    const day = value.days[index];
    const expectedDate = expectedDates[index];
    if (!isRecord(day) || day.date !== expectedDate) return null;
    const sunset = parseV2Sunset(day.sunset, expectedDate);
    if (sunset === undefined) return null;
    days.push(Object.freeze({ date: expectedDate, sunset }));
  }

  return Object.freeze({
    tzid: value.tzid,
    lat: value.lat,
    lng: value.lng,
    days: Object.freeze(days),
  });
}

function getCalendarWeekday(dateKey: string): number | null {
  try {
    const nextDate = addDaysToCalendarDate(dateKey, 0);
    if (nextDate !== dateKey) return null;
    return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  } catch {
    return null;
  }
}

/** Selects only an adjacent, provider-verified Friday/Saturday pair that has not ended. */
export function selectNextSunsetPair(
  range: VerifiedSunsetRange,
  now: Date,
): VerifiedSunsetPair | null {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) return null;

  for (let index = 0; index < range.days.length - 1; index += 1) {
    const friday = range.days[index];
    const saturday = range.days[index + 1];
    if (
      getCalendarWeekday(friday.date) !== 5 ||
      getCalendarWeekday(saturday.date) !== 6 ||
      addDaysToCalendarDate(friday.date, 1) !== saturday.date ||
      !friday.sunset ||
      !saturday.sunset ||
      !isValidSunsetPair(friday.sunset, saturday.sunset) ||
      now >= saturday.sunset
    ) {
      continue;
    }

    return Object.freeze({
      tzid: range.tzid,
      fridayDate: friday.date,
      saturdayDate: saturday.date,
      fri: friday.sunset,
      sat: saturday.sunset,
    });
  }

  return null;
}

/**
 * Device coordinates are optional and may only be supplied after the consent flow succeeds.
 * Without them, the public Elmhurst location is always selected.
 */
export function selectSunsetLocation(
  elmhurstCoordinates: SunsetCoordinates,
  consentedDeviceCoordinates: SunsetCoordinates | null,
): SunsetLocationSelection {
  if (consentedDeviceCoordinates) {
    return Object.freeze({
      coordinates: consentedDeviceCoordinates,
      source: 'device',
    });
  }

  return Object.freeze({
    coordinates: elmhurstCoordinates,
    source: 'elmhurst',
  });
}

export function isSameSunsetLocation(
  first: SunsetLocationSelection,
  second: SunsetLocationSelection,
): boolean {
  return (
    first.source === second.source &&
    first.coordinates.lat === second.coordinates.lat &&
    first.coordinates.lng === second.coordinates.lng
  );
}

/**
 * Rejects malformed or mismatched pairs before they can drive an authoritative-looking
 * Sabbath claim. Consecutive sunsets should be ordered and between 12 and 36 hours apart.
 */
export function isValidSunsetPair(fri: Date, sat: Date): boolean {
  if (
    !(fri instanceof Date) ||
    !(sat instanceof Date) ||
    Number.isNaN(fri.getTime()) ||
    Number.isNaN(sat.getTime())
  ) {
    return false;
  }

  const elapsed = sat.getTime() - fri.getTime();
  return elapsed >= 12 * 60 * 60 * 1_000 && elapsed <= 36 * 60 * 60 * 1_000;
}

/** Computes the countdown only from a validated provider pair; there is no synthetic time. */
export function calculateSabbathWindow(
  now: Date,
  fri: Date,
  sat: Date,
): SabbathWindow | null {
  if (
    !(now instanceof Date) ||
    Number.isNaN(now.getTime()) ||
    !isValidSunsetPair(fri, sat)
  ) {
    return null;
  }

  let isSabbath = false;
  let target: Date;
  if (now < fri) {
    target = new Date(fri);
  } else if (now < sat) {
    isSabbath = true;
    target = new Date(sat);
  } else return null;

  return Object.freeze({
    isSabbath,
    target,
    millisecondsRemaining: Math.max(0, target.getTime() - now.getTime()),
  });
}
