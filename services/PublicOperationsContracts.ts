type JsonRecord = Record<string, unknown>;

export interface PublicEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  registrationUrl: string | null;
  registrationDeadline: string | null;
}

export interface PublicEventFeed {
  schemaVersion: 1;
  generatedAt: string;
  timezone: string;
  events: PublicEvent[];
}

export interface PublicEventFeedOptions {
  /** Exact hostnames approved by church leadership for outbound registration links. */
  approvedRegistrationHosts: readonly string[];
}

export interface PublicScheduleSlot {
  id: string;
  roleId: string;
  startsAt: string;
  status: 'open' | 'filled';
}

export interface PublicScheduleFeed {
  schemaVersion: 1;
  generatedAt: string;
  timezone: string;
  slots: PublicScheduleSlot[];
}

export interface PublicBulletinFeed {
  schemaVersion: 1;
  generatedAt: string;
  weekOf: string;
  announcements: Array<{ id: string; text: string }>;
  verseReference: {
    translationId: string;
    bookId: string;
    chapter: number;
    verse: number;
  } | null;
}

export const PUBLIC_OPERATIONS_LIMITS = Object.freeze({
  approvedRegistrationHosts: 32,
  announcements: 100,
  announcementText: 500,
  eventTitle: 160,
  events: 100,
  registrationUrl: 2048,
  scheduleSlots: 250,
});

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const RFC3339_INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
const HOSTNAME =
  /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)*[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

function record(value: unknown, label: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, allowed: readonly string[], label: string) {
  const extras = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extras.length) throw new Error(`${label} contains forbidden fields: ${extras.join(', ')}.`);
}

function identifier(value: unknown, label: string) {
  if (typeof value !== 'string' || !IDENTIFIER.test(value)) {
    throw new Error(`${label} must be a stable identifier.`);
  }
  return value;
}

function text(value: unknown, label: string, maximum: number) {
  if (
    typeof value !== 'string' ||
    value.trim() !== value ||
    value.length === 0 ||
    value.length > maximum ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  ) {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

function isRealCalendarDate(year: number, month: number, day: number) {
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysByMonth[month - 1];
}

function calendarDate(value: unknown, label: string) {
  if (typeof value !== 'string') throw new Error(`${label} must be YYYY-MM-DD.`);
  const match = DATE_ONLY.exec(value);
  if (!match || !isRealCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]))) {
    throw new Error(`${label} must be a real calendar date in YYYY-MM-DD form.`);
  }
  return value;
}

function instant(value: unknown, label: string) {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be an RFC 3339 timestamp with an explicit time-zone offset.`);
  }

  const match = RFC3339_INSTANT.exec(value);
  const validDate =
    match && isRealCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
  if (!validDate || value.length > 35 || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an RFC 3339 timestamp with an explicit time-zone offset.`);
  }

  return value;
}

function optionalInstant(value: unknown, label: string) {
  return value === null ? null : instant(value, label);
}

function approvedRegistrationHosts(options: PublicEventFeedOptions | undefined) {
  if (!options || !Array.isArray(options.approvedRegistrationHosts)) {
    throw new Error('approvedRegistrationHosts must be supplied explicitly.');
  }
  if (options.approvedRegistrationHosts.length > PUBLIC_OPERATIONS_LIMITS.approvedRegistrationHosts) {
    throw new Error(
      `approvedRegistrationHosts cannot contain more than ${PUBLIC_OPERATIONS_LIMITS.approvedRegistrationHosts} entries.`,
    );
  }

  const approved = new Set<string>();
  options.approvedRegistrationHosts.forEach((value, index) => {
    if (typeof value !== 'string' || !HOSTNAME.test(value)) {
      throw new Error(`approvedRegistrationHosts[${index}] must be an exact hostname.`);
    }
    const normalized = value.toLowerCase();
    if (approved.has(normalized)) {
      throw new Error(`approvedRegistrationHosts contains duplicate hostname ${normalized}.`);
    }
    approved.add(normalized);
  });
  return approved;
}

function httpsUrl(value: unknown, label: string, approvedHosts: ReadonlySet<string>) {
  if (value === null) return null;
  if (
    typeof value !== 'string' ||
    value.trim() !== value ||
    value.length === 0 ||
    value.length > PUBLIC_OPERATIONS_LIMITS.registrationUrl
  ) {
    throw new Error(`${label} must be a bounded HTTPS URL or null.`);
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a credential-free HTTPS URL.`);
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) {
    throw new Error(`${label} must be a credential-free HTTPS URL.`);
  }
  if (!approvedHosts.has(parsed.hostname.toLowerCase())) {
    throw new Error(`${label} hostname is not in approvedRegistrationHosts.`);
  }
  return parsed.toString();
}

function boundedCollection(value: unknown[], label: string, maximum: number) {
  if (value.length > maximum) {
    throw new Error(`${label} cannot contain more than ${maximum} entries.`);
  }
  return value;
}

function rejectDuplicateIds(items: ReadonlyArray<{ id: string }>, label: string) {
  const ids = new Set<string>();
  items.forEach((item) => {
    if (ids.has(item.id)) throw new Error(`${label} contains duplicate id ${item.id}.`);
    ids.add(item.id);
  });
}

function timezone(value: unknown) {
  const zone = text(value, 'timezone', 64);
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format();
  } catch {
    throw new Error('timezone must be an IANA time-zone identifier.');
  }
  return zone;
}

export function parsePublicEventFeed(
  value: unknown,
  options: PublicEventFeedOptions,
): PublicEventFeed {
  const feed = record(value, 'Event feed');
  exactKeys(feed, ['schemaVersion', 'generatedAt', 'timezone', 'events'], 'Event feed');
  if (feed.schemaVersion !== 1 || !Array.isArray(feed.events)) {
    throw new Error('Event feed schema is unsupported.');
  }
  const approvedHosts = approvedRegistrationHosts(options);

  const events = boundedCollection(
    feed.events,
    'events',
    PUBLIC_OPERATIONS_LIMITS.events,
  ).map((item, index) => {
    const event = record(item, `events[${index}]`);
    exactKeys(
      event,
      ['id', 'title', 'startsAt', 'endsAt', 'registrationUrl', 'registrationDeadline'],
      `events[${index}]`,
    );
    const startsAt = instant(event.startsAt, `events[${index}].startsAt`);
    const endsAt = instant(event.endsAt, `events[${index}].endsAt`);
    const registrationDeadline = optionalInstant(
      event.registrationDeadline,
      `events[${index}].registrationDeadline`,
    );
    if (Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error('Event end must follow start.');
    if (registrationDeadline && Date.parse(registrationDeadline) > Date.parse(startsAt)) {
      throw new Error('Registration deadline cannot follow the event start.');
    }
    return {
      id: identifier(event.id, `events[${index}].id`),
      title: text(event.title, `events[${index}].title`, PUBLIC_OPERATIONS_LIMITS.eventTitle),
      startsAt,
      endsAt,
      registrationUrl: httpsUrl(
        event.registrationUrl,
        `events[${index}].registrationUrl`,
        approvedHosts,
      ),
      registrationDeadline,
    };
  });
  rejectDuplicateIds(events, 'events');

  return {
    schemaVersion: 1,
    generatedAt: instant(feed.generatedAt, 'generatedAt'),
    timezone: timezone(feed.timezone),
    events,
  };
}

export function parsePublicScheduleFeed(value: unknown): PublicScheduleFeed {
  const feed = record(value, 'Schedule feed');
  exactKeys(feed, ['schemaVersion', 'generatedAt', 'timezone', 'slots'], 'Schedule feed');
  if (feed.schemaVersion !== 1 || !Array.isArray(feed.slots)) {
    throw new Error('Schedule feed schema is unsupported.');
  }
  const slots = boundedCollection(
    feed.slots,
    'slots',
    PUBLIC_OPERATIONS_LIMITS.scheduleSlots,
  ).map((item, index) => {
    const slot = record(item, `slots[${index}]`);
    exactKeys(slot, ['id', 'roleId', 'startsAt', 'status'], `slots[${index}]`);
    if (slot.status !== 'open' && slot.status !== 'filled') {
      throw new Error(`slots[${index}].status is invalid.`);
    }
    return {
      id: identifier(slot.id, `slots[${index}].id`),
      roleId: identifier(slot.roleId, `slots[${index}].roleId`),
      startsAt: instant(slot.startsAt, `slots[${index}].startsAt`),
      status: slot.status as PublicScheduleSlot['status'],
    };
  });
  rejectDuplicateIds(slots, 'slots');
  return {
    schemaVersion: 1,
    generatedAt: instant(feed.generatedAt, 'generatedAt'),
    timezone: timezone(feed.timezone),
    slots,
  };
}

export function parsePublicBulletinFeed(value: unknown): PublicBulletinFeed {
  const feed = record(value, 'Bulletin feed');
  exactKeys(
    feed,
    ['schemaVersion', 'generatedAt', 'weekOf', 'announcements', 'verseReference'],
    'Bulletin feed',
  );
  if (feed.schemaVersion !== 1 || !Array.isArray(feed.announcements)) {
    throw new Error('Bulletin feed schema is unsupported.');
  }
  const weekOf = calendarDate(feed.weekOf, 'weekOf');
  const announcements = boundedCollection(
    feed.announcements,
    'announcements',
    PUBLIC_OPERATIONS_LIMITS.announcements,
  ).map((item, index) => {
    const announcement = record(item, `announcements[${index}]`);
    exactKeys(announcement, ['id', 'text'], `announcements[${index}]`);
    return {
      id: identifier(announcement.id, `announcements[${index}].id`),
      text: text(
        announcement.text,
        `announcements[${index}].text`,
        PUBLIC_OPERATIONS_LIMITS.announcementText,
      ),
    };
  });
  rejectDuplicateIds(announcements, 'announcements');

  let verseReference: PublicBulletinFeed['verseReference'] = null;
  if (feed.verseReference !== null) {
    const verse = record(feed.verseReference, 'verseReference');
    exactKeys(verse, ['translationId', 'bookId', 'chapter', 'verse'], 'verseReference');
    if (
      !Number.isInteger(verse.chapter) ||
      (verse.chapter as number) < 1 ||
      !Number.isInteger(verse.verse) ||
      (verse.verse as number) < 1
    ) {
      throw new Error('verseReference coordinates must be positive integers.');
    }
    verseReference = {
      translationId: identifier(verse.translationId, 'verseReference.translationId'),
      bookId: identifier(verse.bookId, 'verseReference.bookId'),
      chapter: verse.chapter as number,
      verse: verse.verse as number,
    };
  }

  return {
    schemaVersion: 1,
    generatedAt: instant(feed.generatedAt, 'generatedAt'),
    weekOf,
    announcements,
    verseReference,
  };
}
