import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  PUBLIC_OPERATIONS_LIMITS,
  parsePublicBulletinFeed,
  parsePublicEventFeed,
  parsePublicScheduleFeed,
} from '../services/PublicOperationsContracts.ts';

const fixtures = JSON.parse(
  fs.readFileSync(new URL('../fixtures/synthetic/public-operations.json', import.meta.url), 'utf8'),
);
const eventOptions = Object.freeze({ approvedRegistrationHosts: ['example.invalid'] });

test('accepts the synthetic public operations contracts', () => {
  assert.equal(parsePublicEventFeed(fixtures.eventFeed, eventOptions).events.length, 1);
  assert.equal(parsePublicScheduleFeed(fixtures.scheduleFeed).slots[0].status, 'filled');
  assert.equal(parsePublicBulletinFeed(fixtures.bulletinFeed).announcements.length, 0);
});

test('accepts valid RFC 3339 offsets and leap-day calendar dates', () => {
  const schedule = structuredClone(fixtures.scheduleFeed);
  schedule.generatedAt = '2032-02-29T12:34:56.123456789+05:30';
  schedule.slots[0].startsAt = '2032-02-29T00:00:00-05:00';
  assert.equal(parsePublicScheduleFeed(schedule).generatedAt, schedule.generatedAt);

  const bulletin = structuredClone(fixtures.bulletinFeed);
  bulletin.weekOf = '2032-02-29';
  assert.equal(parsePublicBulletinFeed(bulletin).weekOf, '2032-02-29');
});

test('rejects PII-like or private fields from the public schedule contract', () => {
  const feed = structuredClone(fixtures.scheduleFeed);
  feed.slots[0].phone = '000-000-0000';
  assert.throws(() => parsePublicScheduleFeed(feed), /forbidden fields: phone/);
});

test('rejects unsafe registration URLs and impossible event order', () => {
  const unsafeUrl = structuredClone(fixtures.eventFeed);
  unsafeUrl.events[0].registrationUrl = 'http://example.invalid/form';
  assert.throws(() => parsePublicEventFeed(unsafeUrl, eventOptions), /credential-free HTTPS/);

  const impossibleOrder = structuredClone(fixtures.eventFeed);
  impossibleOrder.events[0].endsAt = impossibleOrder.events[0].startsAt;
  assert.throws(() => parsePublicEventFeed(impossibleOrder, eventOptions), /end must follow start/);
});

test('requires explicit exact-host approval for registration URLs', () => {
  assert.throws(
    () => parsePublicEventFeed(fixtures.eventFeed),
    /approvedRegistrationHosts must be supplied explicitly/,
  );
  assert.throws(
    () => parsePublicEventFeed(fixtures.eventFeed, { approvedRegistrationHosts: [] }),
    /hostname is not in approvedRegistrationHosts/,
  );
  assert.throws(
    () =>
      parsePublicEventFeed(fixtures.eventFeed, {
        approvedRegistrationHosts: ['*.example.invalid'],
      }),
    /must be an exact hostname/,
  );

  const subdomain = structuredClone(fixtures.eventFeed);
  subdomain.events[0].registrationUrl = 'https://forms.example.invalid/register';
  assert.throws(
    () => parsePublicEventFeed(subdomain, eventOptions),
    /hostname is not in approvedRegistrationHosts/,
  );
});

test('rejects non-RFC3339, zone-less, and impossible timestamps', () => {
  const zoneLess = structuredClone(fixtures.scheduleFeed);
  zoneLess.generatedAt = '2030-01-01T00:00:00';
  assert.throws(() => parsePublicScheduleFeed(zoneLess), /RFC 3339 timestamp/);

  const proseDate = structuredClone(fixtures.scheduleFeed);
  proseDate.generatedAt = 'January 1, 2030';
  assert.throws(() => parsePublicScheduleFeed(proseDate), /RFC 3339 timestamp/);

  const impossibleDate = structuredClone(fixtures.eventFeed);
  impossibleDate.events[0].startsAt = '2030-02-30T15:00:00Z';
  assert.throws(() => parsePublicEventFeed(impossibleDate, eventOptions), /RFC 3339 timestamp/);
});

test('rejects impossible weekOf calendar dates', () => {
  for (const weekOf of ['2030-02-29', '2030-04-31', '0000-01-01']) {
    const bulletin = structuredClone(fixtures.bulletinFeed);
    bulletin.weekOf = weekOf;
    assert.throws(() => parsePublicBulletinFeed(bulletin), /real calendar date/);
  }
});

test('rejects duplicate public entity identifiers', () => {
  const events = structuredClone(fixtures.eventFeed);
  events.events.push(structuredClone(events.events[0]));
  assert.throws(() => parsePublicEventFeed(events, eventOptions), /events contains duplicate id/);

  const schedule = structuredClone(fixtures.scheduleFeed);
  schedule.slots.push(structuredClone(schedule.slots[0]));
  assert.throws(() => parsePublicScheduleFeed(schedule), /slots contains duplicate id/);

  const bulletin = structuredClone(fixtures.bulletinFeed);
  bulletin.announcements = [
    { id: 'duplicate', text: 'Synthetic announcement one' },
    { id: 'duplicate', text: 'Synthetic announcement two' },
  ];
  assert.throws(() => parsePublicBulletinFeed(bulletin), /announcements contains duplicate id/);
});

test('rejects oversized collections and strings before they enter app state', () => {
  const events = structuredClone(fixtures.eventFeed);
  events.events = Array.from({ length: PUBLIC_OPERATIONS_LIMITS.events + 1 }, (_, index) => ({
    ...events.events[0],
    id: `event-${index}`,
  }));
  assert.throws(() => parsePublicEventFeed(events, eventOptions), /events cannot contain more than/);

  const schedule = structuredClone(fixtures.scheduleFeed);
  schedule.slots = Array.from(
    { length: PUBLIC_OPERATIONS_LIMITS.scheduleSlots + 1 },
    (_, index) => ({ ...schedule.slots[0], id: `slot-${index}` }),
  );
  assert.throws(() => parsePublicScheduleFeed(schedule), /slots cannot contain more than/);

  const bulletin = structuredClone(fixtures.bulletinFeed);
  bulletin.announcements = Array.from(
    { length: PUBLIC_OPERATIONS_LIMITS.announcements + 1 },
    (_, index) => ({ id: `announcement-${index}`, text: 'Synthetic announcement' }),
  );
  assert.throws(
    () => parsePublicBulletinFeed(bulletin),
    /announcements cannot contain more than/,
  );

  const longTitle = structuredClone(fixtures.eventFeed);
  longTitle.events[0].title = 'x'.repeat(PUBLIC_OPERATIONS_LIMITS.eventTitle + 1);
  assert.throws(() => parsePublicEventFeed(longTitle, eventOptions), /title is invalid/);
});
