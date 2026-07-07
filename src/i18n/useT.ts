import { useSyncExternalStore } from "react";
import { useKStore } from "@/store/useKStore";
import { translate, hasNativeTranslation, englishSource, type TKey } from "./translations";
import { getCachedTranslation, requestTranslation, subscribe, getVersion } from "./runtimeFallback";

// Snapshot returns a version counter that bumps whenever a runtime translation
// arrives, so React re-renders subscribed components.
const getSnapshot = () => getVersion();
const subscribeStore = (cb: () => void) => subscribe(cb);


export function useT() {
  const language = useKStore((s) => s.language) || "en";
  // Subscribe to runtime translation updates so the component re-renders
  // when an async fallback translation arrives.
  useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);

  return (key: TKey) => {
    if (hasNativeTranslation(language, key)) return translate(language, key);
    const base = language.split("-")[0];
    if (base === "en") return translate(language, key);
    const source = englishSource(key);
    const cached = getCachedTranslation(language, source);
    if (cached) return cached;
    requestTranslation(language, source);
    return source;
  };
}

// Translate an arbitrary English string at runtime (for strings not in the
// static dictionary). Returns the source string until the translation arrives.
export function useTText() {
  const language = useKStore((s) => s.language) || "en";
  useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);
  return (source: string) => {
    if (!source) return source;
    const base = language.split("-")[0];
    if (base === "en") return source;
    const cached = getCachedTranslation(language, source);
    if (cached) return cached;
    requestTranslation(language, source);
    return source;
  };
}
