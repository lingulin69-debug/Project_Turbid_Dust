-- Ensure td_users table exists and has correct columns
CREATE TABLE IF NOT EXISTS td_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    oc_name text UNIQUE NOT NULL,
    simple_password text,
    faction text CHECK (faction IN ('Turbid', 'Pure')),
    identity_role text DEFAULT 'citizen' CHECK (identity_role IN ('citizen', 'apostate', 'liquidator')),
    inventory jsonb DEFAULT '[]',
    wardrobe jsonb DEFAULT '[]',
    coins integer DEFAULT 10,
    daily_coin_earned integer DEFAULT 0,
    collected_shards integer DEFAULT 0,
    last_reset_time timestamp with time zone DEFAULT now(),
    is_in_lottery_pool boolean DEFAULT false,
    is_high_affinity_candidate boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Ensure identity_role check constraint includes 'liquidator'
ALTER TABLE td_users 
DROP CONSTRAINT IF EXISTS td_users_identity_role_check;

ALTER TABLE td_users 
ADD CONSTRAINT td_users_identity_role_check 
CHECK (identity_role IN ('citizen', 'apostate', 'liquidator'));

-- Ensure RLS is enabled
ALTER TABLE td_users ENABLE ROW LEVEL SECURITY;

-- Allow all access policy (Dev Mode)
DROP POLICY IF EXISTS "Allow all access to td_users" ON td_users;
CREATE POLICY "Allow all access to td_users" ON td_users FOR ALL USING (true) WITH CHECK (true);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
