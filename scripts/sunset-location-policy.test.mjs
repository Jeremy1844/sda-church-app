import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  calculateSabbathWindow,
  createSunsetRangeRequest,
  formatLocalCalendarDate,
  getSunsetApiRangeUrl,
  isSameSunsetLocation,
  normalizeSunsetCoordinates,
  parseSunsetV2Range,
  selectNextSunsetPair,
  selectSunsetLocation,
  SUNSET_COORDINATE_ECHO_TOLERANCE,
  SUNSET_LOCATION_PRIVACY_COPY,
  SUNSET_LOCATION_PROVIDER_HOST,
  SUNSET_PROVIDER_ATTRIBUTION_URL,
} from '../services/SunsetLocationPolicy.ts';

const elmhurst = Object.freeze({ lat: 40.74546, lng: -73.88914 });
const request = createSunsetRangeRequest(new Date('2030-01-05T23:30:00Z'));

function createValidRangeResponse() {
  return {
    tzid: 'America/New_York',
    lat: 40.7455,
    lng: -73.8891,
    days: request.expectedDates.map((date) => ({
      date,
      sunset: `${date}T17:00:00-05:00`,
    })),
  };
}

test('Elmhurst remains the default until consented device coordinates exist', () => {
  assert.deepEqual(selectSunsetLocation(elmhurst, null), {
    coordinates: elmhurst,
    source: 'elmhurst',
  });

  const device = normalizeSunsetCoordinates(40.7128, -74.006);
  assert.ok(device);
  assert.deepEqual(selectSunsetLocation(elmhurst, device), {
    coordinates: device,
    source: 'device',
  });
});

test('invalid browser coordinate results cannot displace the Elmhurst fallback', () => {
  assert.equal(normalizeSunsetCoordinates(Number.NaN, -73), null);
  assert.equal(normalizeSunsetCoordinates(91, -73), null);
  assert.equal(normalizeSunsetCoordinates(40, -181), null);
  assert.equal(normalizeSunsetCoordinates('40', -73), null);
});

test('sunset results are bound to their exact location source and coordinates', () => {
  const first = selectSunsetLocation(elmhurst, null);
  const same = selectSunsetLocation(elmhurst, null);
  const device = selectSunsetLocation(elmhurst, normalizeSunsetCoordinates(40.7, -74));

  assert.equal(isSameSunsetLocation(first, same), true);
  assert.equal(isSameSunsetLocation(first, device), false);
  assert.equal(
    isSameSunsetLocation(
      device,
      selectSunsetLocation(elmhurst, normalizeSunsetCoordinates(40.7001, -74)),
    ),
    false,
  );
});

test('the v2 request contains two complete Fri/Sat pairs across UTC/location skew', () => {
  assert.equal(request.dateStart, '2030-01-03');
  assert.equal(request.dateEnd, '2030-01-19');
  assert.equal(request.expectedDates.length, 17);
  assert.equal(
    getSunsetApiRangeUrl(elmhurst.lat, elmhurst.lng, request.dateStart, request.dateEnd),
    'https://api.sunrise-sunset.org/v2?lat=40.74546&lng=-73.88914&date_start=2030-01-03&date_end=2030-01-19',
  );
  assert.throws(() => createSunsetRangeRequest(new Date(Number.NaN)), /invalid/);
});

test('v2 range validation accepts only exact coordinate, timezone, and day echoes', () => {
  const valid = createValidRangeResponse();
  const parsed = parseSunsetV2Range(valid, elmhurst, request.expectedDates);
  assert.ok(parsed);
  assert.equal(parsed.tzid, 'America/New_York');
  assert.deepEqual(
    parsed.days.map(({ date }) => date),
    request.expectedDates,
  );
  assert.equal(parsed.days[0].sunset?.toISOString(), '2030-01-03T22:00:00.000Z');

  assert.equal(
    parseSunsetV2Range(
      { ...valid, lat: elmhurst.lat + SUNSET_COORDINATE_ECHO_TOLERANCE + 0.00001 },
      elmhurst,
      request.expectedDates,
    ),
    null,
  );
  assert.equal(
    parseSunsetV2Range({ ...valid, tzid: '../New_York' }, elmhurst, request.expectedDates),
    null,
  );
  assert.equal(
    parseSunsetV2Range(
      { ...valid, days: valid.days.slice(0, -1) },
      elmhurst,
      request.expectedDates,
    ),
    null,
  );

  const duplicateDate = structuredClone(valid);
  duplicateDate.days[1].date = duplicateDate.days[0].date;
  assert.equal(parseSunsetV2Range(duplicateDate, elmhurst, request.expectedDates), null);

  const wrongTimestampDate = structuredClone(valid);
  wrongTimestampDate.days[0].sunset = '2030-01-04T17:00:00-05:00';
  assert.equal(
    parseSunsetV2Range(wrongTimestampDate, elmhurst, request.expectedDates),
    null,
  );
});

test('selection uses adjacent verified pairs and advances after Saturday without approximation', () => {
  const parsed = parseSunsetV2Range(
    createValidRangeResponse(),
    elmhurst,
    request.expectedDates,
  );
  assert.ok(parsed);

  const firstPair = selectNextSunsetPair(parsed, new Date('2030-01-04T20:00:00Z'));
  assert.ok(firstPair);
  assert.equal(firstPair.fridayDate, '2030-01-04');
  assert.equal(firstPair.saturdayDate, '2030-01-05');
  assert.equal(
    calculateSabbathWindow(new Date('2030-01-04T20:00:00Z'), firstPair.fri, firstPair.sat)
      ?.millisecondsRemaining,
    2 * 60 * 60 * 1_000,
  );

  const nextPair = selectNextSunsetPair(parsed, new Date('2030-01-05T23:00:00Z'));
  assert.ok(nextPair);
  assert.equal(nextPair.fridayDate, '2030-01-11');
  assert.equal(nextPair.saturdayDate, '2030-01-12');
  assert.equal(
    calculateSabbathWindow(new Date('2030-01-05T23:00:00Z'), firstPair.fri, firstPair.sat),
    null,
  );
});

test('a missing or implausible sunset fails closed and cannot create a Sabbath claim', () => {
  const response = createValidRangeResponse();
  const firstFridayIndex = response.days.findIndex(
    ({ date }) => new Date(`${date}T12:00:00Z`).getUTCDay() === 5,
  );
  response.days[firstFridayIndex].sunset = null;
  const parsed = parseSunsetV2Range(response, elmhurst, request.expectedDates);
  assert.ok(parsed);
  assert.equal(
    selectNextSunsetPair(parsed, new Date('2030-01-04T20:00:00Z'))?.fridayDate,
    '2030-01-11',
  );

  const invalid = createValidRangeResponse();
  invalid.days[firstFridayIndex + 1].sunset = `${invalid.days[firstFridayIndex + 1].date}T02:00:00-05:00`;
  const parsedInvalid = parseSunsetV2Range(invalid, elmhurst, request.expectedDates);
  assert.ok(parsedInvalid);
  assert.equal(
    selectNextSunsetPair(parsedInvalid, new Date('2030-01-04T20:00:00Z'))?.fridayDate,
    '2030-01-11',
  );
});

test('calendar formatting remains local and rejects invalid dates', () => {
  const localDate = new Date(2030, 0, 2, 12, 0, 0);
  assert.equal(formatLocalCalendarDate(localDate), '2030-01-02');
  assert.throws(() => formatLocalCalendarDate(new Date(Number.NaN)), /invalid/);
});

test('pre-permission copy discloses provider transfer, retention, and provider timezone', () => {
  assert.match(SUNSET_LOCATION_PRIVACY_COPY.disclosure, /latitude and longitude/i);
  assert.match(SUNSET_LOCATION_PRIVACY_COPY.disclosure, new RegExp(SUNSET_LOCATION_PROVIDER_HOST));
  assert.match(SUNSET_LOCATION_PRIVACY_COPY.disclosure, /does not save or log/i);
  assert.match(SUNSET_LOCATION_PRIVACY_COPY.disclosure, /Elmhurst/i);
  assert.match(SUNSET_LOCATION_PRIVACY_COPY.localSession, /local calendar and time zone/i);
});

test('Home keeps consent explicit, bounds requests, and visibly links required attribution', () => {
  const source = fs.readFileSync(
    new URL('../app/(tabs)/index.tsx', import.meta.url),
    'utf8',
  );
  const requestFunctionStart = source.indexOf('const requestCurrentLocation');
  const permissionCall = source.indexOf('navigator.geolocation.getCurrentPosition');

  assert.notEqual(requestFunctionStart, -1);
  assert.ok(permissionCall > requestFunctionStart);
  assert.equal(source.match(/navigator\.geolocation\.getCurrentPosition/g)?.length, 1);
  assert.match(source, /onPress=\{requestCurrentLocation\}/);
  assert.match(source, /visible=\{locationDisclosureVisible\}/);
  assert.match(source, /location\.source === 'device'[\s\S]*cache: 'no-store'/);
  assert.doesNotMatch(source, /setHours\(18,/);
  assert.match(source, /SUNSET_REQUEST_TIMEOUT_MS/);
  assert.match(source, /geolocationRequestId\.current !== requestId/);
  assert.match(source, /getSunsetApiRangeUrl/);
  assert.match(source, /range: verifiedRange/);
  assert.match(source, /selectNextSunsetPair\(sunsetState\.range, now\)/);
  assert.match(source, /Data: Sunrise-Sunset\.org/);
  assert.match(source, /SUNSET_PROVIDER_ATTRIBUTION_URL/);
  assert.equal(SUNSET_PROVIDER_ATTRIBUTION_URL, 'https://sunrise-sunset.org/');
});
