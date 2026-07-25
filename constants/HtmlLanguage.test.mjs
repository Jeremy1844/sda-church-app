import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { applyHtmlLanguage, resolveHtmlLanguageTag } from './HtmlLanguage.mjs';

test('maps supported app languages to explicit HTML language and script tags', () => {
  assert.equal(resolveHtmlLanguageTag('en'), 'en');
  assert.equal(resolveHtmlLanguageTag('es'), 'es');
  assert.equal(resolveHtmlLanguageTag('zh'), 'zh-Hant');
  assert.equal(resolveHtmlLanguageTag('zh-cn'), 'zh-Hans');
  assert.equal(resolveHtmlLanguageTag('unsupported'), 'en');
});

test('updates the web document language when the app language changes', () => {
  const documentElement = { lang: 'en' };
  assert.equal(applyHtmlLanguage(documentElement, 'zh'), 'zh-Hant');
  assert.equal(documentElement.lang, 'zh-Hant');
  assert.equal(applyHtmlLanguage(documentElement, 'es'), 'es');
  assert.equal(documentElement.lang, 'es');

  const layoutSource = fs.readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  assert.match(
    layoutSource,
    /applyHtmlLanguage\(document\.documentElement, language\)/,
  );
});
