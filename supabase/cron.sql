-- ====================================================================
-- SUPABASE CRON JOB CONFIGURATION (pg_cron + pg_net)
-- Centralized 1-minute notification trigger
-- ====================================================================

-- 1. Enable pg_cron and pg_net extensions in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Remove previous scheduled job if exists
SELECT cron.unschedule('process-scheduled-notifications-every-minute')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-notifications-every-minute'
);

-- 3. Register the 1-minute central scheduler
-- REPLACE:
-- - 'https://YOUR_PROJECT_ID.supabase.co' with your Supabase Project URL
-- - 'YOUR_SERVICE_ROLE_KEY' with your Supabase service_role key (Project Settings -> API)
SELECT cron.schedule(
    'process-scheduled-notifications-every-minute',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-scheduled-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
    );
    $$
);

-- Note: Alternatively, replace the current_setting with your direct strings:
-- url := 'https://xyzcompany.supabase.co/functions/v1/process-scheduled-notifications'
-- 'Authorization', 'Bearer eyJhbGciOi...'
