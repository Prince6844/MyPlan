// ============================================================================
// Supabase Edge Function: process-scheduled-notifications
// Centralized minute-by-minute scheduler for Morning Digest, Night Review,
// and Task Reminders respecting each user's specific Timezone
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webpush from "npm:web-push@3.6.7";

serve(async (_req: Request) => {
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
      return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), { status: 500 });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    let sentMorningCount = 0;
    let sentNightCount = 0;
    let sentTaskCount = 0;

    // Helper to send push to all devices of a user
    const sendPush = async (userId: string, title: string, body: string, type: string, notifData: Record<string, unknown> = {}) => {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

      if (!subs || subs.length === 0) return 0;

      const payload = JSON.stringify({
        title,
        body,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        type,
        data: notifData,
      });

      let delivered = 0;
      const expired: string[] = [];

      for (const sub of subs) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          }, payload);
          delivered++;
        } catch (err: unknown) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            expired.push(sub.id);
          }
        }
      }

      if (expired.length > 0) {
        await supabase.from("push_subscriptions").delete().in("id", expired);
      }

      await supabase.from("notification_logs").insert({
        user_id: userId,
        notification_type: type,
        title,
        body,
        status: delivered > 0 ? "sent" : "failed",
        sent_at: delivered > 0 ? new Date().toISOString() : null,
      });

      return delivered;
    };

    // 1. Fetch all users with user_settings
    const { data: userSettingsList } = await supabase
      .from("user_settings")
      .select("*")
      .eq("notifications_enabled", true);

    if (userSettingsList && userSettingsList.length > 0) {
      for (const settings of userSettingsList) {
        const tz = settings.timezone || "Asia/Kolkata";

        // Local time calculation in user's timezone
        let localTimeStr = "00:00";
        let localDateStr = "2026-10-02";
        try {
          const timeParts = new Intl.DateTimeFormat("en-GB", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(now);
          localTimeStr = timeParts.substring(0, 5); // "HH:mm"

          const dateParts = new Intl.DateTimeFormat("en-CA", {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(now);
          localDateStr = dateParts; // "YYYY-MM-DD"
        } catch {
          continue;
        }

        // ==========================================
        // 2. MORNING SUMMARY
        // ==========================================
        const morningTarget = (settings.morning_summary_time || "07:00").substring(0, 5);
        if (settings.morning_summary_enabled && localTimeStr === morningTarget) {
          // Check idempotency: did we already send morning summary today?
          const { data: logs } = await supabase
            .from("notification_logs")
            .select("id")
            .eq("user_id", settings.user_id)
            .eq("notification_type", "morning_summary")
            .gte("created_at", `${localDateStr}T00:00:00`);

          if (!logs || logs.length === 0) {
            // Get today's tasks
            const { data: tasks } = await supabase
              .from("tasks")
              .select("*")
              .eq("user_id", settings.user_id)
              .eq("task_date", localDateStr)
              .order("task_time", { ascending: true });

            let body = "Good Morning! You have no tasks planned for today.";
            if (tasks && tasks.length > 0) {
              const taskLines = tasks.slice(0, 5).map(t => `${t.task_time.substring(0, 5)} ${t.title}`).join("\n");
              body = `Today you have ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}:\n${taskLines}`;
            }

            const count = await sendPush(settings.user_id, "Good Morning! 👋", body, "morning_summary", {
              date: localDateStr,
            });
            if (count > 0) sentMorningCount++;
          }
        }

        // ==========================================
        // 3. NIGHT REVIEW
        // ==========================================
        const nightTarget = (settings.night_review_time || "22:00").substring(0, 5);
        if (settings.night_review_enabled && localTimeStr === nightTarget) {
          const { data: logs } = await supabase
            .from("notification_logs")
            .select("id")
            .eq("user_id", settings.user_id)
            .eq("notification_type", "night_review")
            .gte("created_at", `${localDateStr}T00:00:00`);

          if (!logs || logs.length === 0) {
            // Check incomplete tasks for today
            const { data: pendingTasks } = await supabase
              .from("tasks")
              .select("*")
              .eq("user_id", settings.user_id)
              .eq("task_date", localDateStr)
              .eq("completed", false);

            let body = "Great job! All today's tasks are completed.";
            if (pendingTasks && pendingTasks.length > 0) {
              const names = pendingTasks.slice(0, 3).map(t => t.title).join("\n");
              body = `You have ${pendingTasks.length} tasks pending today.\nPending:\n${names}`;
            }

            const count = await sendPush(settings.user_id, "MyPlan 🌙", body, "night_review", {
              date: localDateStr,
            });
            if (count > 0) sentNightCount++;
          }
        }

        // ==========================================
        // 4. INDIVIDUAL TASK REMINDERS
        // ==========================================
        const { data: candidateTasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", settings.user_id)
          .eq("task_date", localDateStr)
          .eq("completed", false)
          .eq("reminder_enabled", true);

        if (candidateTasks && candidateTasks.length > 0) {
          for (const task of candidateTasks) {
            let isDue = false;
            let reminderText = "starts soon";

            if (task.custom_reminder_at) {
              // Custom reminder ISO comparison
              const remDate = new Date(task.custom_reminder_at);
              const diffMin = Math.abs((remDate.getTime() - now.getTime()) / 60000);
              if (diffMin <= 1.0) {
                isDue = true;
                reminderText = "reminder time reached";
              }
            } else {
              // Calculate reminder minutes before task_time
              const [th, tm] = task.task_time.split(":").map(Number);
              const [ch, cm] = localTimeStr.split(":").map(Number);
              const taskTotalMin = th * 60 + tm;
              const currentTotalMin = ch * 60 + cm;
              const remMinutes = task.reminder_minutes ?? 10;
              const dueMinute = taskTotalMin - remMinutes;

              if (currentTotalMin === dueMinute) {
                isDue = true;
                reminderText = remMinutes === 0 ? "starts now" : `starts in ${remMinutes} minutes`;
              }
            }

            if (isDue) {
              // Check idempotency for this task
              const { data: existingLogs } = await supabase
                .from("notification_logs")
                .select("id")
                .eq("user_id", settings.user_id)
                .eq("notification_type", "task_reminder")
                .ilike("title", `%${task.title}%`)
                .gte("created_at", `${localDateStr}T00:00:00`);

              if (!existingLogs || existingLogs.length === 0) {
                const title = "MyPlan 🔔";
                const body = `${task.title} ${reminderText}.`;
                const count = await sendPush(settings.user_id, title, body, "task_reminder", {
                  taskId: task.id,
                });
                if (count > 0) sentTaskCount++;
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked_users: userSettingsList?.length || 0,
        dispatched: {
          morning_summaries: sentMorningCount,
          night_reviews: sentNightCount,
          task_reminders: sentTaskCount,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Scheduled notifications process error:", err);
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
  }
});
