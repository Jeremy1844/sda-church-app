const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { checkVersions, syncVersions } = require('../public/sync-version');

const CURRENT_VERSION = '1.2.3';

function json(value, eol = '\n') {
  return `${JSON.stringify(value, null, 2).replace(/\n/g, eol)}${eol}`;
}

function createFixture(t, options = {}) {
  const rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'version-sync-'));
  t.after(() => fs.rmSync(rootDirectory, { force: true, recursive: true }));

  const eol = options.eol ?? '\n';
  const files = {
    'app.json':
      options.appContent ?? json({ expo: { version: options.appVersion ?? '0.1.0' } }, eol),
    'package-lock.json':
      options.lockContent ??
      json(
        {
          name: 'fixture',
          packages: { '': { name: 'fixture', version: options.innerLockVersion ?? '0.1.0' } },
          version: options.lockVersion ?? '0.1.0',
        },
        eol,
      ),
    'package.json': json({ name: 'fixture', version: CURRENT_VERSION }, eol),
    'public/sw.js':
      options.serviceWorker ?? `const VERSION = '${options.workerVersion ?? '0.1.0'}';${eol}`,
  };

  fs.mkdirSync(path.join(rootDirectory, 'public'));
  for (const [relativePath, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(rootDirectory, relativePath), content, 'utf8');
  }

  return rootDirectory;
}

function readFixture(rootDirectory) {
  return Object.fromEntries(
    ['package.json', 'app.json', 'package-lock.json', 'public/sw.js'].map((relativePath) => [
      relativePath,
      fs.readFileSync(path.join(rootDirectory, relativePath), 'utf8'),
    ]),
  );
}

test('synchronizes a single-quoted VERSION declaration', (t) => {
  const rootDirectory = createFixture(t);
  const result = syncVersions(rootDirectory);

  assert.deepEqual(result.changedFiles, ['app.json', 'package-lock.json', 'public/sw.js']);
  assert.match(readFixture(rootDirectory)['public/sw.js'], /const VERSION = '1\.2\.3';/);
  assert.deepEqual(checkVersions(rootDirectory), {
    mismatches: [],
    synchronized: true,
    version: CURRENT_VERSION,
  });
});

test('preserves double quotes, flexible spacing, and CRLF line endings', (t) => {
  const eol = '\r\n';
  const rootDirectory = createFixture(t, {
    eol,
    serviceWorker: `// fixture${eol}\tconst   VERSION\t = \t"0.1.0" ;   ${eol}// end${eol}`,
  });

  syncVersions(rootDirectory);
  const files = readFixture(rootDirectory);

  assert.match(files['public/sw.js'], /\tconst   VERSION\t = \t"1\.2\.3" ;   \r\n/);
  for (const content of Object.values(files)) {
    assert.equal(content.replace(/\r\n/g, '').includes('\n'), false);
  }
});

test('rejects a missing VERSION declaration without changing files', (t) => {
  const rootDirectory = createFixture(t, { serviceWorker: '// VERSION is intentionally absent\n' });
  const before = readFixture(rootDirectory);

  assert.throws(
    () => syncVersions(rootDirectory),
    /exactly one const VERSION declaration; found 0/,
  );
  assert.deepEqual(readFixture(rootDirectory), before);
});

test('rejects duplicate VERSION declarations without changing files', (t) => {
  const rootDirectory = createFixture(t, {
    serviceWorker: "const VERSION = '0.1.0';\nconst VERSION = \"0.2.0\";\n",
  });
  const before = readFixture(rootDirectory);

  assert.throws(
    () => syncVersions(rootDirectory),
    /exactly one const VERSION declaration; found 2/,
  );
  assert.deepEqual(readFixture(rootDirectory), before);
});

test('does not rewrite files that are already current', (t) => {
  const rootDirectory = createFixture(t, {
    appVersion: CURRENT_VERSION,
    innerLockVersion: CURRENT_VERSION,
    lockVersion: CURRENT_VERSION,
    workerVersion: CURRENT_VERSION,
  });
  const before = readFixture(rootDirectory);

  const result = syncVersions(rootDirectory);

  assert.deepEqual(result.changedFiles, []);
  assert.deepEqual(readFixture(rootDirectory), before);
});

test('validates every target before writing any target', (t) => {
  const rootDirectory = createFixture(t, {
    lockContent: json({ name: 'fixture', packages: { '': { name: 'fixture' } }, version: '0.1.0' }),
  });
  const before = readFixture(rootDirectory);

  assert.throws(
    () => syncVersions(rootDirectory),
    /package-lock\.json packages\[""\]\.version must be a non-empty string/,
  );
  assert.deepEqual(readFixture(rootDirectory), before);
});

test('check reports app, both lockfile, and service-worker drift without writing', (t) => {
  const rootDirectory = createFixture(t);
  const before = readFixture(rootDirectory);

  const result = checkVersions(rootDirectory);

  assert.equal(result.synchronized, false);
  assert.deepEqual(
    result.mismatches.map(({ field }) => field),
    [
      'app.json expo.version',
      'package-lock.json version',
      'package-lock.json packages[""].version',
      'public/sw.js VERSION',
    ],
  );
  assert.deepEqual(readFixture(rootDirectory), before);
});
