ALTER TABLE mission_logs
ADD COLUMN IF NOT EXISTS coins_earned INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION buy_market_item(p_buyer_oc TEXT, p_slot_id UUID, p_chapter_version TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  slot_record RECORD;
  buyer_record RECORD;
  new_coins INTEGER;
  is_outfit BOOLEAN;
  is_pet BOOLEAN;
  new_inventory JSONB;
  new_wardrobe JSONB;
  item_entry JSONB;
  wardrobe_entry JSONB;
BEGIN
  SELECT * INTO slot_record
  FROM market_slots
  WHERE id = p_slot_id AND chapter_version = p_chapter_version
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SLOT_NOT_FOUND';
  END IF;
  IF slot_record.is_sold THEN
    RAISE EXCEPTION 'ALREADY_SOLD';
  END IF;

  SELECT oc_name, coins, faction, npc_role, inventory, wardrobe INTO buyer_record
  FROM td_users
  WHERE oc_name = p_buyer_oc
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BUYER_NOT_FOUND';
  END IF;
  IF buyer_record.npc_role IS NOT NULL THEN
    RAISE EXCEPTION 'NPC_FORBIDDEN';
  END IF;
  IF buyer_record.faction IS NULL OR (buyer_record.faction <> 'Turbid' AND buyer_record.faction <> 'Pure') THEN
    RAISE EXCEPTION 'INVALID_FACTION';
  END IF;
  IF slot_record.seller_oc = p_buyer_oc THEN
    RAISE EXCEPTION 'SELF_PURCHASE_NOT_ALLOWED';
  END IF;
  IF buyer_record.coins < slot_record.price THEN
    RAISE EXCEPTION 'INSUFFICIENT_COINS';
  END IF;
  IF COALESCE(slot_record.requires_dice, false) THEN
    RAISE EXCEPTION 'DICE_ITEM_NOT_SUPPORTED';
  END IF;

  is_outfit := slot_record.item_type IN ('outfit', 'r18');
  is_pet := slot_record.item_type IN ('pet_preset', 'pet_special');

  IF NOT is_outfit AND NOT is_pet THEN
    IF jsonb_array_length(COALESCE(buyer_record.inventory, '[]'::jsonb)) >= 12 THEN
      RAISE EXCEPTION 'INVENTORY_FULL';
    END IF;
  END IF;

  IF is_outfit AND slot_record.item_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(buyer_record.wardrobe, '[]'::jsonb)) AS w
      WHERE w->>'item_id' = slot_record.item_id
    ) THEN
      RAISE EXCEPTION 'OUTFIT_ALREADY_OWNED';
    END IF;
  END IF;

  IF is_pet THEN
    IF slot_record.item_id IS NULL THEN
      RAISE EXCEPTION 'MISSING_PET_ID';
    END IF;
    IF EXISTS (
      SELECT 1 FROM player_pets WHERE owner_oc = p_buyer_oc AND pet_id = slot_record.item_id
    ) THEN
      RAISE EXCEPTION 'PET_BLACKLISTED';
    END IF;
    IF (SELECT COUNT(*) FROM player_pets WHERE owner_oc = p_buyer_oc AND is_released = false) >= 3 THEN
      RAISE EXCEPTION 'PET_LIMIT_REACHED';
    END IF;
  END IF;

  new_coins := buyer_record.coins - slot_record.price;

  new_inventory := buyer_record.inventory;
  new_wardrobe := buyer_record.wardrobe;
  item_entry := NULL;
  wardrobe_entry := NULL;

  IF NOT is_outfit AND NOT is_pet THEN
    item_entry := jsonb_build_object(
      'slot_id', slot_record.id,
      'item_type', slot_record.item_type,
      'item_id', slot_record.item_id,
      'name', COALESCE(slot_record.custom_name, slot_record.item_id, slot_record.item_type),
      'description', slot_record.custom_description,
      'acquired_at', NOW()
    );
    new_inventory := COALESCE(buyer_record.inventory, '[]'::jsonb) || jsonb_build_array(item_entry);
  END IF;

  IF is_outfit THEN
    wardrobe_entry := jsonb_build_object(
      'slot_id', slot_record.id,
      'item_id', slot_record.item_id,
      'name', COALESCE(slot_record.custom_name, slot_record.item_id, slot_record.item_type),
      'acquired_at', NOW()
    );
    new_wardrobe := COALESCE(buyer_record.wardrobe, '[]'::jsonb) || jsonb_build_array(wardrobe_entry);
  END IF;

  UPDATE td_users
  SET coins = new_coins,
      inventory = new_inventory,
      wardrobe = new_wardrobe
  WHERE oc_name = p_buyer_oc;

  UPDATE market_slots
  SET is_sold = true, buyer_oc = p_buyer_oc
  WHERE id = p_slot_id;

  IF is_pet THEN
    INSERT INTO player_pets (owner_oc, pet_id, is_released)
    VALUES (p_buyer_oc, slot_record.item_id, false);
  END IF;

  INSERT INTO npc_actions (npc_oc, action_type, target_oc, coins_delta, result, chapter_version)
  VALUES (slot_record.seller_oc, 'buy_item', p_buyer_oc, -slot_record.price, p_buyer_oc || ' 購買了 ' || COALESCE(slot_record.custom_name, slot_record.item_id, slot_record.item_type), p_chapter_version);

  RETURN jsonb_build_object(
    'success', true,
    'message', '購買成功',
    'item_type', slot_record.item_type,
    'item_id', slot_record.item_id,
    'coins_remaining', new_coins,
    'new_coins', new_coins,
    'item', item_entry,
    'wardrobe_updated', is_outfit
  );
END;
$$;

CREATE OR REPLACE FUNCTION buy_pet(p_buyer_oc TEXT, p_pet_id TEXT, p_chapter_version TEXT, p_personality TEXT, p_habit TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  pet_record RECORD;
  buyer_record RECORD;
  new_coins INTEGER;
  seller_oc TEXT;
BEGIN
  SELECT * INTO pet_record
  FROM pets
  WHERE id = p_pet_id AND is_listed = true
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PET_NOT_FOUND';
  END IF;

  SELECT oc_name, coins INTO buyer_record
  FROM td_users
  WHERE oc_name = p_buyer_oc
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BUYER_NOT_FOUND';
  END IF;

  IF EXISTS (
    SELECT 1 FROM player_pets WHERE owner_oc = p_buyer_oc AND pet_id = p_pet_id
  ) THEN
    RAISE EXCEPTION 'PET_BLACKLISTED';
  END IF;

  IF (SELECT COUNT(*) FROM player_pets WHERE owner_oc = p_buyer_oc AND is_released = false) >= 3 THEN
    RAISE EXCEPTION 'PET_LIMIT_REACHED';
  END IF;

  IF buyer_record.coins < pet_record.price THEN
    RAISE EXCEPTION 'INSUFFICIENT_COINS';
  END IF;

  new_coins := buyer_record.coins - pet_record.price;
  UPDATE td_users SET coins = new_coins WHERE oc_name = p_buyer_oc;

  INSERT INTO player_pets (owner_oc, pet_id, is_released)
  VALUES (p_buyer_oc, p_pet_id, false);

  IF p_personality IS NOT NULL OR p_habit IS NOT NULL THEN
    UPDATE player_pets
    SET personality = p_personality,
        habit = p_habit
    WHERE owner_oc = p_buyer_oc AND pet_id = p_pet_id;
  END IF;

  UPDATE pets SET is_listed = false WHERE id = p_pet_id;

  seller_oc := COALESCE(pet_record.seller_oc, 'pet_merchant');
  INSERT INTO npc_actions (npc_oc, action_type, target_oc, coins_delta, result, chapter_version)
  VALUES (seller_oc, 'buy_item', p_buyer_oc, -pet_record.price, p_buyer_oc || ' 購買了 ' || pet_record.name, p_chapter_version);

  RETURN jsonb_build_object(
    'success', true,
    'message', '購買成功',
    'pet_id', p_pet_id,
    'coins_remaining', new_coins,
    'new_coins', new_coins,
    'pet', jsonb_build_object('id', pet_record.id, 'name', pet_record.name, 'description', pet_record.description)
  );
END;
$$;

CREATE OR REPLACE FUNCTION report_mission_tx(
  p_oc_name TEXT,
  p_mission_id TEXT,
  p_report_content TEXT,
  p_chapter_version TEXT,
  p_lock_mission_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
  current_earned INTEGER;
  base_reward INTEGER;
  new_coins INTEGER;
  lock_id TEXT;
  authority TEXT;
  mission_landmark_id TEXT;
  bounty_record RECORD;
  leader_record RECORD;
  bounty_paid BOOLEAN := FALSE;
BEGIN
  SELECT oc_name, coins, faction INTO user_record
  FROM td_users
  WHERE oc_name = p_oc_name
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM mission_logs
    WHERE oc_name = p_oc_name
      AND mission_id = p_mission_id
      AND chapter_version = p_chapter_version
      AND status IN ('reported', 'approved')
  ) THEN
    RAISE EXCEPTION 'MISSION_ALREADY_LOCKED';
  END IF;

  SELECT COALESCE(SUM(coins_earned), 0) INTO current_earned
  FROM mission_logs
  WHERE oc_name = p_oc_name
    AND chapter_version = p_chapter_version
    AND status IN ('reported', 'approved');

  base_reward := FLOOR(RANDOM() * 3)::INT + 3;
  IF current_earned + base_reward > 10 THEN
    RAISE EXCEPTION 'CHAPTER_CAP_REACHED';
  END IF;

  new_coins := user_record.coins + base_reward;
  UPDATE td_users
  SET coins = new_coins,
      daily_coin_earned = current_earned + base_reward
  WHERE oc_name = p_oc_name;

  lock_id := COALESCE(p_lock_mission_id, 'main_' || p_chapter_version);
  DELETE FROM mission_logs
  WHERE oc_name = p_oc_name
    AND mission_id = lock_id
    AND chapter_version = p_chapter_version
    AND status = 'locked';

  INSERT INTO mission_logs (oc_name, mission_id, report_content, status, chapter_version, coins_earned)
  VALUES (p_oc_name, p_mission_id, p_report_content, 'reported', p_chapter_version, base_reward);

  mission_landmark_id := NULL;
  IF p_mission_id IS NOT NULL THEN
    mission_landmark_id := split_part(p_mission_id, '_', 3);
  END IF;

  IF mission_landmark_id IS NOT NULL AND mission_landmark_id <> '' THEN
    SELECT * INTO bounty_record
    FROM leader_decrees
    WHERE decree_type = 'bounty'
      AND bounty_completed = FALSE
      AND target_oc = p_oc_name
      AND target_landmark_id = mission_landmark_id
      AND chapter_version = p_chapter_version
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      SELECT oc_name, leader_treasury INTO leader_record
      FROM td_users
      WHERE oc_name = bounty_record.leader_oc
      FOR UPDATE;

      IF leader_record.leader_treasury >= bounty_record.bounty_amount THEN
        UPDATE td_users
        SET coins = coins + bounty_record.bounty_amount
        WHERE oc_name = p_oc_name;

        UPDATE td_users
        SET leader_treasury = leader_record.leader_treasury - bounty_record.bounty_amount
        WHERE oc_name = bounty_record.leader_oc;

        UPDATE leader_decrees
        SET bounty_completed = TRUE,
            bounty_completed_by = p_oc_name
        WHERE id = bounty_record.id;

        bounty_paid := TRUE;
      END IF;
    END IF;
  END IF;

  authority := CASE WHEN user_record.faction = 'Turbid' THEN '眾議會' ELSE '教會' END;

  RETURN jsonb_build_object(
    'success', true,
    'message', '『命運的齒輪再次轉動...』' || E'\n' || '(回報已送出，獲得 +' || base_reward || ' 貨幣)',
    'coins_earned', base_reward,
    'coins_total', new_coins,
    'weekly_coin_earned', current_earned + base_reward,
    'reward', base_reward,
    'new_coins', new_coins,
    'authority', authority,
    'bounty_paid', bounty_paid,
    'bounty_amount', COALESCE(bounty_record.bounty_amount, 0)
  );
END;
$$;
