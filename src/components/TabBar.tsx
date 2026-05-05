import { NavLink, useNavigate } from "react-router-dom";
import { Home, Utensils, BarChart3, User, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";

const items: { to: string; key: TKey; Icon: any }[] = [
  { to: "/", key: "nav.home", Icon: Home },
  { to: "/diary", key: "nav.diary", Icon: Utensils },
  { to: "/progress", key: "nav.progress", Icon: BarChart3 },
  { to: "/profile", key: "nav.profile", Icon: User },
];

export const TabBar = () => {
  const t = useT();
  const nav = useNavigate();
  const left = items.slice(0, 2);
  const right = items.slice(2);

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(420px,92%)]">
      <div className="relative rounded-full backdrop-blur-xl bg-card/95 border-[3px] border-foreground px-2 py-2 flex items-center justify-between">
        {left.map(({ to, key, Icon }) => (
          <TabItem key={to} to={to} label={t(key)} Icon={Icon} end={to === "/"} />
        ))}

        {/* Center scan button — primary action */}
        <button
          aria-label="Scan food"
          onClick={() => nav("/scan?auto=1")}
          className="k-tap relative -mt-10 w-16 h-16 rounded-full bg-gradient-primary border-[3px] border-foreground flex items-center justify-center shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.6)] active:scale-95 transition-transform"
        >
          <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl -z-10" />
          <ScanLine className="w-7 h-7 text-primary-foreground" strokeWidth={2.6} />
        </button>

        {right.map(({ to, key, Icon }) => (
          <TabItem key={to} to={to} label={t(key)} Icon={Icon} end={false} />
        ))}
      </div>
    </nav>
  );
};

const TabItem = ({ to, label, Icon, end }: { to: string; label: string; Icon: any; end: boolean }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      cn(
        "flex-1 flex items-center justify-center gap-2 h-11 px-2 rounded-full transition-all duration-300 leading-none",
        isActive ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )
    }
  >
    {({ isActive }) =>
      isActive ? (
        <span className="text-xs font-semibold tracking-wide whitespace-nowrap">{label}</span>
      ) : (
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      )
    }
  </NavLink>
);
