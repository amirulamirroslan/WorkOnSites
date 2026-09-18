"use client";

import { createContext, useContext, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { dictionaries, type Language, type TranslationKey } from "@/lib/i18n";

const I18nContext = createContext<{
  lang: Language;
  t: (key: TranslationKey) => string;
  setLang: (lang: Language) => void;
} | null>(null);

export function I18nProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Language>(initialLanguage);
  const supabase = createClient();

  function setLang(next: Language) {
    setLangState(next);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) supabase.from("profiles").update({ preferred_language: next }).eq("id", session.user.id);
    });
  }

  function t(key: TranslationKey) {
    return dictionaries[lang][key] ?? dictionaries.en[key];
  }

  return <I18nContext.Provider value={{ lang, t, setLang }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
