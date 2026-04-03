-- ============================================================-- Wave 7: ???????chapter advancement?
-- ============================================================

-- global_stats ????????
ALTER TABLE global_stats
  ADD COLUMN IF NOT EXISTS current_chapter INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_settlement_balance INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_settlement_winner TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_settlement_at TIMESTAMPTZ DEFAULT NULL;

-- ???????
CREATE TABLE IF NOT EXISTS chapter_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_version TEXT NOT NULL,
  balance_value INTEGER NOT NULL,
  winning_faction TEXT NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapter_settlements_version
  ON chapter_settlements(chapter_version);

ALTER TABLE chapter_settlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read chapter_settlements" ON chapter_settlements;
CREATE POLICY "Allow read chapter_settlements" ON chapter_settlements
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert chapter_settlements" ON chapter_settlements;
CREATE POLICY "Allow insert chapter_settlements" ON chapter_settlements
  FOR INSERT WITH CHECK (true);

-- ============================================================-- Wave 6: 據點留言系統
-- ============================================================

CREATE TABLE IF NOT EXISTS landmark_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landmark_id TEXT NOT NULL,
    oc_name TEXT NOT NULL,
    faction TEXT NOT NULL,
    content TEXT NOT NULL,
    chapter_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(landmark_id, oc_name)
);

CREATE INDEX IF NOT EXISTS idx_landmark_messages_lookup
    ON landmark_messages(landmark_id, faction);

-- ============================================================
-- Wave 5: 寵物系統
-- ============================================================

CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_preset BOOLEAN DEFAULT TRUE,
    is_listed BOOLEAN DEFAULT FALSE,
    price INTEGER DEFAULT 2,
    seller_oc TEXT DEFAULT NULL,
    chapter_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_oc TEXT NOT NULL,
    pet_id TEXT REFERENCES pets(id),
    is_released BOOLEAN DEFAULT FALSE,
    released_at TIMESTAMPTZ DEFAULT NULL,
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_oc, pet_id)
);

CREATE INDEX IF NOT EXISTS idx_player_pets_owner ON player_pets(owner_oc);
CREATE INDEX IF NOT EXISTS idx_player_pets_active ON player_pets(owner_oc, is_released);

-- 頝設16款初始資料
INSERT INTO pets (id, name, description, price, is_preset) VALUES
('pet_001', '白鴉雛鳥',  '從繭的裂縫中飛出的幼鳥，羽毛帶著微弱的光。',              3, TRUE),
('pet_002', '霧中蜘蛛',  '在黑霧邊緣絝網，杕杉的丝是蟲，而是記憶碎片。',            2, TRUE),
('pet_003', '裂紋石龜',  '背殼上的裂紋僝是地圖，據說通往柝個消失的地方。',          2, TRUE),
('pet_004', '低語貓',    '永靠在說話，但沒有人蝽得懂。',                              3, TRUE),
('pet_005', '黑泥蛙',    '從深淵邊緣的黑泥裡爬出來，皮膚帶有礦石紋路。',            1, TRUE),
('pet_006', '空心兔',    '摸起來輕飄飄的，僝是靈魂還沒裝滿。',                       2, TRUE),
('pet_007', '靡面魚',    '游泳時倒映周圝所有人的臉，但有時坝射的臉丝誝識。',         3, TRUE),
('pet_008', '骨翼蝙蝠',  '翅膀是逝明的，坯以看見裡面細細的骨架。',                   2, TRUE),
('pet_009', '苔蘚熊',    '身上長著會發光的苔蘚，睡著時苔蘚會唱歌。',                3, TRUE),
('pet_010', '靽靵狝',    '毛色僝生靽的金屬，摸起來坻是暖的。',                       2, TRUE),
('pet_011', '晶體蜥蜴',  '皮膚是坊逝明的水晶質感，情緒激動時會發出碎裂蝲。',        3, TRUE),
('pet_012', '無臉鳥',    '臉的佝置是一片光滑的白，但牠知靓你在看牠。',              4, TRUE),
('pet_013', '煙霧水毝',  '飄在空中而非水裡，觸手碰到人會讓人想起靺忘的事。',        3, TRUE),
('pet_014', '紅眼鼴鼠',  '在地底挖掘，帶回來的東西有時候是別人失去的物哝。',        2, TRUE),
('pet_015', '金線蠶',    '坝出的絲是真正的金色，但沒有人知靓用途。',                4, TRUE),
('pet_016', '雙頭烝鴉',  '兩個頭永靠在爭論，但飛行方坑從來丝會出錯。',              3, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Wave 4: 背靓者能力系統欄佝
-- ============================================================

-- td_users 新增背靓者能力欄佝
ALTER TABLE td_users
  ADD COLUMN IF NOT EXISTS apostate_skill_used BOOLEAN DEFAULT FALSE,
    -- 本章能力是坦已使用，章節針置時歸 FALSE
  ADD COLUMN IF NOT EXISTS apostate_current_skill TEXT DEFAULT NULL;
    -- 本章指派能力：'greed' | 'leak' | 'pickpocket'

-- td_world_map_landmarks 新增洩漝標記欄佝（背靓者能力B用）
ALTER TABLE td_world_map_landmarks
  ADD COLUMN IF NOT EXISTS leaked_to_faction TEXT DEFAULT NULL,
    -- 被洩漝給哪個陣營，NULL 表示未洩漝
  ADD COLUMN IF NOT EXISTS leaked_chapter TEXT DEFAULT NULL;
    -- 被洩漝的章節版本

-- ============================================================
-- Wave 1 & 2: 坳時通訊 + NPC 系統
-- ============================================================

-- 1. global_stats: 全局天平數值（singleton row）
CREATE TABLE IF NOT EXISTS global_stats (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  balance_value INTEGER DEFAULT 50 CHECK (balance_value BETWEEN 0 AND 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
INSERT INTO global_stats (id, balance_value)
  VALUES ('singleton', 50)
  ON CONFLICT (id) DO NOTHING;
ALTER TABLE global_stats REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE global_stats;

-- 2. drift_fragments: 漂浝瓶挝久化
CREATE TABLE IF NOT EXISTS drift_fragments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_oc TEXT NOT NULL,
  content TEXT NOT NULL,
  x_pct DECIMAL(6,2) NOT NULL,
  y_pct DECIMAL(6,2) NOT NULL,
  chapter_version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_drift_chapter ON drift_fragments(chapter_version);
ALTER TABLE drift_fragments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE drift_fragments;

-- 3. market_slots: 商人上架靓具
CREATE TABLE IF NOT EXISTS market_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_oc TEXT NOT NULL,
  item_id TEXT NOT NULL,
  chapter_version TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 5,
  is_sold BOOLEAN DEFAULT FALSE,
  buyer_oc TEXT,
  listed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_market_chapter ON market_slots(chapter_version, is_sold);

-- 4. td_users 新增 NPC 欄佝 + is_lost + HP
ALTER TABLE td_users
  ADD COLUMN IF NOT EXISTS npc_role TEXT
    CHECK (npc_role IN ('merchant', 'trafficker', 'inn_owner') OR npc_role IS NULL),
  ADD COLUMN IF NOT EXISTS is_lost BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_hp INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT 100;

-- RLS (Dev mode: allow all)
ALTER TABLE drift_fragments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all drift_fragments" ON drift_fragments;
CREATE POLICY "Allow all drift_fragments" ON drift_fragments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all global_stats" ON global_stats;
CREATE POLICY "Allow all global_stats" ON global_stats FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE market_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all market_slots" ON market_slots;
CREATE POLICY "Allow all market_slots" ON market_slots FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Original schema below
-- ============================================================

-- Update td_users table for Coin Management
-- 1. 精細化幣值系統: 初始幣值 10
ALTER TABLE td_users 
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS daily_coin_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS collected_shards INTEGER DEFAULT 0;

-- Set default coins to 10 for new users (and existing if 0/null?)
ALTER TABLE td_users ALTER COLUMN coins SET DEFAULT 10;

-- 2. mission_logs: 紀錄任務坃與與回報 (Replaces participation_records requirement)
CREATE TABLE IF NOT EXISTS mission_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  oc_name TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  report_content TEXT,
  status TEXT CHECK (status IN ('participating', 'reported', 'approved')) DEFAULT 'participating',
  chapter_version TEXT NOT NULL, -- 主線章節鎖定機制
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. breath_pool: 儲存「呼杯〝隨機贈禮與留言
CREATE TABLE IF NOT EXISTS breath_pool (
  breath_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_oc TEXT NOT NULL,
  message TEXT,
  item_id TEXT NOT NULL, -- B001-B007
  chapter_version TEXT NOT NULL,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_by TEXT, -- OC Name of claimer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. blind_box_items: 定義盲盒睎池
CREATE TABLE IF NOT EXISTS blind_box_items (
  item_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('raiment', 'fragment', 'relic')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'legendary')),
  drop_rate DECIMAL(5, 4) NOT NULL,
  image_url TEXT,
  description TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_mission_logs_oc_chapter ON mission_logs(oc_name, chapter_version);
CREATE INDEX IF NOT EXISTS idx_breath_pool_claimed ON breath_pool(is_claimed, chapter_version);

-- Comments for documentation
COMMENT ON TABLE mission_logs IS 'Core mission tracking with chapter version locking.';
COMMENT ON TABLE breath_pool IS 'Async gift exchange pool for Breathing System.';
COMMENT ON COLUMN td_users.coins IS 'Unified currency. Initial: 10. Daily Cap logic applied in app.';
- -   A d d   i d e n t i t y   c o l u m n s   t o   t d _ u s e r s 
 
 A L T E R   T A B L E   t d _ u s e r s   
 
 A D D   C O L U M N   I F   N O T   E X I S T S   i d e n t i t y _ r o l e   t e x t   D E F A U L T   ' c i t i z e n '   C H E C K   ( i d e n t i t y _ r o l e   I N   ( ' c i t i z e n ' ,   ' a p o s t a t e ' ) ) , 
 
 A D D   C O L U M N   I F   N O T   E X I S T S   i s _ i n _ l o t t e r y _ p o o l   b o o l e a n   D E F A U L T   f a l s e , 
 
 A D D   C O L U M N   I F   N O T   E X I S T S   i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   b o o l e a n   D E F A U L T   f a l s e ; 
 
 
 
 - -   C r e a t e   a p o s t a t e _ a c t i o n s   t a b l e 
 
 C R E A T E   T A B L E   I F   N O T   E X I S T S   a p o s t a t e _ a c t i o n s   ( 
 
         i d   u u i d   D E F A U L T   g e n _ r a n d o m _ u u i d ( )   P R I M A R Y   K E Y , 
 
         u s e r _ i d   u u i d   R E F E R E N C E S   t d _ u s e r s ( i d )   O N   D E L E T E   C A S C A D E , 
 
         c h a p t e r   t e x t   N O T   N U L L , 
 
         a s s i g n e d _ a c t i o n _ t y p e   t e x t   C H E C K   ( a s s i g n e d _ a c t i o n _ t y p e   I N   ( ' A ' ,   ' B ' ,   ' C ' ) ) , 
 
         i s _ e x e c u t e d   b o o l e a n   D E F A U L T   f a l s e , 
 
         e x e c u t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e , 
 
         c r e a t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   D E F A U L T   n o w ( ) , 
 
         U N I Q U E ( u s e r _ i d ,   c h a p t e r ) 
 
 ) ; 
 
 
 
 - -   R L S   P o l i c i e s   f o r   a p o s t a t e _ a c t i o n s 
 
 A L T E R   T A B L E   a p o s t a t e _ a c t i o n s   E N A B L E   R O W   L E V E L   S E C U R I T Y ; 
 
 
 
 C R E A T E   P O L I C Y   " U s e r s   c a n   v i e w   t h e i r   o w n   a p o s t a t e   a c t i o n s " 
 
 O N   a p o s t a t e _ a c t i o n s   F O R   S E L E C T 
 
 U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ; 
 
 
 
 C R E A T E   P O L I C Y   " U s e r s   c a n   u p d a t e   t h e i r   o w n   a p o s t a t e   a c t i o n s " 
 
 O N   a p o s t a t e _ a c t i o n s   F O R   U P D A T E 
 
 U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ; 
 
 
 
 - -   R P C   t o   t r i g g e r   t h e   l o t t e r y   ( A d m i n   o n l y   o r   s y s t e m   t r i g g e r ) 
 
 - -   l o g i c :   S e l e c t s   c a n d i d a t e s   f r o m   h i g h _ a f f i n i t y   p o o l   a n d   a s s i g n s   ' a p o s t a t e '   r o l e 
 
 C R E A T E   O R   R E P L A C E   F U N C T I O N   t r i g g e r _ a p o s t a t e _ l o t t e r y ( 
 
         t a r g e t _ c h a p t e r   t e x t ,   
 
         c o u n t _ p e r _ f a c t i o n   i n t 
 
 ) 
 
 R E T U R N S   v o i d   A S   $ $ 
 
 D E C L A R E 
 
         t u r b i d _ c a n d i d a t e s   u u i d [ ] ; 
 
         p u r e _ c a n d i d a t e s   u u i d [ ] ; 
 
         s e l e c t e d _ i d   u u i d ; 
 
 B E G I N 
 
         - -   S e l e c t   T u r b i d   c a n d i d a t e s 
 
         S E L E C T   A R R A Y _ A G G ( i d )   I N T O   t u r b i d _ c a n d i d a t e s 
 
         F R O M   t d _ u s e r s 
 
         W H E R E   f a c t i o n   =   ' T u r b i d '   
 
             A N D   i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   =   t r u e   
 
             A N D   i d e n t i t y _ r o l e   =   ' c i t i z e n ' 
 
             A N D   i s _ i n _ l o t t e r y _ p o o l   =   t r u e ; 
 
 
 
         - -   R a n d o m l y   s e l e c t   a n d   u p d a t e   T u r b i d   u s e r s 
 
         F O R   i   I N   1 . . c o u n t _ p e r _ f a c t i o n   L O O P 
 
                 I F   a r r a y _ l e n g t h ( t u r b i d _ c a n d i d a t e s ,   1 )   >   0   T H E N 
 
                         s e l e c t e d _ i d   : =   t u r b i d _ c a n d i d a t e s [ f l o o r ( r a n d o m ( )   *   a r r a y _ l e n g t h ( t u r b i d _ c a n d i d a t e s ,   1 ) )   +   1 ] ; 
 
                         
 
                         U P D A T E   t d _ u s e r s   S E T   i d e n t i t y _ r o l e   =   ' a p o s t a t e '   W H E R E   i d   =   s e l e c t e d _ i d ; 
 
                         
 
                         - -   I n i t i a l i z e   a c t i o n   f o r   t h e   n e w   a p o s t a t e   f o r   c u r r e n t   c h a p t e r 
 
                         I N S E R T   I N T O   a p o s t a t e _ a c t i o n s   ( u s e r _ i d ,   c h a p t e r ,   a s s i g n e d _ a c t i o n _ t y p e ) 
 
                         V A L U E S   ( 
 
                                 s e l e c t e d _ i d ,   
 
                                 t a r g e t _ c h a p t e r ,   
 
                                 ( A R R A Y [ ' A ' , ' B ' , ' C ' ] ) [ f l o o r ( r a n d o m ( )   *   3 )   +   1 ] 
 
                         ) ; 
 
                         
 
                         - -   R e m o v e   s e l e c t e d   f r o m   a r r a y   t o   a v o i d   d o u b l e   p i c k i n g   ( s i m p l e   a p p r o a c h :   j u s t   i g n o r e ,   o r   f i l t e r   i n   n e x t   r u n ,   b u t   a r r a y   m a n i p u l a t i o n   i n   P L P G S Q L   i s   t r i c k y .   
 
                         - -   B e t t e r   a p p r o a c h :   u s e   a   t e m p   t a b l e   o r   c u r s o r   w i t h   O R D E R   B Y   r a n d o m ( )   L I M I T   n ) 
 
                 E N D   I F ; 
 
         E N D   L O O P ; 
 
 
 
         - -   R e - d o i n g   t h e   s e l e c t i o n   l o g i c   p r o p e r l y   w i t h   S Q L   q u e r i e s   i n s t e a d   o f   a r r a y   m a n i p u l a t i o n 
 
         - -   U p d a t e   T u r b i d 
 
         W I T H   s e l e c t e d   A S   ( 
 
                 S E L E C T   i d   F R O M   t d _ u s e r s   
 
                 W H E R E   f a c t i o n   =   ' T u r b i d '   
 
                     A N D   i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   =   t r u e   
 
                     A N D   i d e n t i t y _ r o l e   =   ' c i t i z e n ' 
 
                     A N D   i s _ i n _ l o t t e r y _ p o o l   =   t r u e 
 
                 O R D E R   B Y   r a n d o m ( ) 
 
                 L I M I T   c o u n t _ p e r _ f a c t i o n 
 
         ) 
 
         U P D A T E   t d _ u s e r s   
 
         S E T   i d e n t i t y _ r o l e   =   ' a p o s t a t e '   
 
         W H E R E   i d   I N   ( S E L E C T   i d   F R O M   s e l e c t e d ) ; 
 
 
 
         - -   U p d a t e   P u r e 
 
         W I T H   s e l e c t e d   A S   ( 
 
                 S E L E C T   i d   F R O M   t d _ u s e r s   
 
                 W H E R E   f a c t i o n   =   ' P u r e '   
 
                     A N D   i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   =   t r u e   
 
                     A N D   i d e n t i t y _ r o l e   =   ' c i t i z e n ' 
 
                     A N D   i s _ i n _ l o t t e r y _ p o o l   =   t r u e 
 
                 O R D E R   B Y   r a n d o m ( ) 
 
                 L I M I T   c o u n t _ p e r _ f a c t i o n 
 
         ) 
 
         U P D A T E   t d _ u s e r s   
 
         S E T   i d e n t i t y _ r o l e   =   ' a p o s t a t e '   
 
         W H E R E   i d   I N   ( S E L E C T   i d   F R O M   s e l e c t e d ) ; 
 
         
 
         - -   I n i t i a l i z e   a c t i o n s   f o r   A L L   a p o s t a t e s   f o r   t h i s   c h a p t e r   ( i n c l u d i n g   e x i s t i n g   o n e s   i f   a n y ) 
 
         I N S E R T   I N T O   a p o s t a t e _ a c t i o n s   ( u s e r _ i d ,   c h a p t e r ,   a s s i g n e d _ a c t i o n _ t y p e ) 
 
         S E L E C T   
 
                 i d ,   
 
                 t a r g e t _ c h a p t e r ,   
 
                 ( A R R A Y [ ' A ' , ' B ' , ' C ' ] ) [ f l o o r ( r a n d o m ( )   *   3 )   +   1 ] 
 
         F R O M   t d _ u s e r s 
 
         W H E R E   i d e n t i t y _ r o l e   =   ' a p o s t a t e ' 
 
         O N   C O N F L I C T   ( u s e r _ i d ,   c h a p t e r )   D O   N O T H I N G ; 
 
 
 
 E N D ; 
 
 $ $   L A N G U A G E   p l p g s q l   S E C U R I T Y   D E F I N E R ; 
 
 - -   1 .   A d d   ' l i q u i d a t o r '   t o   i d e n t i t y _ r o l e   c h e c k   c o n s t r a i n t 
 
 A L T E R   T A B L E   t d _ u s e r s   
 
 D R O P   C O N S T R A I N T   I F   E X I S T S   t d _ u s e r s _ i d e n t i t y _ r o l e _ c h e c k ; 
 
 
 
 A L T E R   T A B L E   t d _ u s e r s   
 
 A D D   C O N S T R A I N T   t d _ u s e r s _ i d e n t i t y _ r o l e _ c h e c k   
 
 C H E C K   ( i d e n t i t y _ r o l e   I N   ( ' c i t i z e n ' ,   ' a p o s t a t e ' ,   ' l i q u i d a t o r ' ) ) ; 
 
 
 
 - -   2 .   C r e a t e   l i q u i d a t o r _ a c t i o n s   t a b l e 
 
 C R E A T E   T A B L E   I F   N O T   E X I S T S   l i q u i d a t o r _ a c t i o n s   ( 
 
         i d   u u i d   D E F A U L T   g e n _ r a n d o m _ u u i d ( )   P R I M A R Y   K E Y , 
 
         u s e r _ i d   u u i d   R E F E R E N C E S   t d _ u s e r s ( i d )   O N   D E L E T E   C A S C A D E , 
 
         t a r g e t _ o c _ n a m e   t e x t   N O T   N U L L , 
 
         s c a n _ r e s u l t   t e x t   C H E C K   ( s c a n _ r e s u l t   I N   ( ' p o s i t i v e ' ,   ' n e g a t i v e ' ) ) ,   - -   p o s i t i v e = a p o s t a t e ,   n e g a t i v e = c i t i z e n / o t h e r 
 
         c h a p t e r   t e x t   N O T   N U L L , 
 
         e x e c u t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   D E F A U L T   n o w ( ) , 
 
         U N I Q U E ( u s e r _ i d ,   c h a p t e r )   - -   L i m i t   1   p e r   c h a p t e r 
 
 ) ; 
 
 
 
 - -   R L S   P o l i c i e s 
 
 A L T E R   T A B L E   l i q u i d a t o r _ a c t i o n s   E N A B L E   R O W   L E V E L   S E C U R I T Y ; 
 
 
 
 C R E A T E   P O L I C Y   " U s e r s   c a n   v i e w   t h e i r   o w n   l i q u i d a t o r   a c t i o n s " 
 
 O N   l i q u i d a t o r _ a c t i o n s   F O R   S E L E C T 
 
 U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ; 
 
 
 
 C R E A T E   P O L I C Y   " U s e r s   c a n   i n s e r t   t h e i r   o w n   l i q u i d a t o r   a c t i o n s " 
 
 O N   l i q u i d a t o r _ a c t i o n s   F O R   I N S E R T 
 
 W I T H   C H E C K   ( a u t h . u i d ( )   =   u s e r _ i d ) ; 
 
 - -   C r e a t e   t d _ u s e r s   t a b l e   i f   n o t   e x i s t s 
 
 C R E A T E   T A B L E   I F   N O T   E X I S T S   t d _ u s e r s   ( 
 
         i d   u u i d   D E F A U L T   g e n _ r a n d o m _ u u i d ( )   P R I M A R Y   K E Y , 
 
         o c _ n a m e   t e x t   U N I Q U E   N O T   N U L L , 
 
         s i m p l e _ p a s s w o r d   t e x t , 
 
         f a c t i o n   t e x t   C H E C K   ( f a c t i o n   I N   ( ' T u r b i d ' ,   ' P u r e ' ) ) , 
 
         i d e n t i t y _ r o l e   t e x t   D E F A U L T   ' c i t i z e n '   C H E C K   ( i d e n t i t y _ r o l e   I N   ( ' c i t i z e n ' ,   ' a p o s t a t e ' ,   ' l i q u i d a t o r ' ) ) , 
 
         i n v e n t o r y   j s o n b   D E F A U L T   ' [ ] ' , 
 
         w a r d r o b e   j s o n b   D E F A U L T   ' [ ] ' , 
 
         c o i n s   i n t e g e r   D E F A U L T   1 0 , 
 
         d a i l y _ c o i n _ e a r n e d   i n t e g e r   D E F A U L T   0 , 
 
         c o l l e c t e d _ s h a r d s   i n t e g e r   D E F A U L T   0 , 
 
         l a s t _ r e s e t _ t i m e   t i m e s t a m p   w i t h   t i m e   z o n e   D E F A U L T   n o w ( ) , 
 
         i s _ i n _ l o t t e r y _ p o o l   b o o l e a n   D E F A U L T   f a l s e , 
 
         i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   b o o l e a n   D E F A U L T   f a l s e , 
 
         c r e a t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   D E F A U L T   n o w ( ) , 
 
         u p d a t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   D E F A U L T   n o w ( ) 
 
 ) ; 
 
 
 
 - -   E n s u r e   R L S   i s   e n a b l e d 
 
 A L T E R   T A B L E   t d _ u s e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ; 
 
 
 
 - -   B a s i c   p o l i c y   f o r   d e m o :   a l l o w   a l l   a c c e s s   ( s i n c e   a u t h   i s   s i m u l a t e d   v i a   s i m p l e _ p a s s w o r d   i n   t h i s   d e v   e n v i r o n m e n t ) 
 
 - -   I n   p r o d u c t i o n ,   t h i s   s h o u l d   b e   s t r i c t e r . 
 
 D R O P   P O L I C Y   I F   E X I S T S   " A l l o w   a l l   a c c e s s   t o   t d _ u s e r s "   O N   t d _ u s e r s ; 
 
 C R E A T E   P O L I C Y   " A l l o w   a l l   a c c e s s   t o   t d _ u s e r s "   O N   t d _ u s e r s   F O R   A L L   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ; 
 
 - -   E n s u r e   t d _ u s e r s   t a b l e   e x i s t s   a n d   h a s   c o r r e c t   c o l u m n s 
 
 C R E A T E   T A B L E   I F   N O T   E X I S T S   t d _ u s e r s   ( 
 
         i d   u u i d   D E F A U L T   g e n _ r a n d o m _ u u i d ( )   P R I M A R Y   K E Y , 
 
         o c _ n a m e   t e x t   U N I Q U E   N O T   N U L L , 
 
         s i m p l e _ p a s s w o r d   t e x t , 
 
         f a c t i o n   t e x t   C H E C K   ( f a c t i o n   I N   ( ' T u r b i d ' ,   ' P u r e ' ) ) , 
 
         i d e n t i t y _ r o l e   t e x t   D E F A U L T   ' c i t i z e n '   C H E C K   ( i d e n t i t y _ r o l e   I N   ( ' c i t i z e n ' ,   ' a p o s t a t e ' ,   ' l i q u i d a t o r ' ) ) , 
 
         i n v e n t o r y   j s o n b   D E F A U L T   ' [ ] ' , 
 
         w a r d r o b e   j s o n b   D E F A U L T   ' [ ] ' , 
 
         c o i n s   i n t e g e r   D E F A U L T   1 0 , 
 
         d a i l y _ c o i n _ e a r n e d   i n t e g e r   D E F A U L T   0 , 
 
         c o l l e c t e d _ s h a r d s   i n t e g e r   D E F A U L T   0 , 
 
         l a s t _ r e s e t _ t i m e   t i m e s t a m p   w i t h   t i m e   z o n e   D E F A U L T   n o w ( ) , 
 
         i s _ i n _ l o t t e r y _ p o o l   b o o l e a n   D E F A U L T   f a l s e , 
 
         i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   b o o l e a n   D E F A U L T   f a l s e , 
 
         c r e a t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   D E F A U L T   n o w ( ) , 
 
         u p d a t e d _ a t   t i m e s t a m p   w i t h   t i m e   z o n e   D E F A U L T   n o w ( ) 
 
 ) ; 
 
 
 
 - -   E n s u r e   i d e n t i t y _ r o l e   c h e c k   c o n s t r a i n t   i n c l u d e s   ' l i q u i d a t o r ' 
 
 A L T E R   T A B L E   t d _ u s e r s   
 
 D R O P   C O N S T R A I N T   I F   E X I S T S   t d _ u s e r s _ i d e n t i t y _ r o l e _ c h e c k ; 
 
 
 
 A L T E R   T A B L E   t d _ u s e r s   
 
 A D D   C O N S T R A I N T   t d _ u s e r s _ i d e n t i t y _ r o l e _ c h e c k   
 
 C H E C K   ( i d e n t i t y _ r o l e   I N   ( ' c i t i z e n ' ,   ' a p o s t a t e ' ,   ' l i q u i d a t o r ' ) ) ; 
 
 
 
 - -   E n s u r e   R L S   i s   e n a b l e d 
 
 A L T E R   T A B L E   t d _ u s e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ; 
 
 
 
 - -   A l l o w   a l l   a c c e s s   p o l i c y   ( D e v   M o d e ) 
 
 D R O P   P O L I C Y   I F   E X I S T S   " A l l o w   a l l   a c c e s s   t o   t d _ u s e r s "   O N   t d _ u s e r s ; 
 
 C R E A T E   P O L I C Y   " A l l o w   a l l   a c c e s s   t o   t d _ u s e r s "   O N   t d _ u s e r s   F O R   A L L   U S I N G   ( t r u e )   W I T H   C H E C K   ( t r u e ) ; 
 
 
 
 - -   N o t i f y   P o s t g R E S T   t o   r e l o a d   s c h e m a 
 
 N O T I F Y   p g r s t ,   ' r e l o a d   c o n f i g ' ; 
 
 - -   1 .   C r e a t e   I d e n t i t y   R o l e   E n u m   ( i f   n o t   e x i s t s ) 
 
 D O   $ $   B E G I N   
 
         C R E A T E   T Y P E   i d e n t i t y _ r o l e _ t y p e   A S   E N U M   ( ' c i t i z e n ' ,   ' a p o s t a t e ' ,   ' l i q u i d a t o r ' ) ;   
 
 E X C E P T I O N   
 
         W H E N   d u p l i c a t e _ o b j e c t   T H E N   n u l l ;   
 
 E N D   $ $ ;   
 
 
 
 - -   2 .   C r e a t e   o r   U p d a t e   t d _ u s e r s   t a b l e 
 
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . t d _ u s e r s   (   
 
         i d   S E R I A L   P R I M A R Y   K E Y ,   
 
         u s e r n a m e   T E X T   U N I Q U E   N O T   N U L L ,   
 
         f a c t i o n   T E X T   N O T   N U L L   C H E C K   ( f a c t i o n   I N   ( ' T u r b i d ' ,   ' P u r e ' ) ) ,   
 
         i d e n t i t y _ r o l e   i d e n t i t y _ r o l e _ t y p e   D E F A U L T   ' c i t i z e n ' ,   
 
         i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   B O O L E A N   D E F A U L T   f a l s e ,   
 
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   C U R R E N T _ T I M E S T A M P   
 
 ) ; 
 
 
 
 - -   3 .   N o t i f y   P o s t g R E S T   t o   r e l o a d   s c h e m a 
 
 N O T I F Y   p g r s t ,   ' r e l o a d   c o n f i g ' ; 
 
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . t d _ u s e r s   (   
 
         i d   S E R I A L   P R I M A R Y   K E Y ,   
 
         u s e r n a m e   T E X T   U N I Q U E   N O T   N U L L ,   
 
         f a c t i o n   T E X T   N O T   N U L L ,   
 
         i d e n t i t y _ r o l e   T E X T   D E F A U L T   ' c i t i z e n ' ,   
 
         i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   B O O L E A N   D E F A U L T   f a l s e ,   
 
         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   C U R R E N T _ T I M E S T A M P   
 
 ) ; 
 
 - -   c��{? (� `? u�? ? ��? �ak�? ? W��-��{? ����? ? ? 
 
 D O   $ $   
 
 B E G I N   
 
         I F   N O T   E X I S T S   ( S E L E C T   1   F R O M   i n f o r m a t i o n _ s c h e m a . t a b l e s   W H E R E   t a b l e _ n a m e   =   ' t d _ u s e r s ' )   T H E N   
 
                 C R E A T E   T A B L E   p u b l i c . t d _ u s e r s   (   
 
                         i d   S E R I A L   P R I M A R Y   K E Y ,   
 
                         u s e r n a m e   T E X T   U N I Q U E   N O T   N U L L ,   
 
                         f a c t i o n   T E X T   N O T   N U L L ,   
 
                         i d e n t i t y _ r o l e   T E X T   D E F A U L T   ' c i t i z e n ' ,   
 
                         i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   B O O L E A N   D E F A U L T   f a l s e ,   
 
                         c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   C U R R E N T _ T I M E S T A M P   
 
                 ) ;   
 
         E N D   I F ;   
 
 E N D   $ $ ;   
 
 
 
 - -   c��{?   i d e n t i t y _ r o l e   ? ? i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   u�? nd����V���u:� �d#�? ? vQ? u�? {��{�N�V? 
 
 A L T E R   T A B L E   p u b l i c . t d _ u s e r s   A D D   C O L U M N   I F   N O T   E X I S T S   i d e n t i t y _ r o l e   T E X T   D E F A U L T   ' c i t i z e n ' ;   
 
 A L T E R   T A B L E   p u b l i c . t d _ u s e r s   A D D   C O L U M N   I F   N O T   E X I S T S   i s _ h i g h _ a f f i n i t y _ c a n d i d a t e   B O O L E A N   D E F A U L T   f a l s e ; 
 
 