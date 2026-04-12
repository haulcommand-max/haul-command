-- 1. USER ROLES (Authentication Bridge)
-- Links a Supabase auth.user to their primary persona.
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('broker', 'operator', 'admin')),
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = id);

-- 2. BROKER PROFILES (The Demand Side)
CREATE TABLE IF NOT EXISTS public.broker_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.user_roles(id) ON DELETE CASCADE UNIQUE,
  company_name text NOT NULL,
  mc_number text,
  usdot_number text,
  is_verified boolean DEFAULT false,
  rating float DEFAULT 5.0,
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public broker profile visibility" ON public.broker_profiles FOR SELECT USING (true);
CREATE POLICY "Brokers can update own" ON public.broker_profiles FOR UPDATE USING (auth.uid() = user_id);

-- 3. THE LOAD BOARD (Freight matching core)
CREATE TABLE IF NOT EXISTS public.loads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id uuid REFERENCES public.broker_profiles(id) ON DELETE CASCADE,
  
  -- Routing
  origin_city text NOT NULL,
  origin_state text NOT NULL,
  destination_city text NOT NULL,
  destination_state text NOT NULL,
  
  -- Logistics details
  pickup_date timestamp NOT NULL,
  load_type text NOT NULL,                  
  required_services text[] DEFAULT '{}',    
  price_cents integer NOT NULL,             
  
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_transit', 'completed', 'canceled')),
  
  -- THE BRIDGE: Links the load directly to your 1.56M Phase 1 records once assigned
  assigned_operator_id uuid REFERENCES public.directory_listings(id), 
  
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible to all authenticated users" ON public.loads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Brokers control own loads" ON public.loads FOR ALL USING (
  broker_id IN (SELECT id FROM public.broker_profiles WHERE user_id = auth.uid())
);

-- 4. LOAD BIDS (Operator Marketplace Competition)
CREATE TABLE IF NOT EXISTS public.load_bids (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id uuid REFERENCES public.loads(id) ON DELETE CASCADE,
  operator_id uuid REFERENCES public.directory_listings(id) ON DELETE CASCADE,
  bid_amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp DEFAULT now()
);
ALTER TABLE public.load_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers see bids, Operators see own bids" ON public.load_bids FOR SELECT USING (
  operator_id IN (SELECT id FROM public.directory_listings WHERE claimed_by = auth.uid())
  OR 
  load_id IN (SELECT id FROM public.loads WHERE broker_id IN (SELECT id FROM public.broker_profiles WHERE user_id = auth.uid()))
);

-- 5. ESCROW PAYMENTS (Secure Financial Routing)
CREATE TABLE IF NOT EXISTS public.escrow_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id uuid REFERENCES public.loads(id) ON DELETE CASCADE,
  payer_broker_id uuid REFERENCES public.broker_profiles(id),
  receiver_operator_id uuid REFERENCES public.directory_listings(id),
  amount_cents integer NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  status text NOT NULL DEFAULT 'held' CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  created_at timestamp DEFAULT now(),
  released_at timestamp
);
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view own escrow" ON public.escrow_payments FOR SELECT USING (
  payer_broker_id IN (SELECT id FROM public.broker_profiles WHERE user_id = auth.uid())
  OR 
  receiver_operator_id IN (SELECT id FROM public.directory_listings WHERE claimed_by = auth.uid())
);
