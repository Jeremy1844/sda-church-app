const assert = require('node:assert/strict');
const test = require('node:test');
const {
  isOwnedCacheName,
  isCacheablePath,
  isCacheableResponse,
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
  assert.equal(isSameOriginRequest('https://example.test/app.js', 'https://example.test'), true);
  assert.equal(isSameOriginRequest('https://bible.example/api.json', 'https://example.test'), false);
  assert.equal(isCacheablePath('/sda-church-app/data/latest-activity.json'), true);
  assert.equal(isCacheablePath('/api/private'), false);
  assert.equal(isCacheablePath('/sda-church-app/api/private'), false);
  assert.equal(isCacheablePath('/prayer'), false);
  assert.equal(isCacheablePath('/sda-church-app/prayer/request'), false);
  assert.equal(isCacheablePath('/oauth/callback'), false);
  assert.equal(isCacheablePath('/sda-church-app/schedule/publication'), false);
  assert.equal(isCacheablePath('/another-app/api/public.json'), true);
});

test('service-worker cache respects response privacy directives', () => {
  assert.equal(isCacheableResponse(response()), true);
  assert.equal(isCacheableResponse(response({ ok: false })), false);
  assert.equal(isCacheableResponse(response({ type: 'opaque' })), false);
  assert.equal(isCacheableResponse(response({ cacheControl: 'private, max-age=60' })), false);
  assert.equal(isCacheableResponse(response({ cacheControl: 'no-store' })), false);
});
