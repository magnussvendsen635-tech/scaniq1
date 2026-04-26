import { NavLink } from "react-router-dom";
import { Home, Utensils, Dumbbell, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";

const items: { to: string; key: TKey; Icon: any }[] = [
  { to: "/", key: "nav.home", Icon: Home },
  { to: "/diary", key: "nav.diary", Icon: Utensils },
  { to: "/workouts", key: "nav.workouts", Icon: Dumbbell },
  { to: "/progress", key: "nav.progress", Icon: BarChart3 },
  { to: "/profile", key: "nav.profile", Icon: User },
];

export const TabBar = () => {
  const t = useT();
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(420px,92%)]">
      <div className="k-card !rounded-full backdrop-blur-xl bg-card/85 border-border/70 px-2 py-2 flex items-center justify-between">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full transition-all duration-300",
                isActive ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <Icon className="w-5 h-5" strokeWidth={2.2} />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
