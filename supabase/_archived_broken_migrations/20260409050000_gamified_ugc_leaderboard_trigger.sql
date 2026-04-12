-- ==============================================================================
-- Haul Command — Gamified UGC Leaderboard Trigger
-- Purpose: Automatically award Trust Points to Operators who post Corridor Alerts
-- ==============================================================================

-- 1. Ensure the corridor alerts table tracks the author
ALTER TABLE public.corridor_alerts 
ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.hc_global_operators(id);

-- 2. Create the Trigger Function to award "Trust Points" automatically
CREATE OR REPLACE FUNCTION public.reward_ugc_trust_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only reward if an operator actually posted it
  IF NEW.author_id IS NOT NULL THEN
    
    -- Upsert the leaderboard entry to give them +10 local trust points
    INSERT INTO public.leaderboard_entries (user_id, category, country, score, post_count, updated_at)
    VALUES (NEW.author_id, 'operator', NEW.country_code, 10, 1, now())
    ON CONFLICT (id) DO UPDATE 
    SET 
        score = public.leaderboard_entries.score + 10,
        post_count = public.leaderboard_entries.post_count + 1,
        updated_at = now();
        
    -- Update their overall Report Card trust score
    UPDATE public.report_cards 
    SET overall_score = overall_score + 10 
    WHERE user_id = NEW.author_id;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Wire the SQL Trigger to the Corridor Alerts table
DROP TRIGGER IF EXISTS trigger_reward_ugc_trust_points ON public.corridor_alerts;
CREATE TRIGGER trigger_reward_ugc_trust_points
AFTER INSERT ON public.corridor_alerts
FOR EACH ROW
EXECUTE FUNCTION public.reward_ugc_trust_points();
