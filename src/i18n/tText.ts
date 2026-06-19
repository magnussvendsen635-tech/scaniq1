import { useKStore } from "@/store/useKStore";
import { getCachedTranslation, requestTranslation } from "./runtimeFallback";

// Translate an arbitrary English string outside of React (for toasts, alerts,
// imperative messages). Reads the user's selected language from the store,
// returns a cached translation if available, otherwise schedules a runtime
// fetch and returns the English source. Subsequent calls (e.g. on the next
// render) will pick up the cached translation.
export function tText(source: string): string {
  if (!source) return source;
  const language = useKStore.getState().language || "en";
  if (language.split("-")[0] === "en") return source;
  const cached = getCachedTranslation(language, source);
  if (cached) return cached;
  requestTranslation(language, source);
  return source;
}
