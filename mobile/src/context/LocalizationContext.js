import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_LANGUAGE, translations } from "../localization/translations";

const STORAGE_KEY = "etax_language";

export const LocalizationContext = createContext(null);

export function LocalizationProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && translations[stored]) {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = useCallback((lang) => {
    if (!translations[lang]) return;
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key) => translations[language]?.[key] || translations[DEFAULT_LANGUAGE][key] || key,
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}
