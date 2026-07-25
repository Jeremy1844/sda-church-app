import registrySource from './locales.json';

export type SupportedLanguage = 'en' | 'zh' | 'zh-cn' | 'es';
export const DEFAULT_LANG: SupportedLanguage = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'zh', 'zh-cn', 'es'] as const;

type LocaleInput = {
  languageCode?: string | null;
  languageTag?: string | null;
  scriptCode?: string | null;
};

export const LOCALE_REGISTRY = registrySource;

export const isSupportedLanguage = (value: unknown): value is SupportedLanguage =>
  typeof value === 'string' &&
  (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

export function resolveSupportedLanguage(locale?: LocaleInput | null): SupportedLanguage {
  if (!locale?.languageCode) return DEFAULT_LANG;

  const languageCode = locale.languageCode.toLowerCase();
  if (languageCode === 'zh') {
    const languageTag = locale.languageTag ?? '';
    const simplified =
      locale.scriptCode === 'Hans' || /(?:^|[-_])(hans|cn|sg|my)(?:$|[-_])/i.test(languageTag);
    return simplified ? 'zh-cn' : 'zh';
  }

  return isSupportedLanguage(languageCode) ? languageCode : DEFAULT_LANG;
}
