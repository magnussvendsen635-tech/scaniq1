import { Link } from "react-router-dom";
import { useKStore } from "@/store/useKStore";
import { Bell, BellOff, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/useT";

export const RemindersCard = () => {
  const { reminders } = useKStore();
  const t = useT();
  return (
    <Link
      to="/reminders"
      className="k-card k-tap p-5 mb-4 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${reminders.enabled ? "bg-gradient-primary shadow-glow" : "bg-surface-3"}`}>
        {reminders.enabled ? <Bell className="w-5 h-5 text-foreground" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{t("reminders.title")}</div>
        <div className="text-xs text-muted-foreground">
          {reminders.enabled ? t("reminders.sub_on") : t("reminders.sub_off")}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </Link>
  );
};
