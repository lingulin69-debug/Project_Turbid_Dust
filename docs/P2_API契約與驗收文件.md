# 《白鴉之繭》P2 功能 — API 契約 & 端到端驗收文件

## 1. 角色卡完整版

### 1.1 獲取角色卡資訊 (Get Character Card Info)

#### API 端點
`GET /api/character-card/:oc_name`

#### 請求 (Request)
*   此 API 應透過 URL 參數接收玩家的 OC 名稱。
*   可選查詢參數 `viewer_oc` 用於判斷查看者的陣營，以應用公開規則。
```
/api/character-card/PlayerA?viewer_oc=ViewerB
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "oc_name": "string",
  "faction": "string",
  "display_name": "string", // 根據公開規則顯示 OC 名稱或匿名代號
  "avatar_url": "string",   // 當前選擇的完整立繪縮圖 URL
  "wardrobe": [             // 已收集衣裝列表
    {
      "item_id": "string",
      "name": "string",
      "image_url": "string"
    }
  ],
  "karma_tags": [           // 因果標籤
    {
      "tag_id": "string",
      "name": "string",
      "description": "string"
    }
  ],
  "faded_marks": [          // 褪色印記 (舊標籤)
    {
      "tag_id": "string",
      "name": "string",
      "description": "string"
    }
  ],
  "hp": "number",           // HP 狀態條
  "status_effects": [       // 特殊狀態標記
    {
      "effect_id": "string",
      "name": "string",
      "duration": "string"
    }
  ],
  "witness_records": [      // 見證紀錄
    {
      "landmark_id": "string",
      "party_members": ["string"],
      "timestamp": "string"
    }
  ],
  "pets": [                 // 我的寵物
    {
      "pet_id": "string",
      "name": "string",
      "description": "string",
      "image_url": "string"
    }
  ]
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND
}
```

## 4. 寵物商人系統

### 4.1 寵物商人開關店 (Pet Merchant Toggle Open Status)

#### API 端點
`POST /api/npc/pet-merchant/toggle-open`

#### 請求 (Request)
```json
{
  "pet_merchant_oc": "string", // 寵物商人的 OC 名稱
  "is_open": "boolean",        // true 為開，false 為關
  "chapter_version": "string"  // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "is_shop_open": "boolean" // 寵物商店當前狀態
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NPC_NOT_FOUND, NOT_A_PET_MERCHANT
}
```

#### 驗收標準
*   寵物商人的 `is_shop_open` 欄位應更新為指定狀態。
*   關店時，地圖圖示應顯示「今日休息」。

#### 測試腳本 (cURL)
```bash
# 測試寵物商店開門 (假設 PetMerchantA 是寵物商人)
curl -X POST -H "Content-Type: application/json" -d '{
  "pet_merchant_oc": "PetMerchantA",
  "is_open": true,
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/pet-merchant/toggle-open

# 測試寵物商店關門
curl -X POST -H "Content-Type: application/json" -d '{
  "pet_merchant_oc": "PetMerchantA",
  "is_open": false,
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/pet-merchant/toggle-open
```

### 4.2 寵物商人上架預設寵物 (Pet Merchant List Default Pet)

#### API 端點
`POST /api/npc/pet-merchant/list-default-pet`

#### 請求 (Request)
```json
{
  "pet_merchant_oc": "string", // 寵物商人的 OC 名稱
  "pet_id": "string",          // 預設寵物 ID
  "chapter_version": "string"  // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Default pet listed successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NPC_NOT_FOUND, NOT_A_PET_MERCHANT, PET_ALREADY_LISTED, MAX_DEFAULT_PETS_REACHED
}
```

#### 驗收標準
*   寵物商人上架的預設寵物數量不應超過 3 款。
*   章節更新時，所有預設寵物應自動下架。

#### 測試腳本 (cURL)
```bash
# 測試成功上架預設寵物
curl -X POST -H "Content-Type: application/json" -d '{
  "pet_merchant_oc": "PetMerchantA",
  "pet_id": "pet_001",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/pet-merchant/list-default-pet
```

### 4.3 寵物商人上架自製寵物 (Pet Merchant List Custom Pet)

#### API 端點
`POST /api/npc/pet-merchant/list-custom-pet`

#### 請求 (Request)
```json
{
  "pet_merchant_oc": "string", // 寵物商人的 OC 名稱
  "name": "string",            // 自製寵物名稱
  "description": "string",     // 自製寵物描述
  "image_url": "string",       // 自製寵物圖片 URL (Supabase Storage)
  "price": "number",           // 售價
  "chapter_version": "string"  // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Custom pet listed successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NPC_NOT_FOUND, NOT_A_PET_MERCHANT, MAX_CUSTOM_PETS_REACHED
}
```

#### 驗收標準
*   寵物商人上架的自製寵物數量不應超過 3 隻。
*   上架後應顯示「特別款」標記。

#### 測試腳本 (cURL)
```bash
# 測試成功上架自製寵物
curl -X POST -H "Content-Type: application/json" -d '{
  "pet_merchant_oc": "PetMerchantA",
  "name": "我的獨角獸",
  "description": "一隻會發光的獨角獸。",
  "image_url": "https://supabase.com/storage/v1/object/public/pet-images/unicorn.png",
  "price": 5,
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/pet-merchant/list-custom-pet
```

### 4.4 玩家購買寵物 (Player Buy Pet)

#### API 端點
`POST /api/pets/buy` (此 API 已在 P0 任務中實作，此處為驗收標準補充)

#### 請求 (Request)
```json
{
  "buyer_oc": "string",        // 購買者的 OC 名稱
  "pet_id": "string",          // 寵物 ID
  "chapter_version": "string"  // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Pet purchased successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND, PET_NOT_FOUND, INSUFFICIENT_COINS, MAX_PETS_REACHED, PET_ALREADY_OWNED, PET_BANISHED
}
```

#### 驗收標準
*   玩家的貨幣應扣除寵物售價。
*   玩家的寵物列表中應新增該寵物。
*   玩家最多同時持有 3 隻寵物。
*   已持有或已流放的寵物不可重複購買。
*   若玩家貨幣不足，應返回 `INSUFFICIENT_COINS` 錯誤。
*   若玩家已達最大持有數量，應返回 `MAX_PETS_REACHED` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功購買寵物
curl -X POST -H "Content-Type: application/json" -d '{
  "buyer_oc": "PlayerA",
  "pet_id": "pet_001",
  "chapter_version": "1.0"
}' http://localhost:3000/api/pets/buy

# 測試貨幣不足
curl -X POST -H "Content-Type: application/json" -d '{
  "buyer_oc": "PlayerA",
  "pet_id": "pet_005",
  "chapter_version": "1.0"
}' http://localhost:3000/api/pets/buy

# 測試已達最大持有數量
curl -X POST -H "Content-Type: application/json" -d '{
  "buyer_oc": "PlayerA",
  "pet_id": "pet_002",
  "chapter_version": "1.0"
}' http://localhost:3000/api/pets/buy
```

## 5. 黑心商人+骰子判定

### 5.1 獲取黑心商人商品列表 (Get Black Merchant Items)

#### API 端點
`GET /api/npc/black-merchant/items`

#### 請求 (Request)
*   此 API 應透過查詢參數接收 `chapter_version`。
```
?chapter_version=string
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "items": [
    {
      "item_id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "type": "dice_roll" | "direct_effect" | "r18_clothing" | "custom",
      "dice_type": "D6" | "D20", // 若為骰子判定類
      "effect_description": "string", // 若為直接生效類
      "is_limited": "boolean", // 是否限量
      "remaining_stock": "number" // 剩餘庫存 (若限量)
    }
  ]
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息
}
```

#### 驗收標準
*   應返回黑心商人當前章節可販售的商品列表。
*   商品應包含骰子判定類、直接生效類、R18 服裝類和自製商品。
*   應正確顯示商品的價格、描述、類型和限量資訊。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取黑心商人商品列表
curl -X GET "http://localhost:3000/api/npc/black-merchant/items?chapter_version=1.0"
```

### 5.2 購買黑心商人商品 (Buy Black Merchant Item)

#### API 端點
`POST /api/npc/black-merchant/buy`

#### 請求 (Request)
```json
{
  "buyer_oc": "string",        // 購買者的 OC 名稱
  "item_id": "string",         // 商品 ID
  "chapter_version": "string"  // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Item purchased successfully.",
  "effect_result": "string" // 若為骰子判定類，則為骰子結果描述
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND, ITEM_NOT_FOUND, INSUFFICIENT_COINS, OUT_OF_STOCK
}
```

#### 驗收標準
*   玩家的貨幣應扣除商品價格。
*   若為骰子判定類商品，應根據骰子結果返回相應的 `effect_result`。
*   若為直接生效類商品，應觸發相應的效果 (例如性別轉換狀態)。
*   若為 R18 服裝類商品，應添加到玩家的衣櫃中。
*   若商品限量且庫存不足，應返回 `OUT_OF_STOCK` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試購買致富寶箱 (骰子判定類)
curl -X POST -H "Content-Type: application/json" -d '{
  "buyer_oc": "PlayerA",
  "item_id": "rich_chest",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/black-merchant/buy

# 測試購買神秘藥劑 (直接生效類)
curl -X POST -H "Content-Type: application/json" -d '{
  "buyer_oc": "PlayerA",
  "item_id": "mystery_potion",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/black-merchant/buy

# 測試購買女僕裝 (R18 服裝類)
curl -X POST -H "Content-Type: application/json" -d '{
  "buyer_oc": "PlayerA",
  "item_id": "maid_outfit",
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/black-merchant/buy
```

### 5.3 黑市議價 (Black Market Bargain)

#### API 端點
`POST /api/npc/black-merchant/bargain`

#### 請求 (Request)
```json
{
  "buyer_oc": "string",        // 議價玩家的 OC 名稱
  "item_id": "string",         // 商品 ID
  "offered_price": "number",   // 玩家出價
  "chapter_version": "string"  // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Bargain offer sent to merchant."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND, ITEM_NOT_FOUND, OFFER_TOO_LOW
}
```

#### 驗收標準
*   玩家出價應不低於商品標價的 50%。
*   黑心商人應收到議價通知，並決定接受或拒絕。
*   若接受，系統自動完成交易。

#### 測試腳本 (cURL)
```bash
# 測試成功發送議價 (假設商品價格為 5 幣，出價 3 幣)
curl -X POST -H "Content-Type: application/json" -d '{
  "buyer_oc": "PlayerA",
  "item_id": "rich_chest",
  "offered_price": 3,
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/black-merchant/bargain

# 測試出價過低 (假設商品價格為 5 幣，出價 1 幣)
curl -X POST -H "Content-Type: application/json" -d '{
  "buyer_oc": "PlayerA",
  "item_id": "rich_chest",
  "offered_price": 1,
  "chapter_version": "1.0"
}' http://localhost:3000/api/npc/black-merchant/bargain
```

## 6. 背道者操作優化

### 6.1 獲取背道者可用能力 (Get Apostate Abilities)

#### API 端點
`GET /api/apostate/abilities/:oc_name`

#### 請求 (Request)
*   此 API 應透過 URL 參數接收背道者的 OC 名稱。
*   可選查詢參數 `chapter_version`。
```
/api/apostate/abilities/ApostateA?chapter_version=1.0
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "abilities": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "type": "A" | "B" | "C", // 能力類型
      "is_available": "boolean", // 是否可用
      "remaining_uses": "number" // 剩餘使用次數 (若有)
    }
  ]
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND, NOT_AN_APOSTATE
}
```

#### 驗收標準
*   應返回指定背道者當前章節可用的能力列表。
*   應包含能力名稱、描述、類型、可用狀態和剩餘使用次數。
*   若玩家不是背道者，應返回 `NOT_AN_APOSTATE` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取背道者能力 (假設 ApostateA 是背道者)
curl -X GET "http://localhost:3000/api/apostate/abilities/ApostateA?chapter_version=1.0"

# 測試非背道者
curl -X GET "http://localhost:3000/api/apostate/abilities/PlayerA?chapter_version=1.0"
```

### 6.2 執行背道者能力 (Execute Apostate Ability)

#### API 端點
`POST /api/apostate/execute-ability`

#### 請求 (Request)
```json
{
  "apostate_oc": "string",    // 背道者的 OC 名稱
  "ability_id": "string",     // 要執行的能力 ID
  "target_oc": "string",      // 目標玩家的 OC 名稱 (若能力需要)
  "target_landmark_id": "string", // 目標據點 ID (若能力需要)
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Ability executed successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：NOT_AN_APOSTATE, ABILITY_NOT_FOUND, ABILITY_NOT_AVAILABLE, INSUFFICIENT_USES, INVALID_TARGET
}
```

#### 驗收標準
*   背道者的能力應成功執行，並觸發相應的遊戲效果。
*   能力使用次數應正確扣除。
*   若能力不可用或使用次數不足，應返回相應錯誤。
*   若目標無效，應返回 `INVALID_TARGET` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試執行能力 A (貪婪)
curl -X POST -H "Content-Type: application/json" -d '{
  "apostate_oc": "ApostateA",
  "ability_id": "ability_A",
  "chapter_version": "1.0"
}' http://localhost:3000/api/apostate/execute-ability

# 測試執行能力 B (陣營洩漏)
curl -X POST -H "Content-Type: application/json" -d '{
  "apostate_oc": "ApostateA",
  "ability_id": "ability_B",
  "target_landmark_id": "l1",
  "chapter_version": "1.0"
}' http://localhost:3000/api/apostate/execute-ability

# 測試執行能力 C (扒竊)
curl -X POST -H "Content-Type: application/json" -d '{
  "apostate_oc": "ApostateA",
  "ability_id": "ability_C",
  "chapter_version": "1.0"
}' http://localhost:3000/api/apostate/execute-ability
```

## 7. 據點留言功能

### 7.1 提交據點留言 (Submit Landmark Comment)

#### API 端點
`POST /api/landmark/comment`

#### 請求 (Request)
```json
{
  "oc_name": "string",        // 玩家的 OC 名稱
  "landmark_id": "string",    // 據點 ID
  "comment_content": "string",// 留言內容 (30 字以內)
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Comment submitted successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND, LANDMARK_NOT_FOUND, ALREADY_COMMENTED, MISSION_NOT_COMPLETED
}
```

#### 驗收標準
*   玩家成功提交留言後，留言應與據點和玩家關聯。
*   每個玩家在每個據點只能留一條留言。
*   玩家必須完成該據點任務後才能留言。
*   留言內容應限制在 30 字以內。

#### 測試腳本 (cURL)
```bash
# 測試成功提交留言 (假設 PlayerA 已完成 l1 任務)
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "landmark_id": "l1",
  "comment_content": "這個據點的任務很有趣！",
  "chapter_version": "1.0"
}' http://localhost:3000/api/landmark/comment
```

## 8. 匿名代號生成

### 8.1 獲取玩家匿名代號 (Get Player Alias)

#### API 端點
`GET /api/user/alias/:oc_name`

#### 請求 (Request)
*   此 API 應透過 URL 參數接收玩家的 OC 名稱。

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "oc_name": "string",
  "alias": "string" // 玩家的匿名代號
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND
}
```

#### 驗收標準
*   應返回指定玩家的匿名代號。
*   匿名代號應由因果標籤的 `alias_prefix` + 隨機後綴生成。
*   若玩家不存在，應返回 `USER_NOT_FOUND` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取玩家匿名代號
curl -X GET "http://localhost:3000/api/user/alias/PlayerA"

# 測試玩家不存在
curl -X GET "http://localhost:3000/api/user/alias/NonExistentPlayer"
```
# 測試重複提交留言
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "landmark_id": "l1",
  "comment_content": "再次留言",
  "chapter_version": "1.0"
}' http://localhost:3000/api/landmark/comment

# 測試未完成任務提交留言
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerB",
  "landmark_id": "l2",
  "comment_content": "我還沒完成任務！",
  "chapter_version": "1.0"
}' http://localhost:3000/api/landmark/comment
```

### 7.2 獲取據點留言 (Get Landmark Comments)

#### API 端點
`GET /api/landmark/comments/:landmark_id`

#### 請求 (Request)
*   此 API 應透過 URL 參數接收據點 ID。
*   可選查詢參數 `viewer_oc` 用於判斷查看者的陣營。
```
/api/landmark/comments/l1?viewer_oc=PlayerA
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "comments": [
    {
      "id": "string",
      "oc_name": "string",
      "faction": "string",
      "content": "string",
      "timestamp": "string"
    }
  ]
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：LANDMARK_NOT_FOUND
}
```

#### 驗收標準
*   應返回指定據點的所有留言。
*   留言僅同陣營玩家可見。
*   若查看者與留言玩家不同陣營，則不應返回該留言。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取據點留言 (假設 PlayerA 與留言者同陣營)
curl -X GET "http://localhost:3000/api/landmark/comments/l1?viewer_oc=PlayerA"

# 測試獲取據點留言 (假設 EnemyPlayer 與留言者不同陣營)
curl -X GET "http://localhost:3000/api/landmark/comments/l1?viewer_oc=EnemyPlayer"
```

#### 驗收標準
*   若查看者與目標玩家同陣營，應顯示完整資訊。
*   若查看者與目標玩家不同陣營，`display_name` 應顯示匿名代號，並隱藏敏感資訊。
*   應包含所有角色卡內容：OC 名稱、陣營色標記、匿名代號、衣裝造型、已收集衣裝列表、因果標籤、褪色印記、HP 狀態條、特殊狀態標記、見證紀錄、我的寵物。
*   若玩家不存在，應返回 `USER_NOT_FOUND` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試獲取 PlayerA 的角色卡資訊 (同陣營查看)
curl -X GET "http://localhost:3000/api/character-card/PlayerA?viewer_oc=PlayerB"

# 測試獲取 PlayerA 的角色卡資訊 (敵方陣營查看)
curl -X GET "http://localhost:3000/api/character-card/PlayerA?viewer_oc=EnemyPlayer"

# 測試玩家不存在
curl -X GET "http://localhost:3000/api/character-card/NonExistentPlayer"
```

### 1.2 選擇衣裝造型 (Select Outfit)

#### API 端點
`POST /api/character-card/select-outfit`

#### 請求 (Request)
```json
{
  "oc_name": "string",        // 玩家的 OC 名稱
  "outfit_id": "string",      // 選擇的衣裝 ID
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "current_outfit_id": "string" // 當前選擇的衣裝 ID
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND, OUTFIT_NOT_OWNED
}
```

#### 驗收標準
*   玩家的 `current_outfit_id` 應更新為選擇的衣裝 ID。
*   若玩家未擁有該衣裝，應返回 `OUTFIT_NOT_OWNED` 錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功選擇衣裝
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "outfit_id": "outfit_001",
  "chapter_version": "1.0"
}' http://localhost:3000/api/character-card/select-outfit

# 測試未擁有衣裝
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "outfit_id": "outfit_999",
  "chapter_version": "1.0"
}' http://localhost:3000/api/character-card/select-outfit
```

### 1.3 流放寵物 (Banish Pet)

#### API 端點
`POST /api/character-card/banish-pet`

#### 請求 (Request)
```json
{
  "oc_name": "string",        // 玩家的 OC 名稱
  "pet_id": "string",         // 流放的寵物 ID
  "chapter_version": "string" // 當前章節版本
}
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "success": true,
  "message": "Pet banished successfully."
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND, PET_NOT_OWNED
}
```

#### 驗收標準
*   玩家的寵物列表中應移除該寵物。
*   流放後，該寵物 ID 應被記錄為「已流放」，不可再次購買。
*   應返回流放提示：「你放開了牠的爪子，牠消失在霧裡。」

#### 測試腳本 (cURL)
```bash
# 測試成功流放寵物
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "pet_id": "pet_001",
  "chapter_version": "1.0"
}' http://localhost:3000/api/character-card/banish-pet

# 測試未擁有寵物
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "pet_id": "pet_999",
  "chapter_version": "1.0"
}' http://localhost:3000/api/character-card/banish-pet
```

## 2. 小道消息接真實數據

### 2.1 獲取小道消息 (Get Gossip Feed)

#### API 端點
`GET /api/gossip`

#### 請求 (Request)
*   此 API 應透過查詢參數接收 `chapter_version`。
```
?chapter_version=string
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "gossip_feed": [
    {
      "id": "string",
      "type": "system" | "leader" | "player", // 訊息類型
      "timestamp": "string",
      "content": "string",
      "author_oc": "string", // 若為玩家或領主發布，則為 OC 名稱
      "leader_decree_type": "tax" | "curse" | "law" | "bounty", // 若為領主發布，則為法令類型
      "leader_decree_prefix": "string" // 若為命名詛咒，則為前綴
    }
  ]
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息
}
```

## 3. 通知系統

### 3.1 獲取私人通知 (Get Private Notifications)

#### API 端點
`GET /api/notifications/private/:oc_name`

#### 請求 (Request)
*   此 API 應透過 URL 參數接收玩家的 OC 名稱。
*   可選查詢參數 `chapter_version`。
```
/api/notifications/private/PlayerA?chapter_version=1.0
```

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "notifications": [
    {
      "id": "string",
      "type": "pickpocket_stolen" | "pickpocket_executed" | "rescue_in_progress", // 通知類型
      "timestamp": "string",
      "content": "string", // 通知內容
      "is_read": "boolean"
    }
  ]
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND
}
```

#### 驗收標準
*   應返回指定玩家的所有私人通知。
*   通知應包含被扒竊、執行扒竊、救援進行中等類型。
*   應有 `is_read` 狀態，並支援標記為已讀。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取私人通知
curl -X GET "http://localhost:3000/api/notifications/private/PlayerA?chapter_version=1.0"
```

### 3.2 標記通知為已讀 (Mark Notification As Read)

#### API 端點
`POST /api/notifications/mark-read`

#### 請求 (Request)
```json
{
  "oc_name": "string",        // 玩家的 OC 名稱
  "notification_id": "string" // 要標記為已讀的通知 ID
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
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND, NOTIFICATION_NOT_FOUND
}
```

#### 驗收標準
*   指定通知的 `is_read` 狀態應更新為 `true`。
*   若玩家不存在或通知不存在，應返回相應錯誤。

#### 測試腳本 (cURL)
```bash
# 測試成功標記通知為已讀 (假設 PlayerA 有通知 "notif_001")
curl -X POST -H "Content-Type: application/json" -d '{
  "oc_name": "PlayerA",
  "notification_id": "notif_001"
}' http://localhost:3000/api/notifications/mark-read
```

### 3.3 獲取彈窗通知 (Get Popup Notifications)

#### API 端點
`GET /api/notifications/popup/:oc_name`

#### 請求 (Request)
*   此 API 應透過 URL 參數接收玩家的 OC 名稱。

#### 回應 (Response)
**成功 (200 OK)**
```json
{
  "popup_notifications": [
    {
      "id": "string",
      "type": "kidnapped", // 通知類型
      "timestamp": "string",
      "content": "string", // 通知內容
      "countdown_seconds": "number" // 倒數計時秒數 (若有)
    }
  ]
}
```

**失敗 (4xx/5xx)**
```json
{
  "error": "string" // 錯誤訊息，例如：USER_NOT_FOUND
}
```

#### 驗收標準
*   應返回指定玩家的所有彈窗通知。
*   彈窗通知應包含被綁架時的提示，並帶有倒數計時。
*   彈窗通知應強制顯示，直到玩家解除狀態或倒數結束。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取彈窗通知 (假設 PlayerA 處於被綁架狀態)
curl -X GET "http://localhost:3000/api/notifications/popup/PlayerA"
```


#### 驗收標準
*   應返回指定章節版本的所有小道消息。
*   小道消息應包含系統自動訊息 (綁架、救援、懸賞令)。
*   小道消息應包含領主發布的訊息 (徵稅令、命名詛咒、荒謬法令、懸賞令)，並帶有 `👑` 標記和陣營色邊框。
*   小道消息應包含玩家日誌 (任務回報後自動產生)。

#### 測試腳本 (cURL)
```bash
# 測試成功獲取小道消息
curl -X GET "http://localhost:3000/api/gossip?chapter_version=1.0"
```

