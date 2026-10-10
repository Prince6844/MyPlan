import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const notificationTypes = new Set(["morning_summary", "night_review", "task_reminder", "test"]);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
      throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY must be configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice("Bearer ".length);
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const isServiceRole = token === serviceRoleKey;
    let callerUserId: string | null = null;
    if (!isServiceRole) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) callerUserId = user.id;
    }

    const body = await req.json();
    const userId = body.user_id;
    const title = body.title;
    const message = body.body;
    const type = body.notification_type ?? "test";
    const data = body.data ?? {};
    if (
      typeof userId !== "string" || typeof title !== "string" || !title.trim() ||
      typeof message !== "string" || !notificationTypes.has(type) ||
      typeof data !== "object" || data === null || Array.isArray(data)
    ) {
      return new Response(JSON.stringify({ error: "Invalid notification payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isServiceRole && callerUserId !== userId) {
      return new Response(JSON.stringify({ error: "You can only notify your own account" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT") || "mailto:admin@myplan.app",
      vapidPublicKey,
      vapidPrivateKey,
    );
    const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);
    if (subscriptionError) throw subscriptionError;

    if (!subscriptions?.length) {
      const { error: logError } = await supabaseAdmin.from("notification_logs").insert({
        user_id: userId, notification_type: type, title, body: message, status: "no_subscription",
      });
      if (logError) console.error("Could not log missing push subscription:", logError.message);
      return new Response(JSON.stringify({
        success: false, delivered: 0, message: "No push subscriptions are registered for this account.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = JSON.stringify({ title, body: message, type, data: { ...data, type } });
    const expiredIds: string[] = [];
    let delivered = 0;
    await Promise.all(subscriptions.map(async subscription => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        }, payload);
        delivered++;
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        console.error("Web Push delivery failed:", error);
        if (statusCode === 404 || statusCode === 410) expiredIds.push(subscription.id);
      }
    }));

    if (expiredIds.length) {
      const { error } = await supabaseAdmin.from("push_subscriptions").delete().in("id", expiredIds);
      if (error) console.error("Could not remove expired push subscriptions:", error.message);
    }
    const sentAt = delivered ? new Date().toISOString() : null;
    const { error: logError } = await supabaseAdmin.from("notification_logs").insert({
      user_id: userId,
      notification_type: type,
      title,
      body: message,
      status: delivered > 0 ? "sent" : "failed",
      sent_at: sentAt,
    });
    if (logError) console.error("Could not persist notification delivery log:", logError.message);

    return new Response(JSON.stringify({
      success: delivered > 0,
      message: delivered > 0 ? `Push accepted by ${delivered} device(s).` : "Push was not accepted by any registered device.",
      delivered,
      expired_pruned: expiredIds.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("send-push-notification failed:", error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
