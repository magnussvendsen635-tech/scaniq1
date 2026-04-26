import { useKStore } from "@/store/useKStore";
import { translate, type TKey } from "./translations";

export function useT() {
  const language = useKStore((s) => s.language);
  return (key: TKey) => translate(language, key);
}
