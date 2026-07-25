import assert from 'node:assert/strict';
import test from 'node:test';
import { injectPrecacheUrls, selectPrecacheUrls } from './web-build-manifest.mjs';

test('selects route HTML, bundled assets, manifest, icons, and sanitized public data', () => {
  const urls = selectPrecacheUrls([
    'index.html',
    'home\\bulletin.html',
    'home\\events.html',
    'home\\give.html',
    'home\\prayer.html',
    '_expo/static/js/web/entry.js',
    '_expo/static/js/web/entry.js.map',
    'assets/fonts/NotoSans-Regular.ttf',
    'assets/images/youtube_art.png',
    'manifest.json',
    'icon-192x192.png',
    'favicon.ico',
    'data/latest-activity.json',
    'deploy-web.js',
    'robots.txt',
  ]);
  assert.deepEqual(urls, [
    '/sda-church-app/',
    '/sda-church-app/_expo/static/js/web/entry.js',
    '/sda-church-app/assets/fonts/NotoSans-Regular.ttf',
    '/sda-church-app/assets/images/youtube_art.png',
    '/sda-church-app/data/latest-activity.json',
    '/sda-church-app/favicon.ico',
    '/sda-church-app/home/bulletin.html',
    '/sda-church-app/home/events.html',
    '/sda-church-app/home/give.html',
    '/sda-church-app/home/prayer.html',
    '/sda-church-app/icon-192x192.png',
    '/sda-church-app/index.html',
    '/sda-church-app/manifest.json',
  ]);
});

test('injects exactly one generated manifest into a worker', () => {
  const source = 'const PRECACHE_URLS = [];\nconst value = 1;\n';
  const output = injectPrecacheUrls(source, ['/sda-church-app/']);
  assert.match(output, /const PRECACHE_URLS = \[\n  "\/sda-church-app\/"\n\];/);
  assert.throws(() => injectPrecacheUrls('const value = 1;', []), /exactly one/);
});
