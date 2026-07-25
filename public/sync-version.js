const fs = require('fs');
const path = require('path');

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const VERSION_DECLARATION_PATTERN =
  /^([ \t]*const[ \t]+VERSION[ \t]*=[ \t]*)(['"])([^'"\r\n]*)(\2)([ \t]*;?[ \t]*)(?=\r?$)/gm;

const PROJECT_FILES = Object.freeze({
  packageJson: 'package.json',
  appJson: 'app.json',
  packageLock: 'package-lock.json',
  serviceWorker: path.join('public', 'sw.js'),
});

function readFile(filePath, label) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read ${label}: ${error.message}`);
  }
}

function parseJson(content, label) {
  try {
    return JSON.parse(content.replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function assertVersionField(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertPackageVersion(version) {
  assertVersionField(version, 'package.json version');
  if (!SEMVER_PATTERN.test(version)) {
    throw new Error(
      `package.json version must be a valid semantic version; received ${JSON.stringify(version)}.`,
    );
  }
}

function findVersionDeclaration(content) {
  const matches = [...content.matchAll(VERSION_DECLARATION_PATTERN)];

  if (matches.length !== 1) {
    throw new Error(
      `public/sw.js must contain exactly one const VERSION declaration; found ${matches.length}.`,
    );
  }

  const [match] = matches;
  return {
    declaration: match[0],
    index: match.index,
    value: match[3],
    valueEnd: match.index + match[1].length + match[2].length + match[3].length,
    valueStart: match.index + match[1].length + match[2].length,
  };
}

function replaceVersionDeclaration(content, version) {
  const declaration = findVersionDeclaration(content);
  return (
    content.slice(0, declaration.valueStart) +
    version +
    content.slice(declaration.valueEnd)
  );
}

function serializeJson(value, originalContent) {
  const usesCrLf = originalContent.includes('\r\n');
  const eol = usesCrLf ? '\r\n' : '\n';
  const indentMatch = originalContent.match(/\r?\n([ \t]+)"/);
  const indent = indentMatch ? indentMatch[1] : '  ';
  const hasTrailingNewline = /\r?\n$/.test(originalContent);
  const serialized = JSON.stringify(value, null, indent).replace(/\n/g, eol);

  return serialized + (hasTrailingNewline ? eol : '');
}

function resolveProjectFiles(rootDirectory) {
  return Object.fromEntries(
    Object.entries(PROJECT_FILES).map(([key, relativePath]) => [
      key,
      {
        absolutePath: path.join(rootDirectory, relativePath),
        relativePath: relativePath.replace(/\\/g, '/'),
      },
    ]),
  );
}

function loadProject(rootDirectory = path.resolve(__dirname, '..')) {
  const files = resolveProjectFiles(rootDirectory);
  const packageContent = readFile(files.packageJson.absolutePath, files.packageJson.relativePath);
  const appContent = readFile(files.appJson.absolutePath, files.appJson.relativePath);
  const lockContent = readFile(files.packageLock.absolutePath, files.packageLock.relativePath);
  const serviceWorkerContent = readFile(
    files.serviceWorker.absolutePath,
    files.serviceWorker.relativePath,
  );

  const packageJson = parseJson(packageContent, files.packageJson.relativePath);
  const appJson = parseJson(appContent, files.appJson.relativePath);
  const packageLock = parseJson(lockContent, files.packageLock.relativePath);

  assertPackageVersion(packageJson.version);
  assertVersionField(appJson?.expo?.version, 'app.json expo.version');
  assertVersionField(packageLock.version, 'package-lock.json version');
  assertVersionField(
    packageLock?.packages?.['']?.version,
    'package-lock.json packages[""].version',
  );

  const serviceWorkerVersion = findVersionDeclaration(serviceWorkerContent).value;
  assertVersionField(serviceWorkerVersion, 'public/sw.js VERSION');

  return {
    app: { content: appContent, data: appJson, ...files.appJson },
    lock: { content: lockContent, data: packageLock, ...files.packageLock },
    package: { content: packageContent, data: packageJson, ...files.packageJson },
    serviceWorker: {
      content: serviceWorkerContent,
      version: serviceWorkerVersion,
      ...files.serviceWorker,
    },
    version: packageJson.version,
  };
}

function collectMismatches(project) {
  const expected = project.version;
  const values = [
    ['app.json expo.version', project.app.data.expo.version],
    ['package-lock.json version', project.lock.data.version],
    ['package-lock.json packages[""].version', project.lock.data.packages[''].version],
    ['public/sw.js VERSION', project.serviceWorker.version],
  ];

  return values
    .filter(([, actual]) => actual !== expected)
    .map(([field, actual]) => ({ actual, expected, field }));
}

function checkVersions(rootDirectory) {
  const project = loadProject(rootDirectory);
  const mismatches = collectMismatches(project);

  return {
    mismatches,
    synchronized: mismatches.length === 0,
    version: project.version,
  };
}

function validatePreparedChanges(project, candidates) {
  const appJson = parseJson(candidates.app, project.app.relativePath);
  const packageLock = parseJson(candidates.lock, project.lock.relativePath);
  const serviceWorkerVersion = findVersionDeclaration(candidates.serviceWorker).value;

  const candidateVersions = [
    ['app.json expo.version', appJson?.expo?.version],
    ['package-lock.json version', packageLock.version],
    ['package-lock.json packages[""].version', packageLock?.packages?.['']?.version],
    ['public/sw.js VERSION', serviceWorkerVersion],
  ];

  for (const [field, actual] of candidateVersions) {
    if (actual !== project.version) {
      throw new Error(
        `Prepared ${field} does not match package.json: expected ${project.version}, received ${JSON.stringify(actual)}.`,
      );
    }
  }
}

function writeChanges(changes) {
  const written = [];

  try {
    for (const change of changes) {
      fs.writeFileSync(change.absolutePath, change.nextContent, 'utf8');
      written.push(change);
    }
  } catch (error) {
    const rollbackErrors = [];

    for (const change of written.reverse()) {
      try {
        fs.writeFileSync(change.absolutePath, change.previousContent, 'utf8');
      } catch (rollbackError) {
        rollbackErrors.push(`${change.relativePath}: ${rollbackError.message}`);
      }
    }

    const rollbackMessage = rollbackErrors.length
      ? ` Rollback also failed for ${rollbackErrors.join(', ')}.`
      : '';
    throw new Error(`Version synchronization could not be written: ${error.message}.${rollbackMessage}`);
  }
}

function syncVersions(rootDirectory) {
  // Load and validate every target before preparing or writing any change.
  const project = loadProject(rootDirectory);

  project.app.data.expo.version = project.version;
  project.lock.data.version = project.version;
  project.lock.data.packages[''].version = project.version;

  const candidates = {
    app: serializeJson(project.app.data, project.app.content),
    lock: serializeJson(project.lock.data, project.lock.content),
    serviceWorker: replaceVersionDeclaration(project.serviceWorker.content, project.version),
  };

  validatePreparedChanges(project, candidates);

  const changes = [
    { target: project.app, nextContent: candidates.app },
    { target: project.lock, nextContent: candidates.lock },
    { target: project.serviceWorker, nextContent: candidates.serviceWorker },
  ]
    .filter(({ target, nextContent }) => target.content !== nextContent)
    .map(({ target, nextContent }) => ({
      absolutePath: target.absolutePath,
      nextContent,
      previousContent: target.content,
      relativePath: target.relativePath,
    }));

  writeChanges(changes);

  return {
    changedFiles: changes.map(({ relativePath }) => relativePath),
    version: project.version,
  };
}

function runCli(args = process.argv.slice(2), rootDirectory = path.resolve(__dirname, '..')) {
  if (args.length !== 1 || !['--check', '--sync'].includes(args[0])) {
    throw new Error('Usage: node public/sync-version.js --check | --sync');
  }

  if (args[0] === '--check') {
    const result = checkVersions(rootDirectory);
    if (!result.synchronized) {
      console.error(`Version fields do not match package.json (${result.version}):`);
      for (const mismatch of result.mismatches) {
        console.error(
          `- ${mismatch.field}: expected ${mismatch.expected}, received ${mismatch.actual}`,
        );
      }
      return 1;
    }

    console.log(`All version fields match package.json (${result.version}).`);
    return 0;
  }

  const result = syncVersions(rootDirectory);
  if (result.changedFiles.length === 0) {
    console.log(`All version fields already match package.json (${result.version}).`);
  } else {
    console.log(`Synchronized version ${result.version} in:`);
    for (const file of result.changedFiles) {
      console.log(`- ${file}`);
    }
  }
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = runCli();
  } catch (error) {
    console.error(`Version synchronization failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  checkVersions,
  collectMismatches,
  findVersionDeclaration,
  loadProject,
  replaceVersionDeclaration,
  runCli,
  serializeJson,
  syncVersions,
};
