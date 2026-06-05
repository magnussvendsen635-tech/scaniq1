import { NavLink, useNavigate } from "react-router-dom";
import { Home, LayoutDashboard, BarChart3, User, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";

const items: { to: string; key: TKey; Icon: any }[] = [
  { to: "/", key: "nav.home", Icon: Home },
  { to: "/diary", key: "nav.diary", Icon: LayoutDashboard },
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
      {/* Glassmorphism container */}
      <div
        className="relative rounded-full px-2 py-2 flex items-center justify-between
                   bg-card/70 backdrop-blur-2xl border border-foreground/10
                   shadow-[0_12px_40px_-12px_hsl(var(--foreground)/0.35),inset_0_1px_0_0_hsl(0_0%_100%/0.18)]"
      >
        {/* Subtle top highlight for premium glass feel */}
        <div className="pointer-events-none absolute inset-x-6 top-px h-px rounded-full bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />

        {left.map(({ to, key, Icon }) => (
          <TabItem key={to} to={to} label={t(key)} Icon={Icon} end={to === "/"} />
        ))}

        {/* Center scan button — premium gradient + halo */}
        <button
          aria-label="Scan food"
          onClick={() => nav("/scan?auto=1")}
          className="k-tap group relative -mt-10 w-16 h-16 rounded-full
                     bg-gradient-primary border-2 border-background/80
                     flex items-center justify-center
                     shadow-[0_10px_28px_-6px_hsl(var(--primary)/0.65),inset_0_1px_0_0_hsl(0_0%_100%/0.35)]
                     active:scale-95 transition-transform"
        >
          {/* Outer halo */}
          <span className="absolute inset-0 rounded-full bg-primary/45 blur-2xl -z-10 group-active:opacity-75" />
          {/* Inner glossy highlight */}
          <span className="pointer-events-none absolute inset-x-2 top-1.5 h-3 rounded-full bg-white/35 blur-[2px]" />
          <ScanLine className="w-7 h-7 text-primary-foreground relative" strokeWidth={2.6} />
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
