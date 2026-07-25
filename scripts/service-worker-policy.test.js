const assert = require('node:assert/strict');
const test = require('node:test');
const {
  isOwnedCacheName,
  isCacheablePath,
  isCacheableResponse,
  getCachedNavigationPath,
  isSafeNavigationPath,
  isSameOriginRequest,
} = require('../public/sw');

test('service worker owns only its versioned cache namespace', () => {
  assert.equal(isOwnedCacheName('sda-church-v0.22.0'), true);
  assert.equal(isOwnedCacheName('sda-church-v0.23.0'), true);
  assert.equal(isOwnedCacheName('another-app-v1'), false);
  assert.equal(isOwnedCacheName('sda-church-assets'), false);
});

function response({ ok = true, type = 'basic', cacheControl = '' } = {}) {
  return {
    ok,
    type,
    headers: new Headers({ 'cache-control': cacheControl }),
  };
}

test('service-worker cache is limited to same-origin public requests', () => {
  const buildOwnedPaths = [
    '/sda-church-app/',
    '/sda-church-app/data/latest-activity.json',
    '/sda-church-app/_expo/static/js/web/entry.js',
    '/sda-church-app/assets/assets/fonts/app.ttf',
    '/sda-church-app/home/give.html',
    // Even a generated file fails closed when it belongs to a sensitive path family.
    '/sda-church-app/admin/public.html',
    '/sda-church-app/payment/receipt.html',
    '/sda-church-app/roster/public.html',
  ];
  assert.equal(isSameOriginRequest('https://example.test/app.js', 'https://example.test'), true);
  assert.equal(isSameOriginRequest('https://bible.example/api.json', 'https://example.test'), false);
  assert.equal(isCacheablePath('/sda-church-app/', buildOwnedPaths), true);
  assert.equal(isCacheablePath('/sda-church-app/data/latest-activity.json', buildOwnedPaths), true);
  assert.equal(isCacheablePath('/sda-church-app/_expo/static/js/web/entry.js', buildOwnedPaths), true);
  assert.equal(isCacheablePath('/sda-church-app/assets/assets/fonts/app.ttf', buildOwnedPaths), true);
  assert.equal(isCacheablePath('/sda-church-app/home/give.html', buildOwnedPaths), true);
  assert.equal(isCacheablePath('/api/private', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/sda-church-app/api/private', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/prayer', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/sda-church-app/prayer/request', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/oauth/callback', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/sda-church-app/schedule/publication', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/sda-church-app/admin/public.html', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/sda-church-app/payment/receipt.html', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/sda-church-app/roster/public.html', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/sda-church-app/data/unknown.json', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/sda-church-app/admin%2Fpublic.html', buildOwnedPaths), false);
  assert.equal(isCacheablePath('/another-app/index.html', buildOwnedPaths), false);
  // Navigation aliases are deliberately not cache-write targets.
  assert.equal(isCacheablePath('/sda-church-app/home/give', buildOwnedPaths), false);
});

test('safe extensionless navigations resolve only to cached public route documents', () => {
  const buildOwnedPaths = [
    '/sda-church-app/',
    '/sda-church-app/index.html',
    '/sda-church-app/home/give.html',
    '/sda-church-app/community/prayer.html',
    // A generated path in a sensitive family must still fail closed.
    '/sda-church-app/admin/public.html',
  ];

  assert.equal(
    getCachedNavigationPath('/sda-church-app/home/give', buildOwnedPaths),
    '/sda-church-app/home/give.html',
  );
  assert.equal(
    getCachedNavigationPath('/sda-church-app/home/give/', buildOwnedPaths),
    '/sda-church-app/home/give.html',
  );
  assert.equal(
    getCachedNavigationPath('/sda-church-app/community/prayer', buildOwnedPaths),
    '/sda-church-app/community/prayer.html',
  );
  assert.equal(
    getCachedNavigationPath('/sda-church-app/', buildOwnedPaths),
    '/sda-church-app/',
  );

  assert.equal(isSafeNavigationPath('/sda-church-app/home/give', buildOwnedPaths), true);
  assert.equal(isSafeNavigationPath('/sda-church-app/home/unknown', buildOwnedPaths), false);
  assert.equal(isSafeNavigationPath('/sda-church-app/admin/public', buildOwnedPaths), false);
  assert.equal(isSafeNavigationPath('/sda-church-app/home%2Fgive', buildOwnedPaths), false);
  assert.equal(isSafeNavigationPath('/another-app/home/give', buildOwnedPaths), false);
});

test('service-worker cache respects response privacy directives', () => {
  assert.equal(isCacheableResponse(response()), true);
  assert.equal(isCacheableResponse(response({ ok: false })), false);
  assert.equal(isCacheableResponse(response({ type: 'opaque' })), false);
  assert.equal(isCacheableResponse(response({ cacheControl: 'private, max-age=60' })), false);
  assert.equal(isCacheableResponse(response({ cacheControl: 'no-store' })), false);
});
