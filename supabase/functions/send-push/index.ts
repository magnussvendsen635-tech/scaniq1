// Send web push notifications to subscribed users.
// Called by cron job (send-reminders) — protected via CRON_SECRET header.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@kcally.app";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authentication: either valid user JWT, or cron secret header
    const cronHeader = req.headers.get("x-cron-secret");
    const isCronCall = CRON_SECRET && cronHeader === CRON_SECRET;

    let callerUserId: string | null = null;
    if (!isCronCall) {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      if (!token) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const authClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: userErr } = await authClient.auth.getUser(token);
      if (userErr || !userData.user) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callerUserId = userData.user.id;
    }

    const body = (await req.json()) as PushPayload;
    if (!body.title || !body.body) {
      return new Response(JSON.stringify({ error: "title and body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Non-cron callers can only push to themselves
    let targets: string[] = [];
    if (isCronCall) {
      if (body.user_ids?.length) targets = body.user_ids;
      else if (body.user_id) targets = [body.user_id];
      else targets = []; // empty = all in query
    } else {
      targets = [callerUserId!];
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    let query = admin.from("push_subscriptions").select("id, endpoint, p256dh, auth, user_id");
    if (targets.length) query = query.in("user_id", targets);

    const { data: subs, error: subsErr } = await query;
    if (subsErr) throw subsErr;

    const payload = JSON.stringify({
      title: body.title,
      body: body.body,
      url: body.url || "/",
      tag: body.tag,
    });

    let sent = 0;
    let removed = 0;
    for (const s of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
          removed++;
        } else {
          console.error("push failed", status, err?.body);
        }
      }
    }

    return new Response(JSON.stringify({ sent, removed, total: subs?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message || "internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
