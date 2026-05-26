import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Droplet, UtensilsCrossed } from "lucide-react";
import { useKStore } from "@/store/useKStore";
import { ensurePermission, rescheduleReminders, cancelAllScanIQ } from "@/lib/notifications";
import { Switch } from "@/components/ui/switch";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

export default function Reminders() {
  const nav = useNavigate();
  const { reminders, setReminders, meals } = useKStore();
  const native = Capacitor.isNativePlatform();

  const apply = async (next: typeof reminders) => {
    setReminders(next);
    if (native && next.enabled) {
      await rescheduleReminders({ reminders: next, meals });
    } else {
      await cancelAllScanIQ();
    }
  };

  const toggleEnabled = async (v: boolean) => {
    if (v) {
      const granted = await ensurePermission(!!reminders.permissionAsked);
      setReminders({ permissionAsked: true });
      if (!granted) {
        toast.error("Notifikationer er ikke tilladt", { description: "Tillad i indstillinger for at få påmindelser." });
        return;
      }
    }
    await apply({ ...reminders, enabled: v });
  };

  return (
    <div className="k-page pb-32">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Påmindelser</h1>
      </header>

      {!native && (
        <div className="k-card p-4 mb-4 bg-surface-2 text-xs text-muted-foreground">
          Push-notifikationer virker kun i ScanIQ-mobilappen (iOS/Android). I browseren er disse indstillinger gemt og bruges når du åbner appen på din telefon.
        </div>
      )}

      <div className="k-card p-5 mb-4 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${reminders.enabled ? "bg-gradient-primary shadow-glow" : "bg-surface-3"}`}>
          <Bell className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">Aktivér påmindelser</div>
          <div className="text-xs text-muted-foreground">Smart, minimal — kun når du har glemt at logge.</div>
        </div>
        <Switch checked={reminders.enabled} onCheckedChange={toggleEnabled} />
      </div>

      <div className="k-card overflow-hidden mb-4 divide-y divide-border/60">
        <Row Icon={UtensilsCrossed} title="Måltider" sub="Morgenmad, frokost, aftensmad">
          <Switch
            checked={reminders.meals}
            disabled={!reminders.enabled}
            onCheckedChange={(v) => apply({ ...reminders, meals: v })}
          />
        </Row>
        <TimeRow
          label="Morgenmad"
          value={reminders.breakfastTime ?? "08:00"}
          disabled={!reminders.enabled || !reminders.meals}
          onChange={(v) => apply({ ...reminders, breakfastTime: v })}
        />
        <TimeRow
          label="Frokost"
          value={reminders.lunchTime ?? "12:30"}
          disabled={!reminders.enabled || !reminders.meals}
          onChange={(v) => apply({ ...reminders, lunchTime: v })}
        />
        <TimeRow
          label="Aftensmad"
          value={reminders.dinnerTime ?? "18:30"}
          disabled={!reminders.enabled || !reminders.meals}
          onChange={(v) => apply({ ...reminders, dinnerTime: v })}
        />
      </div>

      <div className="k-card overflow-hidden divide-y divide-border/60">
        <Row Icon={Droplet} title="Vand" sub="Bliv mindet om at drikke">
          <Switch
            checked={reminders.water}
            disabled={!reminders.enabled}
            onCheckedChange={(v) => apply({ ...reminders, water: v })}
          />
        </Row>
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="text-sm">Hvert (timer)</span>
          <select
            value={reminders.waterEveryHours ?? 3}
            disabled={!reminders.enabled || !reminders.water}
            onChange={(e) => apply({ ...reminders, waterEveryHours: Number(e.target.value) })}
            className="w-24 h-10 rounded-xl bg-surface-2 border border-border/60 px-3 text-right text-sm disabled:opacity-50"
          >
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}t</option>)}
          </select>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 px-1 leading-relaxed">
        Måltidspåmindelser sendes kun, hvis du ikke allerede har logget for den kategori. Når du logger fx frokost, springes flere frokost-påmindelser over indtil i morgen.
      </p>
    </div>
  );
}

const Row = ({ Icon, title, sub, children }: { Icon: any; title: string; sub: string; children: React.ReactNode }) => (
  <div className="px-5 py-4 flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center">
      <Icon className="w-4 h-4 text-primary-glow" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
    {children}
  </div>
);

const TimeRow = ({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (v: string) => void }) => (
  <div className="px-5 py-3 flex items-center justify-between">
    <span className="text-sm">{label}</span>
    <input
      type="time"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-32 h-10 rounded-xl bg-surface-2 border border-border/60 px-3 text-right text-sm disabled:opacity-50"
    />
  </div>
);
