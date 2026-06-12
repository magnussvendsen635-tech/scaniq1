import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { useT } from "@/i18n/useT";

const KEY = "scaniq_cookie_consent_v1";

export function CookieConsent() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        const timer = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const close = (value: "accepted" | "essential") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 pointer-events-none">
      <div
        role="dialog"
        aria-label={t("cookie.title")}
        className="pointer-events-auto mx-auto w-[min(560px,100%)] rounded-3xl border border-border/60 bg-card/95 backdrop-blur-xl p-4 shadow-[0_20px_60px_-20px_hsl(var(--foreground)/0.5)]"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-soft flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-primary-glow" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm leading-snug">{t("cookie.title")}</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t("cookie.body_pre")}{" "}
              <Link to="/privacy" className="text-primary-glow underline">
                {t("cookie.body_link")}
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => close("accepted")}
                className="k-tap px-4 h-9 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-glow"
              >
                {t("cookie.accept_all")}
              </button>
              <button
                onClick={() => close("essential")}
                className="k-tap px-4 h-9 rounded-full bg-surface-2 text-foreground text-xs font-medium border border-border/60"
              >
                {t("cookie.essential")}
              </button>
            </div>
          </div>
          <button
            onClick={() => close("essential")}
            className="k-tap w-8 h-8 rounded-full hover:bg-surface-2 flex items-center justify-center shrink-0"
            aria-label={t("cookie.close")}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
