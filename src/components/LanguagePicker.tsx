import { useMemo, useState } from "react";
import { LANGUAGES } from "@/data/languages";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export function LanguagePicker({ value, onChange, className }: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(s) ||
        l.native.toLowerCase().includes(s) ||
        l.code.toLowerCase().includes(s)
    );
  }, [q]);

  return (
    <div className={cn("k-card overflow-hidden flex flex-col", className)}>
      <div className="p-3 border-b border-border/60 flex items-center gap-2 bg-surface-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search language…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      <div className="overflow-y-auto divide-y divide-border/60 max-h-[55vh]">
        {filtered.map((l) => {
          const active = l.code === value;
          return (
            <button
              key={l.code}
              onClick={() => onChange(l.code)}
              className={cn(
                "w-full px-4 py-3 flex items-center gap-3 text-left k-tap hover:bg-surface-2 transition-colors",
                active && "bg-surface-2"
              )}
            >
              <span className="text-2xl leading-none">{l.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{l.native}</div>
                <div className="text-xs text-muted-foreground truncate">{l.name}</div>
              </div>
              {active && <Check className="w-5 h-5 text-primary" />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">{t("lang.none_found")}</div>
        )}
      </div>
    </div>
  );
}
