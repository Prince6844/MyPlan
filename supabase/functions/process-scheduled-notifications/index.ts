import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webpush from "npm:web-push@3.6.7";

const responseHeaders = { "Content-Type": "application/json" };
const minute = 60_000;
const deliveryWindow = 2 * minute;
const taskReminderCatchUpWindow = 15 * minute;
type NotificationType = "morning_summary" | "night_review" | "task_reminder";
type TaskRecord = {
  id: string;
  title: string;
  task_date: string;
  task_time: string;
  completed: boolean;
  reminder_enabled: boolean;
  reminder_minutes: number | null;
  custom_reminder_at: string | null;
};

const partsInZone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
};

const shiftDate = (value: string, days: number) => {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
};

const zonedDateTimeToEpoch = (date: string, time: string, timeZone: string): number | null => {
  const dateParts = date.split("-").map(Number);
  const timeParts = time.split(":").map(Number);
  if (dateParts.length !== 3 || timeParts.length < 2 || [...dateParts, ...timeParts].some(part => !Number.isFinite(part))) return null;
  const desired = Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], timeParts[2] || 0);
  let epoch = desired;
  for (let attempt = 0; attempt < 4; attempt++) {
    const local = partsInZone(new Date(epoch), timeZone);
    const represented = Date.UTC(
      Number(local.year), Number(local.month) - 1, Number(local.day),
      Number(local.hour), Number(local.minute), Number(local.second),
    );
    const adjustment = desired - represented;
    epoch += adjustment;
    if (adjustment === 0) break;
  }
  const resolved = partsInZone(new Date(epoch), timeZone);
  return Number(resolved.year) === dateParts[0] &&
    Number(resolved.month) === dateParts[1] &&
    Number(resolved.day) === dateParts[2] &&
    Number(resolved.hour) === timeParts[0] &&
    Number(resolved.minute) === timeParts[1]
    ? epoch
    : null;
};

const timeLabel = (epoch: number, timeZone: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(epoch));

serve(async req => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405, headers: responseHeaders,
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
    if (req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
      return new Response(JSON.stringify({ success: false, error: "Service-role authentication required" }), {
        status: 401, headers: responseHeaders,
      });
    }

    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:admin@myplan.app", vapidPublicKey, vapidPrivateKey);
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const now = new Date();
    const { data: settingsList, error: settingsError } = await supabase
      .from("user_settings")
      .select("user_id, timezone, notifications_enabled, morning_summary_enabled, morning_summary_time, night_review_enabled, night_review_time")
      .eq("notifications_enabled", true);
    if (settingsError) throw settingsError;

    let sentMorning = 0;
    let sentNight = 0;
    let sentTasks = 0;

    const dispatch = async (
      userId: string,
      type: NotificationType,
      key: string,
      scheduledFor: number,
      title: string,
      body: string,
      data: Record<string, unknown>,
    ): Promise<boolean> => {
      const { data: claimed, error: claimError } = await supabase.rpc("claim_notification_delivery", {
        p_user_id: userId,
        p_delivery_key: key,
        p_notification_type: type,
        p_scheduled_for: new Date(scheduledFor).toISOString(),
      });
      if (claimError) throw claimError;
      if (claimed !== true) return false;

      const { data: subscriptions, error: subscriptionError } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", userId);
      if (subscriptionError) throw subscriptionError;

      const expiredIds: string[] = [];
      let delivered = 0;
      await Promise.all((subscriptions || []).map(async subscription => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          }, JSON.stringify({ title, body, type, data: { ...data, deliveryKey: key, type } }));
          delivered++;
        } catch (error: unknown) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          console.error("Scheduled Web Push failed:", error);
          if (statusCode === 404 || statusCode === 410) expiredIds.push(subscription.id);
        }
      }));

      if (expiredIds.length) {
        const { error } = await supabase.from("push_subscriptions").delete().in("id", expiredIds);
        if (error) console.error("Could not remove expired subscriptions:", error.message);
      }

      const sentAt = delivered > 0 ? new Date().toISOString() : null;
      const lastError = delivered > 0 ? null : subscriptions?.length
        ? "Push service did not accept delivery for any registered device."
        : "No push subscriptions are registered.";
      const { error: statusError } = await supabase
        .from("notification_deliveries")
        .update({ status: delivered > 0 ? "sent" : "failed", sent_at: sentAt, last_error: lastError })
        .eq("user_id", userId)
        .eq("delivery_key", key);
      if (statusError) console.error("Could not persist scheduled delivery status:", statusError.message);

      const { error: logError } = await supabase.from("notification_logs").insert({
        user_id: userId,
        notification_type: type,
        title,
        body,
        scheduled_for: new Date(scheduledFor).toISOString(),
        sent_at: sentAt,
        status: delivered > 0 ? "sent" : subscriptions?.length ? "failed" : "no_subscription",
      });
      if (logError) console.error("Could not write scheduled notification log:", logError.message);
      return delivered > 0;
    };

    for (const settings of settingsList || []) {
      const timeZone = settings.timezone || "Asia/Kolkata";
      let today: string;
      let nowParts: Record<string, string>;
      try {
        nowParts = partsInZone(now, timeZone);
        today = `${nowParts.year}-${nowParts.month}-${nowParts.day}`;
      } catch (error) {
        console.error(`Invalid timezone configured for user ${settings.user_id}:`, error);
        continue;
      }
      const morningTime = (settings.morning_summary_time || "07:00").slice(0, 5);
      const morningScheduled = zonedDateTimeToEpoch(today, morningTime, timeZone);
      if (
        settings.morning_summary_enabled &&
        morningScheduled !== null &&
        now.getTime() >= morningScheduled &&
        now.getTime() - morningScheduled <= deliveryWindow
      ) {
        const { data: tasks, error } = await supabase
          .from("tasks").select("title, task_time").eq("user_id", settings.user_id)
          .eq("task_date", today).order("task_time", { ascending: true });
        if (error) throw error;
        const lines = (tasks || []).slice(0, 5).map(task => `${String(task.task_time).slice(0, 5)} ${task.title}`);
        const message = tasks?.length
          ? `You have ${tasks.length} task${tasks.length === 1 ? "" : "s"} today.\n${lines.join("\n")}`
          : "You have no tasks planned for today.";
        if (await dispatch(settings.user_id, "morning_summary", `morning:${today}`, morningScheduled, "Your MyPlan morning summary", message, { date: today, url: selfBaseUrl() })) sentMorning++;
      }

      const nightTime = (settings.night_review_time || "22:00").slice(0, 5);
      const nightScheduled = zonedDateTimeToEpoch(today, nightTime, timeZone);
      if (
        settings.night_review_enabled &&
        nightScheduled !== null &&
        now.getTime() >= nightScheduled &&
        now.getTime() - nightScheduled <= deliveryWindow
      ) {
        const { data: pending, error } = await supabase
          .from("tasks").select("title").eq("user_id", settings.user_id)
          .eq("task_date", today).eq("completed", false);
        if (error) throw error;
        const names = (pending || []).slice(0, 4).map(task => task.title).join(", ");
        const message = pending?.length ? `${pending.length} task${pending.length === 1 ? "" : "s"} still need attention: ${names}` : "You completed everything planned for today. Great work!";
        if (await dispatch(settings.user_id, "night_review", `night:${today}`, nightScheduled, "Your MyPlan evening review", message, { date: today })) sentNight++;
      }

      const rangeStart = shiftDate(today, -1);
      const rangeEnd = shiftDate(today, 1);
      const { data: datedTasks, error: datedTaskError } = await supabase
        .from("tasks").select("id, title, task_date, task_time, completed, reminder_enabled, reminder_minutes, custom_reminder_at")
        .eq("user_id", settings.user_id).eq("completed", false).eq("reminder_enabled", true)
        .gte("task_date", rangeStart).lte("task_date", rangeEnd);
      if (datedTaskError) throw datedTaskError;

      const { data: customTasks, error: customTaskError } = await supabase
        .from("tasks").select("id, title, task_date, task_time, completed, reminder_enabled, reminder_minutes, custom_reminder_at")
        .eq("user_id", settings.user_id).eq("completed", false).eq("reminder_enabled", true)
        .not("custom_reminder_at", "is", null)
        .gte("custom_reminder_at", new Date(now.getTime() - taskReminderCatchUpWindow).toISOString())
        .lte("custom_reminder_at", now.toISOString());
      if (customTaskError) throw customTaskError;

      const candidates = new Map<string, TaskRecord>();
      for (const task of [...(datedTasks || []), ...(customTasks || [])] as TaskRecord[]) candidates.set(task.id, task);
      for (const task of candidates.values()) {
        const taskEpoch = zonedDateTimeToEpoch(task.task_date, String(task.task_time).slice(0, 8), timeZone);
        if (taskEpoch === null) {
          console.error(`Invalid task date or time for task ${task.id}`);
          continue;
        }
        const reminderEpoch = task.custom_reminder_at
          ? new Date(task.custom_reminder_at).getTime()
          : taskEpoch - Math.max(0, task.reminder_minutes ?? 10) * minute;
        if (!Number.isFinite(reminderEpoch) || reminderEpoch > now.getTime() || now.getTime() - reminderEpoch > taskReminderCatchUpWindow) continue;

        const key = `task:${task.id}:${new Date(reminderEpoch).toISOString()}`;
        const taskLabel = timeLabel(taskEpoch, timeZone);
        const minutesUntil = Math.max(0, Math.ceil((taskEpoch - now.getTime()) / minute));
        const timing = minutesUntil === 0 ? "starts now" : `starts in ${minutesUntil} minute${minutesUntil === 1 ? "" : "s"}`;
        const message = `${task.title} · ${taskLabel} (${timing}).`;
        if (await dispatch(settings.user_id, "task_reminder", key, reminderEpoch, `Reminder: ${task.title}`, message, { taskId: task.id })) sentTasks++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      checked_users: settingsList?.length || 0,
      dispatched: { morning_summaries: sentMorning, night_reviews: sentNight, task_reminders: sentTasks },
    }), { headers: responseHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Scheduled notification processing failed:", error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: responseHeaders,
    });
  }
});

function selfBaseUrl(): string {
  return Deno.env.get("APP_BASE_URL") || "https://prince6844.github.io/MyPlan/";
}
