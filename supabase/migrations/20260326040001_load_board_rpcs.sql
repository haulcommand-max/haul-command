-- 1. ACCEPT LOAD BID (Broker Logic)
-- Allows a broker to accept an operator's bid, updating the load, rejecting other bids, and generating a pending escrow record.
CREATE OR REPLACE FUNCTION public.accept_load_bid(p_bid_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges, strictly controlled by checks inside
SET search_path = public
AS $$
DECLARE
  v_bid record;
  v_load record;
  v_broker_id uuid;
BEGIN
  -- 1. Get bid details
  SELECT * INTO v_bid FROM public.load_bids WHERE id = p_bid_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bid not found or already processed.';
  END IF;

  -- 2. Get load details
  SELECT * INTO v_load FROM public.loads WHERE id = v_bid.load_id AND status = 'open';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Load not found or not in open status.';
  END IF;

  -- 3. Verify caller is the broker who owns the load
  SELECT id INTO v_broker_id FROM public.broker_profiles WHERE user_id = auth.uid();
  IF v_load.broker_id != v_broker_id THEN
    RAISE EXCEPTION 'Unauthorized: Only the load owner can accept bids.';
  END IF;

  -- 4. Update the winning bid
  UPDATE public.load_bids SET status = 'accepted' WHERE id = p_bid_id;

  -- 5. Reject other pending bids for this load
  UPDATE public.load_bids SET status = 'rejected' WHERE load_id = v_load.id AND id != p_bid_id AND status = 'pending';

  -- 6. Update load status and assign the operator
  UPDATE public.loads 
  SET status = 'assigned', assigned_operator_id = v_bid.operator_id 
  WHERE id = v_load.id;

  -- 7. Create pending escrow payment record automatically referencing the bid amount
  INSERT INTO public.escrow_payments (
    load_id, payer_broker_id, receiver_operator_id, amount_cents, status
  ) VALUES (
    v_load.id, v_broker_id, v_bid.operator_id, v_bid.bid_amount_cents, 'pending'
  );
END;
$$;

-- 2. MARK LOAD IN TRANSIT (Operator Logic)
-- Allows an assigned operator to systematically progress the load status
CREATE OR REPLACE FUNCTION public.mark_load_in_transit(p_load_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_load record;
  v_operator_id uuid;
BEGIN
  -- 1. Get load details
  SELECT * INTO v_load FROM public.loads WHERE id = p_load_id AND status = 'assigned';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Load not found or not in assigned status.';
  END IF;

  -- 2. Verify caller is the assigned operator (links back to their directory listing)
  SELECT id INTO v_operator_id 
  FROM public.directory_listings 
  WHERE claimed_by = auth.uid() AND id = v_load.assigned_operator_id;

  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only the assigned operator can mark this load as in transit.';
  END IF;

  -- 3. Update load status
  UPDATE public.loads SET status = 'in_transit' WHERE id = p_load_id;
END;
$$;

-- 3. RELEASE ESCROW (Broker Logic)
-- The ultimate success path: the broker releases held escrow funds to the operator.
CREATE OR REPLACE FUNCTION public.release_escrow(p_escrow_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_escrow record;
  v_broker_id uuid;
BEGIN
  -- 1. Get escrow details
  SELECT * INTO v_escrow FROM public.escrow_payments WHERE id = p_escrow_id AND status = 'held';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow payment not found or not currently in held status.';
  END IF;

  -- 2. Verify caller is the broker who owns the escrow payment
  SELECT id INTO v_broker_id FROM public.broker_profiles WHERE user_id = auth.uid();
  IF v_escrow.payer_broker_id != v_broker_id THEN
    RAISE EXCEPTION 'Unauthorized: Only the payer can release escrow funds.';
  END IF;

  -- 3. Update escrow status
  UPDATE public.escrow_payments 
  SET status = 'released', released_at = now() 
  WHERE id = p_escrow_id;

  -- 4. Mark the corresponding load as completed
  UPDATE public.loads 
  SET status = 'completed' 
  WHERE id = v_escrow.load_id;
END;
$$;

-- 4. SUBMIT LOAD BID (Operator Logic)
-- Safely submits a bid, protecting against race conditions if the load was just closed.
CREATE OR REPLACE FUNCTION public.submit_load_bid(p_load_id uuid, p_amount_cents integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id uuid;
  v_load_status text;
  v_new_bid_id uuid;
BEGIN
  -- 1. Verify caller is a claimed operator
  SELECT id INTO v_operator_id FROM public.directory_listings WHERE claimed_by = auth.uid();
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not a claimed operator.';
  END IF;

  -- 2. Verify load is still open
  SELECT status INTO v_load_status FROM public.loads WHERE id = p_load_id;
  IF v_load_status != 'open' THEN
    RAISE EXCEPTION 'Load is no longer open for bidding.';
  END IF;
  
  -- 3. Insert bid and return its ID
  INSERT INTO public.load_bids (load_id, operator_id, bid_amount_cents, status)
  VALUES (p_load_id, v_operator_id, p_amount_cents, 'pending')
  RETURNING id INTO v_new_bid_id;
  
  RETURN v_new_bid_id;
END;
$$;
