import { useEffect, useState } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { useT } from "@/i18n/useT";

type Task = { id: string; text: string; done: boolean };

const storageKey = (day: string) => `scaniq:tasks:${day}`;

export function DailyTasks({ day }: { day: string }) {
  const t = useT();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(day));
      setTasks(raw ? JSON.parse(raw) : []);
    } catch {
      setTasks([]);
    }
  }, [day]);

  const persist = (next: Task[]) => {
    setTasks(next);
    try { localStorage.setItem(storageKey(day), JSON.stringify(next)); } catch {}
  };

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    persist([...tasks, { id: crypto.randomUUID(), text, done: false }]);
    setDraft("");
  };

  const toggle = (id: string) =>
    persist(tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const remove = (id: string) => persist(tasks.filter((x) => x.id !== id));

  return (
    <div className="k-card p-4 mb-4">
      <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">
        {t("tasks.title")}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("tasks.placeholder")}
          className="flex-1 h-11 px-3 rounded-2xl bg-card border border-border/60 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={add}
          aria-label={t("common.add")}
          className="k-tap w-11 h-11 rounded-2xl bg-gradient-to-r from-[#F59E5B] to-[#EA6A1F] flex items-center justify-center text-white shadow-[0_6px_18px_-4px_rgba(245,158,91,0.65)]"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
      {tasks.length === 0 ? (
        <div className="text-xs text-muted-foreground py-2">{t("tasks.empty")}</div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 group">
              <button
                onClick={() => toggle(task.id)}
                className={`k-tap w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  task.done
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
                aria-pressed={task.done}
              >
                {task.done && <Check className="w-4 h-4" strokeWidth={3} />}
              </button>
              <span
                className={`flex-1 text-sm ${
                  task.done ? "line-through text-muted-foreground" : ""
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => remove(task.id)}
                className="k-tap w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
