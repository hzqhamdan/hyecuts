import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ms from './locales/ms.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ms: { translation: ms }
    },
    fallbackLng: 'en',
    // The language toggles compare i18n.language with 'en'. Without this, an
    // en-US or en-GB browser keeps its full tag as the language: the page is in
    // English but the toggle shows the Malaysian flag, and the first click
    // "switches" to English.
    supportedLngs: ['en', 'ms'],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
