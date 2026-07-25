import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSafeBackRoute, ROUTES } from '../constants/Routes.ts';

test('Back destinations accept only exact canonical internal routes', () => {
  for (const route of Object.values(ROUTES)) {
    assert.equal(resolveSafeBackRoute(route), route);
  }

  for (const value of [
    'https://phish.example',
    '//phish.example',
    'javascript:alert(1)',
    '%68ttps://phish.example',
    '/you?next=https://phish.example',
    '/community/prayer',
    '/home/events',
    ['', null, undefined],
  ]) {
    assert.equal(resolveSafeBackRoute(value), null);
  }
});
