const PRECACHE_DECLARATION = 'const PRECACHE_URLS = [];';

export function selectPrecacheUrls(filePaths, basePath = '/sda-church-app') {
  const normalizedBase = `/${basePath.split('/').filter(Boolean).join('/')}`;
  const selected = filePaths
    .map((filePath) => filePath.replace(/\\/g, '/').replace(/^\.\//, ''))
    .filter(
      (filePath) =>
        filePath.endsWith('.html') ||
        filePath.startsWith('_expo/') ||
        filePath.startsWith('assets/') ||
        filePath === 'manifest.json' ||
        filePath === 'favicon.ico' ||
        /^icon-(?:48x48|192x192|512x512)\.png$/.test(filePath) ||
        filePath === 'data/latest-activity.json',
    )
    .filter((filePath) => !filePath.endsWith('.map'))
    .map((filePath) => `${normalizedBase}/${filePath}`);

  selected.push(`${normalizedBase}/`);
  return [...new Set(selected)].sort();
}

export function injectPrecacheUrls(workerSource, urls) {
  const firstIndex = workerSource.indexOf(PRECACHE_DECLARATION);
  if (firstIndex < 0 || firstIndex !== workerSource.lastIndexOf(PRECACHE_DECLARATION)) {
    throw new Error('Expected exactly one empty PRECACHE_URLS declaration in dist/sw.js.');
  }
  return workerSource.replace(
    PRECACHE_DECLARATION,
    `const PRECACHE_URLS = ${JSON.stringify(urls, null, 2)};`,
  );
}
