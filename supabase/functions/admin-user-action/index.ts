import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  action: "ban" | "unban" | "delete";
  user_id: string;
  reason?: string;
}

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
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: u.user.id });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = (await req.json()) as Body;
    if (!body?.user_id || !body?.action)
      return new Response(JSON.stringify({ error: "missing params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (body.action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(body.user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.action === "ban") {
      await admin.from("profiles").update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        ban_reason: body.reason ?? null,
      }).eq("id", body.user_id);
      // Invalidate all sessions for the banned user
      await admin.auth.admin.updateUserById(body.user_id, { ban_duration: "876000h" });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.action === "unban") {
      await admin.from("profiles").update({
        is_banned: false,
        banned_at: null,
        ban_reason: null,
      }).eq("id", body.user_id);
      await admin.auth.admin.updateUserById(body.user_id, { ban_duration: "none" });
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
