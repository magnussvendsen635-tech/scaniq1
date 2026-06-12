import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChefHat, Sparkles } from "lucide-react";
import { useT } from "@/i18n/useT";

export default function Recipes() {
  const nav = useNavigate();
  const t = useT();
  return (
    <div className="k-page pb-32">
      <header className="flex items-center gap-3 mb-8">
        <button
          onClick={() => nav(-1)}
          className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t("recipes.title")}</h1>
      </header>

      <div className="k-card p-8 bg-gradient-surface relative overflow-hidden text-center">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-primary opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary-glow/15 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow mb-6">
            <ChefHat className="w-10 h-10 text-primary-foreground" strokeWidth={2.2} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border/60 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              {t("recipes.coming_chip")}
            </span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            {t("recipes.heading")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            {t("recipes.body")}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-4 italic">
            {t("recipes.future")}
          </p>
        </div>
      </div>
    </div>
  );
}
