import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  formatLocalCalendarDate,
  normalizeSunsetCoordinates,
  parseSunsetApiPayload,
  selectSunsetLocation,
  SUNSET_LOCATION_PRIVACY_COPY,
  SUNSET_LOCATION_PROVIDER_HOST,
} from '../services/SunsetLocationPolicy.ts';

const elmhurst = Object.freeze({ lat: 40.74546, lng: -73.88914 });

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

test('sunset API dates use local calendar fields instead of a UTC date shift', () => {
  const localDate = new Date(2030, 0, 2, 12, 0, 0);
  assert.equal(formatLocalCalendarDate(localDate), '2030-01-02');
  assert.throws(() => formatLocalCalendarDate(new Date(Number.NaN)), /invalid/);
});

test('sunset API payload validation rejects HTTP-success error and malformed results', () => {
  assert.equal(
    parseSunsetApiPayload({
      status: 'OK',
      results: { sunset: '2030-01-02T22:15:00+00:00' },
    })?.toISOString(),
    '2030-01-02T22:15:00.000Z',
  );
  assert.equal(parseSunsetApiPayload({ status: 'INVALID_REQUEST', results: {} }), null);
  assert.equal(parseSunsetApiPayload({ status: 'OK', results: { sunset: 'not-a-date' } }), null);
  assert.equal(parseSunsetApiPayload({ status: 'OK' }), null);
});

test('pre-permission copy discloses the provider, coordinate transfer, and no app retention', () => {
  assert.match(SUNSET_LOCATION_PRIVACY_COPY.disclosure, /latitude and longitude/i);
  assert.match(SUNSET_LOCATION_PRIVACY_COPY.disclosure, new RegExp(SUNSET_LOCATION_PROVIDER_HOST));
  assert.match(SUNSET_LOCATION_PRIVACY_COPY.disclosure, /does not save or log/i);
  assert.match(SUNSET_LOCATION_PRIVACY_COPY.disclosure, /Elmhurst/i);
});

test('Home keeps geolocation behind the disclosure continuation action', () => {
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
});
