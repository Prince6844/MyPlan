-- Run after enabling pg_cron, pg_net, and Vault in the Supabase project.
-- Create Vault secrets named "project_url" (project URL, no trailing slash)
-- and "service_role_key" in the Dashboard before scheduling. This secret must
-- be the actual service-role JWT used by the processor's Authorization check;
-- never put it in this file.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'process-scheduled-notifications-every-minute';

SELECT cron.schedule(
    'process-scheduled-notifications-every-minute',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := (
            SELECT decrypted_secret
            FROM vault.decrypted_secrets
            WHERE name = 'project_url'
        ) || '/functions/v1/process-scheduled-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (
                SELECT decrypted_secret
                FROM vault.decrypted_secrets
                WHERE name = 'service_role_key'
            )
        ),
        body := '{}'::jsonb
    );
    $$
);
