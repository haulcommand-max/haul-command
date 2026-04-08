CREATE TABLE IF NOT EXISTS notification_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  data        jsonb,
  read_at     timestamptz,
  push_sent   boolean NOT NULL DEFAULT false,
  push_sent_at timestamptz,
  sms_sent    boolean NOT NULL DEFAULT false,
  sms_sent_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Note: user_id foreign key constraint removed temporarily in case profiles does not exist yet.
-- This ensures the system does not break if the auth sync is using a different table structure in the new app.

CREATE INDEX IF NOT EXISTS ne_user_id_idx    ON notification_events(user_id);
CREATE INDEX IF NOT EXISTS ne_read_idx       ON notification_events(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS ne_created_idx    ON notification_events(created_at DESC);

ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY ne_owner ON notification_events FOR ALL USING (user_id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
