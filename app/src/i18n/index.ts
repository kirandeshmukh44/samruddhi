// app/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import safeStorage from '../lib/storage';

import en from './en.json';
import hi from './hi.json';
import mr from './mr.json';

const LANGUAGE_KEY = 'bilu_language';

export const supportedLanguages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Load persisted language on startup.
export async function loadLanguage() {
  try {
    const saved = await safeStorage.getItem(LANGUAGE_KEY);
    if (saved && ['en', 'hi', 'mr'].includes(saved)) {
      await i18n.changeLanguage(saved);
    }
  } catch (e) {
    // ignore
  }
}

export async function setLanguage(code: string) {
  await i18n.changeLanguage(code);
  try {
    await safeStorage.setItem(LANGUAGE_KEY, code);
  } catch (e) {
    // ignore
  }
}

export default i18n;
