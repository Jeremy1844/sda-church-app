import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  parsePublicBulletinFeed,
  parsePublicEventFeed,
  parsePublicScheduleFeed,
} from '../services/PublicOperationsContracts.ts';

const fixtures = JSON.parse(
  fs.readFileSync(new URL('../fixtures/synthetic/public-operations.json', import.meta.url), 'utf8'),
);

test('accepts the synthetic public operations contracts', () => {
  assert.equal(parsePublicEventFeed(fixtures.eventFeed).events.length, 1);
  assert.equal(parsePublicScheduleFeed(fixtures.scheduleFeed).slots[0].status, 'filled');
  assert.equal(parsePublicBulletinFeed(fixtures.bulletinFeed).announcements.length, 0);
});

test('rejects PII-like or private fields from the public schedule contract', () => {
  const feed = structuredClone(fixtures.scheduleFeed);
  feed.slots[0].phone = '000-000-0000';
  assert.throws(() => parsePublicScheduleFeed(feed), /forbidden fields: phone/);
});

test('rejects unsafe registration URLs and impossible event order', () => {
  const unsafeUrl = structuredClone(fixtures.eventFeed);
  unsafeUrl.events[0].registrationUrl = 'http://example.invalid/form';
  assert.throws(() => parsePublicEventFeed(unsafeUrl), /credential-free HTTPS/);

  const impossibleOrder = structuredClone(fixtures.eventFeed);
  impossibleOrder.events[0].endsAt = impossibleOrder.events[0].startsAt;
  assert.throws(() => parsePublicEventFeed(impossibleOrder), /end must follow start/);
});
