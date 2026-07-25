import type { SupportedLanguage } from './LocaleRegistry';

export function resolveHtmlLanguageTag(language: unknown): string;
export function applyHtmlLanguage(
  documentElement: { lang: string } | null | undefined,
  language: SupportedLanguage,
): string;
