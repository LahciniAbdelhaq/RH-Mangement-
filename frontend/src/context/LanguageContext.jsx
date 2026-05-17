import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'fr');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prevLang => prevLang === 'fr' ? 'en' : 'fr');
  };

  const t = (text) => {
    if (lang === 'fr') return text;
    return (translations.en && translations.en[text]) || text;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
