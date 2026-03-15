# 《白鴉之繭》P0 修補 — API 契約 & 端到端驗收文件

> 本文件用途：Trae 完成 P0 修補後，作為對照驗收依據。  
> 所有 API 均假設 base URL 為本地開發環境 `http://localhost:3000`。  
> 生產環境需替換為實際域名。

---

## 目錄

1. [P0-1 購買 API](#p0-1-購買-api)
2. [P0-2 任務鎖定持久化](#p0-2-任務鎖定持久化)
3. [P0-3 適性問卷寫入 Supabase](#p0-3-適性問卷寫入-supabase)
4. [P0-4 清算者掃描 Bug](#p0-4-清算者掃描-bug)
5. [P0-5 陣營色碼全面替換](#p0-5-陣營色碼全面替換)
6. [P0-6 管理員密碼安全改造](#p0-6-管理員密碼安全改造)
7. [端到端測試腳本](#端到端測試腳本)
8. [驗收 Checklist](#驗收-checklist)

---

### `POST /api/auth/login`

**用途**：玩家使用 OC 名稱和密碼登入。

#### 請求格式

```json
{
  "oc_name": "塞理安",
  "password": "1234"
}
```

#### 後端執行順序

```
1. 查詢 td_users WHERE oc_name = oc_name
   → 若不存在 → 回傳 404 「USER_NOT_FOUND」

2. 比對 simple_password
   → 若不匹配 → 回傳 401 「INVALID_PASSWORD」

3. 回傳 200 成功，並附帶 user 物件
```

---

## P0-1 購買 API

### `POST /api/npc/merchant/buy`

**用途**：玩家向道具商人或黑心商人購買商品（非骰子判定類）。

#### 請求格式

```json
{
  "buyer_oc": "塞理安",
  "market_slot_id": "uuid-of-slot",
  "chapter_version": "1.0"
}
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `buyer_oc` | string | ✅ | 購買者 OC 名稱 |
| `market_slot_id` | string (UUID) | ✅ | 對應 `market_slots.id` |
| `chapter_version` | string | ✅ | 當前章節，格式如 `"1.0"` |

#### 後端執行順序（必須在同一 transaction 內完成）

```
1. 查詢 market_slots WHERE id = market_slot_id
   → 若 is_sold = TRUE  → 回傳 409 「商品已售出」
   → 若不存在           → 回傳 404 「商品不存在」

2. 查詢 buyer 的 td_users.coins
   → 若 coins < price   → 回傳 400 「貨幣不足」

3. 若 item_type = 'outfit' 或 'r18'：
   查詢 buyer 的 wardrobe JSONB
   → 若已包含此 item_id → 回傳 409 「衣裝已持有」

4. 若 item_type IN ('pet_preset', 'pet_special')：
   查詢 player_pets WHERE owner_oc = buyer_oc AND pet_id = item_id
   → 若存在（含 is_released = TRUE）→ 回傳 409 「此寵物已被通緝，無法再次購買」

5. 執行扣幣：
   UPDATE td_users SET coins = coins - price
   WHERE oc_name = buyer_oc

6. 標記售出：
   UPDATE market_slots
   SET is_sold = TRUE, buyer_oc = buyer_oc
   WHERE id = market_slot_id

7. 依 item_type 執行後續寫入：
   - 'item' / 'custom' → 寫入 buyer inventory JSONB
   - 'outfit' / 'r18'  → 寫入 buyer wardrobe JSONB
   - 'pet_preset' / 'pet_special' → INSERT INTO player_pets

8. 寫入 npc_actions：
   action_type = 'buy_item'
   npc_oc = seller_oc, target_oc = buyer_oc
   coins_delta = -price

9. 回傳 200 成功
```

#### 成功回應

```json
{
  "success": true,
  "message": "購買成功",
  "item_type": "item",
  "item_id": "item_001",
  "coins_remaining": 7
}
```

#### 錯誤回應一覽

| HTTP 狀態碼 | `error` 值 | 說明 |
|-------------|-----------|------|
| 400 | `INSUFFICIENT_COINS` | 貨幣不足 |
| 404 | `SLOT_NOT_FOUND` | 商品不存在 |
| 409 | `ALREADY_SOLD` | 商品已售出（先到先得衝突） |
| 409 | `OUTFIT_ALREADY_OWNED` | 衣裝已持有 |
| 409 | `PET_BLACKLISTED` | 寵物已流放或持有過，無法再買 |
| 422 | `MISSING_FIELDS` | 缺少必填欄位 |
| 500 | `DB_ERROR` | 資料庫錯誤 |

#### 前端對接注意

- 購買按鈕點擊後立即 disabled，避免重複送出（中國低速網路下尤其重要）
- 收到 409 `ALREADY_SOLD` 時需重新 fetch 市集列表，更新 UI
- 購買成功後需更新 header 的貨幣顯示數字

---

### `POST /api/pets/buy`

**用途**：玩家向寵物商人購買寵物（走獨立路由，非市集）。

#### 請求格式

```json
{
  "buyer_oc": "塞理安",
  "pet_id": "pet_001",
  "chapter_version": "1.0"
}
```

#### 後端執行順序

```
1. 查詢 pets WHERE id = pet_id AND is_listed = TRUE
   → 若不存在或未上架 → 404 PET_NOT_FOUND

2. 查詢 player_pets WHERE owner_oc = buyer_oc AND pet_id = pet_id
   → 若存在（無論 is_released）→ 409 PET_BLACKLISTED

3. 查詢玩家當前持有寵物數量
   SELECT COUNT(*) FROM player_pets
   WHERE owner_oc = buyer_oc AND is_released = FALSE
   → 若 >= 3 → 400 PET_LIMIT_REACHED（「你已無法再養更多了」）

4. 扣幣 + INSERT player_pets（同一 transaction）

5. 回傳 200
```

#### 錯誤回應補充

| HTTP 狀態碼 | `error` 值 | 前端顯示文字 |
|-------------|-----------|------------|
| 400 | `PET_LIMIT_REACHED` | 「你已無法再養更多了」 |
| 409 | `PET_BLACKLISTED` | 「你已經被這個族群通緝了，人類。」 |

---

## P0-2 任務鎖定持久化

### `POST /api/mission/lock`

**用途**：玩家回報任務後，鎖定該任務本章不可重複回報，防刷幣。

#### 請求格式

```json
{
  "oc_name": "塞理安",
  "mission_id": "main_ch1_l1",
  "chapter_version": "1.0"
}
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `oc_name` | string | ✅ | 玩家 OC 名稱 |
| `mission_id` | string | ✅ | 任務識別碼 |
| `chapter_version` | string | ✅ | 當前章節 |

#### mission_id 格式規範

```
{type}_{chapter}_{landmark_id}
範例：
  main_ch1_l1     → 第一章 l1 據點主線任務
  side_ch1_l2     → 第一章 l2 據點支線任務
  daily_ch1_l1    → 第一章 l1 常駐任務
  party_ch1_l1    → 第一章 l1 組隊任務
```

#### 鎖定判斷邏輯

```
查詢 mission_logs：
  WHERE oc_name = oc_name
    AND mission_id = mission_id
    AND chapter_version = chapter_version
    AND status IN ('reported', 'approved')

→ 若查詢到記錄 → 回傳 409 MISSION_ALREADY_LOCKED
→ 若查詢不到   → INSERT 新紀錄，status = 'reported'
```

#### 與 `POST /api/mission/report` 的關係

```
正確呼叫順序：
  1. 前端呼叫 POST /api/mission/report（計算獎勵、加幣）
  2. report 成功後，後端內部自動呼叫 mission/lock 邏輯
     （不應由前端分開呼叫，防止 race condition）

⚠️ 重要：mission/lock 邏輯應整合在 mission/report 的 transaction 內，
   而不是兩個獨立 API 分開呼叫。
   若目前已分開實作，需在 report API 內加入 lock 判斷。
```

#### 成功回應

```json
{
  "success": true,
  "message": "任務回報已記錄",
  "coins_earned": 3,
  "coins_total": 10,
  "weekly_coin_earned": 8
}
```

#### 錯誤回應一覽

| HTTP 狀態碼 | `error` 值 | 說明 |
|-------------|-----------|------|
| 409 | `MISSION_ALREADY_LOCKED` | 本章已回報過此任務 |
| 400 | `CHAPTER_CAP_REACHED` | 本章貨幣已達上限（10幣） |
| 400 | `DAILY_CAP_REACHED` | 今日貨幣已達上限（5幣） |
| 422 | `MISSING_FIELDS` | 缺少必填欄位 |

#### 章節重置邏輯

```
章節更新時（管理員觸發）需執行：
  1. 清空 mission_logs 中 status = 'reported' 的本章記錄
     （或以 chapter_version 區分，不刪除，自然隔離）
  2. UPDATE td_users SET weekly_coin_earned = 0, daily_coin_earned = 0
  3. 重置其他章節狀態（apostate_skill_used 等）

⚠️ 推薦用 chapter_version 區分而不是刪除記錄，
   方便管理員事後查帳。
```

---

## P0-3 適性問卷寫入 Supabase

### `POST /api/apostate/submit-screening`

**用途**：玩家完成適性問卷後，將結果寫入 Supabase `td_users`。

#### 請求格式

```json
{
  "oc_name": "塞理安",
  "answers": [
    { "question_id": "q1", "answer": "A" },
    { "question_id": "q2", "answer": "B" },
    { "question_id": "q3", "answer": "A" },
    { "question_id": "q4", "answer": "C" },
    { "question_id": "q5", "answer": "A" }
  ]
}
```

#### 後端評分邏輯

```
每題設定「高適性答案」（由管理員設定，硬編碼在後端）：
  q1: 'A' = +1
  q2: 'B' = +1
  q3: 'A' = +1
  q4: 'C' = +1
  q5: 'A' = +1

高適性分數閾值：>= 3 分 → is_high_affinity_candidate = TRUE

UPDATE td_users
SET is_high_affinity_candidate = (score >= 3),
    is_in_lottery_pool = TRUE
WHERE oc_name = oc_name
```

#### 防重複提交

```
查詢 td_users.is_in_lottery_pool WHERE oc_name = oc_name
→ 若 TRUE → 回傳 409 SCREENING_ALREADY_SUBMITTED
```

#### 回應格式（故意模糊，不洩漏是否被標記）

```json
{
  "success": true,
  "message": "問卷已記錄。"
}
```

> ⚠️ 絕對不回傳 `is_high_affinity_candidate` 的值。前端收到 success 只顯示「已收到」，並應有防止重複彈窗的機制。

---

## P0-4 清算者掃描 Bug

### `POST /api/liquidator/scan`

**問題**：角色名對比邏輯錯誤，疑似大小寫或全半形不一致導致比對失敗。

#### 正確比對方式

```typescript
// ❌ 錯誤寫法（可能的問題）
if (input_name == db_oc_name) { ... }

// ✅ 正確寫法（trim + normalize）
const normalize = (s: string) =>
  s.trim().toLowerCase().normalize('NFC')

if (normalize(input_name) === normalize(db_oc_name)) { ... }
```

#### 請求格式（確認）

```json
{
  "scanner_oc": "vonn",
  "target_name": "塞理安",
  "chapter_version": "1.0"
}
```

#### 驗收確認點

- [ ] 輸入含空格的 OC 名稱仍能正確比對（trim）
- [ ] 全形/半形字元不影響比對
- [ ] 找不到目標時回傳 404 而非靜默失敗

---

## P0-5 陣營色碼全面替換

### 需替換的色碼對照表

| 舊色碼 | 新色碼 | 用途 |
|--------|--------|------|
| `#9333ea` | `#7c3aed` | 濁息者高光色 |
| `#eab308` | `#d4af37` | 淨塵者高光色 |

### Grep 指令（在專案根目錄執行）

```bash
# 找出所有舊色碼位置
grep -rn "#9333ea" --include="*.tsx" --include="*.ts" --include="*.css" --include="*.json" .
grep -rn "#eab308" --include="*.tsx" --include="*.ts" --include="*.css" --include="*.json" .

# 確認替換後無殘留
grep -rn "#9333ea\|#eab308" --include="*.tsx" --include="*.ts" --include="*.css" .
```

### 高風險位置清單（優先確認）

```
src/components/MapView*         地圖陣營標色
src/components/CharacterCard*   角色卡陣營色
src/components/CentralBalance*  天平組件
src/styles/globals.css          全局CSS變數
tailwind.config.*               Tailwind色彩設定
src/lib/constants.*             色碼常數定義
```

### 建議做法

在 `src/lib/constants.ts` 集中定義色碼常數，全專案引用常數而非硬編碼：

```typescript
// src/lib/constants.ts
export const FACTION_COLORS = {
  Turbid: {
    primary: '#211a2e',
    highlight: '#7c3aed',  // ✅ 新色碼
  },
  Pure: {
    primary: '#ede6ce',
    highlight: '#d4af37',  // ✅ 新色碼
  },
  background: '#0a0a0f',
  leaderEvil: '#7f1d1d',
} as const
```

---

## P0-6 管理員密碼安全改造

### 問題描述

`ReportSystemLogic.ts` 內有硬編碼密碼，任何有代碼庫存取權限的人都能看到。

### 改造步驟

#### Step 1：移除硬編碼

```typescript
// ❌ 改造前（ReportSystemLogic.ts 內類似這樣的寫法）
const ADMIN_PASSWORD = 'xxxx'

// ✅ 改造後
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
if (!ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD env not set')
```

#### Step 2：設定環境變數

```bash
# .env.local（本地開發，不提交 git）
ADMIN_PASSWORD=你的密碼

# Vercel / 生產環境
# 在部署平台的環境變數設定面板手動填入
```

#### Step 3：確認 .gitignore

```bash
# 確認 .env.local 在 .gitignore 內
cat .gitignore | grep .env
# 應看到：.env*.local 或 .env.local
```

#### Step 4：驗收確認

```bash
# 確認代碼中無硬編碼密碼
grep -rn "vonn\|ADMIN_PASSWORD\s*=\s*['\"]" --include="*.ts" --include="*.tsx" src/
# 結果應只出現 process.env.ADMIN_PASSWORD，不出現明文密碼
```

---

### `POST /api/admin/settle-chapter` (僅限管理員)

**用途**：觸發章節結算，更新 NPC 的經營狀態。

### `POST /api/npc/donate`

**用途**：玩家對經營不善的 NPC 進行捐款。

**請求格式**

```json
{
  "donator_oc": "塞理安",
  "npc_oc": "NPC_雜貨商人",
  "amount": 5
}
```

---

## 端到端測試腳本

> 以下腳本用 `curl` 撰寫，適合在中國網路環境執行（不依賴 WebSocket）。
> 執行前請先替換 `BASE_URL`、`buyer_oc`、`market_slot_id` 等變數。

### 環境設定

```bash
BASE_URL="http://localhost:3000"
BUYER_OC="塞理安"
CHAPTER="1.0"
```

---

### 測試 1：購買 API 正常流程

```bash
# 先取得市集列表，找到一個未售出的 slot id
curl -s "$BASE_URL/api/npc/merchant/market?chapter_version=$CHAPTER" | \
  python3 -c "import sys,json; slots=json.load(sys.stdin)['slots']; \
  print([s for s in slots if not s['is_sold']][0]['id'])"

# 儲存 slot_id 後執行購買
SLOT_ID="貼上上面取得的UUID"

curl -s -X POST "$BASE_URL/api/npc/merchant/buy" \
  -H "Content-Type: application/json" \
  -d "{\"buyer_oc\": \"$BUYER_OC\", \"market_slot_id\": \"$SLOT_ID\", \"chapter_version\": \"$CHAPTER\"}"

# 預期回應：{"success":true,"message":"購買成功",...}
```

### 測試 2：購買 API — 貨幣不足

```bash
# 假設有個 price=99 的商品（或玩家幣不夠）
curl -s -X POST "$BASE_URL/api/npc/merchant/buy" \
  -H "Content-Type: application/json" \
  -d "{\"buyer_oc\": \"$BUYER_OC\", \"market_slot_id\": \"$SLOT_ID\", \"chapter_version\": \"$CHAPTER\"}"

# 預期回應：{"success":false,"error":"INSUFFICIENT_COINS"}
```

### 測試 3：購買 API — 重複購買同一商品

```bash
# 重複送出相同請求（商品已售出）
curl -s -X POST "$BASE_URL/api/npc/merchant/buy" \
  -H "Content-Type: application/json" \
  -d "{\"buyer_oc\": \"$BUYER_OC\", \"market_slot_id\": \"$SLOT_ID\", \"chapter_version\": \"$CHAPTER\"}"

# 預期回應：{"success":false,"error":"ALREADY_SOLD"}
```

### 測試 4：任務鎖定 — 正常回報

```bash
curl -s -X POST "$BASE_URL/api/mission/report" \
  -H "Content-Type: application/json" \
  -d "{
    \"oc_name\": \"$BUYER_OC\",
    \"mission_id\": \"main_ch1_l1\",
    \"chapter_version\": \"$CHAPTER\",
    \"report_content\": \"第一章-遺棄醫院-塞理安\"
  }"

# 預期回應：{"success":true,"coins_earned":3,...}
```

### 測試 5：任務鎖定 — 重複回報（防刷幣核心驗證）

```bash
# 立即重複送出相同請求
curl -s -X POST "$BASE_URL/api/mission/report" \
  -H "Content-Type: application/json" \
  -d "{
    \"oc_name\": \"$BUYER_OC\",
    \"mission_id\": \"main_ch1_l1\",
    \"chapter_version\": \"$CHAPTER\",
    \"report_content\": \"第一章-遺棄醫院-塞理安\"
  }"

# ✅ 預期回應：{"success":false,"error":"MISSION_ALREADY_LOCKED"}
# ❌ 如果回應 success:true 代表鎖定失敗，需修復
```

### 測試 6：適性問卷提交

```bash
curl -s -X POST "$BASE_URL/api/apostate/submit-screening" \
  -H "Content-Type: application/json" \
  -d "{
    \"oc_name\": \"$BUYER_OC\",
    \"answers\": [
      {\"question_id\": \"q1\", \"answer\": \"A\"},
      {\"question_id\": \"q2\", \"answer\": \"B\"},
      {\"question_id\": \"q3\", \"answer\": \"A\"},
      {\"question_id\": \"q4\", \"answer\": \"C\"},
      {\"question_id\": \"q5\", \"answer\": \"A\"}
    ]
  }"

# 預期回應：{"success":true,"message":"問卷已記錄。"}
# ⚠️ 回應中不得出現 is_high_affinity_candidate 欄位
```

### 測試 7：適性問卷 — 重複提交防護

```bash
# 重複送出
curl -s -X POST "$BASE_URL/api/apostate/submit-screening" \
  -H "Content-Type: application/json" \
  -d "{\"oc_name\": \"$BUYER_OC\", \"answers\": []}"

# 預期回應：{"success":false,"error":"SCREENING_ALREADY_SUBMITTED"}
```

### 測試 8：清算者掃描（含空格邊界測試）

```bash
# 正常掃描
curl -s -X POST "$BASE_URL/api/liquidator/scan" \
  -H "Content-Type: application/json" \
  -d "{\"scanner_oc\": \"vonn\", \"target_name\": \"塞理安\", \"chapter_version\": \"$CHAPTER\"}"

# 含前後空格（測試 trim）
curl -s -X POST "$BASE_URL/api/liquidator/scan" \
  -H "Content-Type: application/json" \
  -d "{\"scanner_oc\": \"vonn\", \"target_name\": \" 塞理安 \", \"chapter_version\": \"$CHAPTER\"}"

# 兩次應回傳相同結果
```

---

## 驗收 Checklist

Trae 完成後，逐項勾選確認：

### P0-1 購買 API

- [ ] `POST /api/npc/merchant/buy` 路由存在且回應 200
- [ ] 貨幣不足回傳 400 `INSUFFICIENT_COINS`
- [ ] 商品已售出回傳 409 `ALREADY_SOLD`
- [ ] 購買成功後 `market_slots.is_sold = TRUE`
- [ ] 購買成功後 `td_users.coins` 正確扣除
- [ ] 購買衣裝後寫入 `wardrobe JSONB`
- [ ] 購買寵物後寫入 `player_pets`
- [ ] 已流放寵物無法再購買（`PET_BLACKLISTED`）
- [ ] 寵物上限3隻檢查（`PET_LIMIT_REACHED`）
- [ ] 前端購買按鈕送出後立即 disabled

### P0-2 任務鎖定持久化

- [ ] `POST /api/mission/report` 內部包含 lock 判斷
- [ ] 同章節同任務重複回報回傳 409 `MISSION_ALREADY_LOCKED`
- [ ] 貨幣上限（10幣/章）正確檢查
- [ ] `mission_logs` 正確寫入紀錄
- [ ] 章節更新後 `weekly_coin_earned` 歸零

### P0-3 適性問卷

- [ ] `POST /api/apostate/submit-screening` 路由存在
- [ ] 結果正確寫入 `td_users.is_high_affinity_candidate`
- [ ] 回應中不洩漏 `is_high_affinity_candidate` 值
- [ ] 重複提交回傳 409
- [ ] `is_in_lottery_pool` 寫入 TRUE

### P0-4 清算者掃描

- [ ] OC 名稱 trim 處理
- [ ] 大小寫/全半形 normalize 處理
- [ ] 找不到目標回傳 404（非靜默失敗）

### P0-5 色碼替換

- [ ] `grep -rn "#9333ea"` 結果為空
- [ ] `grep -rn "#eab308"` 結果為空
- [ ] 頁面視覺確認：濁息者高光為 `#7c3aed`
- [ ] 頁面視覺確認：淨塵者高光為 `#d4af37`
- [ ] `src/lib/constants.ts` 已集中管理色碼常數

### P0-6 密碼安全

- [ ] `ReportSystemLogic.ts` 無明文密碼
- [ ] 密碼改為 `process.env.ADMIN_PASSWORD` 讀取
- [ ] `.env.local` 已加入 `.gitignore`
- [ ] git log 中無密碼提交紀錄（若有需用 git rebase 清除）

---

## 附：中國網路環境特別注意事項

這些不是 P0，但在 Trae 開發過程中隨手可做的防禦性改動：

```
1. Supabase Realtime 備援
   凡是用到 Realtime 訂閱的地方，加上輪詢 fallback：
   每 15 秒執行一次 fetch，若 WebSocket 斷線自動切換。

2. 圖片載入
   Supabase Storage 的圖片 URL 在中國不穩定。
   建議加上 loading="lazy" + onerror fallback（顯示預設佔位圖）。

3. 請求 timeout
   所有 fetch 加上 AbortController timeout（建議 8 秒）：
   const controller = new AbortController()
   setTimeout(() => controller.abort(), 8000)
   fetch(url, { signal: controller.signal })

4. 貨幣顯示
   介面所有「殘幣」「金幣」「幣」等用詞統一替換為「貨幣」
   grep -rn "殘幣\|金幣" --include="*.tsx" --include="*.ts" src/
```

---

*文件版本：2026-03-12 | 依據 System_Design.md 2026-03-10 重構版本*
