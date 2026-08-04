import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useTText } from "@/i18n/useT";

/**
 * Privacy & Disclosures — a short, plain-language index of every piece of data
 * ScanIQ handles and every permission the iOS app can ask for.
 *
 * This page is maintained by the ScanIQ app owner to answer common privacy
 * questions. It is a self-declaration, not an independent certification or
 * audit. The full legal text lives on the Privacy Policy and Terms pages.
 */

interface Item {
  name: string;
  what: string;
  why: string;
  when: string;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-6">
    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
      {title}
    </h2>
    <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">{children}</div>
  </section>
);

const Entry = ({ item }: { item: Item }) => (
  <div className="px-5 py-4 border-b border-border/40 last:border-0">
    <div className="text-sm font-semibold">{item.name}</div>
    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.what}</p>
    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
      <span className="font-medium text-foreground/80">Why: </span>
      {item.why}
    </p>
    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
      <span className="font-medium text-foreground/80">When: </span>
      {item.when}
    </p>
  </div>
);

export default function Disclosures() {
  const nav = useNavigate();
  const tt = useTText();
  const native = (() => {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  })();

  const permissions: Item[] = [
    {
      name: tt("Camera"),
      what: tt("Live camera frames used to photograph your meal or a nutrition label."),
      why: tt("Photos are analysed to estimate calories and macros."),
      when: tt("Asked the first time you open the scanner. The app works without it if you pick photos instead."),
    },
    {
      name: tt("Photo library"),
      what: tt("The single image you choose from your library."),
      why: tt("So you can analyse a meal photo you already took."),
      when: tt("Asked only when you tap to pick a photo."),
    },
    {
      name: tt("Save to photo library"),
      what: tt("Writes a scanned meal photo back to your library."),
      why: tt("Only when you tap Save on a scan."),
      when: tt("Asked the first time you save an image."),
    },
    {
      name: tt("Notifications"),
      what: tt("Local reminders scheduled on your device."),
      why: tt("Meal, water and weigh-in reminders you turn on yourself."),
      when: tt("Asked only when you enable a reminder in Settings."),
    },
  ];

  const data: Item[] = [
    {
      name: tt("Account"),
      what: tt("Email address, or the Apple relay address if you use Sign in with Apple, plus display name and sign-in timestamps."),
      why: tt("To create your account, sign you in and secure it."),
      when: tt("At sign-up and each sign-in."),
    },
    {
      name: tt("Profile & goals"),
      what: tt("Age, sex, height, weight, activity level, goal and target weight."),
      why: tt("To calculate your calorie and macro targets."),
      when: tt("During onboarding and whenever you edit them."),
    },
    {
      name: tt("Meals & scans"),
      what: tt("Meal photos, detected food names, calories, macros and the time you logged them."),
      why: tt("To show your diary, daily totals and trends."),
      when: tt("Each time you scan or log a meal."),
    },
    {
      name: tt("Body measurements"),
      what: tt("Weight entries and water intake you enter yourself."),
      why: tt("To draw your progress charts."),
      when: tt("Only when you log them."),
    },
    {
      name: tt("Subscription"),
      what: tt("Subscription status, product identifier and renewal date received from Apple via RevenueCat."),
      why: tt("To unlock Premium features on your account."),
      when: tt("On purchase, restore and renewal. ScanIQ never sees your payment card — Apple is the merchant of record."),
    },
    {
      name: tt("Diagnostics"),
      what: tt("Basic in-app page views, device type and error information, linked to your account."),
      why: tt("To keep the app stable and fix crashes."),
      when: tt("While you use the app."),
    },
  ];

  const processors: Item[] = [
    {
      name: tt("Lovable Cloud (Supabase)"),
      what: tt("Database, authentication, file storage and server functions, hosted in the EU."),
      why: tt("Stores your account, meals and scan images."),
      when: tt("Whenever you use the app."),
    },
    {
      name: tt("Apple / RevenueCat"),
      what: tt("Purchase and subscription status."),
      why: tt("Processes payments and reports entitlement back to the app."),
      when: tt("Only for subscribers."),
    },
    {
      name: tt("AI model provider"),
      what: tt("The meal photo and a text prompt."),
      why: tt("To analyse the food and estimate nutrition."),
      when: tt("Only at the moment you run a scan."),
    },
  ];

  return (
    <div className="k-page min-h-screen bg-background" style={{ paddingBottom: 100 }}>
      <header className="flex items-center gap-3 mb-5 pt-2">
        <button
          onClick={() => nav(-1)}
          aria-label={tt("Back")}
          className="k-tap w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">{tt("Privacy & Disclosures")}</h1>
      </header>

      <p className="text-xs text-muted-foreground leading-relaxed mb-6">
        {tt(
          "This page is maintained by the ScanIQ team to answer common privacy questions about the app. It is a self-declaration, not an independent audit or certification. The binding terms are in our Privacy Policy and Terms."
        )}
      </p>

      <div className="rounded-2xl border-2 border-[hsl(24_95%_53%)]/40 bg-[hsl(24_95%_53%)]/8 p-4 mb-6">
        <div className="text-sm font-semibold mb-1">{tt("Tracking / App Tracking Transparency")}</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {tt(
            "ScanIQ does not track you. We do not collect the IDFA advertising identifier, we do not use ad networks or third-party analytics SDKs, and we never share or sell your data with data brokers or link it to data from other companies' apps or websites for advertising."
          )}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-2">
          {tt(
            "Because no tracking takes place, the app does not show the App Tracking Transparency prompt and does not request tracking permission. The diagnostics we do collect are first-party only: they stay in ScanIQ and are used to run and improve the app."
          )}
        </p>
        {native && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            {tt(
              "There is no cookie banner in the app — cookies are only used on our website in the browser."
            )}
          </p>
        )}
      </div>

      <Section title={tt("Permissions the app can request")}>
        {permissions.map((i) => (
          <Entry key={i.name} item={i} />
        ))}
      </Section>

      <div className="rounded-2xl bg-card border border-border/60 px-5 py-4 mb-6">
        <div className="text-sm font-semibold mb-1">{tt("Not used")}</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {tt(
            "ScanIQ does not use HealthKit, location, contacts, microphone, Bluetooth, calendar or the advertising identifier. No such permission is requested and no matching code ships in the app."
          )}
        </p>
      </div>

      <Section title={tt("Data the app stores")}>
        {data.map((i) => (
          <Entry key={i.name} item={i} />
        ))}
      </Section>

      <Section title={tt("Who processes your data")}>
        {processors.map((i) => (
          <Entry key={i.name} item={i} />
        ))}
      </Section>

      <Section title={tt("Your control")}>
        <div className="px-5 py-4 text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>
            {tt(
              "You can export or delete your account and all associated data at any time from Settings → Data & privacy. Deleting your account removes your profile, meals, scan images, weights and subscription records."
            )}
          </p>
          <p>
            {tt(
              "Data is encrypted in transit (HTTPS/TLS) and at rest on our EU-hosted infrastructure. Row-level security means your rows can only be read by your own signed-in account."
            )}
          </p>
          <p>
            {tt("Privacy or security questions: privacy@scaniq.site")}
          </p>
        </div>
      </Section>

      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
        <button onClick={() => nav("/privacy")} className="underline underline-offset-4">
          {tt("Privacy Policy")}
        </button>
        <span className="text-border">·</span>
        <button onClick={() => nav("/terms")} className="underline underline-offset-4">
          {tt("Terms")}
        </button>
        <span className="text-border">·</span>
        <button onClick={() => nav("/security")} className="underline underline-offset-4">
          {tt("Security")}
        </button>
      </div>
    </div>
  );
}
