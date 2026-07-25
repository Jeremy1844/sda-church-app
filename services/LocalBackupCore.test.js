'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');

const {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  applyKeyValueTransaction,
  canonicalize,
  createBackupEnvelope,
  utf8ByteLength,
  validateBackupSettings,
  validateBackupText,
} = require('./LocalBackupCore.js');

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const createdAt = '2026-07-25T12:34:56.000Z';
const settings = {
  language: 'zh',
  theme: 'dark',
  setupComplete: true,
};

test('canonicalize sorts object keys recursively and preserves array order', () => {
  assert.equal(
    canonicalize({ z: [3, 2, 1], a: { text: '安息日', enabled: true } }),
    '{"a":{"enabled":true,"text":"安息日"},"z":[3,2,1]}',
  );
  assert.equal(utf8ByteLength('安息日'), 9);
});

test('canonicalize rejects values that JSON cannot safely represent', () => {
  assert.throws(() => canonicalize(undefined), /type undefined/);
  assert.throws(() => canonicalize(Number.NaN), /non-finite/);
  assert.throws(() => canonicalize(new Date()), /plain objects/);

  const circular = {};
  circular.self = circular;
  assert.throws(() => canonicalize(circular), /circular/);
});

test('creates and validates a stable SHA-256 backup envelope', async () => {
  const envelope = await createBackupEnvelope(settings, createdAt, sha256);

  assert.equal(envelope.format, BACKUP_FORMAT);
  assert.equal(envelope.version, BACKUP_VERSION);
  assert.match(envelope.integrity.digest, /^[a-f0-9]{64}$/);

  const reordered = JSON.stringify({
    integrity: envelope.integrity,
    data: { setupComplete: true, theme: 'dark', language: 'zh' },
    createdAt: envelope.createdAt,
    version: envelope.version,
    format: envelope.format,
  });
  assert.deepEqual(await validateBackupText(reordered, sha256), envelope);
});

test('rejects unsupported fields, versions, values, and prototype-like input', async () => {
  const envelope = await createBackupEnvelope(settings, createdAt, sha256);

  await assert.rejects(
    validateBackupText(JSON.stringify({ ...envelope, extra: true }), sha256),
    /missing or unsupported fields/,
  );
  await assert.rejects(
    validateBackupText(JSON.stringify({ ...envelope, version: 2 }), sha256),
    /version 2 is unsupported/,
  );
  await assert.rejects(
    validateBackupText(
      JSON.stringify({ ...envelope, data: { ...envelope.data, language: 'fr' } }),
      sha256,
    ),
    /language is unsupported/,
  );
  await assert.rejects(
    validateBackupText(
      `{"format":"${BACKUP_FORMAT}","version":1,"createdAt":"2026-07-25T12:34:56.000Z",` +
        '"data":{"language":"en","theme":"light","setupComplete":true,' +
        '"__proto__":{}},"integrity":{"algorithm":"SHA-256","digest":"' +
        `${'0'.repeat(64)}"}}`,
      sha256,
    ),
    /missing or unsupported fields/,
  );
  assert.throws(
    () => validateBackupSettings({ ...settings, votd_cache_en: 'excluded' }),
    /missing or unsupported fields/,
  );
});

test('accepts every v1 setting boundary and rejects invalid setup state', () => {
  for (const language of ['en', 'zh', 'zh-cn', 'es']) {
    for (const theme of ['light', 'dark']) {
      for (const setupComplete of [false, true]) {
        assert.deepEqual(validateBackupSettings({ language, theme, setupComplete }), {
          language,
          theme,
          setupComplete,
        });
      }
    }
  }

  assert.throws(
    () => validateBackupSettings({ ...settings, setupComplete: 'true' }),
    /must be true or false/,
  );
});

test('rejects malformed, oversized, and checksum-altered files', async () => {
  const envelope = await createBackupEnvelope(settings, createdAt, sha256);

  await assert.rejects(validateBackupText('{', sha256), /not valid JSON/);
  await assert.rejects(
    validateBackupText(' '.repeat(MAX_BACKUP_BYTES + 1), sha256),
    /exceeds the 65536-byte limit/,
  );
  await assert.rejects(
    validateBackupText(
      JSON.stringify({ ...envelope, data: { ...envelope.data, theme: 'light' } }),
      sha256,
    ),
    /checksum does not match/,
  );
});

test('storage transaction restores every prior value after a partial write failure', async () => {
  const values = new Map([
    ['user-language', 'en'],
    ['user-theme', 'light'],
    ['has-completed-setup', 'true'],
    ['votd_cache_en', '{"must":"remain untouched"}'],
  ]);
  let failThemeWriteOnce = true;
  const storage = {
    async getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    async setItem(key, value) {
      if (key === 'user-theme' && value === 'dark' && failThemeWriteOnce) {
        failThemeWriteOnce = false;
        throw new Error('simulated quota failure');
      }
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };

  await assert.rejects(
    applyKeyValueTransaction(storage, [
      ['user-language', 'es'],
      ['user-theme', 'dark'],
      ['has-completed-setup', 'false'],
    ]),
    /previous settings were restored/,
  );
  assert.deepEqual(Object.fromEntries(values), {
    'user-language': 'en',
    'user-theme': 'light',
    'has-completed-setup': 'true',
    votd_cache_en: '{"must":"remain untouched"}',
  });
});

test('storage transaction removes only explicitly listed keys', async () => {
  const values = new Map([
    ['user-language', 'es'],
    ['votd_cache_es', 'derived cache'],
  ]);
  const storage = {
    async getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };

  await applyKeyValueTransaction(storage, [['user-language', null]]);
  assert.deepEqual(Object.fromEntries(values), { votd_cache_es: 'derived cache' });
});
