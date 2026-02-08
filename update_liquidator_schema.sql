-- 1. Add 'liquidator' to identity_role check constraint
ALTER TABLE td_users 
DROP CONSTRAINT IF EXISTS td_users_identity_role_check;

ALTER TABLE td_users 
ADD CONSTRAINT td_users_identity_role_check 
CHECK (identity_role IN ('citizen', 'apostate', 'liquidator'));

-- 2. Create liquidator_actions table
CREATE TABLE IF NOT EXISTS liquidator_actions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES td_users(id) ON DELETE CASCADE,
    target_oc_name text NOT NULL,
    scan_result text CHECK (scan_result IN ('positive', 'negative')), -- positive=apostate, negative=citizen/other
    chapter text NOT NULL,
    executed_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, chapter) -- Limit 1 per chapter
);

-- RLS Policies
ALTER TABLE liquidator_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own liquidator actions"
ON liquidator_actions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own liquidator actions"
ON liquidator_actions FOR INSERT
WITH CHECK (auth.uid() = user_id);
