# Claude Code 快查筆記 — Project Turbid Dust (Cocos Creator 版)

> 將此檔案放在專案根目錄命名為 `CLAUDE.md`，Claude Code 會自動讀取作為專案上下文。

---

## 專案基本資訊

- **引擎**: Cocos Creator 3.x（TypeScript）
- **專案路徑**: `c:\Users\user\Desktop\委託網頁\Project_Turbid_Dust\`
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

AnnouncementPanel、QuestPanel、DailyPanel、CollectionPanel、SettingsPanel、InventoryPanel、NPCPanel、LeaderTyrannyPanel — 均使用 WhiteCrowCard Prefab，已套 faction 切換邏輯。

---

## 地圖系統（MapTestView.scene）

### 據點（Landmarks）

```typescript
interface LandmarkData {
    id: string;      // 格式：l{章節}_{陣營}{序號}，例：l1_t01、l1_p02
    name: string;
    x: number;       // 地圖節點本地座標
    y: number;
    faction: 'Turbid' | 'Pure';
    status: 'open' | 'closed';
    occupants: number;
    capacity: number;
    type: string;
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

## 🔴 死命令（Claude Code 必須嚴格遵守）

### 1｜防燃燒 Token 鐵律
- **禁止主動掃描整個資料夾。** 不確定目標檔案位置時，先問使用者，確認後再單一檔案逐一處理。
- 每次只讀取、修改任務直接相關的檔案，不旁及其他。
- 需要了解模組關係時，優先讀 `CLAUDE.md`，其次讀單一腳本頂部的 `import`，而不是遞迴展開整個 `src/`。

### 2｜絕對禁止 Web 語法輸出
生成或修改任何 `.ts` / Prefab 腳本時，**嚴禁出現下列任何內容**：

| 禁止項目 | 正確替代 |
|---------|---------|
| HTML 標籤（`<div>`, `<span>`, `<button>` 等） | Cocos `Node` + `UITransform` |
| CSS class 字串（`className="..."`, Tailwind） | `node.color` / `Widget` 元件屬性 |
| React Hooks（`useState`, `useEffect`, `useRef`） | `@property` + `onLoad` / `start` / `update` |
| Framer Motion（`motion.div`, `animate`, `exit`） | `tween()` / `cc.Tween` |
| `style={{ }}` inline CSS | `Label.color` / `Sprite.color` / `node.setPosition()` |

違反以上任一項視為輸出錯誤，需立即自我更正。

### 3｜Shader / Material 預留接口規範
所有視覺元件（WhiteCrowCard、CharacterCard、MapLandmark 等）建立時，**必須預留 Material 切換接口**，以利後續套用濁息視覺效果（裂紋皮膚、黑霧、粒子噪波等）。

```typescript
// ✅ 每個有視覺輸出的 Component 都加上這段
@property(Material)
turbidMaterial: Material = null;   // 濁息狀態覆蓋材質（可為 null）

@property(Material)
pureMaterial: Material = null;     // 淨塵狀態覆蓋材質（可為 null）

applyFactionMaterial(faction: 'Turbid' | 'Pure') {
    const mat = faction === 'Turbid' ? this.turbidMaterial : this.pureMaterial;
    if (mat) {
        this.getComponent(Sprite)?.customMaterial = mat;
    }
    // Shader Uniform 預留點（後續填入）
    // mat?.setProperty('u_crackIntensity', 0.0);
    // mat?.setProperty('u_fogDensity', 0.0);
}
```

- 尚未製作美術資源時，`turbidMaterial` / `pureMaterial` 保持 `null`，程式走預設路徑，不影響現有功能。
- 後續設計師提供 `.mtl` 後，直接在 Inspector 拖入即可啟用，無需再動程式邏輯。

---

## 節省 Token 的說話方式

**好的提問（快）:**
> 「修改 `WhiteCrowCard.ts` 的 Turbid 主題，把 `cardBg` 換成載入 `turbid_bg` SpriteFrame」

**容易浪費 Token 的提問（慢）:**
> 「幫我改一下深色那個視窗的背景」（需要先找 Prefab 再定位腳本）

**貼截圖** 比描述更快——直接貼截圖讓 Claude 看到問題在哪。


# 專案開發最高指導原則 (Project Integrity Rules)

## 1. 架構紀律 (MVC Strict Enforcement)
- **絕對禁止**在 UI 層 (如 `HUDController`、`ChapterStoryModal`) 或 控制層 (`MainGameController`) 裡面直接寫 `fetch` 呼叫 Supabase API。
- 所有的資料庫請求、資料結構定義 (`interface`)，都必須集中在 `PTD_DataManager.ts` 中處理。
- UI 組件只能透過 `DataManager.get...` 或事件監聽來更新畫面。

## 2. Cocos Creator 3.x 開發規範
- 不得使用過時的 Cocos 2.x 語法。完全支援且鼓勵使用 `async/await`。
- 載入遠端圖片必須使用 `assetManager.loadRemote<ImageAsset>` 並轉換為 `SpriteFrame`。
- 事件綁定後，必須在 `onDestroy()` 中使用 `targetOff()` 確實解除綁定，禁止造成 Memory Leak。
- 必須使用型別安全的 `getComponent(ClassName)`，禁止使用字串 `getComponent('ClassName')`。

## 3. 誠實驗證原則 (No Fake Validation)
- 不得捏造自動化測試的結果。
- 只要修改或新增功能邏輯，請提供「Cocos 編輯器內的具體手動驗證步驟」，包含：
  1. 該把這個腳本掛在哪個節點上？
  2. Inspector 面板需要綁定哪些東西？
  3. 預期的 Console Log 輸出是什麼？
  4. 畫面上應該看到什麼變化？
- 若遇到程式碼錯誤，必須誠實指出錯誤行號與原因，禁止偷偷把原本寫好的其他功能刪除或覆蓋。

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