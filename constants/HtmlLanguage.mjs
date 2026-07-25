const HTML_LANGUAGE_TAGS = Object.freeze({
  en: 'en',
  es: 'es',
  zh: 'zh-Hant',
  'zh-cn': 'zh-Hans',
});

export function resolveHtmlLanguageTag(language) {
  return HTML_LANGUAGE_TAGS[language] || HTML_LANGUAGE_TAGS.en;
}

export function applyHtmlLanguage(documentElement, language) {
  const languageTag = resolveHtmlLanguageTag(language);
  if (documentElement && typeof documentElement === 'object') {
    documentElement.lang = languageTag;
  }
  return languageTag;
}
