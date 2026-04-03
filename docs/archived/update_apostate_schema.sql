-- Add identity columns to td_users
ALTER TABLE td_users 
ADD COLUMN IF NOT EXISTS identity_role text DEFAULT 'citizen' CHECK (identity_role IN ('citizen', 'apostate')),
ADD COLUMN IF NOT EXISTS is_in_lottery_pool boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_high_affinity_candidate boolean DEFAULT false;

-- Create apostate_actions table
CREATE TABLE IF NOT EXISTS apostate_actions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES td_users(id) ON DELETE CASCADE,
    chapter text NOT NULL,
    assigned_action_type text CHECK (assigned_action_type IN ('A', 'B', 'C')),
    is_executed boolean DEFAULT false,
    executed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, chapter)
);

-- RLS Policies for apostate_actions
ALTER TABLE apostate_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own apostate actions"
ON apostate_actions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own apostate actions"
ON apostate_actions FOR UPDATE
USING (auth.uid() = user_id);

-- RPC to trigger the lottery (Admin only or system trigger)
-- logic: Selects candidates from high_affinity pool and assigns 'apostate' role
CREATE OR REPLACE FUNCTION trigger_apostate_lottery(
    target_chapter text, 
    count_per_faction int
)
RETURNS void AS $$
DECLARE
    turbid_candidates uuid[];
    pure_candidates uuid[];
    selected_id uuid;
BEGIN
    -- Select Turbid candidates
    SELECT ARRAY_AGG(id) INTO turbid_candidates
    FROM td_users
    WHERE faction = 'Turbid' 
      AND is_high_affinity_candidate = true 
      AND identity_role = 'citizen'
      AND is_in_lottery_pool = true;

    -- Randomly select and update Turbid users
    FOR i IN 1..count_per_faction LOOP
        IF array_length(turbid_candidates, 1) > 0 THEN
            selected_id := turbid_candidates[floor(random() * array_length(turbid_candidates, 1)) + 1];
            
            UPDATE td_users SET identity_role = 'apostate' WHERE id = selected_id;
            
            -- Initialize action for the new apostate for current chapter
            INSERT INTO apostate_actions (user_id, chapter, assigned_action_type)
            VALUES (
                selected_id, 
                target_chapter, 
                (ARRAY['A','B','C'])[floor(random() * 3) + 1]
            );
            
            -- Remove selected from array to avoid double picking (simple approach: just ignore, or filter in next run, but array manipulation in PLPGSQL is tricky. 
            -- Better approach: use a temp table or cursor with ORDER BY random() LIMIT n)
        END IF;
    END LOOP;

    -- Re-doing the selection logic properly with SQL queries instead of array manipulation
    -- Update Turbid
    WITH selected AS (
        SELECT id FROM td_users 
        WHERE faction = 'Turbid' 
          AND is_high_affinity_candidate = true 
          AND identity_role = 'citizen'
          AND is_in_lottery_pool = true
        ORDER BY random()
        LIMIT count_per_faction
    )
    UPDATE td_users 
    SET identity_role = 'apostate' 
    WHERE id IN (SELECT id FROM selected);

    -- Update Pure
    WITH selected AS (
        SELECT id FROM td_users 
        WHERE faction = 'Pure' 
          AND is_high_affinity_candidate = true 
          AND identity_role = 'citizen'
          AND is_in_lottery_pool = true
        ORDER BY random()
        LIMIT count_per_faction
    )
    UPDATE td_users 
    SET identity_role = 'apostate' 
    WHERE id IN (SELECT id FROM selected);
    
    -- Initialize actions for ALL apostates for this chapter (including existing ones if any)
    INSERT INTO apostate_actions (user_id, chapter, assigned_action_type)
    SELECT 
        id, 
        target_chapter, 
        (ARRAY['A','B','C'])[floor(random() * 3) + 1]
    FROM td_users
    WHERE identity_role = 'apostate'
    ON CONFLICT (user_id, chapter) DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
