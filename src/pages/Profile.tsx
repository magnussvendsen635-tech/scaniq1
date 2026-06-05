import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useKStore } from "@/store/useKStore";
import { Logo } from "@/components/Logo";
import { Flame, Settings as SettingsIcon, LogOut, ChevronRight, Scale, Database, LifeBuoy, RefreshCw, ExternalLink, Shield, FileText, Trash2, Gift } from "lucide-react";
import leafLogo from "@/assets/scaniq-leaf-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT } from "@/i18n/useT";
import type { TKey } from "@/i18n/translations";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const goalKey: Record<string, TKey> = { lose: "goal.lose", gain: "goal.gain", maintain: "goal.maintain" };

export default function Profile() {
  const nav = useNavigate();
  const t = useT();
  const { signOut, user: authUser } = useAuth();
  const { user, streak, premium } = useKStore();
  const { isActive, refetch } = useSubscription();
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ADMIN_EMAILS = ["magnussvendsen635@gmail.com"];
  const isAdmin =
    (authUser?.email && ADMIN_EMAILS.includes(authUser.email)) ||
    (typeof window !== "undefined" && window.localStorage.getItem("scaniq_admin") === "1");
  

  const restorePurchase = async () => {
    setRestoring(true);
    try {
      await refetch();
      toast.success(isActive ? "Dit abonnement er gendannet" : "Intet aktivt abonnement fundet");
    } catch {
      toast.error("Kunne ikke gendanne — prøv igen senere");
    } finally {
      setRestoring(false);
    }
  };

  const manageSubscription = () => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    if (isIOS) window.location.href = "https://apps.apple.com/account/subscriptions";
    else if (isAndroid) window.location.href = "https://play.google.com/store/account/subscriptions";
    else toast.info("Åbn App Store / Google Play på din telefon for at administrere abonnementet");
  };


  return (
    <div className="k-page">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t("profile.title")}</h1>
        <Logo size={36} />
      </header>

      {/* Hero */}
      <div className="k-card p-6 mb-4 bg-gradient-surface relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground tracking-widest uppercase">{t("profile.goal")}</div>
            <div className="text-xl font-semibold">{t(goalKey[user.goal])}</div>
            <div className="text-[10px] text-muted-foreground/80 mt-0.5">Hold styr på dine kalorier</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label={t("profile.weight")} value={`${user.weight}`} unit="kg" />
        <Stat label={t("profile.calories")} value={`${user.calories}`} unit="kcal" />
        <Stat label={t("profile.protein")} value={`${user.protein}`} unit="g" />
      </div>

      {!premium && (
        <Link to="/premium" className="k-card k-tap p-5 mb-4 flex items-center gap-4 bg-gradient-primary !border-transparent shadow-glow">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white">{t("profile.go_premium")}</div>
            <div className="text-xs text-white/70">{t("profile.unlock")}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80" />
        </Link>
      )}

      <div className="k-card divide-y divide-border/60 overflow-hidden">
        <Row Icon={Scale} title="Weight tracker" sub="Log weight & see your trend" onClick={() => nav("/weight")} />
        
        <Row Icon={SettingsIcon} title={t("profile.edit_settings")} sub={t("profile.edit_settings_sub")} onClick={() => nav("/settings")} />
        <Row
          Icon={RefreshCw}
          title={restoring ? "Gendanner…" : "Restore Purchase"}
          sub="Gendan et eksisterende abonnement"
          onClick={restorePurchase}
        />
        <Row
          Icon={ExternalLink}
          title="Manage Subscription"
          sub="Administrer i App Store / Google Play"
          onClick={manageSubscription}
        />
        <Row Icon={Shield} title="Privacy Policy" sub="Sådan bruger vi dine data" onClick={() => nav("/privacy")} />
        <Row Icon={FileText} title="Terms of Service" sub="Vilkår og betingelser" onClick={() => nav("/terms")} />
        <Row Icon={Gift} title="Bonus Terms" sub="Vilkår for refer-a-friend bonus" onClick={() => nav("/bonus-terms")} />
        <Row Icon={LifeBuoy} title="Hjælp & support" sub="Kontakt, FAQ, om os, slet konto" onClick={() => nav("/help")} />
        {isAdmin && <Row Icon={Database} title="Admin panel" sub="Brugere, måltider & data" onClick={() => nav("/admin")} />}
        <Row
          Icon={RefreshCw}
          title="Genstart onboarding"
          sub="Gennemgå opsætningen forfra"
          onClick={() => {
            useKStore.getState().setOnboarded(false);
            nav("/onboarding", { replace: true });
          }}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full p-4 flex items-center gap-4 hover:bg-surface-2 transition-colors text-left">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-destructive/15">
                <Trash2 className="w-4.5 h-4.5 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-destructive">Slet konto</div>
                <div className="text-xs text-muted-foreground">Slet din konto og alle data permanent</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slet konto?</AlertDialogTitle>
              <AlertDialogDescription>
                Denne handling kan ikke fortrydes. Din konto og alle tilknyttede data slettes permanent.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuller</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async (e) => {
                  e.preventDefault();
                  setDeleting(true);
                  try {
                    const { error } = await supabase.functions.invoke("delete-account");
                    if (error) throw error;
                    await signOut();
                    toast.success("Din konto er slettet");
                    nav("/auth", { replace: true });
                  } catch (err: any) {
                    toast.error("Kunne ikke slette konto", { description: err?.message ?? "Prøv igen senere" });
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Sletter…" : "Slet permanent"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full p-4 flex items-center gap-4 hover:bg-surface-2 transition-colors text-left">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-destructive/15">
                <LogOut className="w-4.5 h-4.5 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-destructive">{t("profile.logout")}</div>
                <div className="text-xs text-muted-foreground">{t("profile.logout_sub")}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("profile.logout")}?</AlertDialogTitle>
              <AlertDialogDescription>
                Du bliver logget ud af din konto.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await signOut();
                  nav("/auth", { replace: true });
                }}
              >
                Log out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

const Stat = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
  <div className="k-card p-4 text-center">
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    <div className="mt-1.5 flex items-baseline justify-center gap-1">
      <span className="text-xl font-semibold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{unit}</span>
    </div>
  </div>
);

const Row = ({ Icon, title, sub, onClick, danger }: { Icon: any; title: string; sub: string; onClick: () => void; danger?: boolean }) => (
  <button onClick={onClick} className="w-full p-4 flex items-center gap-4 hover:bg-surface-2 transition-colors text-left">
    <div className={"w-10 h-10 rounded-2xl flex items-center justify-center " + (danger ? "bg-destructive/15" : "bg-gradient-soft")}>
      <Icon className={"w-4.5 h-4.5 " + (danger ? "text-destructive" : "text-primary-glow")} />
    </div>
    <div className="flex-1">
      <div className={"font-medium " + (danger ? "text-destructive" : "")}>{title}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground" />
  </button>
);

// BackendRow removed — was a developer-only artifact leaking project ref to all users.
