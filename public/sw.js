// This version string is synchronized from package.json by public/sync-version.js.
// This controls a pop-up notification to users when a new version of the app is available for install
// DO NOT EDIT THIS MANUALLY, as it is verified by the release quality gate.
const VERSION = '0.23.0';
const CACHE_PREFIX = 'sda-church-v';
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const APP_BASE_PATH = '/sda-church-app';
const PRECACHE_URLS = [];
const NEVER_CACHE_PATH_PREFIXES = [
  '/account/',
  '/admin/',
  '/api/',
  '/auth/',
  '/oauth/',
  '/forms/',
  '/giving/',
  '/member/',
  '/payment/',
  '/payments/',
  '/private/',
  '/prayer/',
  '/roster/',
  '/schedule/',
  '/user/',
];

function isSameOriginRequest(requestUrl, workerOrigin) {
  return new URL(requestUrl).origin === workerOrigin;
}

function isOwnedCacheName(cacheName) {
  return cacheName.startsWith(CACHE_PREFIX);
}

function isPublicAppPath(pathname) {
  if (
    typeof pathname !== 'string' ||
    pathname.includes('%') ||
    pathname.includes('\\') ||
    (pathname !== APP_BASE_PATH && !pathname.startsWith(`${APP_BASE_PATH}/`))
  ) {
    return false;
  }

  const appRelativePath =
    pathname === APP_BASE_PATH ? '/' : pathname.slice(APP_BASE_PATH.length);
  if (NEVER_CACHE_PATH_PREFIXES.some(
    (prefix) =>
      appRelativePath === prefix.slice(0, -1) || appRelativePath.startsWith(prefix),
  )) {
    return false;
  }

  return true;
}

function isCacheablePath(pathname, cacheablePaths = PRECACHE_URLS) {
  if (!isPublicAppPath(pathname)) return false;

  return cacheablePaths.includes(pathname);
}

function getCachedNavigationPath(pathname, cacheablePaths = PRECACHE_URLS) {
  if (!isPublicAppPath(pathname)) return null;
  if (pathname === APP_BASE_PATH || pathname === `${APP_BASE_PATH}/`) {
    return cacheablePaths.includes(`${APP_BASE_PATH}/`)
      ? `${APP_BASE_PATH}/`
      : null;
  }

  const withoutTrailingSlash = pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
  const htmlPath = `${withoutTrailingSlash}.html`;
  return cacheablePaths.includes(htmlPath) ? htmlPath : null;
}

function isSafeNavigationPath(pathname, cacheablePaths = PRECACHE_URLS) {
  return getCachedNavigationPath(pathname, cacheablePaths) !== null;
}

function isCacheableResponse(response) {
  const cacheControl = response.headers.get('cache-control') || '';
  return (
    response.ok &&
    response.type !== 'opaque' &&
    !/(?:^|,)\s*(?:no-store|private)(?:\s|,|$)/i.test(cacheControl)
  );
}

if (typeof self !== 'undefined') {
  self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      Promise.all([
        self.clients.claim(),
        caches.keys().then((keys) =>
          Promise.all(
            keys.map((key) =>
              isOwnedCacheName(key) && key !== CACHE_NAME
                ? caches.delete(key)
                : undefined,
            ),
          ),
        ),
      ]),
    );
  });

  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);
    if (!isSameOriginRequest(requestUrl.href, self.location.origin)) return;
    const isBuildOwnedPath = isCacheablePath(requestUrl.pathname);
    const isSafeNavigation =
      event.request.mode === 'navigate' && isSafeNavigationPath(requestUrl.pathname);
    if (!isBuildOwnedPath && !isSafeNavigation) return;

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only exact build-manifest paths may be written. Extensionless navigation
          // requests are handled for offline fallback but are never added to the cache.
          if (isBuildOwnedPath && isCacheableResponse(response)) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)),
            );
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const exactMatch = await cache.match(event.request);
          if (exactMatch) return exactMatch;
          if (isSafeNavigation) {
            const routeDocumentPath = getCachedNavigationPath(requestUrl.pathname);
            return (
              (routeDocumentPath && (await cache.match(routeDocumentPath))) ||
              (await cache.match(`${APP_BASE_PATH}/`)) ||
              (await cache.match(`${APP_BASE_PATH}/index.html`)) ||
              Response.error()
            );
          }
          return Response.error();
        }),
    );
  });

  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    NEVER_CACHE_PATH_PREFIXES,
    APP_BASE_PATH,
    PRECACHE_URLS,
    isOwnedCacheName,
    isCacheablePath,
    isCacheableResponse,
    getCachedNavigationPath,
    isPublicAppPath,
    isSafeNavigationPath,
    isSameOriginRequest,
  };
}
