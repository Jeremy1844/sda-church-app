// This version string is synchronized from package.json by public/sync-version.js.
// This controls a pop-up notification to users when a new version of the app is available for install
// DO NOT EDIT THIS MANUALLY, as it is verified by the release quality gate.
const VERSION = '0.23.1';
const CACHE_PREFIX = 'sda-church-v';
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const APP_BASE_PATH = '/sda-church-app';
const PRECACHE_URLS = [
  "/sda-church-app/",
  "/sda-church-app/(tabs)/bible/index.html",
  "/sda-church-app/(tabs)/home/about-my-church.html",
  "/sda-church-app/(tabs)/home/about-sda.html",
  "/sda-church-app/(tabs)/home/baptism.html",
  "/sda-church-app/(tabs)/home/bulletin.html",
  "/sda-church-app/(tabs)/home/discover.html",
  "/sda-church-app/(tabs)/home/events.html",
  "/sda-church-app/(tabs)/home/fellowship.html",
  "/sda-church-app/(tabs)/home/give.html",
  "/sda-church-app/(tabs)/home/prayer.html",
  "/sda-church-app/(tabs)/home/team.html",
  "/sda-church-app/(tabs)/home/worship.html",
  "/sda-church-app/(tabs)/index.html",
  "/sda-church-app/(tabs)/resources/english-hymnal.html",
  "/sda-church-app/(tabs)/resources/hymnal-selection.html",
  "/sda-church-app/(tabs)/resources/index.html",
  "/sda-church-app/(tabs)/you/backup.html",
  "/sda-church-app/(tabs)/you/index.html",
  "/sda-church-app/(tabs)/you/language.html",
  "/sda-church-app/(tabs)/you/legal.html",
  "/sda-church-app/(tabs)/you/privacy.html",
  "/sda-church-app/+not-found.html",
  "/sda-church-app/_expo/.routes.json",
  "/sda-church-app/_expo/static/js/web/entry-6bacc40c33bada062346cd132367f8d2.js",
  "/sda-church-app/_sitemap.html",
  "/sda-church-app/assets/assets/fonts/MaterialCommunityIcons.6e435534bd35da5fef04168860a9b8fa.ttf",
  "/sda-church-app/assets/assets/fonts/NotoSans-Bold.28c191ce33ca36e0f75106491846de68.ttf",
  "/sda-church-app/assets/assets/fonts/NotoSans-Medium.a1311858ffd88b69aa5eadafd8f5c164.ttf",
  "/sda-church-app/assets/assets/fonts/NotoSans-Regular.f46b08cc90d994b34b647ae24c46d504.ttf",
  "/sda-church-app/assets/assets/images/youtube_art.9fd57d27563adb953fc75b392955e202.png",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.3f78af31cca60105799838a1a7a59fbd.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Entypo.31b5ffea3daddc69dd01a1f3d6cf63c5.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/EvilIcons.140c53a7643ea949007aa9a282153849.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ca4b48e04dc1ce10bfbddb262c8b835f.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.b06871f281fee6b241d60582ae9369b9.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Brands.3b89dd103490708d19a95adcae52210e.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.1f77739ca9ff2188b539c36f30ffa2be.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.605ed7926cf39a2ad5ec2d1f9d391d3d.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Brands.56c8d80832e37783f12c05db7c8849e2.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Regular.370dd5af19f8364907b6e2c41f45dbbf.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Solid.adec7d6f310bc577f05e8fe06a5daccf.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Fontisto.b49ae8ab2dbccb02c4d11caaacf09eab.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Foundation.e20945d7c929279ef7a6f1db184a4470.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.6e435534bd35da5fef04168860a9b8fa.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Octicons.871378c6eab492a3e689a9385dc45a12.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/SimpleLineIcons.d2285965fe34b05465047401b8595dd0.ttf",
  "/sda-church-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Zocial.1681f34aaca71b8dfb70756bca331eb2.ttf",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png",
  "/sda-church-app/assets/node_modules/@react-navigation/elements/lib/module/assets/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png",
  "/sda-church-app/assets/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png",
  "/sda-church-app/assets/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png",
  "/sda-church-app/assets/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png",
  "/sda-church-app/assets/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png",
  "/sda-church-app/assets/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png",
  "/sda-church-app/assets/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png",
  "/sda-church-app/assets/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png",
  "/sda-church-app/bible/index.html",
  "/sda-church-app/community/baptism.html",
  "/sda-church-app/community/fellowship.html",
  "/sda-church-app/community/index.html",
  "/sda-church-app/community/prayer.html",
  "/sda-church-app/community/worship.html",
  "/sda-church-app/data/latest-activity.json",
  "/sda-church-app/favicon.ico",
  "/sda-church-app/home/about-my-church.html",
  "/sda-church-app/home/about-sda.html",
  "/sda-church-app/home/baptism.html",
  "/sda-church-app/home/bulletin.html",
  "/sda-church-app/home/discover.html",
  "/sda-church-app/home/events.html",
  "/sda-church-app/home/fellowship.html",
  "/sda-church-app/home/give.html",
  "/sda-church-app/home/prayer.html",
  "/sda-church-app/home/team.html",
  "/sda-church-app/home/worship.html",
  "/sda-church-app/icon-192x192.png",
  "/sda-church-app/icon-48x48.png",
  "/sda-church-app/icon-512x512.png",
  "/sda-church-app/index.html",
  "/sda-church-app/manifest.json",
  "/sda-church-app/resources/english-hymnal.html",
  "/sda-church-app/resources/hymnal-selection.html",
  "/sda-church-app/resources/index.html",
  "/sda-church-app/you/backup.html",
  "/sda-church-app/you/index.html",
  "/sda-church-app/you/language.html",
  "/sda-church-app/you/legal.html",
  "/sda-church-app/you/privacy.html"
];
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

function isExactBuildOwnedRequest(pathname, search, cacheablePaths = PRECACHE_URLS) {
  return search === '' && isCacheablePath(pathname, cacheablePaths);
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

function validatePrecacheUrls(urls, workerOrigin) {
  if (!Array.isArray(urls)) throw new Error('Precache manifest must be an array.');

  const seen = new Set();
  return urls.map((value) => {
    if (typeof value !== 'string' || seen.has(value)) {
      throw new Error('Precache manifest contains an invalid or duplicate URL.');
    }
    seen.add(value);

    const parsed = new URL(value, workerOrigin);
    if (
      parsed.origin !== workerOrigin ||
      value !== parsed.pathname ||
      !isExactBuildOwnedRequest(parsed.pathname, parsed.search, urls)
    ) {
      throw new Error(`Precache URL is outside the public build manifest: ${value}`);
    }
    return value;
  });
}

function createPrecacheRequests(urls, workerOrigin) {
  return validatePrecacheUrls(urls, workerOrigin).map(
    (url) =>
      new Request(new URL(url, workerOrigin), {
        cache: 'reload',
        credentials: 'omit',
        redirect: 'error',
      }),
  );
}

function isCacheableResponse(response) {
  const cacheControl = response.headers.get('cache-control') || '';
  const cacheControlDirectives = new Set(
    cacheControl.split(',').flatMap((directive) => {
      const match = /^\s*([!#$%&'*+.^_`|~0-9A-Za-z-]+)/.exec(directive);
      return match ? [match[1].toLowerCase()] : [];
    }),
  );
  return (
    response.ok &&
    response.type !== 'opaque' &&
    !cacheControlDirectives.has('no-store') &&
    !cacheControlDirectives.has('private')
  );
}

function isExactResponseForRequest(response, request) {
  if (response.redirected || typeof response.url !== 'string' || !response.url) {
    return false;
  }
  const responseUrl = new URL(response.url);
  const requestUrl = new URL(request.url);
  return responseUrl.href === requestUrl.href;
}

function createPublicBuildRequest(request) {
  return new Request(request, {
    credentials: 'omit',
    redirect: 'error',
  });
}

async function precacheBuildAssets(urls, workerOrigin, cache, fetchImpl = fetch) {
  const requests = createPrecacheRequests(urls, workerOrigin);
  const validatedResponses = await Promise.all(
    requests.map(async (request) => {
      const response = await fetchImpl(request);
      if (!isCacheableResponse(response) || !isExactResponseForRequest(response, request)) {
        throw new Error(`Precache response is not public and immutable: ${request.url}`);
      }
      return { request, response };
    }),
  );

  await Promise.all(
    validatedResponses.map(({ request, response }) => cache.put(request, response)),
  );
}

if (typeof self !== 'undefined') {
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) => precacheBuildAssets(PRECACHE_URLS, self.location.origin, cache)),
    );
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
    const isBuildOwnedRequest = isExactBuildOwnedRequest(
      requestUrl.pathname,
      requestUrl.search,
    );
    const isSafeNavigation =
      event.request.mode === 'navigate' && isSafeNavigationPath(requestUrl.pathname);
    if (!isBuildOwnedRequest && !isSafeNavigation) return;

    const networkRequest = isBuildOwnedRequest
      ? createPublicBuildRequest(event.request)
      : event.request;

    event.respondWith(
      fetch(networkRequest)
        .then((response) => {
          // Only exact build-manifest paths may be written. Extensionless navigation
          // requests are handled for offline fallback but are never added to the cache.
          if (
            isBuildOwnedRequest &&
            isCacheableResponse(response) &&
            isExactResponseForRequest(response, networkRequest)
          ) {
            const responseClone = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(networkRequest, responseClone)),
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
    isExactBuildOwnedRequest,
    createPrecacheRequests,
    createPublicBuildRequest,
    getCachedNavigationPath,
    isPublicAppPath,
    isSafeNavigationPath,
    isSameOriginRequest,
    isExactResponseForRequest,
    precacheBuildAssets,
    validatePrecacheUrls,
  };
}
