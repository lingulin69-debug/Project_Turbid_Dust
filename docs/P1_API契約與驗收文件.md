# 《白鴉之繭》P1 功能 — API 契約 & 端到端驗收文件

## 1. 組隊系統完整實作

### 1.1 加入組隊 (Join Party)

#### API 端點
`POST /api/party/join`

#### 請求 (Request)
```json
{
  "oc_name": "string",        // 玩家的 OC 名稱
  "landmark_id": "string",    // 據點 ID
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "party_id": "string" // 成功加入或創建的組隊 ID
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：ALREADY_IN_PARTY, PARTY_FULL, USER_NOT_FOUND, LANDMARK_NOT_FOUND
}
```

#### 驗收標準
*   玩家成功加入組隊後，其 `td_users` 表中的 `is_in_party` 欄位應更新為 `true`。
*   若組隊已滿，玩家應無法加入，並收到 `PARTY_FULL` 錯誤。
*   若玩家已在組隊中，應無法加入其他組隊，並收到 `ALREADY_IN_PARTY` 錯誤。
*   組隊人數達標後，組隊狀態應更新為 `full` (此為後端內部邏輯，前端不直接呼叫)。

#### 測試腳本 (cURL)
```bash
# 測試成功加入組隊
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "landmark_id": "l1",
  "chapter_version": "1.0"
}' http://localhost:3000/api/party/join

# 測試玩家已在組隊中
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "landmark_id": "l2",
  "chapter_version": "1.0"
}' http://localhost:3000/api/party/join

# 測試組隊已滿 (假設 l1 的組隊已滿)
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerC",
  "landmark_id": "l1",
  "chapter_version": "1.0"
}' http://localhost:3000/api/party/join
```

### 1.2 獲取組隊劇情 (Get Party Story)

#### API 端點
`GET /api/party/story`

#### 請求 (Request)
*   此 API 應透過查詢參數接收組隊 ID 和章節版本。
```
?party_id=string&chapter_version=string
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "story_text": "string", // 組隊劇情文本內容
  "choices": []           // 若有選擇分支，則包含選項
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：PARTY_NOT_FOUND, STORY_NOT_AVAILABLE
}
```

#### 驗收標準
*   成功返回指定組隊和章節版本的劇情文本。
*   劇情文本應從 `/src/data/party-events.json` 中讀取。
*   若組隊 ID 或章節版本無效，應返回相應錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取組隊劇情 (假設 party_id 為 "party_abc")
curl -X GET "http://localhost:3000/api/party/story?party_id=party_abc&chapter_version=1.0"

# 測試組隊 ID 無效
curl -X GET "http://localhost:3000/api/party/story?party_id=invalid_id&chapter_version=1.0"
```

### 1.3 組隊抽卡 (Draw Party Card)

#### API 端點
`POST /api/party/draw-card`

#### 請求 (Request)
```json
{
  "oc_name": "string",        // 玩家的 OC 名稱
  "party_id": "string",       // 組隊 ID
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "card_result": "safe" | "ghost", // 抽卡結果：安全牌或鬼牌
  "hp_deducted": 0 | 1             // 若為鬼牌，則為 1，否則為 0
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NOT_IN_PARTY, CARD_ALREADY_DRAWN, PARTY_NOT_FOUND
}
```

#### 驗收標準
*   玩家成功抽卡後，應返回 `safe` 或 `ghost` 結果。
*   若抽到 `ghost`，玩家的 HP 應扣除 1 點。
*   每個玩家在每個組隊中只能抽卡一次。
*   後端應隨機決定鬼牌位置，前端不應知道。

#### 測試腳本 (cURL)
```bash
# 測試成功抽卡 (假設 party_id 為 "party_abc")
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "party_id": "party_abc",
  "chapter_version": "1.0"
}' http://localhost:3000/api/party/draw-card

# 測試重複抽卡
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "party_id": "party_abc",
  "chapter_version": "1.0"
}' http://localhost:3000/api/party/draw-card
```

### 1.4 回報組隊任務 (Report Party Mission)

#### API 端點
`POST /api/party/report-mission`

#### 請求 (Request)
```json
{
  "oc_name": "string",        // 玩家的 OC 名稱
  "mission_id": "string",     // 任務 ID
  "party_id": "string",       // 組隊 ID
  "report_content": "string", // 任務回報內容
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：MISSION_ALREADY_REPORTED, NOT_IN_PARTY, MISSION_NOT_FOUND
}
```

#### 驗收標準
*   任務成功回報後，`mission_logs` 應記錄該任務為完成狀態。
*   組隊夥伴的 OC 名稱應寫入回報玩家的角色卡「見證紀錄」中。
*   若任務已回報或玩家不在組隊中，應返回相應錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功回報組隊任務 (假設 party_id 為 "party_abc", mission_id 為 "m_party_1")
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "mission_id": "m_party_1",
  "party_id": "party_abc",
  "report_content": "我們成功完成了組隊任務！",
  "chapter_version": "1.0"
}' http://localhost:3000/api/party/report-mission

# 測試重複回報任務
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "mission_id": "m_party_1",
  "party_id": "party_abc",
  "report_content": "再次回報",
  "chapter_version": "1.0"
}' http://localhost:3000/api/party/report-mission
```

## 2. HP 扣血機制

### 2.1 扣除玩家 HP (Deduct Player HP)

#### API 端點
`POST /api/user/deduct-hp`

#### 請求 (Request)
```json
{
  "oc_name": "string",        // 玩家的 OC 名稱
  "amount": "number",         // 扣除的 HP 數量 (預設為 1)
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "current_hp": "number" // 玩家當前剩餘 HP
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND, INVALID_AMOUNT
}
```

#### 驗收標準
*   玩家的 HP 應正確扣除。
*   玩家的 HP 不應低於 0。
*   若玩家不存在，應返回 `USER_NOT_FOUND` 錯誤。
*   若扣除數量無效 (例如負數)，應返回 `INVALID_AMOUNT` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功扣除 HP (假設 PlayerA 的 HP 為 10)
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "amount": 1,
  "chapter_version": "1.0"
}' http://localhost:3000/api/user/deduct-hp

# 測試 HP 不會低於 0 (假設 PlayerA 的 HP 為 0 或 1)
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "amount": 5,
  "chapter_version": "1.0"
}' http://localhost:3000/api/user/deduct-hp

# 測試玩家不存在
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "NonExistentPlayer",
  "amount": 1,
  "chapter_version": "1.0"
}' http://localhost:3000/api/user/deduct-hp
```

## 3. 背道者選拔流程打通

### 3.1 抽選背道者 (Select Apostate)

#### API 端點
`POST /api/apostate/select`

#### 請求 (Request)
```json
{
  "oc_name": "string",        // 被選為背道者的玩家 OC 名稱
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Apostate selected and identity locked."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND, ALREADY_APOSTATE, NOT_HIGH_AFFINITY_CANDIDATE
}
```

#### 驗收標準
*   被選中的玩家 `identity_role` 應更新為 `'apostate'`。
*   `identity_role` 應被鎖定，不可再更改。
*   若玩家不存在，應返回 `USER_NOT_FOUND` 錯誤。
*   若玩家已是背道者，應返回 `ALREADY_APOSTATE` 錯誤。
*   若玩家不是 `is_high_affinity_candidate`，應返回 `NOT_HIGH_AFFINITY_CANDIDATE` 錯誤 (此為 GM 操作時的提示)。

#### 測試腳本 (cURL)
```bash
# 測試成功選拔背道者 (假設 PlayerB 是高適性候選人)
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerB",
  "chapter_version": "1.0"
}' http://localhost:3000/api/apostate/select

# 測試玩家不存在
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "NonExistentPlayer",
  "chapter_version": "1.0"
}' http://localhost:3000/api/apostate/select

# 測試玩家已是背道者
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerB",
  "chapter_version": "1.0"
}' http://localhost:3000/api/apostate/select
```

## 4. 領主惡政面板

### 4.1 領主徵稅 (Leader Tax)

#### API 端點
`POST /api/leader/tax`

#### 請求 (Request)
```json
{
  "leader_oc": "string",      // 領主的 OC 名稱
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Tax decree issued successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NOT_A_LEADER, NO_EVIL_POINTS, FACTION_MISMATCH
}
```

#### 驗收標準
*   領主的 `leader_evil_points` 應扣除 1 點。
*   本陣營所有玩家 (coins > 0) 的貨幣應扣除 1 幣，並增加到領主的「金庫」中。
*   被徵稅玩家的 `mission_bonus_coins` 應增加 1。
*   應自動發布一條小道消息。
*   若操作者不是領主，應返回 `NOT_A_LEADER` 錯誤。
*   若領主沒有惡政點數，應返回 `NO_EVIL_POINTS` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功發布徵稅令 (假設 LeaderA 是領主)
curl -X POST -H "Content-Type: application/json" -d '{
  "leader_oc": "LeaderA",
  "chapter_version": "1.0"
}' http://localhost:3000/api/leader/tax

# 測試非領主操作
curl -X POST -H "Content-Type: application/json" -d '{
  "leader_oc": "PlayerA",
  "chapter_version": "1.0"
}' http://localhost:3000/api/leader/tax

# 測試惡政點數不足 (假設 LeaderA 惡政點數為 0)
curl -X POST -H "Content-Type: application/json" -d '{
  "leader_oc": "LeaderA",
  "chapter_version": "1.0"
}' http://localhost:3000/api/leader/tax
```

### 4.2 領主命名詛咒 (Leader Curse)

#### API 端點
`POST /api/leader/curse`

#### 請求 (Request)
```json
{
  "leader_oc": "string",      // 領主的 OC 名稱
  "target_oc": "string",      // 目標玩家的 OC 名稱
  "prefix": "string",         // 自訂的詛咒前綴文字
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Curse decree issued successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NOT_A_LEADER, NO_EVIL_POINTS, TARGET_NOT_FOUND, CROSS_FACTION_CURSE_FORBIDDEN
}
```

#### 驗收標準
*   領主的 `leader_evil_points` 應扣除 1 點。
*   目標玩家的匿名代號應在前端顯示時加上指定前綴。
*   應自動發布一條小道消息 (顯示匿名代號)。
*   若目標玩家花費 20 幣解除詛咒，貨幣應進入虛空。
*   若目標玩家與領主不同陣營，應返回 `CROSS_FACTION_CURSE_FORBIDDEN` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功發布命名詛咒 (假設 LeaderA 是領主, PlayerB 是同陣營玩家)
curl -X POST -H "Content-Type: application/json" -d '{
  "leader_oc": "LeaderA",
  "target_oc": "PlayerB",
  "prefix": "被詛咒的",
  "chapter_version": "1.0"
}' http://localhost:3000/api/leader/curse

# 測試跨陣營詛咒
curl -X POST -H "Content-Type: application/json" -d '{
  "leader_oc": "LeaderA",
  "target_oc": "EnemyPlayer",
  "prefix": "被詛咒的",
  "chapter_version": "1.0"
}' http://localhost:3000/api/leader/curse
```

### 4.3 領主荒謬法令 (Leader Law)

#### API 端點
`POST /api/leader/law`

#### 請求 (Request)
```json
{
  "leader_oc": "string",      // 領主的 OC 名稱
  "content": "string",        // 法令內容
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Law decree issued successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NOT_A_LEADER, NO_EVIL_POINTS
}
```

#### 驗收標準
*   領主的 `leader_evil_points` 應扣除 1 點。
*   應自動發布一條小道消息。
*   玩家登入後第一個畫面應顯示該法令 (可關閉)。

#### 測試腳本 (cURL)
```bash
# 測試成功發布荒謬法令
curl -X POST -H "Content-Type: application/json" -d '{
  "leader_oc": "LeaderA",
  "content": "本章禁止在據點內跳舞。",
  "chapter_version": "1.0"
}' http://localhost:3000/api/leader/law
```

### 4.4 領主懸賞令 (Leader Bounty)

#### API 端點
`POST /api/leader/bounty`

#### 請求 (Request)
```json
{
  "leader_oc": "string",      // 領主的 OC 名稱
  "target_oc": "string",      // 目標玩家的 OC 名稱
  "landmark_id": "string",    // 指定據點 ID
  "reward_amount": "number",  // 賞金金額 (1 或 2 幣)
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Bounty issued successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NOT_A_LEADER, INSUFFICIENT_TREASURY, TARGET_NOT_FOUND, LANDMARK_NOT_FOUND
}
```

#### 驗收標準
*   領主的「金庫」貨幣應扣除 `reward_amount`。
*   應自動發布一條小道消息。
*   玩家回報任務時，若符合懸賞條件，應自動從金庫轉帳。
*   若金庫貨幣不足，應返回 `INSUFFICIENT_TREASURY` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功發布懸賞令 (假設 LeaderA 金庫有足夠貨幣)
curl -X POST -H "Content-Type: application/json" -d '{
  "leader_oc": "LeaderA",
  "target_oc": "PlayerC",
  "landmark_id": "l3",
  "reward_amount": 1,
  "chapter_version": "1.0"
}' http://localhost:3000/api/leader/bounty

# 測試金庫貨幣不足
curl -X POST -H "Content-Type: application/json" -d '{
  "leader_oc": "LeaderA",
  "target_oc": "PlayerC",
  "landmark_id": "l3",
  "reward_amount": 5,
  "chapter_version": "1.0"
}' http://localhost:3000/api/leader/bounty
```

### 4.5 領主詛咒金庫 (Leader Curse Treasury)

#### API 端點
`POST /api/leader/curse-treasury`

#### 請求 (Request)
```json
{
  "leader_oc": "string",      // 領主的 OC 名稱
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Treasury cursed successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NOT_A_LEADER, INSUFFICIENT_TREASURY
}
```

#### 驗收標準
*   領主的「金庫」所有貨幣應被燒毀 (歸零)。
*   隨機一名敵方玩家的本章貨幣上限應扣除 3。
*   若金庫貨幣不足 8 幣，應返回 `INSUFFICIENT_TREASURY` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功詛咒金庫 (假設 LeaderA 金庫有 >= 8 幣)
curl -X POST -H "Content-Type: application/json" -d '{
  "leader_oc": "LeaderA",
  "chapter_version": "1.0"
}' http://localhost:3000/api/leader/curse-treasury

# 測試金庫貨幣不足
curl -X POST -H "Content-Type: application/json" -d '{
  "leader_oc": "LeaderA",
  "chapter_version": "1.0"
}' http://localhost:3000/api/leader/curse-treasury
```

## 5. 人販子完整機制

### 5.1 人販子移動 (Trafficker Move)

#### API 端點
`POST /api/npc/move` (與其他移動型 NPC 共用)

#### 請求 (Request)
```json
{
  "npc_oc": "string",         // 人販子的 OC 名稱
  "target_landmark_id": "string", // 目標據點 ID
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "new_landmark_id": "string", // 移動後的據點 ID
  "remaining_movement_points": "number" // 剩餘移動點數
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NPC_NOT_FOUND, NOT_A_MOVABLE_NPC, NO_MOVEMENT_POINTS, LANDMARK_CLOSED
}
```

#### 驗收標準
*   人販子的 `current_landmark_id` 應更新為 `target_landmark_id`。
*   人販子的 `movement_points` 應扣除 1 點。
*   若移動點數不足，應返回 `NO_MOVEMENT_POINTS` 錯誤。
*   只能移動到 `status = 'open'` 的據點。

#### 測試腳本 (cURL)
```bash
# 測試成功移動 (假設 TraffickerA 有移動點數)
curl -X POST -H "Content-Type: application/json" -d '{
  "npc_oc": "TraffickerA",
  "target_landmark_id": "l2",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/move

# 測試移動點數不足
curl -X POST -H "Content-Type: application/json" -d '{
  "npc_oc": "TraffickerA",
  "target_landmark_id": "l3",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/move
```

### 5.2 人販子村民任務 (Trafficker Villager Mission)

#### API 端點
`POST /api/npc/trafficker/villager-mission`

#### 請求 (Request)
```json
{
  "trafficker_oc": "string",  // 人販子的 OC 名稱
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "reputation_gained": 3, // 獲得的聲望點數
  "current_reputation": "number", // 當前聲望點數
  "mission_text": "string" // 隨機抽取的村民任務文本
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NPC_NOT_FOUND, NOT_A_TRAFFICKER
}
```

#### 驗收標準
*   人販子的聲望 (reputation) 應增加 3 點，上限為 10 點。
*   應從 `/src/data/npc-deliver-texts.json` 中隨機抽取一段文本返回。

#### 測試腳本 (cURL)
```bash
# 測試成功執行村民任務
curl -X POST -H "Content-Type: application/json" -d '{
  "trafficker_oc": "TraffickerA",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/trafficker/villager-mission
```

### 5.3 人販子技能 - 綁架 (Trafficker Skill - Kidnap)

#### API 端點
`POST /api/npc/trafficker/skill/kidnap`

#### 請求 (Request)
```json
{
  "trafficker_oc": "string",  // 人販子的 OC 名稱
  "target_oc": "string",      // 目標玩家的 OC 名稱
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Player kidnapped successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NPC_NOT_FOUND, NOT_A_TRAFFICKER, INSUFFICIENT_REPUTATION, TARGET_NOT_FOUND, TARGET_IS_NPC
}
```

#### 驗收標準
*   人販子的聲望應扣除 5 點。
*   目標玩家應進入失蹤狀態 6 小時 (`is_lost = true`, `lost_until = timestamp`)。
*   應發布小道消息：「[匿名代號] 在黑霧中消失了」。
*   目標玩家應收到彈窗通知。
*   若聲望不足，應返回 `INSUFFICIENT_REPUTATION` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功綁架 (假設 TraffickerA 聲望 >= 5)
curl -X POST -H "Content-Type: application/json" -d '{
  "trafficker_oc": "TraffickerA",
  "target_oc": "PlayerD",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/trafficker/skill/kidnap

# 測試聲望不足
curl -X POST -H "Content-Type: application/json" -d '{
  "trafficker_oc": "TraffickerA",
  "target_oc": "PlayerD",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/trafficker/skill/kidnap
```

### 5.4 人販子技能 - 黑市情報 (Trafficker Skill - Black Market Intel)

#### API 端點
`POST /api/npc/trafficker/skill/intel`

#### 請求 (Request)
```json
{
  "trafficker_oc": "string",  // 人販子的 OC 名稱
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "players_in_landmark": ["string"] // 當前據點本章到訪的 OC 名單
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NPC_NOT_FOUND, NOT_A_TRAFFICKER, INSUFFICIENT_REPUTATION
}
```

#### 驗收標準
*   人販子的聲望應扣除 3 點。
*   返回人販子當前據點本章到訪的玩家 OC 名單。
*   若聲望不足，應返回 `INSUFFICIENT_REPUTATION` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取黑市情報 (假設 TraffickerA 聲望 >= 3)
curl -X POST -H "Content-Type: application/json" -d '{
  "trafficker_oc": "TraffickerA",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/trafficker/skill/intel
```

### 5.5 人販子技能 - 扒竊 (Trafficker Skill - Pickpocket)

#### API 端點
`POST /api/npc/trafficker/skill/pickpocket`

#### 請求 (Request)
```json
{
  "trafficker_oc": "string",  // 人販子的 OC 名稱
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "amount_stolen": "number" // 偷取的貨幣數量
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NPC_NOT_FOUND, NOT_A_TRAFFICKER, INSUFFICIENT_REPUTATION, NO_TARGETS_AVAILABLE
}
```

#### 驗收標準
*   人販子的聲望應扣除 8 點。
*   隨機從符合條件的玩家中偷取 10% 貨幣 (最少 1 幣)。
*   人販子和目標玩家應收到私人通知。
*   不會在小道消息留下任何痕跡。
*   若聲望不足，應返回 `INSUFFICIENT_REPUTATION` 錯誤。
*   若沒有可偷取的目標，應返回 `NO_TARGETS_AVAILABLE` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功扒竊 (假設 TraffickerA 聲望 >= 8)
curl -X POST -H "Content-Type: application/json" -d '{
  "trafficker_oc": "TraffickerA",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/trafficker/skill/pickpocket
```

## 6. 旅店開關店+救援更新

### 6.1 旅店開關店 (Inn Toggle Open Status)

#### API 端點
`POST /api/npc/inn/toggle-open`

#### 請求 (Request)
```json
{
  "inn_owner_oc": "string",   // 旅店老闆的 OC 名稱
  "is_open": "boolean",       // true 為開，false 為關
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "is_shop_open": "boolean" // 旅店當前狀態
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NPC_NOT_FOUND, NOT_AN_INN_OWNER
}
```

#### 驗收標準
*   旅店老闆的 `is_shop_open` 欄位應更新為指定狀態。
*   關店時，地圖圖示應顯示「今日休息」。

#### 測試腳本 (cURL)
```bash
# 測試旅店開門 (假設 InnOwnerA 是旅店老闆)
curl -X POST -H "Content-Type: application/json" -d '{
  "inn_owner_oc": "InnOwnerA",
  "is_open": true,
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/inn/toggle-open

# 測試旅店關門
curl -X POST -H "Content-Type: application/json" -d '{
  "inn_owner_oc": "InnOwnerA",
  "is_open": false,
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/inn/toggle-open
```

### 6.2 救援失蹤玩家 (Rescue Lost Player)

#### API 端點
`POST /api/npc/inn/rescue`

#### 請求 (Request)
```json
{
  "inn_owner_oc": "string",   // 旅店老闆的 OC 名稱
  "rescuer_oc": "string",     // 救援者的 OC 名稱
  "target_oc": "string",      // 目標失蹤玩家的 OC 名稱
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Player rescue initiated."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NPC_NOT_FOUND, NOT_AN_INN_OWNER, RESCUER_NOT_FOUND, TARGET_NOT_FOUND, TARGET_NOT_LOST, INSUFFICIENT_COINS
}
```

#### 驗收標準
*   救援者應支付 5 幣。
*   目標失蹤玩家的失蹤時間應根據 `rescue-distance.json` 中的設定縮短。
*   目標玩家應收到通知：「有人正在把你找回來，預計X分鐘後恢復」。
*   小道消息應發布：「[匿名代號] 從黑暗中被拉回來了」。
*   若救援者貨幣不足，應返回 `INSUFFICIENT_COINS` 錯誤。
*   若目標玩家未失蹤，應返回 `TARGET_NOT_LOST` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功救援 (假設 InnOwnerA 是旅店老闆, RescuerA 有足夠貨幣, TargetE 處於失蹤狀態)
curl -X POST -H "Content-Type: application/json" -d '{
  "inn_owner_oc": "InnOwnerA",
  "rescuer_oc": "RescuerA",
  "target_oc": "TargetE",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/inn/rescue

# 測試救援者貨幣不足
curl -X POST -H "Content-Type: application/json" -d '{
  "inn_owner_oc": "InnOwnerA",
  "rescuer_oc": "RescuerA",
  "target_oc": "TargetE",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/inn/rescue

# 測試目標玩家未失蹤
curl -X POST -H "Content-Type: application/json" -d '{
  "inn_owner_oc": "InnOwnerA",
  "rescuer_oc": "RescuerA",
  "target_oc": "TargetF",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/inn/rescue
```

## 7. 管理員帳號 (Vonn) 設定與疑難排解

### 7.1 `ADMIN_PASSWORD` 環境變數

*   `ADMIN_PASSWORD` 環境變數用於設定管理員帳號 `vonn` 的登入密碼。
*   此變數應在 `.env.local` 檔案中設定，例如：`ADMIN_PASSWORD=0112`。
*   前端會透過 `/api/auth/admin-login` API 驗證此密碼。

### 7.2 `td_users` Supabase 表格中的 'Vonn' 帳號

*   即使 `ADMIN_PASSWORD` 設定正確，`vonn` 帳號仍需要在 Supabase 的 `td_users` 表格中存在一個條目才能成功登入。
*   如果 `td_users` 表格中沒有 `oc_name` 為 'vonn' 的條目，登入將會失敗。

### 7.3 Supabase Table Editor 篩選模式注意事項

*   在 Supabase 的 Table Editor 中，如果啟用了篩選模式，可能會導致現有的資料條目被隱藏，即使它們實際存在於資料庫中。
*   這可能會造成「重複帳號」的錯誤，因為你嘗試創建一個已經存在的帳號，但卻看不到它。
*   請務必檢查並關閉任何可能啟用的篩選器，以確保能看到 `td_users` 表格中的所有資料。

### 7.4 驗證和建立 'Vonn' 帳號條目

#### 驗證步驟
1.  登入 Supabase 專案。
2.  導航到「Table Editor」。
3.  選擇 `td_users` 表格。
4.  確保沒有任何篩選器被啟用。
5.  檢查是否存在 `oc_name` 為 'vonn' 的條目。

#### 建立步驟 (如果不存在)
1.  在 `td_users` 表格中，點擊「Insert row」或類似的按鈕。
2.  填寫以下欄位：
    *   `oc_name`: `vonn`
    *   `simple_password`: (可以設定為任意值，因為 `vonn` 的密碼由 `ADMIN_PASSWORD` 控制，但為了資料完整性仍需填寫)
    *   其他必填欄位請根據你的資料庫 schema 填寫預設值或適當的值。
3.  儲存新的條目。


