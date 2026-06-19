// Runtime translation fallback. When a translation key is missing for the
// user's selected language, we fetch the English source string from the
// translate-text edge function, cache it in localStorage, and notify
// subscribed React hooks so the UI re-renders with the translated value.

import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

const memoryCache = new Map<string, string>(); // `${lang}::${enSource}` -> translated
const inFlight = new Set<string>();
const pendingByLang = new Map<string, Set<string>>(); // lang -> set of english sources
const flushTimers = new Map<string, number>();
const listeners = new Set<Listener>();

const STORAGE_PREFIX = "rt-i18n:";

function storageKey(lang: string, source: string): string {
  // hash the source so keys stay short
  let h = 5381;
  for (let i = 0; i < source.length; i++) h = ((h << 5) + h) ^ source.charCodeAt(i);
  return `${STORAGE_PREFIX}${lang}:${(h >>> 0).toString(36)}`;
}

function cacheKey(lang: string, source: string): string {
  return `${lang}::${source}`;
}

export function getCachedTranslation(lang: string, source: string): string | undefined {
  const k = cacheKey(lang, source);
  const mem = memoryCache.get(k);
  if (mem !== undefined) return mem;
  try {
    const stored = localStorage.getItem(storageKey(lang, source));
    if (stored) {
      memoryCache.set(k, stored);
      return stored;
    }
  } catch { /* ignore */ }
  return undefined;
}

function notify() {
  listeners.forEach((l) => {
    try { l(); } catch { /* ignore */ }
  });
}

function scheduleFlush(lang: string) {
  if (flushTimers.has(lang)) return;
  const id = window.setTimeout(() => {
    flushTimers.delete(lang);
    void flush(lang);
  }, 120);
  flushTimers.set(lang, id);
}

async function flush(lang: string) {
  const pending = pendingByLang.get(lang);
  if (!pending || pending.size === 0) return;
  const batch = Array.from(pending).slice(0, 50);
  batch.forEach((s) => {
    pending.delete(s);
    inFlight.add(cacheKey(lang, s));
  });
  if (pending.size > 0) scheduleFlush(lang);

  try {
    const { data, error } = await supabase.functions.invoke("translate-text", {
      body: { texts: batch, language: lang },
    });
    if (error) throw error;
    const translations: string[] = Array.isArray(data?.translations) && data.translations.length === batch.length
      ? data.translations
      : batch;
    batch.forEach((src, i) => {
      const value = translations[i] || src;
      const k = cacheKey(lang, src);
      memoryCache.set(k, value);
      inFlight.delete(k);
      try { localStorage.setItem(storageKey(lang, src), value); } catch { /* quota */ }
    });
    notify();
  } catch {
    batch.forEach((src) => inFlight.delete(cacheKey(lang, src)));
  }
}

export function requestTranslation(lang: string, source: string): void {
  if (!source) return;
  if (lang.split("-")[0] === "en") return;
  const k = cacheKey(lang, source);
  if (memoryCache.has(k) || inFlight.has(k)) return;
  let pending = pendingByLang.get(lang);
  if (!pending) {
    pending = new Set();
    pendingByLang.set(lang, pending);
  }
  if (pending.has(source)) return;
  pending.add(source);
  scheduleFlush(lang);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
