CREATE TABLE IF NOT EXISTS public.td_users ( 
    id SERIAL PRIMARY KEY, 
    username TEXT UNIQUE NOT NULL, 
    faction TEXT NOT NULL, 
    identity_role TEXT DEFAULT 'citizen', 
    is_high_affinity_candidate BOOLEAN DEFAULT false, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP 
);