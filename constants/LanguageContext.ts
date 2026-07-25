import { createContext } from "react";
import {
  DEFAULT_LANG,
  SupportedLanguage,
} from './LocaleRegistry';

export { DEFAULT_LANG, SupportedLanguage } from './LocaleRegistry';

export const LanguageContext = createContext({
  language: DEFAULT_LANG as SupportedLanguage,
  setLanguage: (lang: SupportedLanguage) => {},
});
