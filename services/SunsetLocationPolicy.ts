export type SunsetCoordinates = Readonly<{
  lat: number;
  lng: number;
}>;

export type SunsetLocationSelection = Readonly<{
  coordinates: SunsetCoordinates;
  source: 'elmhurst' | 'device';
}>;

export const SUNSET_LOCATION_PROVIDER_HOST = 'api.sunrise-sunset.org';

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
    'Location is unavailable. Elmhurst times remain active. Check this site\u2019s location permission in your browser settings, then try again.',
  localSession:
    'Using your current location. This app keeps the coordinates in memory only until you leave or reload the app.',
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

export function parseSunsetApiPayload(value: unknown): Date | null {
  if (!isRecord(value) || value.status !== 'OK' || !isRecord(value.results)) {
    return null;
  }

  const { sunset } = value.results;
  if (typeof sunset !== 'string' || sunset.length > 50) return null;
  const timestamp = Date.parse(sunset);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
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
