import React, { createContext, useContext, useState } from "react";
import { dictionaries } from "@/lib/dictionaries";

type Language = "vi" | "en";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Ngôn ngữ đã chọn lưu trong cookie "lang"
  const [language, setLanguageState] = useState<Language>(() => {
    const match = document.cookie.match(/(^| )lang=([^;]+)/);
    return match?.[2] === "en" ? "en" : "vi";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.cookie = `lang=${lang}; path=/; max-age=31536000`; // 1 năm
    document.documentElement.lang = lang;
  };

  const t = (key: string, replacements?: Record<string, string | number>) => {
    const dict = dictionaries[language];
    let text = (dict as any)[key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
