'use strict';

const BACKUP_FORMAT = 'org.nyccsda.sda-church-app.local-settings';
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 64 * 1024;
const SHA256_ALGORITHM = 'SHA-256';
const SUPPORTED_LANGUAGES = Object.freeze(['en', 'zh', 'zh-cn', 'es']);
const SUPPORTED_THEMES = Object.freeze(['light', 'dark']);
const SUPPORTED_TEXT_SCALES = Object.freeze([1, 1.25, 1.5]);
const SHA256_HEX = /^[a-f0-9]{64}$/;

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertExactKeys(value, expectedKeys, label) {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object.`);
  }

  const actualKeys = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actualKeys.length !== expected.length ||
    actualKeys.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} contains missing or unsupported fields.`);
  }
}

function canonicalize(value, ancestors = new Set()) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Cannot canonicalize a non-finite number.');
    }
    return JSON.stringify(value);
  }

  if (typeof value !== 'object') {
    throw new Error(`Cannot canonicalize a value of type ${typeof value}.`);
  }

  if (ancestors.has(value)) {
    throw new Error('Cannot canonicalize a circular value.');
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => canonicalize(item, ancestors)).join(',')}]`;
    }

    if (!isPlainObject(value) || Object.getOwnPropertySymbols(value).length > 0) {
      throw new Error('Canonical objects must be plain objects with string keys.');
    }

    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key], ancestors)}`);
    return `{${entries.join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

function utf8ByteLength(value) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).byteLength;
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.byteLength(value, 'utf8');
  }
  return unescape(encodeURIComponent(value)).length;
}

function validateCreatedAt(createdAt) {
  if (
    typeof createdAt !== 'string' ||
    createdAt.length > 40 ||
    Number.isNaN(Date.parse(createdAt)) ||
    new Date(createdAt).toISOString() !== createdAt
  ) {
    throw new Error('Backup creation time is invalid.');
  }
}

function validateBackupSettings(settings) {
  assertExactKeys(
    settings,
    ['language', 'setupComplete', 'textScale', 'theme'],
    'Backup settings',
  );

  if (!SUPPORTED_LANGUAGES.includes(settings.language)) {
    throw new Error('Backup language is unsupported.');
  }
  if (!SUPPORTED_THEMES.includes(settings.theme)) {
    throw new Error('Backup theme is unsupported.');
  }
  if (typeof settings.setupComplete !== 'boolean') {
    throw new Error('Backup setup state must be true or false.');
  }
  if (!SUPPORTED_TEXT_SCALES.includes(settings.textScale)) {
    throw new Error('Backup text scale is unsupported.');
  }

  return {
    language: settings.language,
    theme: settings.theme,
    setupComplete: settings.setupComplete,
    textScale: settings.textScale,
  };
}

function integrityContent(envelope) {
  return {
    format: envelope.format,
    version: envelope.version,
    createdAt: envelope.createdAt,
    data: envelope.data,
  };
}

async function calculateDigest(sha256, value) {
  if (typeof sha256 !== 'function') {
    throw new Error('SHA-256 checksum support is unavailable.');
  }
  const digest = await sha256(value);
  if (typeof digest !== 'string' || !SHA256_HEX.test(digest)) {
    throw new Error('SHA-256 checksum provider returned an invalid digest.');
  }
  return digest;
}

async function createBackupEnvelope(settings, createdAt, sha256) {
  const validatedSettings = validateBackupSettings(settings);
  validateCreatedAt(createdAt);

  const content = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt,
    data: validatedSettings,
  };
  const digest = await calculateDigest(sha256, canonicalize(content));

  return {
    ...content,
    integrity: {
      algorithm: SHA256_ALGORITHM,
      digest,
    },
  };
}

function constantTimeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

async function validateBackupText(text, sha256) {
  if (typeof text !== 'string') {
    throw new Error('Backup content must be text.');
  }
  if (utf8ByteLength(text) > MAX_BACKUP_BYTES) {
    throw new Error(`Backup file exceeds the ${MAX_BACKUP_BYTES}-byte limit.`);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Backup file is not valid JSON.');
  }

  assertExactKeys(
    parsed,
    ['createdAt', 'data', 'format', 'integrity', 'version'],
    'Backup file',
  );
  if (parsed.format !== BACKUP_FORMAT) {
    throw new Error('Backup format is unsupported.');
  }
  if (parsed.version !== BACKUP_VERSION) {
    throw new Error(`Backup version ${String(parsed.version)} is unsupported.`);
  }
  validateCreatedAt(parsed.createdAt);
  const data = validateBackupSettings(parsed.data);

  assertExactKeys(parsed.integrity, ['algorithm', 'digest'], 'Backup integrity');
  if (parsed.integrity.algorithm !== SHA256_ALGORITHM) {
    throw new Error('Backup checksum algorithm is unsupported.');
  }
  if (typeof parsed.integrity.digest !== 'string' || !SHA256_HEX.test(parsed.integrity.digest)) {
    throw new Error('Backup checksum is malformed.');
  }

  const normalizedEnvelope = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: parsed.createdAt,
    data,
    integrity: {
      algorithm: SHA256_ALGORITHM,
      digest: parsed.integrity.digest,
    },
  };
  const expectedDigest = await calculateDigest(
    sha256,
    canonicalize(integrityContent(normalizedEnvelope)),
  );
  if (!constantTimeEqual(expectedDigest, normalizedEnvelope.integrity.digest)) {
    throw new Error('Backup checksum does not match the file contents.');
  }

  return normalizedEnvelope;
}

async function applyKeyValueTransaction(storage, changes) {
  if (
    !storage ||
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function' ||
    typeof storage.removeItem !== 'function'
  ) {
    throw new Error('Storage adapter is invalid.');
  }
  if (!Array.isArray(changes) || changes.length === 0) {
    throw new Error('Storage transaction requires at least one change.');
  }

  const seenKeys = new Set();
  for (const change of changes) {
    if (
      !Array.isArray(change) ||
      change.length !== 2 ||
      typeof change[0] !== 'string' ||
      change[0].length === 0 ||
      (typeof change[1] !== 'string' && change[1] !== null)
    ) {
      throw new Error('Storage transaction contains an invalid change.');
    }
    if (seenKeys.has(change[0])) {
      throw new Error('Storage transaction contains a duplicate key.');
    }
    seenKeys.add(change[0]);
  }

  const snapshot = [];
  for (const [key] of changes) {
    snapshot.push([key, await storage.getItem(key)]);
  }

  try {
    for (const [key, value] of changes) {
      if (value === null) {
        await storage.removeItem(key);
      } else {
        await storage.setItem(key, value);
      }
    }
  } catch (writeError) {
    const rollbackErrors = [];
    for (const [key, value] of [...snapshot].reverse()) {
      try {
        if (value === null) {
          await storage.removeItem(key);
        } else {
          await storage.setItem(key, value);
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }

    const message = rollbackErrors.length
      ? 'Storage update failed and the previous settings could not be fully restored.'
      : 'Storage update failed; the previous settings were restored.';
    const transactionError = new Error(message);
    transactionError.cause = writeError;
    transactionError.rollbackErrors = rollbackErrors;
    throw transactionError;
  }
}

module.exports = {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  SHA256_ALGORITHM,
  SUPPORTED_LANGUAGES,
  SUPPORTED_TEXT_SCALES,
  SUPPORTED_THEMES,
  applyKeyValueTransaction,
  canonicalize,
  createBackupEnvelope,
  utf8ByteLength,
  validateBackupSettings,
  validateBackupText,
};
