# Cocos Preview 偵錯交接文件

> 建立日期：2026-04-04  
> 專案路徑：`E:\Game_Dev_Main\Project_Turbid_Dust`  
> 引擎版本：Cocos Creator 3.8.2  
> 設計解析度：1280×720

---

## 一、目前完成的修復清單

### Bug 10：MapTestView 藍色三角形（已定位根因並修復程式 ⚠️ 待持續整合）
- **最終現象**：登入後進入 MapTestView，只看到深藍色三角形，看不到 MapArea/HUD/黃字診斷訊息
- **最終根因**：`MapSceneBuilder` / `MapController` / `InventoryPanel` 程式化建立的 UI 節點沒有明確設到 `UI_2D` layer
- **關鍵判斷**：節點雖然已經掛在 Canvas 下面，但如果 layer 不對，Canvas Camera 仍可能完全不渲染
- **修復方式**：
   - 在 `MapSceneBuilder.ts` 對動態建立的 UI root 做遞迴 `UI_2D` layer 套用
   - 在 `MapController.ts` 對 landmark placeholder / prefab instance 套用 `UI_2D`
   - 在 `InventoryPanel.ts` 對 slot placeholder / prefab instance 套用 `UI_2D`
- **驗證結果**：畫面已出現 `=== MAP AREA OK ===`，代表 MapArea 與 HUD 的渲染鏈路已恢復

### Bug 11：導航按鈕可見但面板/彈窗不完整（已大幅修復，待續收尾）
- **現象**：左側導航與 HUD 已可見，但按鈕對應的彈窗內容原本多數沒有可見回饋
- **根因**：目前 `MapSceneBuilder` 只建立了各面板的「空節點殼層」，但多數面板元件仍依賴 Inspector 子節點插槽，例如：背景 Sprite、標題 Label、關閉按鈕、contentContainer、emptyLabel、slider 等
- **判斷**：這不是同一個渲染 layer 問題，而是 **Builder 尚未把 Panel 內部結構與屬性插槽一起建完**
- **本次已補**：
   - `MapSceneBuilder.ts` 已替 `inventory / itemDetail / npc / whiteCrow / notification / settings / quest / collection` 建立基礎 panel shell
   - 每個 shell 至少補了背景、標題、關閉鍵與基本內容容器/提示文字
   - `MainGameController.ts` 已改成開啟 `announcement / daily` 時呼叫 `WhiteCrowCard.init(...)`，不再只是單純 `active = true`
- **本次新增確認**：
   - `HUDController` 原本是在 runtime 插槽尚未綁好前就先執行 `onLoad()`
   - 結果 `navButtons` / `bellButtonNode` 當下仍是空的，`TOUCH_END` 事件沒有掛到真正的按鈕節點上
   - 已新增 `HUDController.refreshRuntimeBindings()`，並在 `MapSceneBuilder._bindHUDSlots()` 插槽綁定後主動呼叫
   - 左側導航後續又確認了一個更細的問題：**命中框若只綁在文字/原點附近，使用者會看到按鈕，但只能點到極小區域**
   - 最後修法不是單純放大字，而是：
     - 導航改為獨立 `TouchTarget`
     - `TouchTarget` 用 `Widget` 四邊貼齊父節點
     - 直接改走 `Button` / runtime click 綁定
   - 另一個關鍵是：`panelLayer` 打開後會遮住左側導航，因此 HUD / 左側導航 / 右側工具欄 必須提到 `panelLayer` 上方
- **目前狀態**：
   - 左側導航已能穩定開啟各面板
   - 主要面板已有可見 shell
   - backdrop 也能關閉多數面板
   - 剩餘工作改為右上角 HUD 排版與個別面板內容細節

### Bug 12：右上角 HUD 過窄堆疊（未解決，已做多輪嘗試）
- **現象**：貨幣欄位、玩家欄位、鈴鐺、齒輪過窄且彼此擠壓
- **修正方向**：
   - 放寬 `HUD_TopRight` 寬度與 spacing
   - `CoinsLabel / OcNameLabel` 改為較寬 pill button
   - `BellButton / SettingsBtn` 改用與左側導航相同的 touch target 邏輯
   - 齒輪按鈕直接開啟 `settings` 面板
   - HUD 整體再往右貼齊，減少視覺上「縮在中間」的感覺
- **目前實測結果**：使用者回報「右上角位置沒有任何變化」
- **已嘗試但尚未成功的方法**：
   - 放大 `HUD_TopRight` 寬度
   - 調整 `Widget.right`
   - 增加 HUD layout spacing
   - 將 `CoinsLabel / OcNameLabel` 改成較寬 pill button
   - `BellButton / SettingsBtn` 改走 `TouchTarget + Button click`
- **下一步不要再盲改 spacing**：
   - 直接檢查 `HUD_TopRight`、`CoinsLabel`、`OcNameLabel` 的最終 world position / UITransform size
   - 確認目前畫面上可見的文字是不是我們以為的那一批節點

### Bug 13：設定面板語言切換入口（部分完成，功能未完成）
- **需求**：在右上角齒輪打開的設定面板中新增「繁體 / 簡體」切換按鈕
- **本次已補**：
   - `SettingsPanel.ts` 已加入 `traditionalChineseButton / simplifiedChineseButton / languageValueLabel`
   - 使用 `sys.localStorage` 記錄目前語言
   - 會 emit `language-changed` 事件，供後續真正的文字切換流程接入
   - 語言按鈕已改成直立大按鈕，優先對應手機版可點擊性
- **目前實測結果**：
   - 使用者已可看到 `繁體中文 / 简体中文`
   - 按鈕看得到也可點
   - 但 `目前語言` 沒有發生可見變化
- **已嘗試但尚未成功的方法**：
   - `SettingsPanel.refreshRuntimeBindings()`
   - `SettingsPanel.selectTraditionalChinese()` / `selectSimplifiedChinese()` 公開方法
   - `MapSceneBuilder` 直接將語言按鈕強綁到上述公開方法
   - 改成 `Button click` 優先
   - builder 共用綁定升級為 `Button click + TOUCH_END` 雙路徑
- **目前最可能的剩餘問題**：
   - 事件其實沒有進到 `languageValueLabel` 對應的那個顯示節點
   - 或畫面上顯示的 `目前語言` 並不是目前 `panel.languageValueLabel` 引用的節點
   - 也可能是同一畫面上有重複文字節點，導致看起來「沒有更新」
- **下一步建議**：
   - 直接印出 `languageValueLabel.string`
   - 印出 `languageValueLabel.node.worldPosition`
   - 確認當前畫面中的顯示節點是否與引用一致

#### 2026-04-04 晚間同步（合作模式前置結論）
- **已確認的事**：
   - `SettingsPanel.ts` 的最新版腳本有成功進入 Preview（`[SettingsPanel LANG-V4]` 有出現）
   - `MapSceneBuilder.ts` 的視覺變更不一定穩定反映在使用者眼前那個設定面板上，因此不能再只靠 Builder 來判斷 UI 是否更新
   - `LanguageValueLabel` 這條深色框目前已經能正常顯示文字，代表「字串更新但完全不可見」這個分支已經大致排除
- **目前最新狀態**：
   - 深色框：有正常字
   - `✓` 選取標記：**沒有切換**
   - Console：有 `[SettingsPanel] 已切換語言` 類型 log
- **目前最像的根因**：
   - 事件有進來，但按鈕選取狀態沒有正確同步到畫面上
   - 因此目前優先查的是 **button state / active state 更新鏈**，而不是 compile、layer、字串顯示
- **這代表什麼**：
   - 問題已經從「看不到」收斂成「有切到邏輯，但視覺狀態沒跟上」
   - 下一輪排查不應再把重心放在 `LanguageValueLabel`，而應轉向 `TraditionalChineseButton / SimplifiedChineseButton` 的顯示狀態更新

### Bug 14：所有面板需具備一致的關閉模式（部分完成）
- **需求**：所有 UI 面板都要有右上角 `X`，且點擊空白區域可以關閉
- **本次已補**：
   - panel shell 的 `closeButton` 已統一改為右上角 `X`
   - backdrop 點擊關閉已加到多數主要面板
- **目前實測結果**：
   - `X` 最終已出現且功能正常
   - 但 backdrop 點擊關閉仍未正常工作
- **已嘗試但尚未成功的方法**：
   - backdrop 加 `Button`
   - builder 共用綁定改為 `Button click` 優先
   - builder 共用綁定升級為 `Button click + TOUCH_END`
- **目前最可能的剩餘問題**：
   - backdrop 並不是目前最外層正在吃 hit test 的節點
   - 或 panel body / 其他覆蓋節點仍在 backdrop 之上攔截空白區域事件
- **下一步建議**：
   - 直接檢查 backdrop 的 sibling / world rect / active 狀態
   - 確認空白區域實際命中的節點是不是 backdrop

### Bug 1–3：onDestroy 崩潰（已完成 ✅）
- **問題**：23 個腳本的 `onDestroy()` 使用 `?.` 保護已銷毀節點，但 Cocos 已銷毀節點 `?.` 無效
- **解法**：全部改用 `if (node?.isValid) node.off(...)` 保護
- **影響範圍**：23 個 Panel/Controller 檔案，50+ 處修改
- **文件**：`docs/COCOS_ONDESTROY_RULES.md`

### Bug 4：登入按鈕無反應（已完成 ✅）
- **問題**：`LoginController` 的 `loginBtn` 沒有綁定 click 事件
- **解法**：新增 `_registerButtonEvents()` 方法，在 `onLoad()` 中呼叫

### Bug 5：mapController 未綁定（已完成 ✅）
- **問題**：`MainGameController` 在 `onLoad()` 中註冊事件，此時 `MapSceneBuilder` 還沒建完
- **解法**：`MainGameController` 的初始化從 `onLoad()` 移到 `start()`

### Bug 6：地圖空白無地標（已完成 ✅）
- **問題**：`MapController` 需要 Prefab 和 mapRoot，但都是 null；JSON 資料缺少 x/y 座標
- **解法**：
  - 新增 `_createPlaceholderLandmark()` 色塊方法（藍色 60×60）
  - `LandmarkData.x/y` 改為 optional
  - 自動格狀排列（4 列，間距 200×160）

### Bug 7：InventoryPanel gridContainer 未綁定（已完成 ✅）
- **問題**：`InventoryPanel` 需要 `gridContainer` 節點
- **解法**：`MapSceneBuilder._addComponentsAndBind()` 動態建立 GridContainer 子節點

### Bug 8：主畫面 Sprite 不渲染（部分修復 ⚠️）
- **問題**：程式化 `addComponent(Sprite)` 的 `spriteFrame` 為 null，Cocos 不渲染
- **解法**：建立 `PTD_SpriteHelper.ts`，提供 `getWhiteSpriteFrame()` 快取白色 SpriteFrame
- **已套用**：MapSceneBuilder (6 處), MapController (1 處), InventoryPanel (1 處)
- **狀態**：程式碼已修改，但渲染仍不正確（見「當前問題」）

### Bug 9：節點建在 Canvas 上層（已修復但未驗證 ⚠️）
- **問題**：`MapSceneBuilder` 使用 `this.mainGameCtrl.node`（= GameRoot）作為父節點，但 GameRoot 不在 Canvas 下面，UI 攝影機看不到
- **解法**：改為 `const gameRoot = this.node;`（= Canvas 節點）
- **場景修改**：將 MainGameController 從 GameRoot 移到 Canvas 節點上

---

## 二、目前場景結構

### MapTestView.scene 節點樹
```
MapTestView (Scene)
├── Main Light
├── Main Camera (3D 攝影機，透視投影)
└── GameRoot (空容器節點，無元件)
    └── Canvas (位置 640,360 | UITransform 1280×720 | 錨點 0.5,0.5)
        ├── Camera (UI 攝影機，正交投影，orthoHeight=360)
        └── [以下由 MapSceneBuilder 動態建立]
            ├── MapArea (UITransform 1280×720 + Widget 全螢幕 + Graphics/Sprite + MapController)
            ├── HUD_TopRight (Widget 右上角)
            ├── LeftNavBar (Widget 左側垂直置中，7 個導航按鈕)
            ├── RightToolbar (Widget 右側垂直置中)
            ├── PanelLayer (面板容器，子節點預設隱藏)
            ├── TransitionLayer (轉場覆蓋層，子節點預設隱藏)
            └── OverlayLayer (最上層覆蓋，子節點預設隱藏)
```

### Canvas 上掛載的元件
| 元件 | 狀態 |
|------|------|
| cc.UITransform | 1280×720, anchor (0.5, 0.5) |
| cc.Canvas | alignCanvasWithScreen = ✅ |
| cc.Widget | 四邊對齊，edge = 0 |
| MapSceneBuilder | mainGameCtrl → Canvas (已連結) |
| MainGameController | 所有 @property 由 MapSceneBuilder 在 runtime 綁定 |

### 場景生命週期
```
MapSceneBuilder.onLoad()     → 建立所有 UI 節點
                             → _addComponentsAndBind() 綁定到 MainGameController
MainGameController.start()   → 檢查登入狀態
                             → 載入遊戲資料
                             → 啟動即時監聽
```

---

## 三、已確認問題總結（2026-04-04 更新）

### 問題 A：藍色三角形

**狀態**：已定位並完成程式修正

**最終原因**：
1. `MapArea`、HUD、導航欄等節點雖然在 Canvas 子樹下，但它們是用 `new Node()` 動態建立
2. 這些節點未明確設成 `UI_2D` layer
3. 結果是 UI Camera 沒有把它們渲染出來，畫面只剩 3D Camera 背景

**為什麼不是其他原因**：
| 假設 | 判斷 |
|------|------|
| `V3 沒被編譯` | ❌ 已排除。`MapSceneBuilder V3` 與 `MAP AREA OK` 已進入 preview/editor 產物 |
| `MapArea 沒建立` | ❌ 已排除。DIAG 與實際畫面已證明 MapArea 可見 |
| `Graphics` 寫法錯誤 | ❌ 不是主因。修正 layer 後畫面已正常顯示 |
| `Main Camera 衝突` | ⚠️ 仍可觀察，但不是這次主因 |

**最終判斷**：
- `Canvas 子樹下` 只是必要條件，不是充分條件
- **程式化 UI 節點必須同時確認 layer 正確**

### 問題 B：按鈕與彈窗不完整

**狀態**：已定位，且已補上第一版 placeholder UI

**最終原因**：
1. `HUDController` 與 `MainGameController` 的事件鏈大致存在
2. 但 `MapSceneBuilder` 目前只幫許多面板建立空節點並掛 Component
3. 各面板 Component 仍仰賴 Inspector 子節點插槽，例如：
   - `QuestPanel.contentContainer / emptyLabel / closeButton`
   - `CollectionPanel.tabButtons / countLabel / contentContainer`
   - `SettingsPanel.closeButton / bgmSlider / sfxSlider`
   - `NotificationPanel.panelRoot / contentContainer / emptyLabel`
   - `NPCModal.npcNameLabel / dialogueLabel / shopContainer / closeButtonNode`
4. 因此目前不是單純「按鈕沒事件」，而是 **彈窗本體原本多數只是空殼**
5. 本次已先補基礎 shell，剩下的是個別面板的精細內容與完整互動

**最終判斷**：
- 下一階段不是再查 Camera 或 layer
- 而是繼續把 Builder 往前推到「建立更完整的面板內部 UI + 綁屬性插槽」

### 問題 C：同類型 root cause 可能重複出現於「晚建立 helper 節點」

**狀態**：已確認這是本輪排查的重要方向

**關鍵觀察**：
1. 左側導航之所以後來穩定，是因為它在較早階段建立，後續整棵被 `_setUILayerRecursive(leftNav)` 掃過
2. 但 `X`、語言按鈕、panel 內 action/use 類按鈕，多數是後面才透過 helper 建立
3. 這些 helper 原本沒有主動補 `UI_2D layer`

**本輪已補的修正**：
- `_createPillButton()` 建立時即補 `node / TouchTarget / Label` 的 `UI_2D layer`
- `_createCircleButton()` 建立時即補 `node / TouchTarget / Label` 的 `UI_2D layer`
- `_createTextButton()` 建立時即補 `node` 的 `UI_2D layer`

**判斷**：
- 這和最初藍色三角形屬於**同一類型問題**，不是節點不存在，而是 runtime 晚建立節點未完整進入正確的 UI 條件
- 但這次只靠補 layer 還沒有完全收斂，表示剩下的問題不只 layer，還包含：
   - hit target 真正落在哪個節點
   - 畫面上顯示的文字節點是否就是目前引用的節點
   - sibling / layering 是否仍有覆蓋

## 四、歷史症狀紀錄：藍色三角形

### 症狀
- 登入場景正常顯示，可以登入
- 轉場到 MapTestView 後，畫面只顯示一個**深藍色三角形**
- Console 沒有紅色錯誤
- 之前 DIAG 診斷顯示所有節點位置/大小都正確

### 已排除的可能性
| 假設 | 排除原因 |
|------|---------|
| ❌ Script 沒掛上 | Console 有 `[MapSceneBuilder] 場景建構完成` |
| ❌ 節點位置錯誤 | DIAG 顯示 MapArea (640,360) 1280×720 正確 |
| ❌ SpriteFrame null | 已加 getWhiteSpriteFrame()，DIAG 確認 spriteFrame=true |
| ❌ 節點在 Canvas 外 | 已改為 `this.node`，DIAG 確認節點是 Canvas 的子節點 |
| ❌ MainGameCtrl 位置 | 已移到 Canvas 上，Inspector 確認 |
| ❌ 舊的 build 干擾 | `build/web-desktop/` 沒有 index.html |

### 🔴 最大疑點：程式碼可能沒有被重新編譯

**證據**：
1. 將 MapArea 從 `Sprite` 改為 `Graphics`（完全不同的渲染方式），三角形形狀不變
2. 加了黃色大字 `=== MAP AREA OK ===`，畫面上看不到
3. 加了 `console.error('=== MapSceneBuilder V3 已載入 ===')` 版本標記，未確認是否出現

**可能原因**（優先級排序）：

1. **TypeScript 編譯失敗**（最高可能性 ★★★）
   - Cocos 編輯器 Console 可能有紅色 TS 編譯錯誤
   - 如果整個 scripts 編譯失敗，Cocos 可能載入舊的 library 快取
   - **檢查方法**：看 Cocos 編輯器下方 Console 面板
   
2. **script meta 檔案過期**（中等可能性 ★★）
   - 某些 .ts.meta 檔的 UUID 可能跟 library 中的映射不匹配
   - **檢查方法**：刪除 library + temp 後觀察 Cocos 是否完成 reimport
   
3. **瀏覽器快取**（低可能性 ★）
   - 即使清除快取，Service Worker 或 disk cache 可能保留舊 JS
   - **檢查方法**：
     - Chrome DevTools → Application → Service Workers → Unregister all
     - 或使用無痕視窗測試

4. **Cocos 熱更新失敗**（低可能性 ★）
   - 編輯器的 File Watcher 可能沒偵測到外部修改
   - **檢查方法**：在 Cocos 編輯器中手動打開 MapSceneBuilder.ts，看內容是否最新

---

## 五、建議的下一步處理（按優先級）

### 步驟 0：先記住這次真正學到的規則
1. Cocos 的程式化 UI 除了 parent 必須在 Canvas 下，**layer 也必須正確**
2. Builder 若要取代編輯器場景，不只要建外層容器，**還要把 Component 需要的子節點插槽一起建好**
3. `有看到節點`、`有編譯出 JS`、`畫面能渲染` 是三件不同的事，不能混成同一個假設
4. `runtime addComponent` 的元件如果依賴後續插槽綁定，不能只靠 `onLoad()` 做事件註冊，插槽填完後還要再 refresh 一次
5. **看得到按鈕 ≠ 命中框正確**。若使用者只能點到文字縫或原點，代表 hit area 綁法錯了，不能只調字體大小
6. **面板層與 HUD 層級要先定清楚**。否則面板一打開就會把導航吃掉，造成「只能開不能切、不能關」的錯覺
7. **手機版優先考慮直立大按鈕與較寬間距**。桌機可用的橫向小按鈕，在手機上很容易變成「看得到但按不到」
8. **晚建立的 helper 節點要優先懷疑 layer / target / sibling 三件事**，不要只盯著字體大小或 spacing

### 步驟 1：確認程式碼是否有被編譯
1. 打開 Cocos Creator
2. 查看下方 **Console** 面板 — 有沒有紅色錯誤？
3. 按 **▶ 預覽**
4. 在瀏覽器按 F12 → Console
5. 搜尋 `V3` — 如果看到 `=== MapSceneBuilder V3 已載入 ===` 代表最新程式碼有跑

### 步驟 2：如果 V3 沒出現（編譯失敗）
1. 在 Cocos 編輯器 Console 找到錯誤訊息
2. 最可能是 `Graphics` import 有問題 — 可能需要改回 Sprite 方式
3. 或者某個 import 路徑有問題

### 步驟 3：如果 V3 有出現（編譯成功但渲染有問題）
1. 三角形問題可能是 Canvas Camera 和 Main Camera 的渲染衝突
2. 嘗試在編輯器中**刪除 Main Camera 節點**（按右鍵 → 刪除），只留 Canvas Camera
3. 或者嘗試修改 Main Camera 的 `Clear Flags` 為 `DONT_CLEAR`

### 步驟 4：如果以上都無效
考慮以下替代方案：
- **方案 A**：重新建立全新的 MapTestView 場景（在 Cocos 編輯器中新建場景，手動加入 Canvas + 元件）
- **方案 B**：參考 LoginScene 的做法 — LoginScene 有 3686 行，所有節點在編輯器裡手動建好，不用 Builder 動態產生
- **方案 C**：暫時放棄 MapSceneBuilder 的程式化方式，改在編輯器中手動建節點

---

## 六、已修改的檔案清單

### 本次 Session 新增的檔案
| 檔案 | 用途 |
|------|------|
| `assets/scripts/PTD_SpriteHelper.ts` | 提供 `getWhiteSpriteFrame()` 白色 SpriteFrame 快取 |
| `docs/COCOS_PREVIEW_DEBUG_HANDOFF.md` | 本文件 |

### 本次 Session 修改的檔案
| 檔案 | 修改內容 |
|------|---------|
| `MapSceneBuilder.ts` | `gameRoot = this.node`；import Graphics；MapArea 改用 Graphics；DIAG 診斷 log；V3 版本標記；所有 Sprite 加 spriteFrame；新增 `UI_2D` layer 遞迴套用；補主要面板 placeholder shell 與屬性綁定；HUD runtime 插槽完成後主動 refresh 綁定；左側導航改為 `TouchTarget + Widget` 命中框；HUD / 導航層級提到 panelLayer 上方；右上角 HUD 重排 |
| `MapController.ts` | import getWhiteSpriteFrame；placeholder landmark 加 spriteFrame；landmark / prefab instance 套用 `UI_2D` |
| `InventoryPanel.ts` | import getWhiteSpriteFrame；placeholder slot 加 spriteFrame；slot / prefab instance 套用 `UI_2D` |
| `MapLandmark.ts` | `LandmarkData.x/y` 改為 optional |
| `LoginController.ts` | `_registerButtonEvents()` 事件綁定 |
| `MainGameController.ts` | 初始化搬到 `start()`；onDestroy isValid guards；announcement/daily 改呼叫 `WhiteCrowCard.init(...)` |
| `HUDController.ts` | 資料刷新與事件註冊拆開；新增 `refreshRuntimeBindings()` 供 runtime 插槽綁定後重掛事件 |
| `SettingsPanel.ts` | 新增繁中/簡中切換按鈕、目前語言顯示與 localStorage 記錄 |

## 八、重啟後優先排查清單（避免重走已排除分支）

### 已解決，重啟後不用再從這裡開始
1. 左側導航命中框過小：已解決
2. 左側導航打開面板後被 panelLayer 吃掉：已解決
3. MapArea / HUD / 黃字不顯示：已解決
4. `X` 完全看不到：已解決

### 尚未解決，重啟後先查這 3 件
1. **`HUD_TopRight` 最終 world position / size 是否真的改了**
2. **`languageValueLabel` 是否真的是畫面上目前顯示的那個節點**
3. **空白區域實際命中的節點是不是 backdrop**

### 建議的第一輪診斷輸出
請先在對應節點加 log，直接印：
- `HUD_TopRight`、`CoinsLabel`、`OcNameLabel` 的 `worldPosition / UITransform size`
- `languageValueLabel.string`、`languageValueLabel.node.worldPosition`
- 設定面板 `Backdrop` 的 `active / worldPosition / size / sibling`

### 不建議再優先嘗試的盲修
以下這些本輪已做過，短期內不要再原地重複：
- 只改 HUD spacing
- 只改字體大小
- 只改成 `Button click`
- 只改成 `TOUCH_END`
- 只再補一次 `UI_2D layer` 而不檢查最終 target / sibling
| `assets/Scene/MapTestView.scene` | MainGameController 從 GameRoot 移到 Canvas；GameRoot 改名去掉前導空格 |
| 23 個 Panel/Controller 檔案 | onDestroy isValid guards |

---

## 七、DIAG 診斷資料（最後一次成功取得）

```
[DIAG] Canvas worldPos=(640, 360) size=(1280, 720) anchor=(0.5, 0.5)
[DIAG]   child "Camera" active=true worldPos=(640, 360) size=(?, ?)
[DIAG]   child "MapArea" active=true worldPos=(640, 360) size=(1280, 720)
[DIAG]   child "HUD_TopRight" active=true worldPos=(1048, 676) size=(400, 40)
[DIAG]   child "LeftNavBar" active=true worldPos=(44, 360) size=(64, 352)
[DIAG]   child "RightToolbar" active=true worldPos=(1232, 360) size=(48, 72)
[DIAG]   child "PanelLayer" active=true worldPos=(640, 360) size=(1280, 720)
[DIAG]   child "TransitionLayer" active=true worldPos=(640, 360) size=(1280, 720)
[DIAG]   child "OverlayLayer" active=true worldPos=(640, 360) size=(1280, 720)
[DIAG] MapArea sprite: spriteFrame=true, sizeMode=0, color=(30,35,50,255)
```

> 補充：修正後 DIAG 已額外加入 `layer=` 與 `graphics=`，之後請優先用它來驗證 UI_2D 與渲染鏈路。

---

## 九、2026 年 4 月新增修復記錄

### Bug 15：MapSceneBuilder `this.node` 指向錯誤（已完成 ✅）

| 項目 | 說明 |
|------|------|
| 現象 | 面板 shell 未建構（`PanelLayer 不存在`），UI_2D layer 未套用到正確節點 |
| 根因 | MapSceneBuilder 掛在 Canvas 的兄弟節點上（與 Canvas 同層在 Scene root 下），`this.node` 是 MapSceneBuilder 空節點，不是 Canvas |
| 影響範圍 | `onLoad()` 的 `gameRoot`、`_postValidateInspectorBindings()` 遍歷、`_ensurePanelShellsForInspectorPath()` 搜尋 PanelLayer、`start()` 診斷 |
| 錯誤寫法 | `const gameRoot = this.node;` 或 `this.node.parent ?? this.node` |
| 正確寫法 | `const gameRoot = ctrl.node;`（MainGameController 掛在 Canvas 上，`ctrl.node` 保證是 Canvas） |
| 關鍵教訓 | **永遠不要假設 `this.node` 就是你想操作的容器。如果腳本可能掛在任何節點上，應透過已知的引用（如 `ctrl.node`）找到目標容器** |

實際節點層級：
```
Scene Root               ← 無 UITransform
├── Canvas               ← ctrl.node（MainGameController 在此）
│   ├── Camera
│   ├── MapArea
│   ├── HUD_TopRight
│   ├── PanelLayer       ← 需要搜尋的目標
│   └── ...
└── MapSceneBuilder      ← this.node（Canvas 的兄弟！）
```

### Bug 16：面板 shell 存在但事件未綁定（已完成 ✅）

| 項目 | 說明 |
|------|------|
| 現象 | X 按鈕和 Backdrop 可見但點擊無反應，且只有 2 個面板顯示「自動補建」 |
| 根因 | `_ensurePanelShellsForInspectorPath` 中使用 `if (!node.getChildByName('Backdrop'))` 跳過已有 Backdrop 的面板。當面板在上次 Preview 或動態建構中已保留了 Backdrop 子節點（場景快取），本次 runtime 的 `_bindHideOnTap()` 就不會執行 |
| 錯誤寫法 | `if (!node.getChildByName('Backdrop')) { configureFn(node, panel); }` |
| 正確寫法 | 無條件執行 `configureFn(node, panel);`。`_ensurePanelShell()` 內部已有 `if (!xxx)` 防重建節點，而事件綁定（`_bindHideOnTap`）會先 `targetOff(this)` 清除舊綁定再重新註冊 |
| 關鍵教訓 | **「節點已存在」不等於「事件已綁定」。Cocos 場景快取保留了節點結構但不保留 runtime 事件。每次 onLoad 都必須重新綁定事件，即使 DOM 結構完整** |

### Bug 17：左側導覽重複的設定按鈕（進行中 🔄）

| 項目 | 說明 |
|------|------|
| 現象 | 左側導航第 7 個按鈕是「設定」，與右上角齒輪功能重複 |
| 修正 | 從 `HUDController.NAV_PANELS` 陣列移除 `'settings'`（7→6 項）。使用者需在編輯器中移除 LeftNavBar 下的第 7 個按鈕節點 |

### Bug 18：右上角齒輪「事件觸發但面板不顯示」（已完成 ✅）

| 項目 | 說明 |
|------|------|
| 現象 | 齒輪點擊後 Console 有 `齒輪 TOUCH_END → settings` + `settingsPanel=true`，但面板不出現 |
| 根因（層次 1 — 雙重觸發）| 在 SettingsBtn 的**所有子節點**上註冊 TOUCH_END → Label 和 TouchTarget 各觸發一次 → `togglePanel` 被呼叫兩次 → 開了又立刻關 |
| 根因（層次 2 — 空面板）| SettingsPanel 節點 `children=0`。`_ensurePanelShellsForInspectorPath` 用 `panelLayer.getChildByName()` 查找節點失敗（可能不是 PanelLayer 的直接子節點），shell 從未建構 |
| 根因（層次 3 — 階層誤判）| SettingsBtn 實際結構是 `SettingsBtn > TouchTarget > Label`（Label 在 TouchTarget **內部**），非先前假設的兄弟關係 |
| 修正 1 | HUDController：只在**最後一個子節點**（渲染最上層）註冊 TOUCH_END，避免雙重 toggle |
| 修正 2 | MapSceneBuilder：改用 `panel.node`（Inspector 綁定的實際節點引用）取代 `getChildByName()` 名稱查找 |
| 關鍵教訓 | **三層 bug 疊加**：事件重複 + 內容缺失 + 階層假設錯誤。單獨修任何一層都無法解決問題，必須系統性排查 |

### Bug 19：事件雙重觸發（togglePanel 互抵消）（已完成 ✅）

| 項目 | 說明 |
|------|------|
| 現象 | 點擊一個按鈕，Console 顯示同一 handler 執行了 2 次 |
| 根因 | 在同一觸控路徑上的多個節點（如父 + 子，或所有子節點）都註冊了相同 handler |
| 觸控路徑 | Touch 擊中 Label → bubbles 到 TouchTarget → bubbles 到 SettingsBtn。如果 Label 和 TouchTarget 都綁了 handler，各自觸發一次 |
| 修正 | 只在一個節點上註冊。選擇 `children[children.length - 1]`（渲染最頂層）|
| 防範規則 | **一個互動動作 = 只綁一個 handler。** 如需多節點接收同一觸控，使用 `event.propagationStopped = true` 防止重複 |

### Bug 20：`getChildByName` 查找面板節點失敗（已完成 ✅）

| 項目 | 說明 |
|------|------|
| 現象 | `panelLayer.getChildByName('SettingsPanelNode')` 返回 null，即使節點存在 |
| 根因 | `getChildByName` 只搜尋**直接子節點**。若目標節點不是 PanelLayer 的直接子節點（嵌套更深），就找不到 |
| 修正 | 改用 `panel.node`（Inspector 已綁定的直接引用），不再依賴名稱字串查找 |
| 防範規則 | **優先使用 Inspector 綁定的引用（`@property` → `component.node`），避免 `getChildByName` 的層級假設** |
| 與 Bug 15 關聯 | Bug 15 是 `this.node` 指向錯誤節點，Bug 20 是 `getChildByName` 假設了錯誤的父子關係。核心問題相同：**硬編碼的節點路徑假設容易在階層變動時失效** |

### Bug 21：節點階層假設錯誤（SettingsBtn 結構）（已完成 ✅）

| 項目 | 說明 |
|------|------|
| 假設 | SettingsBtn 有兩個並列子節點：Label（⚙）和 TouchTarget |
| 實際 | Label 是 TouchTarget 的**子節點**，不是兄弟：`SettingsBtn > TouchTarget > Label` |
| 影響 | 先前的 "兄弟節點擋觸控" 分析完全錯誤。觸控從 Label 冒泡到 TouchTarget → BlockInputEvents 阻斷進一步冒泡 → 事件不到達 SettingsBtn |
| 防範規則 | **修改事件邏輯前，必須先用截圖確認實際節點階層。不要依賴記憶或假設** |

---

## 十一、系統性邏輯模式（Bug Pattern Framework）

> 這些模式歸納自 Bug 15-21 的偵錯經驗，可作為後續排查的思考框架。

### 模式 A：節點引用失效（Bug 15, 20）
```
症狀：找不到節點 / 操作了錯誤的容器
根因：this.node 不是目標容器 / getChildByName 層級假設錯誤
排查：console.log 印出 node.name, node.parent?.name
修正：使用 Inspector 綁定的引用（ctrl.node, panel.node）代替硬編碼路徑
```

### 模式 B：事件消失（Bug 16, 18-Layer3）
```
症狀：節點可見但點擊無反應
根因：
  B1：場景快取保留節點但不保留事件 → 需每次 runtime 重新綁定
  B2：BlockInputEvents 阻斷冒泡 → handler 在錯誤層級
  B3：Button 元件搶先消費事件 → handler 未註冊在正確事件類型上
排查：console.log 確認 handler 是否執行；確認 BlockInputEvents 位置
修正：在實際接收觸控的節點上直接註冊；每次 runtime 重綁
```

### 模式 C：事件重複（Bug 19）
```
症狀：一次點擊觸發多次 handler / toggle 狀態互抵消
根因：同一觸控路徑上多個節點都註冊了 handler
排查：console.log 的重複次數；檢查 registerEvents 被呼叫幾次
修正：只在一個節點上綁定；使用 event.propagationStopped
```

### 模式 D：面板無內容（Bug 18-Layer2, 11）
```
症狀：show() 執行、node.active=true，但視覺上什麼都沒有
根因：面板節點 children=0，shell（Backdrop/PanelBG/BodyRoot）從未建構
排查：show() 中印出 children.length, size, position
修正：確保 configureFn 實際執行（檢查節點查找邏輯）
```

### 模式 E：階層假設錯誤（Bug 21）
```
症狀：基於節點關係的邏輯不按預期工作
根因：對節點父子/兄弟關係的假設與實際不符
排查：截圖 Inspector 階層樹；印出 node.children.map(c => c.name)
修正：先確認實際階層，再寫事件邏輯
```

### 偵錯優先順序 SOP
1. **先確認事件是否觸發**：handler 的 console.log 是否出現？出現幾次？
2. **再確認面板是否有內容**：children.length > 0？size > 0？
3. **再確認面板是否可見**：parent.active? position 在畫面內？opacity > 0？
4. **最後確認節點階層**：截圖 Inspector 樹狀結構，不要憑記憶

---

## 八、重要 Cocos 知識點（開發過程中學到的）

1. **onDestroy 中不能用 `?.` 保護已銷毀節點** — 必須用 `isValid`
2. **程式化建立的 Sprite 必須設定 `spriteFrame`** — 否則完全不渲染
3. **UI 節點必須在 Canvas 子樹下** — Canvas Camera 只渲染 Canvas 的子孫節點
4. **只在 Canvas 子樹下還不夠，程式化 UI 節點還要確認 `UI_2D` layer**
5. **Builder 只建立空節點殼層是不夠的，Component 需要的 Inspector 插槽也要一起建**
4. **`onLoad()` 建節點，`start()` 做初始化** — 確保依賴的節點已存在
5. **LoginScene 採用編輯器預建方式（3686 行）**，MapTestView 採用程式化建構（759 行）— 兩者策略不同
6. **Cocos 場景中的 script 類型用壓縮 UUID（如 `8775eXt5hhEs4yWSB+zo7Nf`）表示** — 不是腳本名稱

---

## 九、LoginScene vs MapTestView 比較

| 項目 | LoginScene | MapTestView |
|------|-----------|-------------|
| 場景行數 | 3686 行 | 759 行 |
| UI 建構方式 | 編輯器手動建節點 | 程式化 (MapSceneBuilder) |
| Sprite 來源 | 編輯器設定 spriteFrame | 程式碼 getWhiteSpriteFrame() |
| 自訂腳本數 | 1 (LoginController) | 2 (MapSceneBuilder + MainGameController) |
| 渲染狀態 | ✅ 正常 | ❌ 藍色三角形 |

**結論**：LoginScene 的編輯器建構方式穩定可靠。如果程式化建構持續有問題，可考慮改為編輯器建構。

---

## 十、合作模式（2026-04-04 起）

### 分工原則
- **使用者負責**：Cocos Editor 內的畫面確認、節點層級觀察、Inspector 拖綁、回報實際視覺結果
- **AI 負責**：TypeScript 邏輯修改、root cause 判斷、除錯方向收斂、共通規則整理

### 合作節奏
1. AI 每輪只給 1 到 3 個小的 Editor 任務
2. 使用者完成後，回報：畫面結果 / Console / 節點結果 / 卡住點
3. AI 依回報決定：改碼、追加一個小檢查，或直接收斂根因

### 為什麼要這樣做
- Cocos UI 問題常常同時牽涉：節點、層級、Inspector、runtime helper node、程式事件流
- 只靠 AI 猜畫面很慢，只靠使用者手動試錯也容易亂掉
- 最快的方式通常是：**使用者當眼睛，AI 當手術刀**

### 當前合作模式下的優先順序
1. 先收掉設定面板語言區塊
2. 再回頭整理 backdrop / BasePanel / PanelShell 等共通結構
