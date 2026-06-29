import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Utensils, Dumbbell, Crown, Ban, Trash2, ShieldOff,
  Search, ArrowUpDown, Wallet, Download, CheckCircle2, DollarSign, AlertTriangle,
  BarChart3, Eye, TrendingUp, Receipt,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  signup_ip: string | null;
  device_id: string | null;
  is_premium: boolean;
}
interface Stats {
  counts: {
    users: number; banned: number; meals: number; workouts: number; weights: number;
    subscriptions: number; active_subscribers: number; page_views_total: number;
  };
  users: AdminUser[];
  scans_daily: { date: string; count: number }[];
  views_daily: { date: string; count: number }[];
}
interface Payout {
  id: string; user_id: string; amount_cents: number; currency: string;
  status: "pending" | "approved" | "paid" | "rejected";
  paypal_transaction_id: string | null; payout_date: string | null;
  approved_at: string | null; paid_at: string | null; notes: string | null; created_at: string;
}

type SortKey = "created_at" | "signup_ip" | "device_id" | "email";
type Tab = "analytics" | "financials" | "users" | "payouts" | "audit";

interface Financials {
  revenue: {
    total_cents: number;
    currency: string;
    premium_count: number;
    basic_count: number;
    active_subscriptions: number;
  };
  transactions: {
    id: string; email: string; tier: string; amount_cents: number;
    currency: string; status: string; environment: string;
    discount_code_id: string | null; created_at: string;
  }[];
  redemptions: {
    id: string; code_text: string; email: string;
    amount_saved_cents: number; currency: string; created_at: string;
  }[];
  signups_daily: { date: string; count: number }[];
}

export default function Admin() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("analytics");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("created_at");
  const [busy, setBusy] = useState(false);
  const [payDialog, setPayDialog] = useState<{ open: boolean; payout?: Payout; txn: string }>({ open: false, txn: "" });


  useEffect(() => {
    if (!user) { setAllowed(false); return; }
    (async () => {
      const { data } = await supabase.rpc("has_role" as any, { _user_id: user.id, _role: "admin" });
      setAllowed(!!data);
    })();
  }, [user]);

  const loadStats = async () => {
    const { data, error } = await supabase.functions.invoke("admin-stats");
    if (error) setError(error.message);
    else setStats(data as Stats);
  };
  const loadPayouts = async () => {
    const { data, error } = await supabase.from("payouts").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message); else setPayouts((data as Payout[]) ?? []);
  };
  const loadFinancials = async () => {
    const { data, error } = await supabase.functions.invoke("admin-financials");
    if (error) setError(error.message);
    else setFinancials(data as Financials);
  };

  useEffect(() => {
    if (!allowed) return;
    loadStats(); loadPayouts(); loadFinancials();
  }, [allowed]);

  const userById = useMemo(() => {
    const m = new Map<string, AdminUser>();
    for (const u of stats?.users ?? []) m.set(u.id, u);
    return m;
  }, [stats]);

  const filteredUsers = useMemo(() => {
    let list = stats?.users ?? [];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((u) =>
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.signup_ip ?? "").includes(q) ||
        (u.device_id ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = (a[sort] ?? "") as string;
      const bv = (b[sort] ?? "") as string;
      if (sort === "created_at") return new Date(bv).getTime() - new Date(av).getTime();
      return av.localeCompare(bv);
    });
  }, [stats, query, sort]);

  const callAction = async (action: "ban" | "unban" | "delete" | "set_premium", user_id: string, extra: Record<string, any> = {}) => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("admin-user-action", {
        body: { action, user_id, ...extra },
      });
      if (error) throw error;
      const msg: Record<string, string> = {
        delete: "Bruger slettet", ban: "Bruger blokeret", unban: "Blokering ophævet", set_premium: "Pro-status opdateret",
      };
      toast.success(msg[action]);
      await loadStats();
    } catch (e: any) {
      toast.error(e?.message ?? "Handling fejlede");
    } finally { setBusy(false); }
  };

  const approvePayout = async (p: Payout) => {
    const { error } = await supabase.from("payouts")
      .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: user!.id })
      .eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Udbetaling godkendt"); loadPayouts(); }
  };
  const submitPaid = async () => {
    if (!payDialog.payout) return;
    if (!payDialog.txn.trim()) { toast.error("Indtast PayPal Transaction ID"); return; }
    const now = new Date().toISOString();
    const { error } = await supabase.from("payouts").update({
      status: "paid", paypal_transaction_id: payDialog.txn.trim(),
      payout_date: now, paid_at: now, paid_by: user!.id,
    }).eq("id", payDialog.payout.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Markeret som udbetalt");
    setPayDialog({ open: false, txn: "" });
    loadPayouts();
  };
  const rejectPayout = async (p: Payout) => {
    const { error } = await supabase.from("payouts").update({ status: "rejected" }).eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Afvist"); loadPayouts(); }
  };


  const exportPaidCsv = () => {
    const paid = payouts.filter((p) => p.status === "paid");
    const header = ["User Email", "Payout Date", "Amount", "Currency", "PayPal Transaction ID"];
    const rows = paid.map((p) => [
      userById.get(p.user_id)?.email ?? p.user_id,
      p.payout_date ?? "",
      (p.amount_cents / 100).toFixed(2),
      p.currency,
      p.paypal_transaction_id ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `payouts-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (allowed === null) return <div className="k-page">Indlæser…</div>;
  if (!allowed) {
    return (
      <div className="k-page">
        <h1 className="text-2xl font-semibold mb-2">Adgang nægtet</h1>
        <p className="text-sm text-muted-foreground">Du har ikke adgang til admin-panelet.</p>
      </div>
    );
  }

  const fmtMoney = (cents: number, cur: string) => `${(cents / 100).toFixed(2)} ${cur}`;
  const statusPill = (s: Payout["status"]) => {
    const map: Record<Payout["status"], string> = {
      pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/40",
      approved: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40",
      paid: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/40",
      rejected: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40",
    };
    return <span className={`text-[10px] uppercase tracking-widest border px-2 py-0.5 rounded-full ${map[s]}`}>{s}</span>;
  };

  return (
    <div className="k-page pb-32">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      </header>

      {error && <div className="k-card p-4 mb-4 text-sm text-destructive">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat Icon={Users} label="Brugere" value={stats?.counts.users} />
        <Stat Icon={Crown} label="Aktive abon." value={stats?.counts.active_subscribers} />
        <Stat Icon={Eye} label="Sidevisn." value={stats?.counts.page_views_total} />
        <Stat Icon={Ban} label="Blokeret" value={stats?.counts.banned} danger={(stats?.counts.banned ?? 0) > 0} />
        <Stat Icon={Utensils} label="Måltider" value={stats?.counts.meals} />
        <Stat Icon={Dumbbell} label="Workouts" value={stats?.counts.workouts} />
      </div>

      {/* Tabs */}
      <div className="k-card p-1 mb-4 grid grid-cols-5 gap-1">
        {(["analytics", "financials", "users", "payouts", "audit"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2 rounded-xl text-[9px] font-medium uppercase tracking-widest ${
              tab === t ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "analytics" ? "Analytics" : t === "financials" ? "$" : t === "users" ? "Brugere" : t === "payouts" ? "Udbetal." : "Audit"}
          </button>
        ))}
      </div>

      {/* FINANCIALS tab */}
      {tab === "financials" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="k-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
                <DollarSign className="w-3.5 h-3.5" /> Total revenue
              </div>
              <div className="text-2xl font-semibold mt-1">
                ${((financials?.revenue.total_cents ?? 0) / 100).toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Live transactions</div>
            </div>
            <div className="k-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
                <Crown className="w-3.5 h-3.5 text-primary-glow" /> Active subs
              </div>
              <div className="text-2xl font-semibold mt-1">{financials?.revenue.active_subscriptions ?? 0}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Premium: {financials?.revenue.premium_count ?? 0} · Basic: {financials?.revenue.basic_count ?? 0}
              </div>
            </div>
          </div>

          <div className="k-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary-glow" />
              <span className="text-sm font-semibold">Nye brugere (sidste 30 dage)</span>
              <span className="ml-auto text-xs text-muted-foreground">
                Total: {financials?.signups_daily.reduce((s, d) => s + d.count, 0) ?? 0}
              </span>
            </div>
            <BarSeries data={financials?.signups_daily ?? []} color="hsl(var(--primary-glow))" />
          </div>


          <div className="k-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary-glow" />
              <span className="text-sm font-semibold">Transaktioner</span>
              <span className="text-xs text-muted-foreground ml-auto">{financials?.transactions.length ?? 0}</span>
            </div>
            <div className="divide-y divide-border/60 max-h-[60vh] overflow-y-auto">
              {(financials?.transactions ?? []).map((tx) => (
                <div key={tx.id} className="px-4 py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate flex-1">{tx.email}</span>
                    <span className="font-mono">${(tx.amount_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>{tx.tier}</span>
                    <span>·</span>
                    <span>{tx.status}</span>
                    <span>·</span>
                    <span className={tx.environment === "live" ? "text-green-600" : "text-yellow-600"}>{tx.environment}</span>
                    <span className="ml-auto">{new Date(tx.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {(!financials || financials.transactions.length === 0) && (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">Ingen transaktioner endnu</div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ANALYTICS tab */}
      {tab === "analytics" && (
        <div className="space-y-3">
          <div className="k-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary-glow" />
              <span className="text-sm font-semibold">AI scans (sidste 30 dage)</span>
              <span className="ml-auto text-xs text-muted-foreground">
                Total: {stats?.scans_daily.reduce((s, d) => s + d.count, 0) ?? 0}
              </span>
            </div>
            <BarSeries data={stats?.scans_daily ?? []} color="hsl(var(--primary))" />
          </div>
          <div className="k-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-primary-glow" />
              <span className="text-sm font-semibold">Sidevisninger (sidste 30 dage)</span>
              <span className="ml-auto text-xs text-muted-foreground">
                Total: {stats?.views_daily.reduce((s, d) => s + d.count, 0) ?? 0}
              </span>
            </div>
            <BarSeries data={stats?.views_daily ?? []} color="hsl(var(--primary-glow))" />
          </div>
        </div>
      )}

      {/* USERS tab */}
      {tab === "users" && (
        <div className="k-card overflow-hidden">
          <div className="p-3 flex items-center gap-2 border-b border-border/60">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Søg email, IP eller Device ID" className="pl-9 h-9 bg-background" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="text-xs bg-background border border-border/60 rounded-lg px-2 py-2">
              <option value="created_at">Reg. dato</option>
              <option value="email">Email</option>
              <option value="signup_ip">IP</option>
              <option value="device_id">Device ID</option>
            </select>
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border/60 max-h-[60vh] overflow-y-auto">
            {filteredUsers.map((u) => (
              <div key={u.id} className={`px-4 py-3 ${u.is_banned ? "bg-red-500/10 border-l-4 border-red-500" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-medium truncate ${u.is_banned ? "text-red-700 dark:text-red-300" : ""}`}>
                        {u.email ?? u.id}
                      </div>
                      {u.is_banned && <Ban className="w-3.5 h-3.5 text-red-600" />}
                      {!u.email_confirmed_at && (
                        <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> uverificeret
                        </span>
                      )}
                      {u.is_premium && <Crown className="w-3 h-3 text-primary-glow" />}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono">
                      <span>Reg: {new Date(u.created_at).toLocaleString()}</span>
                      <span>Sidst: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}</span>
                      <span>IP: {u.signup_ip ?? "—"}</span>
                      <span className="truncate">Dev: {u.device_id ?? "—"}</span>
                    </div>
                    {u.is_banned && u.ban_reason && (
                      <div className="text-[10px] text-red-600 dark:text-red-300 mt-1">Årsag: {u.ban_reason}</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => callAction("set_premium", u.id, { is_premium: !u.is_premium })}
                      className={u.is_premium ? "border-primary text-primary" : ""}
                    >
                      <Crown className="w-3 h-3 mr-1" /> {u.is_premium ? "Fjern Pro" : "Giv Pro"}
                    </Button>
                    {u.is_banned ? (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => callAction("unban", u.id)}>
                        <ShieldOff className="w-3 h-3 mr-1" /> Ophæv
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-500/60">
                            <Ban className="w-3 h-3 mr-1" /> Bloker
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bloker {u.email}?</AlertDialogTitle>
                            <AlertDialogDescription>Brugeren logges ud øjeblikkeligt og kan ikke logge ind igen.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuller</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => callAction("ban", u.id, { reason: "Manual ban via admin" })}>
                              Bloker
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="w-3 h-3 mr-1" /> Slet
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Slet {u.email}?</AlertDialogTitle>
                          <AlertDialogDescription>Brugeren og alle tilknyttede data slettes permanent. Dette kan ikke fortrydes.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuller</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => callAction("delete", u.id)}>
                            Slet permanent
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
            {!stats && !error && <div className="px-4 py-6 text-sm text-muted-foreground">Indlæser…</div>}
            {stats && filteredUsers.length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground text-center">Ingen brugere matcher</div>
            )}
          </div>
        </div>
      )}

      {/* DISCOUNTS tab */}
      {tab === "discounts" && (
        <div className="space-y-3">
          <div className="k-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-primary-glow" />
              <span className="text-sm font-semibold">Opret rabatkode</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="KODE" value={newDiscount.code} onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value })} />
              <select className="h-10 rounded-xl bg-background border border-border/60 px-3 text-sm"
                value={newDiscount.discount_type}
                onChange={(e) => setNewDiscount({ ...newDiscount, discount_type: e.target.value })}>
                <option value="percentage">Procent (%)</option>
                <option value="flat">Fast beløb</option>
              </select>
              <Input type="number" placeholder="Beløb / %" value={newDiscount.amount} onChange={(e) => setNewDiscount({ ...newDiscount, amount: e.target.value })} />
              <Input type="number" placeholder="Max brug (valgfri)" value={newDiscount.max_uses} onChange={(e) => setNewDiscount({ ...newDiscount, max_uses: e.target.value })} />
              <Input placeholder="Beskrivelse" value={newDiscount.description} onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })} className="col-span-2" />
              <Input type="datetime-local" placeholder="Udløber" value={newDiscount.expires_at} onChange={(e) => setNewDiscount({ ...newDiscount, expires_at: e.target.value })} className="col-span-2" />
            </div>
            <Button onClick={createDiscount} className="w-full mt-3">Opret rabatkode</Button>
            <p className="text-[10px] text-muted-foreground mt-2">
              Bemærk: Dette er en intern rabatkode-tracker. Selve indløsning skal håndteres separat (f.eks. App Store promo codes).
            </p>
          </div>

          <div className="k-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary-glow" />
              <span className="text-sm font-semibold">Rabatkoder</span>
              <span className="text-xs text-muted-foreground ml-auto">{discounts.length} i alt</span>
            </div>
            <div className="divide-y divide-border/60 max-h-[50vh] overflow-y-auto">
              {discounts.map((d) => {
                const expired = d.expires_at && new Date(d.expires_at) < new Date();
                const used_up = d.max_uses != null && d.times_used >= d.max_uses;
                return (
                  <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{d.code}</span>
                        <span className="text-xs text-muted-foreground">
                          {d.discount_type === "percentage" ? `${d.amount}%` : `${d.amount} ${d.currency ?? ""}`}
                        </span>
                        {!d.active && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted">inaktiv</span>}
                        {expired && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300">udløbet</span>}
                        {used_up && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">opbrugt</span>}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {d.description && <span>{d.description} · </span>}
                        Brugt: {d.times_used}{d.max_uses != null ? `/${d.max_uses}` : ""}
                        {d.expires_at && ` · Udløber ${new Date(d.expires_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toggleDiscount(d)}>
                      <Power className="w-3 h-3 mr-1" /> {d.active ? "Deaktiver" : "Aktiver"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteDiscount(d)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
              {discounts.length === 0 && (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">Ingen rabatkoder endnu</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYOUTS tab */}
      {tab === "payouts" && (
        <div className="k-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary-glow" />
            <span className="text-sm font-semibold">Udbetalinger</span>
            <span className="text-xs text-muted-foreground ml-auto">{payouts.length} i alt</span>
          </div>
          <div className="divide-y divide-border/60 max-h-[60vh] overflow-y-auto">
            {payouts.filter((p) => p.status !== "paid").map((p) => {
              const u = userById.get(p.user_id);
              return (
                <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{u?.email ?? p.user_id}</span>
                      {statusPill(p.status)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {fmtMoney(p.amount_cents, p.currency)} · oprettet {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {p.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => approvePayout(p)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Godkend
                      </Button>
                    )}
                    {(p.status === "approved" || p.status === "pending") && (
                      <Button size="sm" onClick={() => setPayDialog({ open: true, payout: p, txn: "" })}>
                        <DollarSign className="w-3 h-3 mr-1" /> Marker betalt
                      </Button>
                    )}
                    {p.status !== "rejected" && p.status !== "paid" && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => rejectPayout(p)}>Afvis</Button>
                    )}
                  </div>
                </div>
              );
            })}
            {payouts.filter((p) => p.status !== "paid").length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground text-center">Ingen åbne udbetalinger</div>
            )}
          </div>
        </div>
      )}

      {/* AUDIT tab */}
      {tab === "audit" && (
        <div className="k-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary-glow" />
            <span className="text-sm font-semibold">Udbetalingslog</span>
            <Button size="sm" variant="outline" className="ml-auto" onClick={exportPaidCsv}>
              <Download className="w-3 h-3 mr-1" /> Eksporter CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="text-left px-4 py-2">Bruger</th>
                  <th className="text-left px-4 py-2">Dato</th>
                  <th className="text-right px-4 py-2">Beløb</th>
                  <th className="text-left px-4 py-2">PayPal Txn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {payouts.filter((p) => p.status === "paid").map((p) => {
                  const u = userById.get(p.user_id);
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-2 truncate max-w-[180px]">{u?.email ?? p.user_id}</td>
                      <td className="px-4 py-2">{p.payout_date ? new Date(p.payout_date).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{fmtMoney(p.amount_cents, p.currency)}</td>
                      <td className="px-4 py-2 font-mono truncate max-w-[200px]">{p.paypal_transaction_id ?? "—"}</td>
                    </tr>
                  );
                })}
                {payouts.filter((p) => p.status === "paid").length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Ingen udbetalinger endnu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={payDialog.open} onOpenChange={(o) => setPayDialog((d) => ({ ...d, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marker som betalt</DialogTitle>
            <DialogDescription>Indtast PayPal Transaction ID for bogføring.</DialogDescription>
          </DialogHeader>
          <Input value={payDialog.txn} onChange={(e) => setPayDialog((d) => ({ ...d, txn: e.target.value }))} placeholder="f.eks. 1AB23456CD789012E" autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog({ open: false, txn: "" })}>Annuller</Button>
            <Button onClick={submitPaid}>Bekræft betaling</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Stat = ({ Icon, label, value, danger }: { Icon: any; label: string; value?: number; danger?: boolean }) => (
  <div className={`k-card p-3 ${danger ? "border-red-500/40" : ""}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${danger ? "bg-red-500/20" : "bg-gradient-soft"}`}>
        <Icon className={`w-3.5 h-3.5 ${danger ? "text-red-600" : "text-primary-glow"}`} />
      </div>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
    <div className={`text-xl font-semibold ${danger ? "text-red-600" : ""}`}>{value ?? "—"}</div>
  </div>
);

const BarSeries = ({ data, color }: { data: { date: string; count: number }[]; color: string }) => {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex items-end gap-[2px] h-32">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
            <div
              className="w-full rounded-t transition-all hover:opacity-80"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 2 : 0, background: color }}
              title={`${d.date}: ${d.count}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
};
