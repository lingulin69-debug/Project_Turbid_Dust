# 給 Claude 的快查筆記 — Project Turbid Dust

> 每次新對話貼這個給 Claude，可大幅減少探索時間 (省 token)

---

## 專案基本資訊
- **路徑**: `c:\Users\user\Desktop\委託網頁\Project_Turbid_Dust\`
- **Dev server**: http://192.168.213.156:3088/
- **Stack**: React 18 + Vite + TypeScript + Tailwind + Framer Motion + Lucide React + Supabase

---

## 關鍵檔案一覽

| 檔案 | 用途 |
|------|------|
| `src/components/WhiteCrowCard.tsx` | 基礎卡片系統 + FACTION_THEMES + 子組件 |
| `src/components/WhiteCrowPanels.tsx` | 各功能面板（使用 WhiteCrowCard） |
| `src/components/MapTestView.tsx` | 主遊戲畫面，掛載所有面板、地圖、NPC ICON |
| `src/components/CharacterCard.tsx` | 角色卡 Modal（Tab 式，**1:2 比例**，max-w-300px） |
| `src/components/MapLandmark.tsx` | 據點 ICON 組件，含 hover tooltip 人數顯示 |
| `src/components/PTD_UI_Theme.tsx` | 全頁主題系統：PTD_UI_THEME / PTD_UI_TURBID_THEME / getPageTheme / usePTDUIStyles |
| `src/components/BalanceSettlementModal.tsx` | 陣營結算 Modal（原名業力結算，已改名） |
| `src/index.css` | 全域樣式，含 `color-scheme: light` 防 Chrome 強制暗色 |
| `src/hooks/useSounds.ts` | 音效系統：`Sounds.panelOpen()` / `Sounds.bell()` / `Sounds.coin()` |
| `src/data/landmark-chapters.json` | 所有章節據點劇情（160+ 據點，Turbid + Pure 合併） |

---

## 雙主題系統架構

### 全頁切換（MapTestView 主畫面）
- `usePTDUIStyles()` 注入 CSS class（`ptd-ui-nav-button`、`ptd-ui-base` 等）
- `const pageTheme = getPageTheme(playerFaction)` — 玩家登入後 `playerFaction` 改變，所有 inline style 同步更新
- 根容器：`className="... ptd-ui-base" data-faction={playerFaction} style={{ backgroundColor: pageTheme.bgBase }}`
- CSS `[data-faction="Turbid"] .ptd-ui-nav-button` 選擇器以 `!important` 覆寫 class 預設值，實現 Pure/Turbid 全頁切換

### 主題顏色對照

| 屬性 | Pure（淺色） | Turbid（深色） |
|------|-------------|---------------|
| bgBase | `#D9D7C5` | `#130826` |
| textPrimary | `#5a4e44` | `#e4d5f5` |
| textSecondary | `#8b7355` | `#c5a8e0` |
| primary | `#b89f86` | `#9b59b6` |
| border | rgba(184,159,134,0.3) | rgba(124,58,237,0.4) |

### 面板層（WhiteCrowCard / WhiteCrowPanels）
- 傳 `faction="Turbid"|"Pure"` 給 `<WhiteCrowCard>` → 根 div 設 CSS 變數 (`--wc-xxx`)
- 子組件 (`WCTabBar`, `WCButton` 等) 自動繼承，不需各自傳 faction
- **背包 / NPC / 惡政面板**：已傳入 `faction={currentUser?.faction}`

### 已遷移面板（使用 WhiteCrowCard + CSS vars）✅
- AnnouncementPanel、QuestPanel、DailyPanel、CollectionPanel、SettingsPanel
- InventoryPanel、NPCPanel、LeaderTyrannyPanel — 用 WhiteCrowCard 包覆，已套 faction prop

---

## 地圖系統（MapTestView.tsx）

### 據點（Landmarks）
- 資料結構：`{ id, name, x, y, faction, status, occupants, capacity, type }`
- ID 格式：`l{章節}_{陣營}{序號}`（例：`l1_t01`、`l1_p02`）
- hover tooltip 顯示人數：`occupants/capacity`（綠色=未滿、紅色=已滿）
- 點擊開放據點 → 跳出劇情 Modal（讀 `landmark-chapters.json`）
- Modal 含「申請加入」按鈕 → 呼叫 `POST /api/party/join`（同陣營 + 登入才顯示）

### 劇情 JSON 格式（`src/data/landmark-chapters.json`）
```json
{
  "chapters": [
    {
      "chapter_version": "1.0",
      "chapter_title": "...",
      "landmarks": [
        {
          "id": "l1_t01",
          "faction": "Turbid",
          "status": "open",
          "intro_text": "...",
          "mission_text": "...",
          "teamup_text": "...",
          "npc_text": "...",
          "outro_text": "【safe】...---【danger】..."
        }
      ]
    }
  ]
}
```

### NPC 地圖 ICON
- **固定位置 NPC**（black_merchant / inn_owner / pet_merchant / item_merchant）
  - 座標寫在 `MAP_NPCS` 常數（MapTestView.tsx 約 L96）
  - 管理員若要調整位置，直接改 x/y 數值
- **移動型 NPC**（trafficker / 人販子）
  - 從 Supabase `td_users.current_landmark_id` 讀取
  - 自動對應到該據點的 x/y 座標，稍微偏移（+3, -4）避免重疊
  - 沒有 `current_landmark_id` 時不顯示
- 點擊 NPC ICON → 跳出互動 Modal（各角色顯示對應互動 UI）
- `NPC_ROLE_ICON`：🎭黑心商人 / 🪤人販子 / 🏠旅店老闆 / 🐾寵物商人

### NPC 互動 Modal — 玩家端介面（已完成）

背包面板**已移除**市集和寵物商店，改由地圖 NPC 圖標觸發。

| NPC | 玩家端介面內容 |
|-----|--------------|
| 🎭 黑心商人 | 本章已上架商品列表（名稱/描述/類型/售價）+ 購買按鈕 |
| 📦 道具商人 | 同上 |
| 🏠 旅店老闆 | 治療 HP（2幣，系統自動擲 D20）+ 委託救援（5幣，輸入目標 OC 名稱）|
| 🐾 寵物商人 | 本章已上架生物列表（名稱/描述/售價）+ 購買按鈕 |
| 🪤 人販子 | 僅顯示「此人在暗處注視著你」，無互動 |

**共用邏輯：**
- 未登入 → 顯示「請先登入」
- 貨幣不足 → 購買按鈕 disable（opacity-30）
- 購買後即時更新 `currentUser.coins` + 刷新列表
- 成功/失敗訊息顯示於 modal 底部（綠/紅，附對應色邊框）
- 點擊 NPC 時自動 fetch 商品（merchant → 按 `seller_oc === npc.oc_name` 篩選；pet_merchant → `GET /api/pets/all`）
- 關閉 Modal 清除所有暫存狀態

**設計系統（已對齊 WhiteCrowCard FACTION_THEMES）：**
- 所有結構色（底色/邊框/陰影/列背景/輸入框）→ `wcTheme.*`
- `roleColor`（每個 NPC 獨立強調色）只用於：頂部裝飾線、角色身分標籤、區塊標題、售價文字
- NPC 強調色：🎭 `#ef4444` / 🪤 `#d97706` / 🏠 `#0d9488` / 🐾 `#9b59b6`
- 動效：`motion.button whileTap={{ scale: 0.94 }}`（所有操作按鈕）、列 hover 用 `onMouseEnter/Leave` 直接改 style（不觸發 React re-render）
- 骰子商品購買後觸發 `DiceResultOverlay`（數字跑馬燈 → Framer Motion 彈跳定格）

**MapTestView.tsx 相關 state：**
```
npcActionMsg        { type: 'ok'|'err'; text: string } | null
npcActionLoading    boolean（旅店治療/救援）
innRescueTarget     string（救援輸入框）
diceAnimState       DiceAnimData | null（骰子動畫，null = 不顯示）
```

**DiceAnimData 介面：**
```ts
interface DiceAnimData {
  dice_type: 'D6' | 'D20';
  result: number;
  message: string;
  coins_delta: number;
  status_tag: string;
}
```
⚠️ 骰子動畫需後端 buy API 在 `item` 物件內回傳 `dice_rolled` 才會觸發，否則退回文字訊息。

### NPC 玩家端管理介面（NPCPanel.tsx）

NPC 玩家登入後在 HUD 的 NPC tab 看到，與玩家購買 Modal **分離**。

| NPC | 管理介面內容 |
|-----|-----------|
| 🎭 黑心商人 | 移動 + 上架商品（含骰子判定商品 D6/D20、R18）+ 已上架列表 |
| 📦 道具商人 | 移動 + 上架商品（一般道具/衣裝/自製，**不含**骰子/R18）+ 已上架列表 |
| 🏠 旅店老闆 | 開關店 toggle（影響地圖顯示與玩家能否使用服務）|
| 🐾 寵物商人 | 開關店 toggle + 勾選預設寵物上架（最多3隻）+ 新增自製特別款 |
| 🪤 人販子 | 移動 + 村民任務（+3聲望）+ 技能（綁架/情報/扒竊，消耗聲望）|

**目前缺少（未實作）：**
- 商人下架已上架商品的功能

---

## 角色卡（CharacterCard.tsx）現況

- Tab 導航：基本 / 生物(n) / 遺物(n) / 見證
- **雙主題**：`viewerFaction === 'Turbid'` → `TURBID_THEME`；Pure → `LIGHT_THEME`
- `const theme = viewerFaction === 'Turbid' ? TURBID_THEME : LIGHT_THEME` 放在所有條件 return **之前**
- 卡片尺寸：`max-w-[300px]`、`aspectRatio: '1 / 2'`（300×600px）、`maxHeight: '92vh'`
- `RelicPoemModal` 背景固定深色（`#06040a`），文字用 `rgba(255,255,255,0.x)` 不跟 theme
- 集齊「昔日的餘溫」系列遺物 → 觸發詩歌 Modal

---

## 尺寸規格（最新，2026-03-17）

### Border-radius

| 元素類型 | 值 |
|---------|-----|
| **主面板 / Modal** | **8px** |
| 按鈕（一般）| 6px |
| 標籤 / 徽章 | 4px |
| 導航按鈕（側邊）| 12px (`rounded-xl`) |
| 圓形按鈕（HUD）| 50% |

### 按鈕尺寸

| 類型 | 尺寸 | 圓角 |
|------|------|------|
| 左側導航按鈕 | **40 × 40 px** (w-10 h-10) | 12px |
| WhiteCrowCard 關閉鈕 | **36 × 36 px** | 50% |
| HUD 頂部圓形按鈕 | ~32 px | 50% |
| NPC ICON | **36 × 36 px** (w-9 h-9) | 50% |

### 面板尺寸

| 面板 | 最大寬度 | 最小高度 |
|------|---------|---------|
| WhiteCrowCard | 450px | 480px |
| CharacterCard | 300px | 600px（1:2 比例）|
| 據點劇情 Modal | 480px | auto |
| NPC 互動 Modal | 420px | auto |
| 背包格子 | — | **6 欄** (grid-cols-6) |

### 陰影（統一來源：PTD_UI_Theme + WhiteCrowCard FACTION_THEMES）

| 等級 | Pure | Turbid |
|------|------|--------|
| lg（面板）| `0 24px 64px rgba(100,90,75,0.18)` + inset | `0 24px 64px rgba(30,0,80,0.55)` + inset |
| md | `0 8px 24px rgba(100,90,75,0.15)` + inset | `0 8px 24px rgba(30,0,80,0.35)` + inset |

---

## 音效系統（src/hooks/useSounds.ts）

音效檔放在 `/public/sounds/`，設計師提供後替換即可。

| 方法 | 檔案 | 觸發位置 |
|------|------|---------|
| `Sounds.panelOpen()` | `/sounds/page_flip.mp3` | 公告/任務/日誌/圖鑑 按鈕點擊 |
| `Sounds.bell()` | `/sounds/bell.mp3` | 鈴鐺按鈕點擊 |
| `Sounds.coin()` | `/sounds/coin.mp3` | 貨幣欄位點擊 |

---

## 響應式斷點（手機支援）

- 主要斷點：`640px`（`sm:`）
- WhiteCrowCard：`min(450px, 100vw-32px)`
- Modal：`w-full max-w-[500px] mx-4`
- HUD 頂部：`top-3 right-3 sm:top-6 sm:right-8`
- 全域 `button` min-height: 44px（手機）
- iOS input font-size ≥ 16px 防自動縮放

---

## 效能規範（已驗證，2026-03-18）

### backdrop-filter: blur() 使用限制

**禁止**在全螢幕/大面積遮罩層上使用 `backdrop-blur-*`，動畫期間每幀重算模糊導致明顯卡頓。

```
✅ 允許：小型靜態元素（tooltip、HUD 按鈕、小徽章）
❌ 禁止：fixed inset-0 的 modal 遮罩、有 animate/exit 的 motion.div 遮罩
```

**已處理的檔案（共 14 處）：**
- `MapTestView.tsx`：NPC Modal、據點 Modal、driftModal、設定 Modal、迷霧遮罩×2
- `CharacterCard.tsx`：角色卡遮罩×4
- `LoginModal.tsx`：登入遮罩
- `LiquidatorSystem.tsx`：清算者 Modal
- `ApostateSystem.tsx`：背道者 Modal×2
- `UIComponents.tsx`：通用 Modal×2
- `AdminApostateControl.tsx`：管理員控制 Modal

**迷霧遮罩附加修正：**
`transition-all duration-1000` → `transition-opacity duration-500`（只 transition 需要屬性，避免瀏覽器計算不必要的屬性）

---

## 已知問題
- `DraggableUIButton` 有 3 個既有 TS `style` 型別錯誤（非我們的變更）
- 音效需使用者互動後才能觸發（瀏覽器自動播放政策），程式已靜默處理

---

## 節省 Token 的說話方式

**好的提問（快）:**
> 「修改 `WhiteCrowCard.tsx` 的 Turbid 主題，把 `cardBg` 換成 `url(/assets/ui/turbid_bg.png)`」

**容易浪費 Token 的提問（慢）:**
> 「幫我改一下深色那個視窗的背景」（Claude 需要先找檔案再定位）

**貼圖截圖** 比描述更快——直接貼截圖讓 Claude 看到問題在哪。
