-- 確保身分欄位與高契合候選人欄位存在 
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'td_users') THEN 
        CREATE TABLE public.td_users ( 
            id SERIAL PRIMARY KEY, 
            username TEXT UNIQUE NOT NULL, 
            faction TEXT NOT NULL, 
            identity_role TEXT DEFAULT 'citizen', 
            is_high_affinity_candidate BOOLEAN DEFAULT false, 
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP 
        ); 
    END IF; 
END $$; 

-- 確保 identity_role 和 is_high_affinity_candidate 欄位存在（防止表已存在但欄位缺失） 
ALTER TABLE public.td_users ADD COLUMN IF NOT EXISTS identity_role TEXT DEFAULT 'citizen'; 
ALTER TABLE public.td_users ADD COLUMN IF NOT EXISTS is_high_affinity_candidate BOOLEAN DEFAULT false;
