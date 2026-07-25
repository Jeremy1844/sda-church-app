'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');

const {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  LEGACY_BACKUP_VERSION,
  LEGACY_SUPPORTED_TEXT_SCALES,
  MAX_BACKUP_BYTES,
  SUPPORTED_TEXT_SCALES,
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
  textScale: 1.25,
};

const createLegacyEnvelope = (legacySettings) => {
  const content = {
    format: BACKUP_FORMAT,
    version: LEGACY_BACKUP_VERSION,
    createdAt,
    data: legacySettings,
  };
  return {
    ...content,
    integrity: {
      algorithm: 'SHA-256',
      digest: sha256(canonicalize(content)),
    },
  };
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
    data: { textScale: 1.25, setupComplete: true, theme: 'dark', language: 'zh' },
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
    validateBackupText(JSON.stringify({ ...envelope, version: 3 }), sha256),
    /version 3 is unsupported/,
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
        '"data":{"language":"en","theme":"light","setupComplete":true,"textScale":1,' +
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

test('accepts every v2 text-scale step and rejects invalid values', () => {
  assert.equal(SUPPORTED_TEXT_SCALES.length, 21);
  for (const language of ['en', 'zh', 'zh-cn', 'es']) {
    for (const theme of ['light', 'dark']) {
      for (const setupComplete of [false, true]) {
        for (const textScale of SUPPORTED_TEXT_SCALES) {
          assert.deepEqual(
            validateBackupSettings({ language, theme, setupComplete, textScale }),
            { language, theme, setupComplete, textScale },
          );
        }
      }
    }
  }

  assert.throws(
    () => validateBackupSettings({ ...settings, setupComplete: 'true' }),
    /must be true or false/,
  );
  assert.throws(
    () => validateBackupSettings({ ...settings, textScale: 1.11 }),
    /text scale is unsupported/,
  );
  for (const textScale of [Number.NaN, Number.POSITIVE_INFINITY, 0.95, 2.05]) {
    assert.throws(
      () => validateBackupSettings({ ...settings, textScale }),
      /text scale is unsupported/,
    );
  }
});

test('verifies a v1 checksum before migrating legacy settings to normalized v2', async () => {
  assert.deepEqual(LEGACY_SUPPORTED_TEXT_SCALES, [1, 1.25, 1.5]);
  const legacySettings = { ...settings, textScale: 1.5 };
  const legacyEnvelope = createLegacyEnvelope(legacySettings);

  const migrated = await validateBackupText(JSON.stringify(legacyEnvelope), sha256);
  assert.equal(migrated.version, BACKUP_VERSION);
  assert.deepEqual(migrated.data, legacySettings);
  assert.notEqual(migrated.integrity.digest, legacyEnvelope.integrity.digest);
  assert.equal(
    migrated.integrity.digest,
    sha256(
      canonicalize({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        createdAt,
        data: legacySettings,
      }),
    ),
  );

  const checksumAlteredLegacy = {
    ...legacyEnvelope,
    data: { ...legacyEnvelope.data, textScale: 1.25 },
  };
  await assert.rejects(
    validateBackupText(JSON.stringify(checksumAlteredLegacy), sha256),
    /checksum does not match/,
  );
});

test('v1 migration remains limited to the three legacy text sizes', async () => {
  const unsupportedLegacy = createLegacyEnvelope({ ...settings, textScale: 1.1 });
  await assert.rejects(
    validateBackupText(JSON.stringify(unsupportedLegacy), sha256),
    /text scale is unsupported for version 1/,
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
    ['user-text-scale', '1'],
    ['votd_cache_en', '{"must":"remain untouched"}'],
  ]);
  let failTextScaleWriteOnce = true;
  const storage = {
    async getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    async setItem(key, value) {
      if (key === 'user-text-scale' && value === '1.5' && failTextScaleWriteOnce) {
        failTextScaleWriteOnce = false;
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
      ['user-text-scale', '1.5'],
    ]),
    /previous settings were restored/,
  );
  assert.deepEqual(Object.fromEntries(values), {
    'user-language': 'en',
    'user-theme': 'light',
    'has-completed-setup': 'true',
    'user-text-scale': '1',
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
