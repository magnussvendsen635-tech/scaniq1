import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useT } from "@/i18n/useT";

export default function BonusTerms() {
  const t = useT();
  return (
    <div className="k-page">
      <header className="flex items-center gap-3 mb-6">
        <Link to="/profile" className="k-tap w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("bonus.title")}</h1>
      </header>

      <div className="k-card p-5 space-y-3 text-sm leading-relaxed">
        <p className="font-semibold">{t("bonus.heading")}</p>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>{t("bonus.b1")}</li>
          <li>{t("bonus.b2")}</li>
          <li>{t("bonus.b3")}</li>
          <li>{t("bonus.b4")}</li>
        </ul>
      </div>
    </div>
  );
}
