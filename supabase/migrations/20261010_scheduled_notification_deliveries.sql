CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    delivery_key TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sending', 'sent', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 1,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, delivery_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_scheduled
    ON public.notification_deliveries (user_id, scheduled_for);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notification deliveries" ON public.notification_deliveries;
CREATE POLICY "Users can view own notification deliveries"
    ON public.notification_deliveries FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON public.notification_deliveries TO authenticated;
REVOKE ALL ON public.notification_deliveries FROM anon;

CREATE OR REPLACE FUNCTION public.claim_notification_delivery(
    p_user_id UUID,
    p_delivery_key TEXT,
    p_notification_type TEXT,
    p_scheduled_for TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    claimed BOOLEAN := false;
BEGIN
    INSERT INTO public.notification_deliveries (
        user_id, delivery_key, notification_type, scheduled_for, status
    ) VALUES (
        p_user_id, p_delivery_key, p_notification_type, p_scheduled_for, 'sending'
    )
    ON CONFLICT (user_id, delivery_key) DO UPDATE
        SET status = 'sending',
            attempts = notification_deliveries.attempts + 1,
            attempted_at = now(),
            last_error = NULL
        WHERE notification_deliveries.status = 'failed'
           OR (notification_deliveries.status = 'sending'
               AND notification_deliveries.attempted_at < now() - interval '10 minutes')
    RETURNING true INTO claimed;

    RETURN COALESCE(claimed, false);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_delivery(UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_delivery(UUID, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
