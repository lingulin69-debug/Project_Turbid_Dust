-- 1. Create Identity Role Enum (if not exists)
DO $$ BEGIN 
    CREATE TYPE identity_role_type AS ENUM ('citizen', 'apostate', 'liquidator'); 
EXCEPTION 
    WHEN duplicate_object THEN null; 
END $$; 

-- 2. Create or Update td_users table
CREATE TABLE IF NOT EXISTS public.td_users ( 
    id SERIAL PRIMARY KEY, 
    username TEXT UNIQUE NOT NULL, 
    faction TEXT NOT NULL CHECK (faction IN ('Turbid', 'Pure')), 
    identity_role identity_role_type DEFAULT 'citizen', 
    is_high_affinity_candidate BOOLEAN DEFAULT false, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP 
);

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
