import React, { createContext, useContext } from 'react';
import type { SupportedLanguage } from '../types/auth';
import { translations, type Translations } from '../utils/i18n';
import { locale, setLocale } from '../i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  /** Tilni o'zgartiradi (sahifa qayta yuklanadi) */
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const value: LanguageContextType = { language: locale, setLanguage: setLocale, t: translations[locale] };

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
