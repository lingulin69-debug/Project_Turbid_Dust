# 《白鴉之繭》Project Turbid Dust — CLAUDE.md

> 每次開始新任務前，請先讀取本文件，再依據任務性質讀取對應的詳細文件。

---

## 專案性質

繪圖企劃輔助網頁。玩家在QQ社群繪製角色後，透過網頁進行兩陣營對抗玩法。
- 玩家總數：40人（兩陣營各20人）
- NPC：另計，無陣營歸屬
- 企劃長度：兩個月，每章更新一次

---

## 技術棧

```
Frontend：Next.js + TypeScript + TailwindCSS
Database：Supabase（PostgreSQL）主要 / SQLite（Prisma）用於身分選拔
即時同步：Supabase Realtime
圖片儲存：Supabase Storage（bucket: 'pet-images'）
動畫：Lottie（天平動畫，設計師提供素材）
```

---

## 文件導航

開發任何功能前，請依照任務類型讀取對應文件：

| 任務類型 | 讀取文件 |
|---------|---------|
| 任何新功能開發 | 先讀 `System_Design.md` 確認架構和優先順序 |
| 資料庫欄位/表結構 | 讀 `world_map_schema.md` |
| 背道者相關功能 | 讀 `final_apostate_deployment.md` |
| 世界觀/劇情文字風格 | 讀 `Lore_Archive.md` |
| 設定細節/視覺巧思 | 讀 `Lore_Deep_Dive.md` |
| 靜態文本填寫格式 | 讀 `/src/data/` 下對應的 json 文件 |

---

## 核心設計原則（開發時必須遵守）

```
1. 天平只被貨幣影響
   global_stats.balance_value 只能由
   POST /api/balance/update 修改
   任何其他API不得直接修改天平值

2. 背道者不是要被抓住的
   遊戲樂趣在貨幣與天平的陣營爭鬥
   背道者行動不留明確公開痕跡

3. 先修復閉環缺口，再開發新功能
   目前P0死局：購買API缺失、任務鎖定持久化

4. 靜態文本不硬編碼在組件裡
   所有劇情/任務文字從 /src/data/ 的json讀取

5. 貨幣統一用詞
   介面顯示和代碼注釋一律用「貨幣」
   資料庫欄位名維持 coins（不改欄位名）
```

---

## 陣營色碼（必須使用，舊色碼已廢棄）

```
濁息者（Turbid）：
  主色   #211a2e（深紫黑）
  高光   #7c3aed（紫色）
  ⚠️ 舊色碼 #9333ea 已廢棄，全面替換

淨塵者（Pure）：
  主色   #ede6ce（米白金）
  高光   #d4af37（白金）
  ⚠️ 舊色碼 #eab308 已廢棄，全面替換

背景色：#0a0a0f
領主惡政相關：#7f1d1d
```

---

## 玩家身分類型

```
identity_role 欄位值：
'citizen'   一般玩家（預設）
'apostate'  背道者（永久鎖定，不可變更）
'leader'    領主（場外NPC性質）

npc_role 欄位值（管理員手動設定）：
NULL            一般玩家
'item_merchant' 道具商人（可移動）
'black_merchant'黑心商人（可移動）
'trafficker'    人販子（可移動）
'inn_owner'     旅店老闆（固定）
'pet_merchant'  寵物商人（固定）

⚠️ 舊版 'merchant' 已拆分，不再使用
```

---

## NPC移動規則

```
移動型NPC（item_merchant / black_merchant / trafficker）：
  每章 movement_points = 10
  每步固定扣1
  只能移動到 status = 'open' 的據點
  共用 POST /api/npc/move

固定型NPC（inn_owner / pet_merchant）：
  不移動
  有開關店功能（is_shop_open 欄位）
```

---

## 靜態文本文件

```
/src/data/party-events.json
  組隊劇情文本
  欄位：id, landmark_id, required_count,
        safe_version, danger_version
  由設計師預先填寫，系統提取

/src/data/npc-deliver-texts.json
  人販子村民任務文本
  欄位：id, text, landmark_tags
  由管理員填寫，系統隨機抽取

/src/data/rescue-distance.json
  旅店救援距離設定
  欄位：inn_landmark_id, distance_zones
  待地圖完成後填入據點分區
```

---

## P0 優先修復項目（已於 2026-03-14 完成驗收）

```
✅ P0 項目已全部審查並確認完成。
   - **購買 API**：已實作，並補上了缺失的寵物購買 API。
   - **任務鎖定**：後端 RPC 函數已正確實作鎖定邏輯。
   - **適性問卷**：後端 API 已正確實作，包含計分與防重複提交。
   - **清算者掃描**：已採用 `normalize` 函數修復名稱比對邏輯。
   - **陣營色碼**：已全面替換為新色碼，並集中於 `constants.ts` 管理。

專案的閉環死局已解決。
```

---

## 已廢棄功能（不要再開發）

```
❌ chaos_value / corrosion_value
❌ 漂流瓶系統（drift_fragments）
❌ 呼息禮物池（breath_pool）
❌ 迷霧清除事件（td_fog_clear_events）
❌ 情報截聽（迷霧次數觸發）
❌ 限時特賣
❌ 領主AI輔助生成文案（改為手動編寫）
❌ 魂細碎片全螢幕劇情（改為純收藏道具）
❌ 紙娃娃系統（改為完整立繪圖切換）
❌ 匿名檢舉信
❌ 背道者舊版三項能力
   （地圖干預 / 混沌注入 / 通訊截流）
```

---

## 管理員帳號

```
username: vonn
⚠️ 密碼硬編碼在 ReportSystemLogic.ts，安全風險，待移至後端環境變數
管理員豁免所有陣營限制
```

---

## 帳號建立機制

```
帳號由管理員（vonn）預先在 Supabase 建立，玩家無法自行註冊。

預建帳號內容：
  oc_name          = 玩家OC名稱（由管理員填入）
  simple_password  = '0000'（預設值，提示玩家只能輸入四位數字）
  faction          = 管理員已設定好，玩家不可更改

第一次登入流程：
  玩家輸入 oc_name + '0000'
  → 系統偵測 simple_password = '0000'
  → 強制進入「設定密碼」畫面（不可跳過）
  → 玩家輸入新的四位數字密碼
  → 寫入資料庫，覆蓋 '0000'
  → 直接進入遊戲

開發注意事項：
  登入 API 必須判斷 simple_password = '0000'
  符合時不視為登入成功，而是導向設定密碼流程
  設定密碼後才算完成建檔，可正常使用所有功能
```

---

## 地圖規格

```
尺寸：2048px × 1080px
縮放：0.5–3x（SCALE_MIN / SCALE_MAX）
座標：百分比（0–100）

Z-Index層級：
  地圖底層：0
  地圖疊加：10
  HUD元素：50
  Modal背景：60
  Modal：70
  Dev控制面板：200
```

---

## 開發工作流建議

```
1. 開始前
   讀取本文件 + 對應詳細文件
   確認功能在P0/P1/P2/P3哪個優先級

2. 開發中
   資料庫變更先更新 world_map_schema.md
   新API先在文件列出再實作
   靜態文字放在 /src/data/ 不寫死在組件

3. 完成後
   確認沒有直接修改天平值
   確認沒有使用廢棄的色碼
   確認貨幣用詞統一
```
