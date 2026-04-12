-- 20260412_wave12_load_delivery_notification_trigger.sql
-- Haul Command Wave 12: Trigger Facility Review Push Notification on Load Close

CREATE OR REPLACE FUNCTION public.trigger_facility_review_on_load_close()
RETURNS TRIGGER AS $$
DECLARE
  v_escort_profile_id UUID;
  v_operator_user_id UUID;
  v_dest_name TEXT;
BEGIN
  -- We only want to fire when status specifically transitions to 'closed'
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    
    -- 1. Get the escort_profile_id that successfully accepted the load
    SELECT escort_profile_id INTO v_escort_profile_id
    FROM public.offers
    WHERE load_id = NEW.id AND status = 'accepted'
    LIMIT 1;

    IF v_escort_profile_id IS NOT NULL THEN
      -- 2. Get the auth.users UUID for that profile
      SELECT user_id INTO v_operator_user_id
      FROM public.profiles
      WHERE id = v_escort_profile_id
      LIMIT 1;

      IF v_operator_user_id IS NOT NULL THEN
        -- 3. Prepare the destination name (e.g. City, State) if not specifically named
        v_dest_name := COALESCE(NEW.dest_city || ', ' || NEW.dest_state, 'the destination facility');

        -- 4. Insert directly into hc_notifications
        -- The comms-core or push-worker will pick this up from 'queued' state
        INSERT INTO public.hc_notifications (
          user_id,
          title,
          body,
          data_json,
          channel,
          status,
          created_at
        ) VALUES (
          v_operator_user_id,
          'Load Complete! How was the drop-off?',
          'Tell operators what it''s like to drop off at ' || v_dest_name || '. Enter your field notes now.',
          jsonb_build_object(
            'action', 'facility_review',
            'load_id', NEW.id,
            'facility_name', v_dest_name,
            'urgency', 'normal'
          ),
          'push',
          'queued',
          now()
        );
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS trg_load_closed_facility_review ON public.loads;

-- Create the trigger
CREATE TRIGGER trg_load_closed_facility_review
AFTER UPDATE ON public.loads
FOR EACH ROW
EXECUTE FUNCTION public.trigger_facility_review_on_load_close();
