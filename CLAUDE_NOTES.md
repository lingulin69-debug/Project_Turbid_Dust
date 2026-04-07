# Claude Code 快查筆記 — Project Turbid Dust (Cocos Creator 版)

> 將此檔案放在專案根目錄命名為 `CLAUDE.md`，Claude Code 會自動讀取作為專案上下文。

---

## 專案基本資訊

- **引擎**: Cocos Creator 3.x（TypeScript）
- **專案路徑**: `E:\Game_Dev_Main\Project_Turbid_Dust\`
- **Dev server**: Cocos Creator 內建預覽（或 `npm run dev`）
- **Stack**: Cocos Creator 3.x + TypeScript + Supabase

---

## 變更記錄 (2026-03-20)

### `DesignOverlay` 元件重構 → **已移除**

原 Web 版 Figma 對齊工具（12 欄網格、1200px 安全框）**不適用於 Cocos**，已整組刪除。
Cocos Creator 編輯器內建 Layout 輔助線與 Widget 元件可直接替代，無需另外實作。

---

## Cocos Creator 核心對應規則

| Web（React + Tailwind） | Cocos Creator 3.x 對應 |
|------------------------|----------------------|
| `.tsx` 元件 | `Node` + `cc.Component`（`.ts` 腳本掛載） |
| `useState` / `useEffect` | `@property` + 生命週期（`onLoad`, `start`, `update`） |
| `className="..."` Tailwind | `UITransform` / `Widget` / `Layout` 元件屬性 |
| `style={{ color, bg }}` inline | Label / Sprite Color、`node.color = new Color(...)` |
| `motion.div`（Framer Motion）| `tween(node)` 或 `cc.Tween` |
| `z-index` | `node.setSiblingIndex()` / Layer 排序 |
| `pointer-events: none` | `node.getComponent(UITransform).hitTest = false`（或關閉 Button 元件） |
| `fixed inset-0` Modal 遮罩 | 全屏 `Node`，`Widget` 四邊設 0，放在高層 Layer |
| `backdrop-blur`（**禁用**）| Cocos 無直接對應，用半透明黑色蓋板替代 |
| `grid-cols-6` 背包格 | `GridLayout` 元件，`startAxis: HORIZONTAL`，欄數 6 |
| `onClick` 按鈕 | `Button` 元件 + `clickEvents` 或 `node.on(Node.EventType.TOUCH_END, ...)` |
| `fetch` / Supabase API | 保持不變（TypeScript 環境相同） |
| `localStorage` | `cc.sys.localStorage`（介面相同）|
| CSS 動畫 `transition-opacity` | `tween(node).to(0.5, { opacity: 0 }).start()` |

---

## 關鍵場景與節點一覽

> 對應原 Web 版的「關鍵檔案一覽」，改為 Cocos 場景/Prefab 結構。

| Prefab / 場景 | 用途 |
|--------------|------|
| `prefabs/WhiteCrowCard.prefab` | 基礎卡片系統，含 FACTION_THEMES 切換邏輯 |
| `prefabs/WhiteCrowPanels.prefab` | 各功能面板（使用 WhiteCrowCard） |
| `scenes/MapTestView.scene` | 主遊戲場景，掛載所有面板、地圖、NPC 圖標 |
| `prefabs/CharacterCard.prefab` | 角色卡 Modal（Tab 式，1:2 比例，寬 300px） |
| `prefabs/MapLandmark.prefab` | 據點圖標節點，含 hover tooltip 人數顯示 |
| `scripts/PTD_UI_Theme.ts` | 全頁主題系統：`PTD_UI_THEME` / `PTD_UI_TURBID_THEME` / `getPageTheme` |
| `prefabs/BalanceSettlementModal.prefab` | 陣營結算 Modal（原名業力結算，已改名）|
| `scripts/SoundManager.ts` | 音效系統（見下方音效章節）|
| `resources/data/landmark-chapters.json` | 所有章節據點劇情（160+ 據點）|
| `resources/portraits/` | 立繪圖檔目錄（見下方命名規則） |

---

## 立繪圖檔命名規則（`resources/portraits/`）

| 檔名 | 對應角色 |
|------|---------|
| `black_merchant.png` | 🎭 黑心商人 |
| `item_merchant.png` | 📦 道具商人 |
| `trafficker.png` | 🪤 人販子 |
| `inn_owner.png` | 🏠 旅店老闆 |
| `pet_merchant.png` | 🐾 寵物商人 |
| `leader_turbid.png` | 濁息陣營領主 |
| `leader_pure.png` | 淨塵陣營教主 |
| `landmark_l1_t01.png` | 據點 l1_t01 專屬立繪（依 ID 命名）|
| `landmark_default.png` | 據點無專屬立繪時的預設圖 |
| `portrait_unknown.png` | 任何角色無圖時的通用 fallback |

* **NPC 節點命名鐵律**：地圖上的 NPC 節點名稱 (`node.name`) 必須嚴格等於資料庫中的 `npc_role` (例如：`inn_owner`, `black_merchant`, `trafficker`)，以便統一透過名稱進行事件對接與判定。


**立繪顯示規則（Cocos 實作）：**

- 桌機（Canvas 寬 ≥ 640）：立繪節點 `active = true`，定位於 Modal 右側，`anchorPoint = (0, 0)`（底部對齊）
- 手機（Canvas 寬 < 640）：立繪節點 `active = false`
- 載入失敗：`spriteFrame` 切換為 `portrait_unknown`

```typescript
// 立繪載入範例
resources.load(`portraits/${portraitId}`, SpriteFrame, (err, sf) => {
    const fallback = err ? 'portraits/portrait_unknown' : null;
    if (fallback) {
        resources.load(fallback, SpriteFrame, (_, fSf) => {
            this.portraitSprite.spriteFrame = fSf;
        });
    } else {
        this.portraitSprite.spriteFrame = sf;
    }
});
```

---

## 雙主題系統架構

### 全頁切換（MapTestView 主場景）

```typescript
// scripts/PTD_UI_Theme.ts
export const PTD_UI_THEME = {
    Pure: {
        bgBase: new Color(217, 215, 197),
        textPrimary: new Color(90, 78, 68),
        textSecondary: new Color(139, 115, 85),
        primary: new Color(184, 159, 134),
        border: new Color(184, 159, 134, 77),  // rgba(184,159,134,0.3)
    },
    Turbid: {
        bgBase: new Color(19, 8, 38),
        textPrimary: new Color(228, 213, 245),
        textSecondary: new Color(197, 168, 224),
        primary: new Color(155, 89, 182),
        border: new Color(124, 58, 237, 102),  // rgba(124,58,237,0.4)
    }
};

export function getPageTheme(faction: 'Pure' | 'Turbid') {
    return PTD_UI_THEME[faction];
}
```

**切換方式：** 玩家登入後取得 `playerFaction`，呼叫 `applyTheme(faction)` 統一更新所有 Label/Sprite Color。

### 主題顏色對照

| 屬性 | Pure（淺色） | Turbid（深色） |
|------|-------------|---------------|
| bgBase | `#D9D7C5` | `#130826` |
| textPrimary | `#5a4e44` | `#e4d5f5` |
| textSecondary | `#8b7355` | `#c5a8e0` |
| primary | `#b89f86` | `#9b59b6` |
| border | rgba(184,159,134,0.3) | rgba(124,58,237,0.4) |

### 面板層（WhiteCrowCard Prefab）

- 傳入 `faction: 'Turbid' | 'Pure'` → 更新 Prefab 內所有 Label/Sprite 顏色
- 子節點透過 `getComponentInParent` 取得 faction，不需各自傳入

### 已遷移面板 ✅

**使用 WhiteCrowCard Prefab 的面板**（傳入 faction 切換色彩）：
AnnouncementPanel、QuestPanel、DailyPanel、CollectionPanel、SettingsPanel、InventoryPanel、NPCPanel

**獨立面板**（自建 UI 結構，含獨立 mask + bgSprite）：

| 面板 | 用途 | 備註 |
|------|------|------|
| LeaderTyrannyPanel | 領主/教皇惡政面板（5 類政令） | EVIL_RED 主題色 `#7f3030` |
| LeaderboardPanel | 排行榜面板 | **僅 admin/gm 可見**，`show()` 檢查 `player.role` |
| BalanceSettlementModal | 章結天平結算動畫 | 5 階段動畫：出現→傾斜→揭曉，beam 旋轉 `tween(eulerAngles)` |
| ApostatePanel | 背道者面板 | 暗色主題，隱匿任務 |
| LiquidatorPanel | 清算者面板 | EVIL_RED 主題 |
| LandmarkStoryModal | 據點劇情彈窗 | 打字機效果 |
| KidnapPopup | 人販子綁架通知 | 不可手動關閉（倒數後自動消失）|

---

## 地圖系統（MapTestView.scene）

### 據點（Landmarks）

```typescript
interface LandmarkData {
    id: string;      // 格式：l{章節}_{陣營}{序號}，例：l1_t01、l1_p02
    name: string;
    x?: number;      // 地圖節點本地座標（可選，缺少時自動排列）
    y?: number;
    faction: 'Turbid' | 'Pure';
    status: 'open' | 'closed';
    occupants?: number;
    capacity?: number;
    type?: string;
}
```

- hover（`MOUSE_ENTER`）：顯示 tooltip，人數 `occupants/capacity`（綠=未滿、紅=已滿）
- 點擊開放據點 → 開啟劇情 Modal（讀 `landmark-chapters.json`）
- Modal 含「申請加入」按鈕 → 呼叫 `POST /api/party/join`（同陣營 + 登入才顯示）

### 劇情 JSON 格式（`resources/data/landmark-chapters.json`）

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

### NPC 地圖圖標

**固定位置 NPC**（black_merchant / inn_owner / pet_merchant / item_merchant）
- 座標寫在 `MapTestView.ts` 的 `MAP_NPCS` 常數（約 L96）
- 調整位置直接改 `x / y` 數值

**移動型 NPC**（trafficker / 人販子）
- 從 Supabase `td_users.current_landmark_id` 讀取
- 自動對應到該據點的 `x / y` 座標，偏移 `(+3, -4)` 避免重疊
- 無 `current_landmark_id` 時 `node.active = false`

點擊 NPC 圖標 → 開啟互動 Modal（各角色顯示對應互動 UI）

| NPC | emoji | 強調色 |
|-----|-------|-------|
| 黑心商人 | 🎭 | `#ef4444` |
| 人販子 | 🪤 | `#d97706` |
| 旅店老闆 | 🏠 | `#0d9488` |
| 寵物商人 | 🐾 | `#9b59b6` |
| 道具商人 | 📦 | — |

---

## NPC 互動 Modal — 玩家端介面

| NPC | 玩家端介面內容 |
|-----|--------------|
| 🎭 黑心商人 | 本章已上架商品列表（名稱/描述/類型/售價）+ 購買按鈕 |
| 📦 道具商人 | 同上 |
| 🏠 旅店老闆 | 治療 HP（2幣，系統自動擲 D20）+ 委託救援（5幣，輸入目標 OC 名稱）|
| 🐾 寵物商人 | 本章已上架生物列表（名稱/描述/售價）+ 購買按鈕 |
| 🪤 人販子 | 僅顯示「此人在暗處注視著你」，無互動 |

**共用邏輯：**
- 未登入 → 顯示「請先登入」
- 貨幣不足 → 購買按鈕 `interactable = false`（透明度降低）
- 購買後即時更新 `currentUser.coins` + 刷新列表
- 成功/失敗訊息顯示於 Modal 底部（綠/紅，附對應色框）
- 點擊 NPC 時自動 fetch 商品（merchant → 按 `seller_oc === npc.oc_name` 篩選；pet_merchant → `GET /api/pets/all`）
- 關閉 Modal 清除所有暫存狀態

**動效：**
- 按鈕點擊：`tween(btn.node).to(0.05, { scale: new Vec3(0.94, 0.94, 1) }).to(0.05, { scale: Vec3.ONE }).start()`
- 列 hover：直接修改 `node.color`，不觸發完整重繪

**骰子商品購買後觸發 `DiceResultOverlay`（數字跑馬燈 → tween 彈跳定格）**

### MapTestView 相關屬性

```typescript
npcActionMsg: { type: 'ok' | 'err'; text: string } | null = null;
npcActionLoading: boolean = false;    // 旅店治療/救援
innRescueTarget: string = '';          // 救援輸入框
diceAnimState: DiceAnimData | null = null;  // null = 不顯示骰子動畫
```

### DiceAnimData 介面

```typescript
interface DiceAnimData {
    dice_type: 'D6' | 'D20';
    result: number;
    message: string;
    coins_delta: number;
    status_tag: string;
}
```

> ⚠️ 骰子動畫需後端 buy API 在 `item` 物件內回傳 `dice_rolled` 才會觸發，否則退回文字訊息。

---

## NPC 玩家端管理介面（NPCPanel Prefab）

NPC 玩家登入後在 HUD 的 NPC tab 看到，與玩家購買 Modal **分離**。

| NPC | 管理介面內容 |
|-----|-----------|
| 🎭 黑心商人 | 移動 + 上架商品（含骰子判定商品 D6/D20、R18）+ 已上架列表 |
| 📦 道具商人 | 移動 + 上架商品（一般道具/衣裝/自製，**不含**骰子/R18）+ 已上架列表 |
| 🏠 旅店老闆 | 開關店 toggle（影響地圖顯示與玩家能否使用服務）|
| 🐾 寵物商人 | 開關店 toggle + 勾選預設寵物上架（最多3隻）+ 新增自製特別款 |
| 🪤 人販子 | 移動 + 村民任務（+3聲望）+ 技能（綁架/情報/扒竊，消耗聲望）|

---

## 角色卡（CharacterCard Prefab）現況

- Tab 導航：基本 / 生物(n) / 遺物(n) / 見證
- **雙主題**：`viewerFaction === 'Turbid'` → `TURBID_THEME`；Pure → `LIGHT_THEME`
- 卡片尺寸：寬 `300px`，高 `600px`（1:2 比例），最大高度 `92%` Canvas 高度
- `RelicPoemModal` 背景固定深色（`#06040a`），文字用 `rgba(255,255,255,0.x)` 不跟 theme
- 集齊「昔日的餘溫」系列遺物 → 觸發詩歌 Modal

---

## 尺寸規格（最新，2026-03-17）

### Border-radius（Cocos 使用 `Graphics` 元件或 Sprite 九宮格）

| 元素類型 | 值 |
|---------|-----|
| 主面板 / Modal | 8px |
| 按鈕（一般）| 6px |
| 標籤 / 徽章 | 4px |
| 導航按鈕（側邊）| 12px |
| 圓形按鈕（HUD）| 50%（正方形節點） |

### 按鈕尺寸

| 類型 | 尺寸 | 圓角 |
|------|------|------|
| 左側導航按鈕 | 40 × 40 px | 12px |
| WhiteCrowCard 關閉鈕 | 36 × 36 px | 50% |
| HUD 頂部圓形按鈕 | ~32 px | 50% |
| NPC 圖標 | 36 × 36 px | 50% |

### 面板尺寸

| 面板 | 最大寬度 | 最小高度 |
|------|---------|---------|
| WhiteCrowCard | 450px | 480px |
| CharacterCard | 300px | 600px（1:2 比例）|
| 據點劇情 Modal | 480px | auto |
| NPC 互動 Modal | 420px | auto |
| 背包格子 | — | **6 欄** GridLayout |

### 陰影（Cocos 用 `Shadow` 或自訂 Sprite 陰影節點）

| 等級 | Pure | Turbid |
|------|------|--------|
| lg（面板）| `rgba(100,90,75,0.18)` 偏移 `(0, -24)` 模糊 `64` | `rgba(30,0,80,0.55)` 偏移 `(0, -24)` 模糊 `64` |
| md | `rgba(100,90,75,0.15)` 偏移 `(0, -8)` 模糊 `24` | `rgba(30,0,80,0.35)` 偏移 `(0, -8)` 模糊 `24` |

---

## 音效系統（`scripts/SoundManager.ts`）

音效檔放在 `resources/sounds/`，設計師提供後替換即可。

```typescript
// 使用方式
SoundManager.panelOpen();   // 公告/任務/日誌/圖鑑 按鈕點擊
SoundManager.bell();        // 鈴鐺按鈕點擊
SoundManager.coin();        // 貨幣欄位點擊
```

| 方法 | 檔案 | 觸發位置 |
|------|------|---------|
| `SoundManager.panelOpen()` | `sounds/page_flip.mp3` | 公告/任務/日誌/圖鑑 按鈕點擊 |
| `SoundManager.bell()` | `sounds/bell.mp3` | 鈴鐺按鈕點擊 |
| `SoundManager.coin()` | `sounds/coin.mp3` | 貨幣欄位點擊 |

```typescript
// SoundManager.ts 基本結構
import { _decorator, Component, AudioSource, AudioClip, resources } from 'cc';

export class SoundManager {
    private static _source: AudioSource;

    static init(source: AudioSource) { this._source = source; }

    static play(path: string) {
        resources.load(`sounds/${path}`, AudioClip, (err, clip) => {
            if (!err) this._source.playOneShot(clip);
        });
    }

    static panelOpen() { this.play('page_flip'); }
    static bell()      { this.play('bell'); }
    static coin()      { this.play('coin'); }
}
```

> 音效需使用者觸摸互動後才能觸發（瀏覽器/行動裝置自動播放政策），程式已靜默處理。

---

## 響應式斷點（手機支援）

- 主要斷點：Canvas 寬度 `640px`
- 使用 `view.getVisibleSize()` 取得畫面大小，動態調整節點
- WhiteCrowCard：`Math.min(450, visibleWidth - 32)`
- Modal：寬度 `Math.min(500, visibleWidth - 32)`，置中對齊
- HUD 頂部偏移：手機 `top: 12, right: 12`；桌機 `top: 24, right: 32`
- 全域 Button `minHeight: 44px`（手機觸控）
- 輸入框字體 ≥ 16px 防 iOS 自動縮放

---

## 效能規範

### `backdrop-filter: blur()` → **在 Cocos 中不使用**

Cocos 無原生 CSS backdrop-filter。所有遮罩層一律改用：

```typescript
// 半透明黑色蓋板（無模糊），效能最佳
maskNode.color = new Color(0, 0, 0, 180);  // alpha 約 0.7
```

**禁止**在動畫中對大面積節點做昂貴的遮罩效果，已驗證可能導致明顯卡頓。

### Modal 動畫規範

```typescript
// ✅ 只 tween 需要的屬性
tween(modalNode)
    .to(0.5, { opacity: 255 })
    .start();

// ❌ 禁止同時 tween scale + position + color（瀏覽器預覽卡頓）
```

---

## 已知問題

- `DraggableUIButton` 有 3 個既有 TS `style` 型別錯誤（非本次變更，暫不處理）
- 音效需使用者互動後才能觸發，程式已靜默處理

---

## 修復紀錄

### 2026-07-14 — P0-P4 全面審計 & 修復

**背景**：對 server/index.ts（78 routes）與前端元件做完整交叉檢查。

#### ✅ 已修復

| # | 範圍 | 修復內容 | 影響檔案 |
|---|------|---------|---------|
| 1 | `POST /api/admin/liquidator-select` | Prisma → Supabase（`prisma.td_users.findMany/updateMany` 改為 `supabaseServer.from().select/update`） | `server/index.ts` |
| 2 | `GET /api/admin/candidates` | Prisma → Supabase | `server/index.ts` |
| 3 | `GET /api/admin/registry` | Prisma → Supabase | `server/index.ts` |
| 4 | 人販子重複路由（4組） | 移除未被前端使用的 `/trafficker/kidnap`、`/deliver`、`/intel`、`/pickpocket`，保留 `/skill/*` 版本 | `server/index.ts`（-250行） |
| 5 | `client.ts` trafficker 路徑 | `/npc/trafficker/kidnap` → `/npc/trafficker/skill/kidnap`，補 `chapter_version` | `src/api/client.ts` |
| 6 | 文件路由更新 | 更新 `world_map_schema.md`、`NPC_功能與權能列表.md` 中的人販子 API 路徑 | `docs/` ×2 |

#### ⚠️ 待處理（已識別但未修復）

| # | 問題 | 風險等級 | 說明 |
|---|------|---------|------|
| 1 | 無速率限制 | 中 | 所有 API 端點無 rate limiting |
| 2 | Admin 認證薄弱 | 中 | 僅檢查 `ocName === 'vonn'`，無 token/session |
| 3 | `npc_actions` 表只寫不讀 | 低 | 資料有寫入但無讀取端點 |
| 4 | karma tag 錯誤靜默吞掉 | 低 | `addKarmaTag` 失敗時不會拋出錯誤 |

#### 📁 檔案清理（同日）

- **刪除 9 檔**：`daemon.py`、5 個過期 SQL、`P0_API契約` 根目錄副本、`test_run.cjs`、`project.pen.bak`
- **移動 2 檔**至 `docs/archived/`：`update_apostate_schema.sql`、`update_liquidator_schema.sql`

#### 路由統計

- 修復前：78 routes（含 3 壞掉 + 4 重複）
- 修復後：74 routes（全部使用 Supabase，零 Prisma 活躍呼叫）

---

## 4. 遊戲核心業務邏輯 (Game Design & Business Rules)
這部分為企劃鐵律，開發功能時必須遵守：
- **天平機制**：天平只被「貨幣」影響，`balance_value` 只能透過特定 API 修改，任何其他行為不得直接改動天平。
- **背道者設計**：背道者（Apostate）的遊戲樂趣在於暗中爭鬥，其行動不可留下明確公開痕跡，此身分不可變更。
- **帳號建立與登入流程**：
  - 玩家無法自行註冊，由管理員預先建檔。
  - 首次登入預設密碼為 `0000`。
  - 系統偵測到密碼為 `0000` 時，必須強制攔截並導向「設定新密碼」流程，不可直接放行進入遊戲。
- **NPC 移動與行為規則**：
  - **移動型（人販子 trafficker）**：位置跟隨 `current_landmark_id`，每章移動點數 10 點，只能走開放據點。
  - **固定型（黑心商人、道具商人、旅店老闆、寵物商人）**：位置固定，具備開關店 (`is_shop_open`) 狀態。
- **名詞統一**：遊戲內的錢一律顯示為「貨幣」，但資料庫欄位名稱維持 `coins` 不可變動。

---

## 修復紀錄 (2026-08-03) — P5 章節轉場系統

### 新增檔案

| 檔案 | 用途 |
|------|------|
| `src/components/BreathingSceneModal.tsx` | 30 秒全螢幕前呼吸場景（進度條 + 跳過） |
| `src/components/ChapterOpeningModal.tsx` | 章節標題卡（開場白 + 背景圖預留） |
| `src/components/MajorChapterModal.tsx` | 可捲動大章節長篇敘事彈窗 |

### 修改檔案

| 檔案 | 變更 |
|------|------|
| `src/data/landmark-chapters.json` | 新增 `breathing_scenes[]`（10 筆）、`chapter_openings[]`（16 筆，含完整開場敘事） |
| `server/index.ts` | 新增 `POST /api/chapter/advance`、`GET /api/chapter/current`、node-cron 週日 20:00 排程 |
| `src/api/client.ts` | 新增 `chapter.getCurrent()` / `chapter.advance()` |
| `src/components/MapTestView.tsx` | 整合三個 Modal + Supabase Realtime 監聽 `current_chapter` 變更 + 結算後自動觸發轉場 |
| `supabase_schema.sql` | Wave 7：`global_stats` 新增 4 欄位 + `chapter_settlements` 表 |

### 轉場流程

```
週日 20:00 cron → 天平結算 → global_stats.current_chapter++ 
→ Supabase Realtime 推播 → 前端接收
→ BreathingSceneModal（30s）→ ChapterOpeningModal → MajorChapterModal
```

### 章節推進 API

```
POST /api/chapter/advance  — 需 ADMIN_PASSWORD，手動推進
GET  /api/chapter/current   — 回傳 current_chapter + last_settlement
```

### DB 變更（supabase_schema.sql Wave 7）

```sql
-- global_stats 新增欄位
ALTER TABLE global_stats
  ADD COLUMN IF NOT EXISTS current_chapter INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_settlement_balance INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_settlement_winner TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_settlement_at TIMESTAMPTZ DEFAULT NULL;

-- 新表
CREATE TABLE chapter_settlements (
  chapter_version TEXT, balance_value INTEGER, winning_faction TEXT, settled_at TIMESTAMPTZ
);
```

### 新增依賴

- `node-cron` + `@types/node-cron`（server 端排程）

---

## Cocos 相容性修補 (2026-08-03) — P5 章節轉場 Cocos 化

### 新增 Cocos 腳本

| 檔案 | 用途 |
|------|------|
| `assets/scripts/BreathingSceneController.ts` | 呼吸場景控制器（`update(dt)` 驅動進度、`tween` 淡入淡出、`UIOpacity` 動畫） |
| `assets/scripts/ChapterOpeningController.ts` | 章節開幕標題卡（`tween` 滑入動畫、`assetManager.loadRemote` 背景圖、`applyFactionMaterial`） |

### 修改 Cocos 腳本

| 檔案 | 變更 |
|------|------|
| `assets/scripts/ChapterStoryModal.ts` | 補上 `turbidMaterial` / `pureMaterial` `@property` 插座 + `applyFactionMaterial` 呼叫 |
| `assets/scripts/MainGameController.ts` | 新增 `breathingSceneCtrl` / `chapterOpeningCtrl` 插座、三段式連鎖流程、`resources.load` 載入 JSON |

### 資料路徑

| 來源 | Cocos 路徑 |
|------|-----------|
| `src/data/landmark-chapters.json` | 複製到 `assets/resources/data/landmark-chapters.json`，用 `resources.load('data/landmark-chapters', JsonAsset)` 載入 |

### Cocos 三段式連鎖流程

```
_triggerChapterTransition()
  → BreathingSceneController.show()   [30s 氛圍過場]
    → emit 'breathing-complete'
      → ChapterOpeningController.show()  [章節標題卡]
        → emit 'opening-continue'
          → ChapterStoryModal.init()     [打字機敘事]
            → emit 'close-modal'
              → _loadNewChapter()
```

### 所有視覺組件 Material 接口狀態

| 組件 | `turbidMaterial` | `pureMaterial` | 狀態 |
|------|-----------------|---------------|------|
| MapLandmark | ✅ | ✅ | 已有 |
| WhiteCrowCard | ✅ | ✅ | 已有 |
| LoginController | ✅ | ✅ | 已有 |
| ChapterStoryModal | ✅ | ✅ | 本次新增 |
| BreathingSceneController | ✅ | ✅ | 本次新增 |
| ChapterOpeningController | ✅ | ✅ | 已有 |
| BalanceSettlementModal | ✅ | ✅ | Phase 4 新增 |
| LeaderboardPanel | ✅ | ✅ | Phase 4 新增 |
| LeaderTyrannyPanel | ✅ | ✅ | Phase 4 新增 |
| ApostatePanel | ✅ | ✅ | 已有 |
| LiquidatorPanel | ✅ | ✅ | 已有 |
| LandmarkStoryModal | ✅ | ✅ | 已有 |
| KidnapPopup | ✅ | ✅ | 已有 |
| QuestPanel | ✅ | ✅ | 已有 |
| CollectionPanel | ✅ | ✅ | 已有 |
| SettingsPanel | ✅ | ✅ | 已有 |
| NotificationPanel | ✅ | ✅ | 已有 |

### Inspector 綁定指南

**BreathingSceneController 節點**：
1. 在場景建立全螢幕遮罩節點
2. 掛上 `BreathingSceneController` 腳本
3. Inspector 綁定：`titleLabel` → Label 節點、`textLabel` → Label 節點、`skipButton` → 按鈕節點、`progressBar` → Filled Sprite（Type=Filled）、`backgroundSprite` → 背景 Sprite
4. 將節點拖入 MainGameController 的 `breathingSceneCtrl` 插座

**ChapterOpeningController 節點**：
1. 建立全螢幕標題卡節點
2. 掛上 `ChapterOpeningController` 腳本
3. Inspector 綁定：`chapterSubtitle` → "Chapter N" Label、`chapterTitleLabel` → 標題 Label、`openingTextLabel` → 開幕文字 Label、`continueButton` → 按鈕節點、`backgroundSprite` → 背景 Sprite、`dividerSprite` → 分隔線 Sprite
4. 將節點拖入 MainGameController 的 `chapterOpeningCtrl` 插座

---

## Cocos 面板開關慣例（hide() 冪等規範）

所有獨立面板的 `hide()` 方法遵守統一慣例：

```typescript
hide() {
    if (!this.node.active) return;           // 冪等守衛：已關閉就跳過
    // 或使用 if (!this._isVisible) return;  （部分面板使用內部旗標）
    tween(this.node.getComponent(UIOpacity)!)
        .to(0.25, { opacity: 0 })
        .call(() => {
            this.node.active = false;
            this.node.emit('panel-closed');   // 統一事件名稱
        })
        .start();
}
```

**重要規則**：
- `MainGameController._closeAllPanels()` 呼叫各面板的 `hide()`（而非直接 `node.active = false`），避免截斷 tween 動畫
- 10 個面板走 `hide()`：QuestPanel、CollectionPanel、SettingsPanel、NotificationPanel、LandmarkStoryModal、ApostatePanel、LiquidatorPanel、BalanceSettlementModal、LeaderboardPanel、LeaderTyrannyPanel
- 3 個元件直接 `node.active = false`：whiteCrowCard、inventoryPanel、npcModal
- KidnapPopup 不可手動關閉（倒數結束後自動消失），不納入 `_closeAllPanels()`

---

## MapLandmark 資料存取

`MapLandmark` 元件的 `_data` 為私有屬性，存取需透過公開 getter：

```typescript
// MapLandmark.ts
get landmarkData(): LandmarkData | null {
    return this._data;
}
```

使用方式（MainGameController / MapController）：
```typescript
const data = landmark.landmarkData;
if (data) {
    // 安全存取 data.id, data.name, data.faction, data.status
}
```

> ⚠️ **禁止** 使用 `(landmark as any)['_data']` 或直接存取 `landmark.id`（那是 Component 的 Node name，不是 LandmarkData）

---

## PlayerData 介面更新

```typescript
interface PlayerData {
    ocName: string;
    faction: 'Turbid' | 'Pure';
    coins: number;
    hp: number;
    maxHp: number;
    role?: 'admin' | 'gm' | 'player';   // 新增：用於 LeaderboardPanel 權限檢查
    chapter?: number;                     // 新增：當前章節，用於 BalanceSettlementModal
}
```

`LoginResponse` 同步新增 `role?` 和 `chapter?` 欄位，`LoginController._initPlayer()` 負責傳遞。

---

## 修復紀錄 — Phase 4 面板建設 + 雙輪審計（12 項修復）

### 新增 Cocos 腳本

| 檔案 | 用途 | @property 數量 |
|------|------|---------------|
| `BalanceSettlementModal.ts` | 章結天平結算動畫（5 階段 tween） | 16 |
| `LeaderboardPanel.ts` | 排行榜面板（僅 admin/gm 可見） | 14 |
| `LeaderTyrannyPanel.ts` | 領主/教皇惡政面板（5 類政令） | ~30 |

### 修改 Cocos 腳本

| 檔案 | 變更摘要 |
|------|---------|
| `MainGameController.ts` | 新增 3 面板 @property + import；`_closeAllPanels()` 重構為呼叫 `hide()`（10 面板）；`_onLandmarkSelected` 改用 `landmarkData` getter |
| `PTD_DataManager.ts` | `PlayerData` + `LoginResponse` 新增 `role?`、`chapter?` 欄位 |
| `LoginController.ts` | `_initPlayer()` 傳遞 role/chapter；4 處 EditBox `.string.trim()` → `.string?.trim()` |
| `MapLandmark.ts` | 新增 `get landmarkData()` 公開 getter |
| `MapController.ts` | `(l as any)['_data']` → `l.landmarkData` + 型別守衛 |

### 審計修復明細

| # | 嚴重度 | 問題 | 修復 |
|---|--------|------|------|
| 1 | 🔴 CRITICAL | `PlayerData` 缺少 `role`/`chapter` 欄位 | 新增欄位至 PlayerData + LoginResponse + LoginController |
| 2 | 🔴 CRITICAL | `_closeAllPanels()` 直接 `node.active=false` 截斷 tween | 改為呼叫各面板 `hide()` |
| 3 | 🔴 CRITICAL | BalanceSettlementModal `scheduleOnce` 關閉後仍觸發 | `hide()` + `onDestroy()` 加 `unscheduleAllCallbacks()` |
| 4 | 🔴 CRITICAL | `_onLandmarkSelected` 存取 Component 屬性而非 LandmarkData | 改用 `landmark.landmarkData` getter |
| 5 | 🟡 MEDIUM | EditBox `.string.trim()` 可能 undefined | 改為 `.string?.trim()` |
| 6 | 🟡 MEDIUM | MapController/MainGameController 使用 `as any` | 改用 `landmarkData` getter |
| 7 | 🟡 MEDIUM | BalanceSettlementModal `eulerAngles` 為 `as any` | 改用 `new Vec3(0,0,angle)` |
| 8 | 🟡 MEDIUM | BalanceSettlementModal 事件名 `'modal-closed'` 不一致 | 統一為 `'panel-closed'` |
| 9 | 🟢 LOW | LeaderboardPanel `hide()` 缺冪等守衛 | 加 `if (!this.node.active) return;` |
| 10 | 🟢 LOW | LeaderTyrannyPanel `hide()` 缺冪等守衛 | 加 `if (!this.node.active) return;` |
| 11 | 🟢 LOW | BalanceSettlementModal `hide()` 缺冪等守衛 | 加 `if (!this.node.active) return;` |
| 12 | 🟢 LOW | BalanceSettlementModal `onDestroy()` 未清排程 | 加 `unscheduleAllCallbacks()` |

### 新增文件

| 檔案 | 用途 |
|------|------|
| `COCOS_SETUP_GUIDE.md`（在 `E:\PTD-COCOS\`）| 從零開始套用 Cocos 環境的引導手冊 |

---

## 修復紀錄 — Cocos 預覽階段 onDestroy 崩潰 + 場景綁定 + 色塊佔位模式

### Bug 1–3：onDestroy 崩潰（23 檔、50+ 處修復）

詳見 `docs/COCOS_ONDESTROY_RULES.md`。

### Bug 4：登入按鈕未連線

| 項目 | 說明 |
|------|------|
| 現象 | 點擊登入按鈕無反應 |
| 原因 | `LoginController.ts` 的按鈕事件依賴 Inspector `clickEvents`，但 `LoginSceneBuilder` 未設定 |
| 修復 | 新增 `_registerButtonEvents()` 在 `onLoad()` 中程式化綁定 `loginBtn` → `onLoginPressed`、`confirmResetBtn` → `onConfirmResetPressed` |

### Bug 5：mapController 未綁定（登入成功後空白）

| 項目 | 說明 |
|------|------|
| 現象 | Console 顯示 `[MainGameController] mapController 未綁定`，畫面全黑 |
| 原因 | `MapSceneBuilder.onLoad()` 只建立容器節點，未加入 Component 腳本也未綁定 `MainGameController` 的 `@property` 插座 |
| 修復 | 新增 `_addComponentsAndBind()` 方法，為 20+ 節點加上對應 Component，全部綁定到 `MainGameController`；`MainGameController` 的初始化從 `onLoad()` 移至 `start()`（等 MapSceneBuilder 綁定完成） |

### Bug 6：地圖空白（無 Prefab 的據點顯示）

| 項目 | 說明 |
|------|------|
| 現象 | 登入成功後地圖區域全黑，無據點 |
| 原因 | `MapController` 要求 `landmarkPrefab`（Prefab）才能生成據點，但 Prefab 無法程式化建立；`mapRoot` 為 null；JSON 資料缺少 x/y 座標 |
| 修復（3 檔案） | 見下方 |

**MapController.ts**：
- 新增 `_createPlaceholderLandmark()`：無 Prefab 時建立 `UITransform(60×60)` + `Sprite`（藍色）+ `Label`（白字名稱）佔位節點
- `_spawnLandmarks()` 改為 Prefab/色塊雙模式，自動排列成 4×N 網格
- 色塊模式下自動綁定 `MapLandmark.baseSprite` 和 `nameLabel`

**MapLandmark.ts**：`LandmarkData.x`/`y` 改為可選欄位

**MapSceneBuilder.ts**：`_buildMapArea()` 新增深灰藍底色 + 設定 `mc.mapRoot = mapNode`

### Bug 7：InventoryPanel gridContainer 未綁定

| 項目 | 說明 |
|------|------|
| 現象 | Console 黃警告 `[InventoryPanel] gridContainer 未綁定` |
| 原因 | MapSceneBuilder 建立 InventoryPanelNode 時未建立 gridContainer 子節點 |
| 修復 | MapSceneBuilder 新增 GridContainer 節點（`Layout.Type.GRID, constraintNum=5`）；InventoryPanel 新增 `_createPlaceholderSlot()` 色塊佔位 |

### 色塊佔位模式設計原則

所有需要 Prefab 或美術資源的元件，都支援「無資源時用程式碼建色塊佔位」模式：

| 元件 | Prefab 名稱 | 佔位色 | 佔位尺寸 |
|------|------------|--------|---------|
| MapController | `landmarkPrefab` | 藍 `(70,130,230)` / 灰 `(120,120,120)` | 60×60 |
| InventoryPanel | `itemSlotPrefab` | 紫 `(90,80,120)` | 72×72 |
| 地圖底色 | — | 深灰藍 `(30,35,50)` | 全螢幕 |

> 後續美術資源到位後，在 Inspector 拖入 Prefab / Material 即可啟用，無需再動程式碼。

### 場景生命週期順序（重要）

```
所有 onLoad() → 所有 start()

MapSceneBuilder.onLoad()
  ├─ 建立節點樹（MapArea, HUD, PanelLayer, OverlayLayer 等）
  ├─ _bindHUDSlots()        → HUDController 綁定完成
  └─ _addComponentsAndBind() → 所有 Component 綁定完成

MainGameController.start()
  ├─ _registerEvents()       → 事件綁定（此時所有插座已可用）
  ├─ 登入守衛檢查
  ├─ _loadInventory()        → InventoryPanel.init()
  └─ _initGameState()        → 載入伺服器狀態
```

### LandmarkData 介面更新

```typescript
export interface LandmarkData {
    id: string;
    name: string;
    x?: number;          // 可選，缺少時自動排列
    y?: number;
    faction: FactionType | 'Common';
    status: 'open' | 'closed';
    type?: LandmarkType;
    occupants?: number;
    capacity?: number;
}
```