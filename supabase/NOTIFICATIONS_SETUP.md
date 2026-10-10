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

- `VAPID_PUBLIC_KEY`: the public P-256 key corresponding to the private key.
- `VAPID_PRIVATE_KEY`: the private VAPID key; server-side secret only.
- `VAPID_SUBJECT`: a `mailto:` contact or valid HTTPS URL.
- `APP_BASE_URL`: `https://prince6844.github.io/MyPlan/`.

Deploy both `send-push-notification` and `process-scheduled-notifications`. Keep JWT verification enabled: user-initiated sends authenticate as the user, and the scheduled processor additionally requires the service-role JWT bearer token. Do not use a publishable/secret API key as this bearer value; the Vault `service_role_key` must be the service-role JWT recognized by the deployed Edge Function.

Set the GitHub Actions repository secret `VITE_VAPID_PUBLIC_KEY` to the exact public key configured above if overriding the public key currently bundled as the frontend default. This is intentionally a public key; the private key must never use a `VITE_*` name. Rebuild and redeploy after changing it. Existing browser subscriptions are tied to a VAPID key pair and must be re-subscribed after key rotation.

## Notifications and timezone behavior

Users must sign in, select **Enable Notifications**, and grant browser permission. The subscription is upserted for the authenticated user under the existing RLS policies. Settings store an IANA timezone (default `Asia/Kolkata`); the server evaluates each user's summary/review time and task wall-clock dates in that timezone. Task reminders use the selected lead time and can catch up for 15 minutes if a scheduled invocation is late. Delivery claims are unique per user and scheduled occurrence. Failed sends can retry; successful claims are not sent again. Invalid (404/410) endpoints are removed.

## Verify end-to-end delivery

1. Use a supported regular (non-private) browser window on the HTTPS Pages URL. Chrome Incognito does not support Push API subscriptions and can report `AbortError: Registration failed - permission denied` even while `Notification.permission` says `granted`; browsers intentionally provide no reliable private-mode feature detection. In Settings, confirm permission is granted and the device subscription is saved, then select **Send Test Notification**. This confirms the Edge Function received provider acceptance only.
2. To verify delivery with the app closed, create an authenticated task reminder a few minutes ahead on that subscribed device, close every MyPlan tab/window, and leave the browser/device online with OS notifications allowed. Wait for the scheduled function to run and confirm the task notification appears. Check the Edge Function logs and `notification_deliveries`/`notification_logs` if it does not.
3. Do not treat a successful test while the app is open, a successful provider HTTP response, or an active browser permission as proof of background/device delivery.

If the private VAPID key was deployed or the ignored local `supabase.zip` archive was shared outside a trusted environment, generate a new VAPID pair and update the Supabase secrets and GitHub `VITE_VAPID_PUBLIC_KEY` together. Re-subscription is required after rotating the pair.
