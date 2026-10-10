# Supabase notifications setup

Push delivery while MyPlan is closed requires a deployed Supabase project, browser permission, valid VAPID keys, and the scheduled Edge Function. The app does not claim delivery if the Edge Function does not report at least one push accepted by a provider. Push support and display while closed depend on the browser, operating system, and device power/network settings.

## One-time database setup

1. Apply the existing migrations, including `20261010_scheduled_notification_deliveries.sql`.
2. Enable the `pg_cron`, `pg_net`, and Vault extensions in the Supabase Dashboard.
3. In Vault, create secrets named `project_url` (the project URL, without a trailing slash) and `service_role_key` (the project's service-role key).
4. Run [`cron.sql`](./cron.sql) in the SQL Editor. It schedules the processor every minute. Confirm the job appears in `cron.job` and inspect `net._http_response` if invocations fail.

The cron job and processor use the service-role key only server-side. Never put it in the frontend or commit it to SQL, source control, or a Vite `VITE_*` variable.

## Edge Function secrets and deployment

Set these Supabase Edge Function secrets using the Dashboard or `supabase secrets set`:

- `VAPID_PUBLIC_KEY`: the public P-256 key corresponding to the private key below.
- `VAPID_PRIVATE_KEY`: the private VAPID key; server-side secret only.
- `VAPID_SUBJECT`: a `mailto:` contact or valid HTTPS URL.
- `APP_BASE_URL`: `https://prince6844.github.io/MyPlan/`.

Deploy both `send-push-notification` and `process-scheduled-notifications`. Keep JWT verification enabled: user-initiated sends authenticate as the user, and the scheduled processor additionally requires the service-role bearer token.

Set the GitHub Actions repository secret `VITE_VAPID_PUBLIC_KEY` to the exact public key configured above if overriding the public key currently bundled as the frontend default. This is intentionally a public key; the private key must never use a `VITE_*` name. Rebuild and redeploy after changing it. Existing browser subscriptions are tied to a VAPID key pair and must be re-subscribed after key rotation.

## Notifications and timezone behavior

Users must sign in, select **Enable Notifications**, and grant browser permission. The subscription is upserted for the authenticated user under the existing RLS policies. Settings store an IANA timezone (default `Asia/Kolkata`); the server evaluates each user's summary/review time and task wall-clock dates in that timezone. Delivery claims are unique per user and scheduled occurrence. Failed sends can retry; successful claims are not sent again. Invalid (404/410) endpoints are removed.

If the private VAPID key was deployed or the ignored local `supabase.zip` archive was shared outside a trusted environment, generate a new VAPID pair and update the Supabase secrets and GitHub `VITE_VAPID_PUBLIC_KEY` together. Re-subscription is required after rotating the pair.
