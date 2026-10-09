// ============================================================================
// Supabase Edge Function: send-push-notification
// Sends standard Web Push notifications to all registered devices of a user
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "BKftqAQCkGtveJJA8-xzMWDp0O4uXPUduaH9zbVeZcspyQiEm84gAt-mZ7IuZyXG_7i0TA3uSaps-vROxP8S8mU";
    
    
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
      if (!vapidPrivateKey) {
         throw new Error("VAPID_PRIVATE_KEY is not configured");
    }
    
    
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@myplan.app";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase backend credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Configure VAPID details
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller authentication
    const authHeader = req.headers.get("Authorization");
    let callerUserId: string | null = null;
    let isServiceRole = false;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (token === supabaseServiceKey) {
        isServiceRole = true;
      } else {
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (!authErr && user) {
          callerUserId = user.id;
        }
      }
    }

    const { user_id, title, body, notification_type = "test", data = {} } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing user_id, title, or body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Security check: non-service callers can only send notifications to their own account
    if (!isServiceRole && callerUserId !== user_id) {
      return new Response(JSON.stringify({ error: "Unauthorized: You can only notify your own account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all push subscriptions for this user
    const { data: subscriptions, error: subErr } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subErr) {
      throw subErr;
    }

    if (!subscriptions || subscriptions.length === 0) {
      // Record in notification logs as pending/no_subscription
      await supabaseAdmin.from("notification_logs").insert({
        user_id,
        notification_type,
        title,
        body,
        status: "no_subscription",
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No push subscriptions found for this user. Please enable notifications on your device." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      type: notification_type,
      data,
    });

    let successCount = 0;
    const expiredIds: string[] = [];

    // Send push to each device subscription
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };
          await webpush.sendNotification(pushSubscription, payload);
          successCount++;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          console.error(`Failed to push to endpoint ${sub.endpoint}:`, err);
          // 404 or 410 indicates expired/unsubscribed endpoint
          if (statusCode === 404 || statusCode === 410) {
            expiredIds.push(sub.id);
          }
        }
      })
    );

    // Prune expired or invalid subscriptions
    if (expiredIds.length > 0) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("id", expiredIds);
    }

    // Log the notification
    await supabaseAdmin.from("notification_logs").insert({
      user_id,
      notification_type,
      title,
      body,
      status: successCount > 0 ? "sent" : "failed",
      sent_at: successCount > 0 ? new Date().toISOString() : null,
    });

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Notification dispatched to ${successCount} device(s)`,
        delivered: successCount,
        expired_pruned: expiredIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("send-push-notification fatal error:", err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
