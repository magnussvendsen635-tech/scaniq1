import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useKStore } from "@/store/useKStore";

// Translates an array of English source strings into the user's selected language.
// Results are cached in localStorage so we only hit the AI gateway once per
// (language × content) combination. Returns the source strings while loading
// or when the target language is English.
export function useAutoTranslate(texts: string[]): { translations: string[]; loading: boolean } {
  const language = useKStore((s) => s.language) || "en";
  const baseLang = language.split("-")[0];

  // Stable cache key based on language and content.
  const cacheKey = useMemo(() => {
    const joined = texts.join("\u0001");
    let h = 5381;
    for (let i = 0; i < joined.length; i++) h = ((h << 5) + h) ^ joined.charCodeAt(i);
    return `at:${language}:${(h >>> 0).toString(36)}:${texts.length}`;
  }, [language, texts]);

  const [state, setState] = useState<{ translations: string[]; loading: boolean }>(() => {
    if (baseLang === "en") return { translations: texts, loading: false };
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === texts.length) {
          return { translations: parsed, loading: false };
        }
      }
    } catch { /* ignore */ }
    return { translations: texts, loading: true };
  });

  useEffect(() => {
    if (baseLang === "en") {
      setState({ translations: texts, loading: false });
      return;
    }
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === texts.length) {
          setState({ translations: parsed, loading: false });
          return;
        }
      }
    } catch { /* ignore */ }

    let cancelled = false;
    setState({ translations: texts, loading: true });
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("translate-text", {
          body: { texts, language },
        });
        if (cancelled) return;
        if (error) throw error;
        const out: string[] = Array.isArray(data?.translations) && data.translations.length === texts.length
          ? data.translations
          : texts;
        try { localStorage.setItem(cacheKey, JSON.stringify(out)); } catch { /* quota */ }
        setState({ translations: out, loading: false });
      } catch {
        if (!cancelled) setState({ translations: texts, loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, [cacheKey, baseLang, language]);

  return state;
}
