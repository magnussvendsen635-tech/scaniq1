// Hourly cron — looks at users' reminder_preferences in their timezone
// and sends water/meal/weight reminders via send-push.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";

function localHour(tz: string): { hour: number; dow: number } {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
      weekday: "short",
    });
    const parts = fmt.formatToParts(new Date());
    const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const wd = parts.find((p) => p.type === "weekday")?.value || "Mon";
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { hour: h, dow: map[wd] ?? 1 };
  } catch {
    const d = new Date();
    return { hour: d.getUTCHours(), dow: d.getUTCDay() };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require cron secret
  const secret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: prefs, error } = await admin
    .from("reminder_preferences")
    .select("user_id, enabled, water, meals, weight, calories, timezone");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  type Job = { user_id: string; title: string; body: string; tag: string; url: string };
  const jobs: Job[] = [];

  for (const p of prefs || []) {
    if (!p.enabled) continue;
    const { hour, dow } = localHour(p.timezone || "Europe/Copenhagen");

    // Water — every 4 hours (11, 15, 19)
    if (p.water && [11, 15, 19].includes(hour)) {
      jobs.push({
        user_id: p.user_id,
        title: "💧 Time to hydrate",
        body: "Remember to drink some water and log it in ScanIQ.",
        tag: `water-${hour}`,
        url: "/",
      });
    }
    // Calories — every 4 hours (10, 14, 18) — reminds user to log/check calories
    if ((p as any).calories && [10, 14, 18].includes(hour)) {
      jobs.push({
        user_id: p.user_id,
        title: "🔥 Check your calories",
        body: "Open ScanIQ to see how many calories you have left today.",
        tag: `calories-${hour}`,
        url: "/",
      });
    }
    // Meals
    if (p.meals && hour === 9) {
      jobs.push({
        user_id: p.user_id,
        title: "🌅 Don't forget breakfast",
        body: "Log your morning meal in ScanIQ.",
        tag: "breakfast",
        url: "/diary",
      });
    }
    if (p.meals && hour === 13) {
      jobs.push({
        user_id: p.user_id,
        title: "🍽️ Time for lunch?",
        body: "Log your lunch when you're done.",
        tag: "lunch",
        url: "/diary",
      });
    }
    if (p.meals && hour === 19) {
      jobs.push({
        user_id: p.user_id,
        title: "🍝 Don't forget dinner",
        body: "Log your evening meal.",
        tag: "dinner",
        url: "/diary",
      });
    }
    // Weight — Sunday 9am
    if (p.weight && dow === 0 && hour === 9) {
      jobs.push({
        user_id: p.user_id,
        title: "⚖️ Weekly weigh-in",
        body: "Log your weight and track your progress.",
        tag: "weight",
        url: "/weight",
      });
    }
  }

  // Dispatch in parallel — call send-push for each unique notification
  const results = await Promise.all(
    jobs.map(async (j) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": CRON_SECRET,
        },
        body: JSON.stringify(j),
      });
      return { user: j.user_id, tag: j.tag, ok: res.ok };
    })
  );

  return new Response(JSON.stringify({ jobs: jobs.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
