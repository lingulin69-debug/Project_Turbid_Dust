# 《Project Turbid Dust》世界地圖與資料庫 Schema

[2026-02-06 建立 | 2026-03-10 全面重構更新]

---

## ⚠️ 同步說明
- 貨幣統一稱「貨幣」，欄位名維持 `coins`，舊稱「殘幣」已廢棄
- 舊色碼 `#9333ea` / `#eab308` 已廢棄，新色碼見第1節
- 漂流瓶（`drift_fragments`）/ 呼息禮物池（`breath_pool`）/ 迷霧清除（`td_fog_clear_events`）已廢棄
- `chaos_value` / `active_apostate_skill` / `corrosion_value` 已移除
- 舊版 `merchant` npc_role 已拆分為 `item_merchant` 和 `black_merchant`
- 實際使用資料庫：**Supabase（PostgreSQL）** 為主，SQLite（Prisma）為次（用於身分選拔）

---

## 1. 陣營定義

| 陣營名稱 | 識別碼 | 主色 | 高光色 |
|---------|--------|------|--------|
| 濁息者 | `'Turbid'` | `#211a2e`（深紫黑） | `#7c3aed`（紫色） |
| 淨塵者 | `'Pure'` | `#ede6ce`（米白金） | `#d4af37`（白金） |

```sql
-- 陣營以 td_users.faction 文字欄位直接儲存，此表保留供未來擴展
CREATE TABLE td_factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color_primary TEXT,
    color_highlight TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO td_factions (name, color_primary, color_highlight) VALUES
('Turbid', '#211a2e', '#7c3aed'),
('Pure',   '#ede6ce', '#d4af37');
```

---

## 2. 使用者帳號主表（td_users）

```sql
CREATE TABLE td_users (
    -- 基本識別
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oc_name TEXT UNIQUE NOT NULL,
    simple_password TEXT NOT NULL DEFAULT '0000',
        -- '0000' = 未啟用帳號（預設值）
        -- 第一次登入時系統偵測到 '0000' 強制進入設定密碼流程
        -- 玩家自訂四位數字後覆蓋此欄位
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW(),

    -- 派系與身分
    faction TEXT NOT NULL,
        -- 'Turbid' | 'Pure'
    identity_role TEXT DEFAULT 'citizen',
        -- 'citizen' | 'apostate' | 'leader'

    -- 背道者選拔
    is_in_lottery_pool BOOLEAN DEFAULT FALSE,
    is_high_affinity_candidate BOOLEAN DEFAULT FALSE,

    -- 貨幣
    coins INTEGER DEFAULT 10,
    weekly_coin_earned INTEGER DEFAULT 0,
    last_reset_time TIMESTAMPTZ DEFAULT NOW(),

    -- 背包與衣裝
    inventory JSONB DEFAULT '[]'::jsonb,
    wardrobe JSONB DEFAULT '[]'::jsonb,
    current_outfit TEXT DEFAULT NULL,

    -- HP系統
    current_hp INTEGER DEFAULT 10,
    max_hp INTEGER DEFAULT 10,

    -- 狀態
    is_lost BOOLEAN DEFAULT FALSE,
    lost_until TIMESTAMPTZ DEFAULT NULL,
    is_in_party BOOLEAN DEFAULT FALSE,

    -- 特殊狀態標記（角色卡顯示）
    status_tags JSONB DEFAULT '[]'::jsonb,
        -- [{"tag":"性別轉換中...","expires_chapter":"2.0"}]

    -- 因果標籤（匿名代號）
    karma_tags JSONB DEFAULT '[]'::jsonb,
        -- [{"tag":"溫柔的劊子手","is_faded":false}]
    alias_name TEXT DEFAULT NULL,

    -- 領主詛咒
    cursed_name_prefix TEXT DEFAULT NULL,

    -- NPC專用（管理員手動設定）
    npc_role TEXT DEFAULT NULL,
        -- NULL | 'item_merchant' | 'black_merchant'
        -- | 'trafficker' | 'inn_owner' | 'pet_merchant'
    is_shop_open BOOLEAN DEFAULT FALSE,
    movement_points INTEGER DEFAULT 10,
    current_landmark_id TEXT DEFAULT NULL,
    prestige INTEGER DEFAULT 0,

    -- 領主專用
    leader_evil_points INTEGER DEFAULT 3,
    leader_treasury INTEGER DEFAULT 0,
    is_taxed_this_chapter BOOLEAN DEFAULT FALSE,

    -- 背道者專用（ALTER TABLE 新增）
    apostate_skill_used BOOLEAN DEFAULT FALSE,
        -- 本章能力是否已使用，章節重置時歸FALSE
    apostate_current_skill TEXT DEFAULT NULL
        -- 本章被指派的能力：'greed' | 'leak' | 'pickpocket'
);

CREATE INDEX idx_td_users_oc_name ON td_users(oc_name);
CREATE INDEX idx_td_users_faction ON td_users(faction);
CREATE INDEX idx_td_users_identity_role ON td_users(identity_role);
CREATE INDEX idx_td_users_npc_role ON td_users(npc_role);
```

---

## 3. 全局天平（即時同步）

```sql
CREATE TABLE global_stats (
    id TEXT PRIMARY KEY DEFAULT 'singleton',
    balance_value INTEGER DEFAULT 50,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO global_stats (id, balance_value) VALUES ('singleton', 50);
```

**重要**：天平只被貨幣捐獻影響，其他機制不得直接修改 `balance_value`

---

## 4. 世界地圖據點

```sql
CREATE TABLE td_world_map_landmarks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    x_percent FLOAT NOT NULL,
    y_percent FLOAT NOT NULL,
    faction TEXT NOT NULL,              -- 'Turbid' | 'Pure' | 'Common'
    status TEXT DEFAULT 'closed',       -- 'open' | 'closed'
    landmark_type TEXT DEFAULT 'default',
        -- 'town' | 'school' | 'church' | 'inn' | 'default'
    capacity INTEGER DEFAULT 1,
    chapter_unlock TEXT DEFAULT '1.0',
    description TEXT,
    -- 背道者能力B洩漏用（ALTER TABLE 新增）
    leaked_to_faction TEXT DEFAULT NULL,
        -- 被洩漏給哪個陣營，NULL表示未被洩漏
    leaked_chapter TEXT DEFAULT NULL,
        -- 被洩漏的章節版本
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO td_world_map_landmarks
    (id, name, x_percent, y_percent, faction, status, landmark_type, capacity)
VALUES
    ('l1', '空衣街區',   20, 40, 'Turbid', 'open',   'town',   5),
    ('l2', '舊觀測站',   45, 30, 'Turbid', 'closed', 'school', 3),
    ('l3', '淨化尖塔',   75, 50, 'Pure',   'open',   'church', 10),
    ('l4', '中央圖書館', 60, 65, 'Pure',   'open',   'school', 8);
```

---

## 5. 任務日誌（小道消息來源）

```sql
CREATE TABLE mission_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oc_name TEXT NOT NULL,
    mission_id TEXT NOT NULL,           -- 格式：'章節-據點名稱-OC名稱'
    landmark_id TEXT,
    report_content TEXT,
    status TEXT DEFAULT 'reported',     -- 'reported' | 'approved'
    chapter_version TEXT NOT NULL,
    gazette_type TEXT DEFAULT 'mission',
        -- 'mission'   玩家任務回報
        -- 'system'    系統自動訊息（綁架/救援等）
        -- 'leader'    領主發布（👑標記）
    gazette_content TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mission_logs_oc ON mission_logs(oc_name);
CREATE INDEX idx_mission_logs_chapter ON mission_logs(chapter_version);
CREATE INDEX idx_mission_logs_landmark ON mission_logs(landmark_id);
CREATE INDEX idx_mission_logs_gazette ON mission_logs(gazette_type);
```

---

## 6. 據點留言

```sql
CREATE TABLE landmark_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landmark_id TEXT NOT NULL REFERENCES td_world_map_landmarks(id),
    oc_name TEXT NOT NULL,
    faction TEXT NOT NULL,
    content TEXT NOT NULL,              -- 最多30字
    chapter_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(landmark_id, oc_name)        -- 每人每據點只能留一條
);

CREATE INDEX idx_landmark_msg_landmark ON landmark_messages(landmark_id);
CREATE INDEX idx_landmark_msg_faction ON landmark_messages(faction);
```

**顯示規則**：只顯示 `faction = 玩家自己陣營` 的留言

---

## 7. 組隊系統

```sql
CREATE TABLE party_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landmark_id TEXT NOT NULL,
    chapter_version TEXT NOT NULL,
    required_count INTEGER NOT NULL,    -- 1 或 3
    current_members JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'open',         -- 'open' | 'full' | 'ended'
    triggered_event_type TEXT DEFAULT NULL,  -- 'safe' | 'danger'
    event_id TEXT DEFAULT NULL,         -- 對應 party-events.json 的id
    danger_card_position INTEGER DEFAULT NULL,  -- 1|2|3，後端決定，前端不可見
    card_results JSONB DEFAULT '[]'::jsonb,
        -- [{"oc_name":"塞理安","position":2,"result":"safe","hp_delta":0}]
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE party_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_slot_id UUID REFERENCES party_slots(id),
    landmark_id TEXT NOT NULL,
    landmark_name TEXT NOT NULL,
    members JSONB NOT NULL,
    event_type TEXT NOT NULL,           -- 'safe' | 'danger'
    chapter_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_party_slots_landmark ON party_slots(landmark_id);
CREATE INDEX idx_party_slots_status ON party_slots(status);
```

---

## 8. NPC行動紀錄

```sql
CREATE TABLE npc_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npc_oc TEXT NOT NULL,
    action_type TEXT NOT NULL,
        -- 'move' | 'deliver' | 'kidnap'
        -- | 'intel' | 'pickpocket' | 'rescue'
        -- | 'list_item' | 'buy_item'
    target_oc TEXT DEFAULT NULL,
    landmark_id TEXT DEFAULT NULL,
    coins_delta INTEGER DEFAULT NULL,
    result TEXT DEFAULT NULL,
    chapter_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_npc_actions_npc ON npc_actions(npc_oc);
CREATE INDEX idx_npc_actions_type ON npc_actions(action_type);
```

---

## 9. 市集

```sql
CREATE TABLE market_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_oc TEXT NOT NULL,
    seller_type TEXT NOT NULL,          -- 'item_merchant' | 'black_merchant'
    item_type TEXT NOT NULL,
        -- 'item'      一般道具
        -- 'outfit'    衣裝
        -- 'dice_item' 骰子判定商品
        -- 'custom'    自製商品
        -- 'r18'       R18服裝
        -- 'pet_preset' 預設寵物
        -- 'pet_special' 自製寵物
    item_id TEXT DEFAULT NULL,
    custom_name TEXT DEFAULT NULL,
    custom_description TEXT DEFAULT NULL,
    price INTEGER DEFAULT 1,
    chapter_version TEXT NOT NULL,
    is_sold BOOLEAN DEFAULT FALSE,
    buyer_oc TEXT DEFAULT NULL,
    requires_dice BOOLEAN DEFAULT FALSE,
    dice_type TEXT DEFAULT NULL,        -- 'D6' | 'D20'
    dice_results JSONB DEFAULT NULL,
        -- [{"min":1,"max":2,"coins_delta":0,"status_tag":null,"message":"..."}]
    listed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_chapter ON market_slots(chapter_version);
CREATE INDEX idx_market_unsold ON market_slots(is_sold);
CREATE INDEX idx_market_seller ON market_slots(seller_oc);
```

---

## 10. 寵物系統

```sql
CREATE TABLE pets (
    id TEXT PRIMARY KEY,                -- 如 'pet_001'
    name TEXT NOT NULL,
    description TEXT,                   -- 最多50字
    is_preset BOOLEAN DEFAULT TRUE,
    is_listed BOOLEAN DEFAULT FALSE,
    price INTEGER DEFAULT 2,
    seller_oc TEXT DEFAULT NULL,
    chapter_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE player_pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_oc TEXT NOT NULL,
    pet_id TEXT REFERENCES pets(id),
    is_released BOOLEAN DEFAULT FALSE,
    released_at TIMESTAMPTZ DEFAULT NULL,
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_oc, pet_id)
);

CREATE INDEX idx_player_pets_owner ON player_pets(owner_oc);
CREATE INDEX idx_player_pets_active ON player_pets(owner_oc, is_released);

-- 預設16款初始資料
INSERT INTO pets (id, name, description, price, is_preset) VALUES
('pet_001', '白鴉雛鳥',  '從繭的裂縫中飛出的幼鳥，羽毛帶著微弱的光。',              3, TRUE),
('pet_002', '霧中蜘蛛',  '在黑霧邊緣結網，捕捉的不是蟲，而是記憶碎片。',            2, TRUE),
('pet_003', '裂紋石龜',  '背殼上的裂紋像是地圖，據說通往某個消失的地方。',          2, TRUE),
('pet_004', '低語貓',    '永遠在說話，但沒有人聽得懂。',                              3, TRUE),
('pet_005', '黑泥蛙',    '從深淵邊緣的黑泥裡爬出來，皮膚帶有礦石紋路。',            1, TRUE),
('pet_006', '空心兔',    '摸起來輕飄飄的，像是靈魂還沒裝滿。',                       2, TRUE),
('pet_007', '鏡面魚',    '游泳時倒映周圍所有人的臉，但有時反射的臉不認識。',         3, TRUE),
('pet_008', '骨翼蝙蝠',  '翅膀是透明的，可以看見裡面細細的骨架。',                  2, TRUE),
('pet_009', '苔蘚熊',    '身上長著會發光的苔蘚，睡著時苔蘚會唱歌。',                3, TRUE),
('pet_010', '鏽鐵狐',    '毛色像生鏽的金屬，摸起來卻是暖的。',                       2, TRUE),
('pet_011', '晶體蜥蜴',  '皮膚是半透明的水晶質感，情緒激動時會發出碎裂聲。',        3, TRUE),
('pet_012', '無臉鳥',    '臉的位置是一片光滑的白，但牠知道你在看牠。',              4, TRUE),
('pet_013', '煙霧水母',  '飄在空中而非水裡，觸手碰到人會讓人想起遺忘的事。',        3, TRUE),
('pet_014', '紅眼鼴鼠',  '在地底挖掘，帶回來的東西有時候是別人失去的物品。',        2, TRUE),
('pet_015', '金線蠶',    '吐出的絲是真正的金色，但沒有人知道用途。',                4, TRUE),
('pet_016', '雙頭烏鴉',  '兩個頭永遠在爭論，但飛行方向從來不會出錯。',              3, TRUE);
```

---

## 11. 領主行動紀錄

```sql
CREATE TABLE leader_decrees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leader_oc TEXT NOT NULL,
    faction TEXT NOT NULL,
    decree_type TEXT NOT NULL,
        -- 'tax'            徵稅令
        -- 'curse'          命名詛咒
        -- 'law'            荒謬法令
        -- 'bounty'         懸賞令
        -- 'curse_treasury' 詛咒金庫
    content TEXT,
    target_oc TEXT DEFAULT NULL,
    target_landmark_id TEXT DEFAULT NULL,
    bounty_amount INTEGER DEFAULT NULL,
    bounty_completed BOOLEAN DEFAULT FALSE,
    bounty_completed_by TEXT DEFAULT NULL,
    evil_points_cost INTEGER DEFAULT 0,
    chapter_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leader_decrees_faction ON leader_decrees(faction);
CREATE INDEX idx_leader_decrees_chapter ON leader_decrees(chapter_version);
CREATE INDEX idx_leader_decrees_bounty ON leader_decrees(bounty_completed);
```

---

## 12. 玩家通知

```sql
CREATE TABLE player_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_oc TEXT NOT NULL,
    content TEXT NOT NULL,
    notification_type TEXT DEFAULT 'private',
        -- 'private'  私人通知
        -- 'popup'    強制彈窗（被綁架）
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_target ON player_notifications(target_oc);
CREATE INDEX idx_notifications_unread ON player_notifications(target_oc, is_read);
```

---

## 13. 因果標籤定義表

```sql
CREATE TABLE td_karma_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name TEXT UNIQUE NOT NULL,
    alias_prefix TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 14. SQLite（Prisma）Schema

**用途**：背道者選拔，不用於即時天平或市集。

```prisma
model td_users {
  id                         String   @id @default(uuid())
  username                   String   @unique
  faction                    String
  identity_role              String   @default("citizen")
  is_high_affinity_candidate Boolean  @default(false)
  npc_role                   String?
  created_at                 DateTime @default(now())
}
```

⚠️ SQLite 與 Supabase 的 `td_users` 是獨立資料庫，欄位不完全相同，勿混用。

---

## 15. API 清單

### ✅ 已實作（40支）

**任務 / 天平**
```
POST /api/mission/report              任務回報
POST /api/mission/lock                任務鎖定持久化（防刷幣）
POST /api/balance/update              天平更新
```

**商人 NPC**
```
POST /api/npc/merchant/list-item      商人上架道具
POST /api/npc/merchant/buy            購買道具
GET  /api/npc/merchant/market         瀏覽市集
```

**黑心商人**
```
POST /api/black-merchant/dice-buy     骰子判定購買
POST /api/black-merchant/haggle       黑市議價
```

**人販子 NPC**
```
POST /api/npc/trafficker/kidnap       人販子綁架
POST /api/npc/trafficker/deliver      人販子村民任務
POST /api/npc/trafficker/intel        人販子黑市情報
POST /api/npc/trafficker/pickpocket   人販子扒竊
```

**旅店 NPC**
```
POST /api/npc/inn/heal                旅店治療
POST /api/npc/inn/rescue              旅店救援（依距離縮短失蹤時間）
POST /api/npc/inn/toggle-shop         旅店開關店
```

**寵物商人**
```
POST /api/pets/buy                    購買寵物
POST /api/pets/release                流放寵物
POST /api/pets/manage/toggle-listing  寵物上架管理
POST /api/pets/manage/create-special  新增自製寵物
POST /api/pets/manage/toggle-shop     寵物商人開關店
```

**NPC 共用**
```
POST /api/npc/move                    NPC移動（移動型NPC共用）
```

**背道者選拔**
```
POST /api/apostate/submit-screening   適性問卷結果寫入Supabase
POST /api/admin/lottery               背道者抽選（每陣營抽2人）
POST /api/admin/stats                 管理員統計
```

**背道者能力**
```
POST /api/apostate/greed              背道者能力A：貪婪
POST /api/apostate/leak               背道者能力B：陣營洩漏
POST /api/apostate/pickpocket         背道者能力C：扒竊
```

**認證**
```
POST /api/auth/set-password           第一次登入設定密碼
POST /api/liquidator/scan             清算者掃描
```

**組隊**
```
POST /api/party/join                  加入組隊
POST /api/party/draw-card             組隊抽卡
POST /api/party/end                   結束組隊
```

**領主惡政**
```
POST /api/leader/tax                  徵稅令
POST /api/leader/curse                命名詛咒
POST /api/leader/law                  荒謬法令
POST /api/leader/bounty               懸賞令
POST /api/leader/curse-treasury       詛咒金庫
POST /api/curse/remove                玩家花20幣解除詛咒
```

**據點留言**
```
POST /api/landmark/message            據點留言
GET  /api/landmark/messages           查看據點留言（同陣營過濾）
```

### 🟢 P3 待實作
```
褪色印記顯示
天平Lottie動畫（等設計師素材）
水墨邊框效果（等設計師素材）
真結局遺物收集系統
```

---

## 16. 已廢棄的表（不再使用）

```
drift_fragments       漂流瓶系統已取消
breath_pool           呼息禮物池已取消
td_fog_clear_events   迷霧清除事件已取消
td_adventure_logs     已由 mission_logs 取代
td_player_profiles    已合併進 td_users
td_user_likes         點讚系統暫不實作
leader_actions        已由 leader_decrees 取代
```
