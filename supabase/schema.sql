-- ====================================================================
-- MYPLAN PRODUCTION DATABASE SCHEMA (Supabase / PostgreSQL)
-- Complete Authentication, Task Data Isolation & Web Push System
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_date DATE NOT NULL,
    task_time TIME NOT NULL,
    completed BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'Personal',
    reminder_enabled BOOLEAN DEFAULT false,
    reminder_minutes INTEGER DEFAULT 10,
    custom_reminder_at TIMESTAMPTZ NULL,
    repeat_type TEXT DEFAULT 'none',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    morning_summary_enabled BOOLEAN DEFAULT true,
    morning_summary_time TIME DEFAULT '07:00',
    night_review_enabled BOOLEAN DEFAULT true,
    night_review_time TIME DEFAULT '22:00',
    default_reminder_minutes INTEGER DEFAULT 10,
    notifications_enabled BOOLEAN DEFAULT false,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT push_subscriptions_user_endpoint_key UNIQUE(user_id, endpoint)
);

-- 5. NOTIFICATION LOGS TABLE (Supports idempotency & delivery tracking)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'morning_summary', 'night_review', 'task_reminder', 'test'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ NULL,
    status TEXT NOT NULL DEFAULT 'sent', -- 'pending', 'sent', 'failed'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_reminder ON public.tasks(reminder_enabled, completed);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_push_sub_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_logs_user_type_date ON public.notification_logs(user_id, notification_type, created_at);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES FOR TASKS (Complete User Isolation)
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

-- 9. RLS POLICIES FOR USER SETTINGS
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 10. RLS POLICIES FOR PUSH SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own subscriptions"
    ON public.push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert own subscriptions"
    ON public.push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update own subscriptions"
    ON public.push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own subscriptions"
    ON public.push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- 11. RLS POLICIES FOR NOTIFICATION LOGS
DROP POLICY IF EXISTS "Users can view own notification logs" ON public.notification_logs;
CREATE POLICY "Users can view own notification logs"
    ON public.notification_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification logs" ON public.notification_logs;
CREATE POLICY "Users can insert own notification logs"
    ON public.notification_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 12. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_tasks_updated_at ON public.tasks;
CREATE TRIGGER tr_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER tr_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER tr_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 13. AUTOMATIC USER SETTINGS INITIALIZATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id, timezone)
    VALUES (NEW.id, 'Asia/Kolkata')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
