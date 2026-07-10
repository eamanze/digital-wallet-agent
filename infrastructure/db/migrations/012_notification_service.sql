BEGIN;

ALTER TABLE notifications.notifications
  ADD COLUMN IF NOT EXISTS event_id UUID,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS template_code TEXT,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS failure_code TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS notifications_event_channel_uidx ON notifications.notifications(event_id, channel, user_id) WHERE event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS notifications.preferences (
  user_id UUID PRIMARY KEY REFERENCES identity.users(id),
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  security_enabled BOOLEAN NOT NULL DEFAULT true,
  marketing_enabled BOOLEAN NOT NULL DEFAULT false,
  transaction_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications.dead_letter_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications.notifications(id),
  event_id UUID,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  failure_code TEXT,
  attempts INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redriven_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS notification_retry_idx ON notifications.notifications(status, next_retry_at) WHERE status='queued';

COMMIT;
