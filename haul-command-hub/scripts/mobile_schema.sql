-- migration: mobile_earnings_schema
-- Adds necessary columns to the profiles table for mobile app features

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS lifetime_earned_cents BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS month_earned_cents BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missed_money_cents BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS roi_multiple NUMERIC(10, 2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS listing_claimed BOOLEAN DEFAULT false;

-- Create an index to speed up listing status queries
CREATE INDEX IF NOT EXISTS idx_profiles_listing_claimed ON public.profiles(listing_claimed);
