-- ═══════════════════════════════════════════════════════════════
-- Sprint: Automated Escrow & Campaign Triggers
-- Architecture: Supabase Database Triggers
-- Prevents Next.js timeout errors, handles balances at DB level
-- ═══════════════════════════════════════════════════════════════

-- 1. Automating Standing Order Escrow Drain
-- Whenever an occurrence completes, automatically deduct from the recurring schedule's escrow
CREATE OR REPLACE FUNCTION decrement_escrow_on_occurrence_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If an occurrence is marked 'completed' and it wasn't before
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Deduct the agreed_rate from the master schedule's escrow balance
        UPDATE recurring_schedules
        SET escrow_balance = escrow_balance - NEW.agreed_rate,
            updated_at = NOW()
        WHERE id = NEW.schedule_id;

        -- If escrow drops below threshold (e.g., less than one occurrence cost), 
        -- we could flag an alert here by inserting into a notifications table or changing status.
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_occurrence_completion_escrow ON schedule_occurrences;
CREATE TRIGGER trg_occurrence_completion_escrow
AFTER UPDATE OF status ON schedule_occurrences
FOR EACH ROW
EXECUTE FUNCTION decrement_escrow_on_occurrence_completion();


-- ═══════════════════════════════════════════════════════════════
-- 2. Campaign & Ad Boost Expiration Handler
-- Automatically switch ad grid campaigns and boosts to 'expired' when end_date passes
-- ═══════════════════════════════════════════════════════════════

-- We use a generic function that can be called via pg_cron (if enabled) 
-- or invoked by an edge function to clean up expired ads globally.

CREATE OR REPLACE FUNCTION expire_old_campaigns()
RETURNS integer AS $$
DECLARE
    expired_count integer := 0;
BEGIN
    -- Expire AdGrid Campaigns
    WITH updated_campaigns AS (
        UPDATE adgrid_campaigns
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'active' AND end_date < NOW()
        RETURNING id
    )
    SELECT count(*) INTO expired_count FROM updated_campaigns;

    -- Expire Ad Boosts
    WITH updated_boosts AS (
        UPDATE ad_boosts
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'active' AND end_date < NOW()
        RETURNING id
    )
    SELECT expired_count + count(*) INTO expired_count FROM updated_boosts;

    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- 3. Trigger for Pre-Funding Activation
-- Automatically sets a Standing Order schedule to active once pre-funding hits completed.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION activate_schedule_on_funding()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
        UPDATE recurring_schedules
        SET 
            status = 'active',
            escrow_balance = escrow_balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.schedule_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_activate_schedule_on_funding ON schedule_prefunding;
CREATE TRIGGER trg_activate_schedule_on_funding
AFTER UPDATE OF status ON schedule_prefunding
FOR EACH ROW
EXECUTE FUNCTION activate_schedule_on_funding();
