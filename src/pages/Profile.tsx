import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useKStore } from "@/store/useKStore";
import { Logo } from "@/components/Logo";
import { Settings as SettingsIcon, LogOut, ChevronRight, Scale, Database, LifeBuoy, RefreshCw, ExternalLink, Shield, FileText, Trash2, Gift, Tag } from "lucide-react";
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!authUser?.id) {
      setIsAdmin(false);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: authUser.id, _role: "admin" })
      .then(({ data, error }) => {
        if (!cancelled) setIsAdmin(!error && data === true);
      });
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);
  
  

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
      </header>

      {/* Hero */}
      <div className="k-card p-6 mb-4 bg-gradient-surface relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground tracking-widest uppercase">{t("profile.goal")}</div>
            <div className="text-xl font-semibold">{t(goalKey[user.goal])}</div>
            <div className="text-[10px] text-muted-foreground/80 mt-0.5">{t("profile.goal_sub")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label={t("profile.weight")} value={`${user.weight}`} unit="kg" />
        <Stat label={t("profile.calories")} value={`${user.calories}`} unit="kcal" />
        <Stat label={t("profile.protein")} value={`${user.protein}`} unit="g" />
      </div>

      {!premium && (
        <Link
          to="/premium"
          className="k-tap rounded-3xl p-5 mb-4 flex items-center gap-4 shadow-[0_12px_28px_-8px_rgba(245,158,91,0.55)] bg-gradient-to-r from-[#F59E5B] to-[#EA6A1F] border-0"
        >
          <img
            src={leafLogo}
            alt=""
            className="shrink-0"
            style={{ width: 56, height: 56, objectFit: "contain", background: "transparent", display: "block" }}
          />
          <div className="flex-1">
            <div className="font-semibold text-white">{t("profile.go_premium")}</div>
            <div className="text-xs text-white/80">{t("profile.unlock")}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/90" />
        </Link>
      )}

      <div className="k-card divide-y divide-border/60 overflow-hidden">
        <Row Icon={Scale} title={t("profile.weight_tracker")} sub={t("profile.weight_tracker_sub")} onClick={() => nav("/weight")} />
        <Row Icon={SettingsIcon} title={t("profile.edit_settings")} sub={t("profile.edit_settings_sub")} onClick={() => nav("/settings")} />
        <Row Icon={Tag} title={t("profile.pricing")} sub={t("profile.pricing_sub")} onClick={() => nav("/pricing")} />
        <Row
          Icon={RefreshCw}
          title={restoring ? t("profile.restoring") : t("profile.restore")}
          sub={t("profile.restore_sub")}
          onClick={restorePurchase}
        />
        <Row
          Icon={ExternalLink}
          title={t("profile.manage_sub")}
          sub={t("profile.manage_sub_sub")}
          onClick={manageSubscription}
        />
        <Row Icon={Shield} title={t("profile.privacy")} sub={t("profile.privacy_sub")} onClick={() => nav("/privacy")} />
        <Row Icon={FileText} title={t("profile.terms")} sub={t("profile.terms_sub")} onClick={() => nav("/terms")} />
        <Row Icon={Gift} title={t("profile.bonus_terms")} sub={t("profile.bonus_terms_sub")} onClick={() => nav("/bonus-terms")} />
        <Row Icon={LifeBuoy} title={t("profile.help")} sub={t("profile.help_sub")} onClick={() => nav("/help")} />
        {isAdmin && <Row Icon={Database} title={t("profile.admin")} sub={t("profile.admin_sub")} onClick={() => nav("/admin")} />}
        <Row
          Icon={RefreshCw}
          title={t("profile.restart_onb")}
          sub={t("profile.restart_onb_sub")}
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
                <div className="font-medium text-destructive">{t("profile.delete_account")}</div>
                <div className="text-xs text-muted-foreground">{t("profile.delete_account_sub")}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("profile.delete_confirm_title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("profile.delete_confirm_body")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
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
                    toast.success(t("profile.deleted"));
                    nav("/auth", { replace: true });
                  } catch (err: any) {
                    toast.error(t("profile.delete_failed"), { description: err?.message ?? "" });
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? t("profile.deleting") : t("profile.delete_permanent")}
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
                {t("profile.logout_confirm_body")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await signOut();
                  nav("/auth", { replace: true });
                }}
              >
                {t("profile.logout")}
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
