import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAILS = ["magnussvendsen635@gmail.com"];

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
    if (userErr || !userData.user || !ADMIN_EMAILS.includes(userData.user.email ?? "")) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 });
    const [meals, workouts, weights, subs] = await Promise.all([
      admin.from("meals").select("id", { count: "exact", head: true }),
      admin.from("workouts").select("id", { count: "exact", head: true }),
      admin.from("weights").select("id", { count: "exact", head: true }),
      admin.from("subscriptions").select("id", { count: "exact", head: true }),
    ]);

    const userList = (users?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }));

    return new Response(
      JSON.stringify({
        counts: {
          users: userList.length,
          meals: meals.count ?? 0,
          workouts: workouts.count ?? 0,
          weights: weights.count ?? 0,
          subscriptions: subs.count ?? 0,
        },
        users: userList,
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
