import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, Users, Utensils, Dumbbell, Scale, Crown, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_EMAILS = ["magnussvendsen635@gmail.com"];

interface Stats {
  counts: { users: number; meals: number; workouts: number; weights: number; subscriptions: number };
  users: { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[];
}

export default function Admin() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowed =
    (user?.email && ADMIN_EMAILS.includes(user.email)) ||
    (typeof window !== "undefined" && window.localStorage.getItem("scaniq_admin") === "1");

  useEffect(() => {
    if (!allowed) return;
    supabase.functions
      .invoke("admin-stats")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setStats(data as Stats);
      })
      .catch((e) => setError(String(e)));
  }, [allowed]);

  if (!allowed) {
    return (
      <div className="k-page">
        <h1 className="text-2xl font-semibold mb-2">Adgang nægtet</h1>
        <p className="text-sm text-muted-foreground">Du har ikke adgang til admin-panelet.</p>
      </div>
    );
  }

  return (
    <div className="k-page pb-32">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      </header>

      {error && <div className="k-card p-4 mb-4 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard Icon={Users} label="Users" value={stats?.counts.users} />
        <StatCard Icon={Utensils} label="Meals" value={stats?.counts.meals} />
        <StatCard Icon={Dumbbell} label="Workouts" value={stats?.counts.workouts} />
        <StatCard Icon={Scale} label="Weights" value={stats?.counts.weights} />
        <StatCard Icon={Crown} label="Subscriptions" value={stats?.counts.subscriptions} />
      </div>

      <a
        href="https://supabase.com/dashboard/project/uqnwhypjrisbfkouwcge/editor"
        target="_blank"
        rel="noopener noreferrer"
        className="k-card k-tap p-4 mb-5 flex items-center gap-4"
      >
        <div className="w-11 h-11 rounded-2xl bg-gradient-soft flex items-center justify-center">
          <Database className="w-5 h-5 text-primary-glow" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Open database editor</div>
          <div className="text-xs text-muted-foreground">Full table & SQL access</div>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      </a>

      <div className="k-card overflow-hidden">
        <div className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border/60">
          Users ({stats?.users.length ?? 0})
        </div>
        <div className="divide-y divide-border/60 max-h-[60vh] overflow-y-auto">
          {stats?.users.map((u) => (
            <div key={u.id} className="px-4 py-3">
              <div className="text-sm font-medium truncate">{u.email ?? u.id}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Joined {new Date(u.created_at).toLocaleDateString()}
                {u.last_sign_in_at && ` · Last seen ${new Date(u.last_sign_in_at).toLocaleDateString()}`}
              </div>
            </div>
          ))}
          {!stats && !error && <div className="px-4 py-6 text-sm text-muted-foreground">Indlæser…</div>}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ Icon, label, value }: { Icon: any; label: string; value?: number }) => (
  <div className="k-card p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 rounded-xl bg-gradient-soft flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary-glow" />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <div className="text-2xl font-semibold">{value ?? "—"}</div>
  </div>
);
