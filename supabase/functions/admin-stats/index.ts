import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: users }, mealsRes, workoutsRes, weightsRes, subsRes, activeSubsRes, profilesRes, scansRes, viewsRes, viewsTotalRes] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 500 }),
      admin.from("meals").select("id", { count: "exact", head: true }),
      admin.from("workouts").select("id", { count: "exact", head: true }),
      admin.from("weights").select("id", { count: "exact", head: true }),
      admin.from("subscriptions").select("id", { count: "exact", head: true }),
      admin.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
      admin.from("profiles").select("id, email, display_name, is_banned, banned_at, ban_reason, signup_ip, device_id, email_verified_at, created_at, is_premium"),
      admin.from("meals").select("created_at").gte("created_at", since30),
      admin.from("page_views").select("created_at").gte("created_at", since30),
      admin.from("page_views").select("id", { count: "exact", head: true }),
    ]);

    const profileMap = new Map<string, any>();
    for (const p of profilesRes.data ?? []) profileMap.set(p.id, p);

    const userList = (users?.users ?? []).map((u) => {
      const p = profileMap.get(u.id) || {};
      return {
        id: u.id,
        email: u.email ?? p.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        is_banned: !!p.is_banned,
        banned_at: p.banned_at ?? null,
        ban_reason: p.ban_reason ?? null,
        signup_ip: p.signup_ip ?? null,
        device_id: p.device_id ?? null,
        is_premium: !!p.is_premium,
        display_name: p.display_name ?? null,
      };
    });

    // Daily series for last 30 days
    const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);
    const buildSeries = (rows: { created_at: string }[] | null) => {
      const counts = new Map<string, number>();
      for (const r of rows ?? []) counts.set(dayKey(r.created_at), (counts.get(dayKey(r.created_at)) ?? 0) + 1);
      const out: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        out.push({ date: d, count: counts.get(d) ?? 0 });
      }
      return out;
    };

    return new Response(
      JSON.stringify({
        counts: {
          users: userList.length,
          banned: userList.filter((u) => u.is_banned).length,
          meals: mealsRes.count ?? 0,
          workouts: workoutsRes.count ?? 0,
          weights: weightsRes.count ?? 0,
          subscriptions: subsRes.count ?? 0,
          active_subscribers: activeSubsRes.count ?? 0,
          page_views_total: viewsTotalRes.count ?? 0,
        },
        users: userList,
        scans_daily: buildSeries(scansRes.data as any),
        views_daily: buildSeries(viewsRes.data as any),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
