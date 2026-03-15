# 背道者系統設計文件 (Apostate System Design)

[2026-02-08 建立 | 2026-03-10 全面重構更新]

---

## ⚠️ 重構說明
舊版三項能力（地圖干預/混沌注入/通訊截流）已全部廢棄。
原因：
- `chaos_value` 已從代碼移除
- `mimic_probability_override` 未實作且複雜度過高
- 通訊截流依賴點讚系統，目前未實作

新版三項能力見第4節。

---

## 0. 核心設計原則

- 背道者身分**不是要被「抓住」的**
- 遊戲的核心樂趣是**貨幣與天平的陣營爭鬥**
- 背道者只是在這個爭鬥中增加不確定性的調味料
- 背道者的行動痕跡應該**模糊**，不留明確證據
- 叛徒被發現與否**不影響遊戲結局**，天平才是唯一的勝負標準

---

## 1. 身分規則

```
identity_role = 'apostate'

永久屬性，以下情況均不得變更：
- 章節重置
- 版本更新
- 管理員操作（除非特殊情況）

每陣營配額：2名
全局總計：4名背道者
其他玩家永遠不知道誰是背道者
```

---

## 2. 選拔流程

```
Step 1：適性問卷
所有玩家完成「去名化道德拷問」問卷
問卷設計：5-8題道德立場題，去名化（不提陣營/人名）
系統依答案分析玩家傾向
↓
Step 2：標記候選人
系統將高適性玩家標記：
is_high_affinity_candidate = TRUE
玩家本人不知道自己被標記
↓
Step 3：管理員執行抽選
呼叫 POST /api/admin/lottery
從候選名單中每陣營隨機抽2人
↓
Step 4：身分鎖定
寫入 identity_role = 'apostate'
永久鎖定，不可變更
被選中的玩家收到背道者專屬通知（Cyan風格UI）
```

### 適性問卷題目設計方向
```
題目風格：去名化道德拷問，不提具體陣營或人名
範例方向：
- 「你目睹年長者為了保護更多人而選擇犧牲少數，你會？」
- 「你發現自己所在的群體正在說謊，你會？」
- 「有人願意用痛苦換取真相，你認為？」
- 「你被告知眼前的和平是建立在謊言上，你會？」
- 「當忠誠與真實發生衝突，你選擇？」

題目答案沒有對錯，系統分析立場傾向
傾向「懷疑現有秩序」「願意打破規則換取真相」的玩家
被標記為高適性候選人
```

---

## 3. 宿命感設計

```
背道者每章能力由系統隨機指派（A/B/C 擇一）
背道者自己無法選擇本章獲得哪項能力

敘事意義：
背道者並非系統的主宰
而是被更高維度力量選中的「載體」
玩家必須在有限的、不可控的能力下發揮最大影響力
```

---

## 4. 三項能力（重構版）

### 能力A：背道者的貪婪

```
效果：
從天平隨機抽取 1-3 幣
來源陣營隨機（可能抽到自家也可能抽到敵方）
不計入當章貨幣上限

執行邏輯：
POST /api/apostate/greed
- 驗證 identity_role = 'apostate'
- 驗證本章 apostate_skill_used = false
- 隨機決定來源陣營（50/50）
- 隨機決定金額（1-3幣）
- 從 global_stats 扣除對應陣營貢獻值（不直接改天平）
  ⚠️ 具體實作方式待與代碼確認
- 背道者 coins + 金額
- apostate_skill_used = true
- 私人通知背道者：
  「你從虛空中取走了 X 枚貨幣。
   來源不明，但它是真實的。」

痕跡：完全靜默，無任何公開記錄
```

### 能力B：陣營洩漏

```
效果：
背道者可把本陣營一個已完成任務的據點「洩漏」給敵方
- 敵方可看到該據點的同陣營留言內容
  （原本敵方看不到）
- 該據點在敵方地圖上顯示「已被敵方解決」標記
- 等同於讓敵方白得一個據點任務
- 不影響天平（天平只被貨幣影響）

執行邏輯：
POST /api/apostate/leak
- body: { landmark_id }
- 驗證 identity_role = 'apostate'
- 驗證本章 apostate_skill_used = false
- 驗證目標據點本陣營有已完成的任務回報
- 在 td_world_map_landmarks 設定
  leaked_to_faction = 敵方陣營
  leaked_chapter = 當前章節
- 敵方玩家進入該據點時看到「已被敵方解決」標記
- 敵方可看到該據點的同陣營留言
- apostate_skill_used = true
- 背道者自己陣營的人不知道被洩漏

痕跡：
敵方看到據點標記異常，但無法確認是背道者還是其他原因
自己陣營的玩家可能發現據點被洩漏，但無法找到確切責任人
```

### 能力C：扒竊

```
效果：
系統隨機從所有玩家中抽一人偷取貨幣
背道者不知道偷了誰
目標不知道是誰偷的

排除對象：
- 背道者自己
- is_lost = true 的玩家
- npc_role IS NOT NULL 的NPC
- coins = 0 的玩家

金額計算：
FLOOR(目標 coins × 0.1)，最少1幣

執行邏輯：
POST /api/apostate/pickpocket
- 驗證 identity_role = 'apostate'
- 驗證本章 apostate_skill_used = false
- 從合格玩家中隨機抽一人
- 計算偷取金額
- 目標 coins - 偷取金額
- 背道者 coins + 偷取金額
- apostate_skill_used = true
- 私人通知背道者（不顯示目標是誰）：
  「你的手悄悄伸進了某人的口袋，
   帶走了 X 枚貨幣。」
- 私人通知目標（不顯示是誰做的）：
  「你的貨幣少了一些，像是被人摸走的。」

痕跡：完全靜默，無公開記錄
```

---

## 5. 背道者專屬UI視覺

```
觸發時機：
- 收到背道者身分通知時
- 打開背道者能力面板時

視覺規格：
背景色：低彩度青色（Cyan #00b4d8 降飽和度至30%）
線條：幾何線條風格，非曲線
動效：頻閃呼吸燈（0.5秒間隔輕微閃爍）
背景紋理：細噪點（opacity 15%）
字體：等寬字體

文字去名化規則：
所有介面文字嚴禁提及：
- 具體陣營名稱（濁息者/淨塵者）
- 任何玩家OC名稱
只使用：「那裡/這裡」「年長者/年幼者」「某人」「某處」

UI張力文案：
『這不是聲音，這是維度的震顫。』
『願您的背叛，能換來一絲真實。』
『你被選中了。原因，不重要。』
『能力已就緒。使用後，不可撤回。』
```

---

## 6. 背道者面板設計

```
╔────────────────────────────╗
║  // APOSTATE INTERFACE //   ║  ← Cyan色，頻閃邊框
║  身分：已確認               ║
║  本章能力：[隨機指派結果]   ║
║                             ║
║  ┌─────────────────────┐   ║
║  │ 能力A：貪婪          │   ║  ← 本章若指派到A則高亮
║  │ 從虛空取走貨幣       │   ║
║  │ [執行] ←按鈕         │   ║
║  └─────────────────────┘   ║
║                             ║
║  本章已使用：[是/否]        ║
║  使用後本章無法再次啟動     ║
╚────────────────────────────╝

注意：
- 面板只有 identity_role = 'apostate' 的玩家看得到
- 入口隱藏在普通UI某處，不醒目
- 能力顯示文字使用去名化語言
```

---

## 7. 資料庫欄位需求

```sql
-- 在 td_users 新增（背道者用）
ALTER TABLE td_users ADD COLUMN IF NOT EXISTS
    apostate_skill_used BOOLEAN DEFAULT FALSE;
    -- 本章能力是否已使用，章節重置時歸FALSE

ALTER TABLE td_users ADD COLUMN IF NOT EXISTS
    apostate_current_skill TEXT DEFAULT NULL;
    -- 本章被指派的能力：'greed' | 'leak' | 'pickpocket'
    -- 章節開始時由系統隨機指派

-- 在 td_world_map_landmarks 新增（能力B用）
ALTER TABLE td_world_map_landmarks ADD COLUMN IF NOT EXISTS
    leaked_to_faction TEXT DEFAULT NULL;
    -- 被洩漏給哪個陣營，NULL表示未被洩漏

ALTER TABLE td_world_map_landmarks ADD COLUMN IF NOT EXISTS
    leaked_chapter TEXT DEFAULT NULL;
    -- 被洩漏的章節版本
```

---

## 8. 章節重置邏輯

```
每章開始時，對所有 identity_role = 'apostate' 的玩家執行：

1. apostate_skill_used = FALSE
2. apostate_current_skill = 隨機('greed', 'leak', 'pickpocket')
3. 發送私人通知告知本章能力：
   「新的週期開始了。
    這一次，你被賦予的是：[能力名稱去名化描述]
    善用它。」
```

---

## 9. 已廢棄的舊版能力

```
❌ 地圖干預（Map Mimic Override）
   原因：mimic_probability_override 從未實作，複雜度過高

❌ 混沌注入（Chaos Infusion）
   原因：chaos_value 已從代碼完全移除

❌ 通訊截流（Interception Window）
   原因：依賴點讚系統，目前不實作；
         且「破壞敵方資訊」不符合新版設計原則
         （遊戲樂趣應在貨幣爭鬥，非資訊破壞）
```

---

## 10. 實作優先順序

```
🔴 P0（選拔前提）
  適性問卷前端介面 + 結果寫入 Supabase

🟠 P1（選拔流程）
  POST /api/admin/lottery 確認可正常執行
  身分鎖定寫入 identity_role = 'apostate'
  背道者收到專屬通知

🟠 P1（能力系統）
  章節開始時隨機指派能力
  背道者面板UI（Cyan視覺）
  三項能力API實作

🟡 P2（操作優化）
  背道者面板操作體驗優化
  去名化文字全面審查
  能力使用後的回饋動畫
```
