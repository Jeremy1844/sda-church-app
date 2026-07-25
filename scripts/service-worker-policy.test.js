const assert = require('node:assert/strict');
const test = require('node:test');
const {
  isCacheablePath,
  isCacheableResponse,
  isSameOriginRequest,
} = require('../public/sw');

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
  assert.equal(isCacheablePath('/prayer'), false);
  assert.equal(isCacheablePath('/oauth/callback'), false);
});

test('service-worker cache respects response privacy directives', () => {
  assert.equal(isCacheableResponse(response()), true);
  assert.equal(isCacheableResponse(response({ ok: false })), false);
  assert.equal(isCacheableResponse(response({ type: 'opaque' })), false);
  assert.equal(isCacheableResponse(response({ cacheControl: 'private, max-age=60' })), false);
  assert.equal(isCacheableResponse(response({ cacheControl: 'no-store' })), false);
});
