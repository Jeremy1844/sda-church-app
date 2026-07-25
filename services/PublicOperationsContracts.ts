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

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

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

function instant(value: unknown, label: string) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an ISO timestamp.`);
  }
  return value;
}

function optionalInstant(value: unknown, label: string) {
  return value === null ? null : instant(value, label);
}

function httpsUrl(value: unknown, label: string) {
  if (value === null) return null;
  if (typeof value !== 'string') throw new Error(`${label} must be an HTTPS URL or null.`);
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error(`${label} must be a credential-free HTTPS URL.`);
  }
  return parsed.toString();
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

export function parsePublicEventFeed(value: unknown): PublicEventFeed {
  const feed = record(value, 'Event feed');
  exactKeys(feed, ['schemaVersion', 'generatedAt', 'timezone', 'events'], 'Event feed');
  if (feed.schemaVersion !== 1 || !Array.isArray(feed.events)) {
    throw new Error('Event feed schema is unsupported.');
  }

  const events = feed.events.map((item, index) => {
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
      title: text(event.title, `events[${index}].title`, 160),
      startsAt,
      endsAt,
      registrationUrl: httpsUrl(event.registrationUrl, `events[${index}].registrationUrl`),
      registrationDeadline,
    };
  });

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
  const slots = feed.slots.map((item, index) => {
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
  if (typeof feed.weekOf !== 'string' || !DATE_ONLY.test(feed.weekOf)) {
    throw new Error('weekOf must be YYYY-MM-DD.');
  }
  const announcements = feed.announcements.map((item, index) => {
    const announcement = record(item, `announcements[${index}]`);
    exactKeys(announcement, ['id', 'text'], `announcements[${index}]`);
    return {
      id: identifier(announcement.id, `announcements[${index}].id`),
      text: text(announcement.text, `announcements[${index}].text`, 500),
    };
  });

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
    weekOf: feed.weekOf,
    announcements,
    verseReference,
  };
}
