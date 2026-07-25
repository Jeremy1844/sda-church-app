// This version string is synchronized from package.json by public/sync-version.js.
// This controls a pop-up notification to users when a new version of the app is available for install
// DO NOT EDIT THIS MANUALLY, as it is verified by the release quality gate.
const VERSION = '0.23.0';
const CACHE_NAME = `sda-church-v${VERSION}`;
const NEVER_CACHE_PATH_PREFIXES = [
  '/api/',
  '/auth/',
  '/oauth/',
  '/forms/',
  '/prayer/',
  '/schedule/',
];

function isSameOriginRequest(requestUrl, workerOrigin) {
  return new URL(requestUrl).origin === workerOrigin;
}

function isCacheablePath(pathname) {
  return !NEVER_CACHE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix),
  );
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
  self.addEventListener('install', () => {});

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      Promise.all([
        self.clients.claim(),
        caches.keys().then((keys) =>
          Promise.all(
            keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : undefined)),
          ),
        ),
      ]),
    );
  });

  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);
    if (!isSameOriginRequest(requestUrl.href, self.location.origin)) return;
    if (!isCacheablePath(requestUrl.pathname)) return;

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (isCacheableResponse(response)) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)),
            );
          }
          return response;
        })
        .catch(async () => (await caches.match(event.request)) || Response.error()),
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
    isCacheablePath,
    isCacheableResponse,
    isSameOriginRequest,
  };
}
