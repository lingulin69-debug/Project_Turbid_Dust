# Cocos 協作安裝與節點銜接超詳細手冊

> 適用對象：第一次進 Cocos Creator、希望照著做就能完成基本場景整理的人。
> 
> 目標：先把「現在能一次做完的固定項目」做完，再和 AI 一起排查真正的 bug。
> 
> 這份手冊故意寫得很細。你可以把它想成「照著做的闖關單」。

---

## 0. 先知道這份手冊在做什麼

這個專案現在不是純手工場景，也不是純程式自動生成。

它是 **混合模式**：

1. 有些東西適合你在 Cocos Editor 裡直接建立、直接拖綁。
2. 有些東西是 `MapSceneBuilder.ts` 在執行時才建立，這些東西不要硬接，不然很容易白做。

所以這份手冊會把工作分成兩類：

### A 類：你現在就能一次做完的
- 開專案
- 開場景
- 檢查 Canvas
- 掛腳本
- Inspector 拖綁
- 檢查節點名稱
- 把固定存在的 Node 補齊

### B 類：現在先不要亂做的
- runtime 才生成的面板內部子節點
- 不確定是不是 Builder 會重建的節點
- 單純靠感覺調位置、調 spacing、調字體大小

---

## 1. 這份手冊優先於哪些舊文件

如果你看到文件彼此有衝突，先以這個順序為準：

1. `docs/COCOS_COLLAB_SETUP_MANUAL.md` 這份手冊
2. `docs/COCOS_PREVIEW_DEBUG_HANDOFF.md`
3. `docs/COCOS_ONDESTROY_RULES.md`
4. `E:/PTD-COCOS/COCOS_PROGRESS.md`
5. `E:/PTD-COCOS/COCOS_SETUP_GUIDE.md`

### 為什麼這樣排

因為 `COCOS_SETUP_GUIDE.md` 和 `COCOS_PROGRESS.md` 偏向大方向文件，
但目前 debug 中的真實情況，以 handoff 文件與最新修補邏輯更準。

---

## 2. 你今天要先完成的總目標

你今天先不要急著修 bug。

你先把下面這 6 件事情做完：

1. 專案成功打開
2. `LoginScene` 可以打開
3. `MapTestView` 可以打開
4. `Canvas` 的基本設定正確
5. 固定腳本都掛在對的位置
6. Inspector 裡固定欄位都拖好

只要這 6 件完成，之後我們排查 bug 的效率會高很多。

---

## 3. 開始前要準備什麼

### 你需要準備

1. Cocos Creator 3.8.x
2. 專案路徑：`E:\Game_Dev_Main\Project_Turbid_Dust`
3. 願意慢慢照著做，不跳步

### 你現在不用準備

1. 美術素材
2. Prefab 全部完成
3. 所有面板都做漂亮
4. 所有 bug 都修好

---

## 3-A. Cocos 介面名稱中文對照表

這一段很重要。

因為 Cocos Creator 介面很多地方是英文，
如果你一看到英文名詞就卡住，後面每一步都會很痛苦。

你可以把下面這張表當成「翻譯字典」。

| 英文名稱 | 中文理解方式 | 這個東西是做什麼的 | 你今天會怎麼用到它 |
|---|---|---|---|
| `Hierarchy` | 層級管理器 | 看場景裡有哪些 Node，誰包住誰 | 用來找 `Canvas`、`GameRoot`、`SettingsPanelNode` |
| `Inspector` | 屬性檢視器 | 看目前選中的 Node 掛了哪些元件、有哪些欄位可以拖 | 用來掛腳本、拖 `Label`、拖 `Button` |
| `Assets` | 資源管理器 | 看場景、腳本、圖片、Prefab 放在哪裡 | 用來打開 `LoginScene`、`MapTestView` |
| `Scene` | 場景視圖 | 直接看到畫面上的東西長在哪裡 | 用來確認節點位置、大概長相 |
| `Console` | 主控台 / 訊息窗 | 顯示錯誤、警告、`console.log` | 用來確認有沒有進到程式邏輯 |
| `Preview` | 預覽 | 真正跑起來看畫面和互動 | 用來測按鈕、測面板、測語言切換 |
| `Node` | 節點 | 場景裡最基本的小盒子，所有東西都掛在 Node 上 | 你會一直新增、選取、命名 Node |
| `Component` | 元件 | 掛在 Node 上的功能模組 | 例如 `Button`、`Label`、`Sprite`、腳本 |
| `Canvas` | 畫布 | 所有 UI 要被畫出來的主要區域 | 沒有它或設錯，UI 會看不到 |
| `Camera` | 攝影機 | 決定畫面看到什麼 | UI Camera 不對，UI 可能完全不顯示 |
| `Widget` | 自動對齊元件 | 讓 UI 自動貼齊上下左右 | 用來讓 HUD 固定在右上角或左側 |
| `UITransform` | UI 尺寸元件 | 決定這個 UI 的寬高和命中範圍 | 按鈕能不能點，常常跟它有關 |

### 最簡單的理解法

1. `Hierarchy` 是「你去找東西的地方」
2. `Inspector` 是「你改東西的地方」
3. `Console` 是「你看有沒有出錯的地方」
4. `Preview` 是「你看它到底有沒有真的動起來的地方」

---

## 3-B. 常見元件中文對照與功能影響表

這張表是用來回答你剛剛問的另一個重點：

**「我新增這個項目，到底多了什麼功能？會影響哪裡？」**

| 元件 / 腳本名稱 | 中文理解方式 | 新增它會得到什麼功能 | 它會影響什麼 |
|---|---|---|---|
| `Label` | 文字元件 | 讓 Node 可以顯示字 | 沒有它，你看不到標題、按鈕字、提示字 |
| `Sprite` | 圖像 / 色塊元件 | 讓 Node 有背景、有色塊、有圖片 | 沒有它，按鈕或面板可能只有字、沒有底 |
| `Button` | 按鈕元件 | 讓 Node 能作為可點擊按鈕 | 沒有它，很多 `CLICK` 類事件不會正常工作 |
| `Slider` | 拉桿元件 | 讓使用者可以左右拖動數值 | 會影響音量、進度條類功能 |
| `UIOpacity` | 透明度元件 | 可以淡入淡出 | 會影響面板開啟 / 關閉動畫 |
| `Widget` | 自動貼齊元件 | 自動貼邊、對齊 | 會影響 HUD、工具列、面板位置 |
| `UITransform` | UI 大小元件 | 決定寬高和可點區域 | 會影響按鈕命中範圍與版面大小 |
| `Material` | 材質元件 | 讓 Sprite 可以套 Shader 視覺效果 | 會影響濁息 / 淨塵材質外觀 |
| `LoginController` | 登入控制腳本 | 管登入、改密、錯誤提示 | 影響能不能從登入進入主場景 |
| `MainGameController` | 主遊戲總控腳本 | 管面板開關、事件路由、章節流程 | 少了它，很多面板就算存在也不會正常打開 |
| `MapSceneBuilder` | 地圖場景建構腳本 | 幫你在執行時建立大量 UI 骨架 | 少了它，畫面可能會非常空 |
| `HUDController` | HUD 控制腳本 | 管右上角 HUD、左側導航、鈴鐺、設定入口 | 影響點按鈕會不會打開對應面板 |
| `SettingsPanel` | 設定面板腳本 | 管語言、音量、關閉動畫 | 影響設定面板是不是有互動 |
| `NotificationPanel` | 通知面板腳本 | 管通知清單顯示 | 影響鈴鐺打開後有沒有內容 |
| `QuestPanel` | 任務面板腳本 | 管任務內容顯示 | 影響左側任務按鈕打開的內容 |
| `CollectionPanel` | 圖鑑面板腳本 | 管圖鑑與統計 | 影響圖鑑按鈕打開的內容 |

### 你可以這樣記

1. `Label` 是字
2. `Sprite` 是底
3. `Button` 是能不能點
4. `UITransform` 是多大、多好點
5. `Widget` 是貼哪裡
6. `Controller / Panel` 腳本是「大腦」

---

## 4. 非常重要的 7 條規則

### 規則 1：不要在 `onDestroy()` 裡亂刪節點

如果你只是做 Editor 端節點整理，**不要因為看到 bug 就順手改腳本裡的 `onDestroy()`**。

這個專案在這裡已經踩過很多坑。

### 規則 2：不要改節點名字，除非手冊明確叫你改

很多程式是靠 `getChildByName()` 找節點。

只要名字不對，程式就會說「我有邏輯，但我找不到那個 Node」。

### 規則 3：不要盲調位置

如果畫面不對，不要先改 `x`、`y`、`spacing`、`字體大小`。

先看：

1. 節點是不是那個節點
2. 有沒有被別的節點蓋住
3. 事件是不是打到對的節點

### 規則 4：固定節點你可以接，runtime 節點先不要猜

能在 Editor 裡直接看到、直接拖的，才是你現在優先處理的。

### 規則 5：不要一邊做一邊自由發揮

你現在先照這份做。
如果哪一步不一樣，先記下來，再回來告訴我。

### 規則 6：每做完一大段就存檔

做完下面任何一段，就按一次儲存：

1. 建完節點
2. 掛完腳本
3. 拖完 Inspector

### 規則 7：只做手冊裡列出的項目

沒有列在這份手冊裡的「看起來順手可以改」的東西，先不要改。

---

## 5. 先判斷你現在是什麼模式

這一步很重要。

### 你先做這個動作

1. 打開 Cocos Creator
2. 打開專案 `Project_Turbid_Dust`
3. 在左邊資源管理器找到 `assets/Scene/`
4. 打開 `MapTestView`
5. 看左邊 Hierarchy

### 你要認得兩種模式

#### 模式 A：場景裡已經有很多固定節點

如果你看得到像下面這些東西：

- `Canvas`
- `GameRoot`
- `HUD_TopRight`
- `PanelLayer`
- `SettingsPanelNode`

這代表你現在可以做很多 Inspector 拖綁。

#### 模式 B：場景很空，很多東西只在 Preview 時出現

如果你只看得到：

- `Canvas`
- `Camera`
- 很少數節點

那代表很多 UI 還是 Builder 在 runtime 生的。

這種情況下你今天的工作重點就不是「內層 UI 美化」，而是「固定骨架和腳本位置」。

---

## 6. 先完成 LoginScene

這一段最簡單，先拿來熱身。

### Step 6-1：打開 LoginScene

1. 在左邊資源管理器找到 `assets/Scene/LoginScene`
2. 雙擊打開它

### Step 6-2：選到 Canvas

1. 在左邊 Hierarchy 點一下 `Canvas`
2. 看右邊 Inspector（屬性檢視器）

### Step 6-3：確認 Canvas 至少有這些東西

1. `UITransform`
2. `Canvas`
3. 如果你們目前用 Builder 方式，也要看到 `LoginSceneBuilder`

### Step 6-4：掛 LoginController

1. 選中 `Canvas`
2. 在 Inspector（屬性檢視器）最下面按 `新增元件`
3. 搜尋 `LoginController`
4. 點它

### 這一步新增了什麼功能

新增 `LoginController` 之後，你得到的是：

1. 登入按鈕的控制邏輯
2. 錯誤訊息顯示
3. 改密流程
4. 進入下一個場景的流程

### 這一步會影響什麼

1. 如果沒掛，登入畫面就算長得對，也可能完全不能按
2. 如果欄位沒拖好，按登入時可能報 null 或沒反應

### Step 6-5：拖 Inspector 欄位

請把下面欄位一個一個拖好：

1. `loginPanel` → 拖 `LoginPanel`
2. `resetPasswordPanel` → 拖 `ResetPasswordPanel`
3. `loadingOverlay` → 拖 `LoadingOverlay`
4. `ocNameInput` → 拖 `LoginPanel/OcNameInput` 的 `EditBox`
5. `passwordInput` → 拖 `LoginPanel/PasswordInput` 的 `EditBox`
6. `loginBtn` → 拖 `LoginPanel/LoginBtn` 的 `Button`
7. `loginErrorLabel` → 拖 `LoginPanel/ErrorLabel` 的 `Label`
8. `newPasswordInput` → 拖 `ResetPasswordPanel/NewPasswordInput` 的 `EditBox`
9. `confirmPasswordInput` → 拖 `ResetPasswordPanel/ConfirmPasswordInput` 的 `EditBox`
10. `confirmResetBtn` → 拖 `ResetPasswordPanel/ConfirmResetBtn` 的 `Button`
11. `resetErrorLabel` → 拖 `ResetPasswordPanel/ResetErrorLabel` 的 `Label`

### Step 6-6：這一段完成後要看到什麼

1. Inspector 裡不再出現空的欄位
2. `LoginController` 不再一堆 `None (Type)`

---

## 7. 再完成 MapTestView 的固定骨架

### Step 7-1：打開 MapTestView

1. 在左邊資源管理器找到 `assets/Scene/MapTestView`
2. 雙擊打開它

### Step 7-2：先只找這 4 個最重要的節點

你先不要看其他的。

你只先找：

1. `Canvas`
2. `GameRoot`
3. `Camera`
4. `Main Camera`

### Step 7-3：確認 Canvas 的基本設定

選中 `Canvas`，右邊 Inspector 檢查：

1. 有 `UITransform`
2. 有 `Canvas`
3. 設計解析度是 `1280 x 720`
4. 如果有 `Widget`，四邊對齊都正常
5. 有 `MapSceneBuilder`

### 這幾個項目各自影響什麼

1. `Canvas`
	- 作用：讓 UI 有地方被畫出來
	- 影響：沒有它，UI 常常直接看不到
2. `UITransform`
	- 作用：給 UI 大小
	- 影響：沒有它，尺寸和命中範圍會怪
3. `Widget`
	- 作用：自動貼邊
	- 影響：HUD、面板位置容易跑掉或不貼邊
4. `MapSceneBuilder`
	- 作用：runtime 建骨架
	- 影響：少了它，很多面板殼可能根本不會出現

### Step 7-4：確認 MainGameController 掛哪裡

這一步很重要。

因為舊文件有些地方寫在 `GameRoot`，
但目前 debug handoff 的新邏輯是：**Canvas 也可能是實際控制核心所在的位置**。

所以你要做的是：

1. 選 `Canvas`
2. 看 Inspector 有沒有 `MainGameController`
3. 再選 `GameRoot`
4. 看 Inspector 有沒有 `MainGameController`

### 記住判斷規則

1. 如果 `MainGameController` 已經掛在 `Canvas`，先不要把它移走。
2. 如果 `MainGameController` 只掛在 `GameRoot`，也先不要自行改位置。
3. 你先記錄實際情況，後面排查時告訴我。

也就是：**先觀察，不先亂搬。**

### MainGameController 的功能概念

你可以把 `MainGameController` 想成「總開關」。

它會影響：

1. 面板打開或關閉
2. 章節事件
3. 地圖 / NPC / 道具等資料路由

所以它掛錯地方，常常會出現這種情況：

1. 按鈕有亮
2. Console 有些 log
3. 但整體流程還是怪怪的

---

## 8. 你今天一定要補齊的固定腳本

在 `MapTestView` 裡，先把「有固定掛點」的腳本確認好。

### 最少要確認這些

1. `MapSceneBuilder`
2. `MainGameController`
3. `HUDController`
4. `MapController`
5. `SettingsPanel`
6. `NotificationPanel`
7. `QuestPanel`
8. `CollectionPanel`

### 為什麼是這 8 個

因為這 8 個不是裝飾，而是最常影響你目前遇到問題的骨架：

1. `MapSceneBuilder` 決定很多東西有沒有被建立
2. `MainGameController` 決定事件會不會流到對的面板
3. `HUDController` 決定入口按鈕能不能開
4. `SettingsPanel` 決定語言切換那塊有沒有真正更新

### 你怎麼確認

做法都是一樣：

1. 點左邊 Hierarchy 裡那個 Node
2. 看右邊 Inspector
3. 確認對應腳本有沒有掛上去

### 如果沒有掛上去怎麼辦

1. 選中那個 Node
2. 點 `新增元件`
3. 搜尋對應腳本名稱
4. 點它加入

---

## 9. 你今天一定要補齊的 Inspector 拖綁

這一段最花時間，但最值得做。

### 9-1. MainGameController

請對照下面這些欄位，一個一個拖：

1. `mapController`
2. `hudController`
3. `inventoryPanel`
4. `npcModal`
5. `whiteCrowCard`
6. `notificationPanel`
7. `settingsPanel`
8. `questPanel`
9. `collectionPanel`
10. `landmarkStoryModal`
11. `apostatePanel`
12. `liquidatorPanel`
13. `kidnapPopup`
14. `balanceSettlementModal`
15. `leaderboardPanel`
16. `leaderTyrannyPanel`

如果這些節點在場景裡已經存在，就拖。
如果場景裡根本沒有，先記下來，不要硬造一個假的。

### 這些欄位拖好後會發生什麼

1. `mapController` 拖好後
	- 地圖相關事件比較有機會正常路由
2. `hudController` 拖好後
	- 左側導航、鈴鐺、設定按鈕才比較能控制主流程
3. `settingsPanel` 拖好後
	- 右上角齒輪才有明確的目標面板
4. `notificationPanel`、`questPanel`、`collectionPanel` 拖好後
	- 對應按鈕才不會變成「有按鈕但找不到面板」

### 9-2. HUDController

請確認以下欄位：

1. `coinsLabel`
2. `hpLabel`
3. `ocNameLabel`
4. `bellButtonNode`
5. `settingsButtonNode`
6. `bellBadgeNode`
7. `bellBadgeLabel`
8. `navButtons`

### 特別提醒

`navButtons` 是陣列。

拖錯順序會出現：

- 你按公告，卻打開任務
- 你按設定，卻打開圖鑑

所以順序一定要對。

目前正確順序是：

1. `announcement`
2. `quest`
3. `daily`
4. `collection`
5. `inventory`
6. `npc`
7. `settings`

### 這一段會影響什麼

1. `coinsLabel` / `ocNameLabel`
	- 影響右上角看到的角色名稱與貨幣
2. `bellButtonNode`
	- 影響點鈴鐺是否打開通知
3. `settingsButtonNode`
	- 影響點齒輪是否打開設定面板
4. `navButtons`
	- 影響左側每一顆按鈕打開的是不是正確面板

### 9-3. SettingsPanel

如果場景裡的 `SettingsPanelNode` 已經存在，而且它不是純 runtime 幽靈節點，請檢查以下欄位：

1. `bgSprite`
2. `titleLabel`
3. `closeButton`
4. `bgmSlider`
5. `sfxSlider`
6. `bgmValueLabel`
7. `sfxValueLabel`
8. `traditionalChineseButton`
9. `simplifiedChineseButton`
10. `languageValueLabel`

### 非常重要

如果你在 Editor 裡根本看不到 `LanguageValueLabel`、`TraditionalChineseButton`、`SimplifiedChineseButton`，
就代表這塊目前大多還是 Builder/runtime 管。

這種情況：

1. 先不要亂自己新增一堆同名節點
2. 先把這件事記錄下來
3. 之後由我判斷該不該轉成手工固定節點

### 這些欄位各自影響什麼

1. `bgSprite`
	- 影響整個設定面板有沒有底色
2. `titleLabel`
	- 影響面板標題有沒有字
3. `closeButton`
	- 影響右上角能不能關閉
4. `bgmSlider`
	- 影響背景音樂音量能不能拖
5. `sfxSlider`
	- 影響音效音量能不能拖
6. `traditionalChineseButton` / `simplifiedChineseButton`
	- 影響語言切換入口能不能點
7. `languageValueLabel`
	- 影響「目前語言」那一條顯示的是不是被正確更新

---

## 10. 今天先不要碰的區域

以下項目你今天先不要自己修：

1. `onDestroy()` 邏輯
2. backdrop 點空白關閉的程式碼
3. HUD 右上角 spacing
4. 語言切換的程式事件
5. 各面板 runtime 生成的內層 label / button / content list

### 為什麼不要碰

因為這些東西現在不是「缺節點」而已，
而是牽涉：

1. runtime 建立順序
2. 事件綁定時機
3. 覆蓋層級
4. hit target
5. 程式引用的是不是眼前那個節點

這些必須等你把固定項目做完，我再帶你精準查。

---

## 11. 你可以一口氣補完的缺漏清單

這一段就是你今天真正的任務清單。

請做完一項就打一個勾。

### A. 專案與場景

- [ ] 專案成功打開
- [ ] `LoginScene` 可打開
- [ ] `MapTestView` 可打開
- [ ] `Canvas` 設計解析度正確

### B. 固定腳本

- [ ] `LoginController` 已掛
- [ ] `MapSceneBuilder` 已掛
- [ ] `MainGameController` 的實際掛點已確認
- [ ] `HUDController` 已掛
- [ ] `MapController` 已掛

### C. LoginScene Inspector

- [ ] `loginPanel`
- [ ] `resetPasswordPanel`
- [ ] `loadingOverlay`
- [ ] `ocNameInput`
- [ ] `passwordInput`
- [ ] `loginBtn`
- [ ] `loginErrorLabel`
- [ ] `newPasswordInput`
- [ ] `confirmPasswordInput`
- [ ] `confirmResetBtn`
- [ ] `resetErrorLabel`

### D. MapTestView Inspector

- [ ] `mapController`
- [ ] `hudController`
- [ ] `inventoryPanel`
- [ ] `npcModal`
- [ ] `whiteCrowCard`
- [ ] `notificationPanel`
- [ ] `settingsPanel`
- [ ] `questPanel`
- [ ] `collectionPanel`

### E. HUD 細項

- [ ] `coinsLabel`
- [ ] `ocNameLabel`
- [ ] `bellButtonNode`
- [ ] `settingsButtonNode`
- [ ] `navButtons` 順序確認

### F. SettingsPanel 結構觀測

- [ ] 看得到 `LanguageValueLabel` / 看不到，已記錄
- [ ] 看得到 `TraditionalChineseButton` / 看不到，已記錄
- [ ] 看得到 `SimplifiedChineseButton` / 看不到，已記錄

---

## 12. 做完之後你要怎麼回報我

請不要只回一句「做完了」。

請直接照下面模板回我：

```text
【Cocos 整理完成回報】

1. LoginScene
- 完成 / 未完成：
- 卡住點：

2. MapTestView
- 完成 / 未完成：
- MainGameController 掛在：Canvas / GameRoot / 兩邊都沒有

3. HUDController Inspector
- 完成 / 未完成：
- 缺哪些欄位：

4. SettingsPanel 結構
- LanguageValueLabel：看得到 / 看不到
- TraditionalChineseButton：看得到 / 看不到
- SimplifiedChineseButton：看得到 / 看不到

5. 其他補充
- 哪些節點你覺得像是 runtime 才出現：
- 哪些地方你不確定要不要自己接：
```

---

## 13. 你做完這份手冊後，我接手做什麼

等你把這份手冊跑完，我接下來會做這 4 件事：

1. 幫你判斷哪些 bug 是「缺 Inspector 綁定」
2. 幫你判斷哪些 bug 是「runtime 節點引用錯誤」
3. 幫你決定下一個只查 1 個 root cause
4. 避免你再掉進盲測循環

---

## 14. 最後一句簡單版

你今天不用修 bug。

你今天只要做這句話：

**把固定存在的節點、固定存在的腳本、固定存在的 Inspector 欄位，全部補齊。**

做完後，把結果回報我。
我再帶你進入下一階段的精準排查。
---
---

# 第二階段：將 Runtime UI 搬到場景節點

> 目標：把 `MapSceneBuilder.ts` 動態建立的所有 UI 節點，全部改成在 **Cocos 場景編輯器** 裡手動建立，讓你可以直接在 Inspector 裡調整大小、位置、顏色等。
>
> 為什麼要做：目前所有按鈕、面板、HUD 都是程式碼在 `onLoad()` 時自動生成的，你無法在編輯器裡看到或微調它們。搬到場景節點後，你可以直接用滑鼠拖曳調整位置、在 Inspector 改顏色改字體，不再需要改程式碼。

---

## 15. 開始之前：了解目前的節點結構

`MapSceneBuilder.ts` 會在 `onLoad()` 時建立以下 **7 大區塊**，你要依序把它們全部搬到場景裡。

```
Canvas
 0. MapArea（地圖底圖）
 1. HUD_TopRight（右上角狀態列）
 2. LeftNavBar（左側導航按鈕列）
 3. RightToolbar（右側縮放按鈕）
 4. PanelLayer（所有彈窗面板的容器）
 5. TransitionLayer（轉場特效層）
 6. OverlayLayer（最頂層覆蓋）
```

你會按照 **15  16  17  18  19  20  21  22** 的順序，一個區塊一個區塊建好。

---

## 16. 建立 MapArea（地圖底圖）

### 16-1. 在 Canvas 下建立節點

1. 在 **層級管理器**（Hierarchy）中，右鍵點擊 `Canvas`
2. 選「建立空節點」（Create Empty Node）
3. 把新節點命名為 `MapArea`

### 16-2. 設定 UITransform

1. 選中 `MapArea`
2. 在 **屬性檢查器**（Inspector）下方找到 `UITransform`（沒有的話點「新增元件」 `UITransform`）
3. 設定：
   - `Content Size`：**W = 1280, H = 720**
   - `Anchor`：**X = 0.5, Y = 0.5**

### 16-3. 加上 Widget（全螢幕填充）

1. 點「新增元件」 搜尋 `Widget`
2. 勾選 `Top`、`Bottom`、`Left`、`Right` 四個方向
3. 四個值都填 **0**
4. `Align Mode` 設為 `ON_WINDOW_RESIZE`

### 16-4. 掛載 MapController 腳本

1. 點「新增元件」 搜尋 `MapController`
2. 把它加上去

### 16-5. 確認

- [x] 節點名稱：`MapArea`
- [x] UITransform：1280  720
- [x] Widget：四邊都是 0
- [x] MapController 腳本已掛載

---

## 17. 建立 HUD_TopRight（右上角狀態列）

### 17-1. 建立主節點

1. 在 Canvas 下建立空節點，命名為 `HUD_TopRight`

### 17-2. 設定 UITransform

- `Content Size`：**W = 620, H = 48**

### 17-3. 加上 Widget

- 勾選 `Top`：**20**
- 勾選 `Right`：**8**
- 其他不勾

### 17-4. 加上 Layout

1. 點「新增元件」 `Layout`
2. 設定：
   - `Type`：**HORIZONTAL**
   - `Spacing X`：**12**
   - `Resize Mode`：**NONE**

### 17-5. 掛載 HUDController 腳本

1. 點「新增元件」 搜尋 `HUDController`
2. 加上去

### 17-6. 建立子節點：CoinsLabel

1. 在 `HUD_TopRight` 下建立空節點，命名為 `CoinsLabel`
2. UITransform：**W = 120, H = 40**
3. 在 `CoinsLabel` 下建立空節點，命名為 `TouchTarget`
4. UITransform：**W = 120, H = 40**
5. 加上 Widget  全填充（Top/Bottom/Left/Right 都 = 0）
6. 加上 `Sprite` 元件  Color 設為 **(71, 85, 105, 240)**
7. 加上 `Button` 元件
8. 加上 `Label` 元件  string = **0**, fontSize = **15**

### 17-7. 建立子節點：OcNameLabel

1. 在 `HUD_TopRight` 下建立空節點，命名為 `OcNameLabel`
2. UITransform：**W = 180, H = 40**
3. 建立 `TouchTarget` 子節點（同上步驟）
4. UITransform：**W = 180, H = 40**
5. Widget 全填充
6. Sprite  Color **(71, 85, 105, 240)**
7. Button
8. Label  string = **未登入**, fontSize = **15**

### 17-8. 建立子節點：SettingsBtn

1. 在 `HUD_TopRight` 下建立空節點，命名為 `SettingsBtn`
2. UITransform：**W = 40, H = 40**
3. 建立 `TouchTarget` 子節點
4. UITransform：**W = 40, H = 40**
5. Widget 全填充
6. Sprite  Color **(71, 85, 105, 255)**
7. Button
8. Label  string = **⚙**, fontSize = **18**

### 17-9. 建立子節點：BellButton

1. 在 `HUD_TopRight` 下建立空節點，命名為 `BellButton`
2. UITransform：**W = 40, H = 40**
3. 建立 `TouchTarget` 子節點
4. UITransform：**W = 40, H = 40**
5. Widget 全填充
6. Sprite  Color **(71, 85, 105, 255)**
7. Button
8. Label  string = **🔔**, fontSize = **18**

### 17-10. 建立 BellBadge（紅點徽章）

1. 在 `BellButton` 下建立空節點，命名為 `BellBadge`
2. UITransform：**W = 16, H = 16**
3. Position：**(12, 12, 0)**
4. **取消勾選 Active**（預設隱藏）
5. 加 Sprite  Color **(239, 68, 68)**（紅色）
6. 在 `BellBadge` 下建立空節點 `BadgeLabel`
7. UITransform：**W = 16, H = 16**
8. Label  string = **0**, fontSize = **10**, 水平/垂直都置中

### 17-11. Inspector 拖綁 HUDController

選中 `HUD_TopRight`（掛有 HUDController 的節點），在 Inspector 中：

| 欄位 | 拖入的節點 |
|------|-----------|
| `Coins Label` | `CoinsLabel > TouchTarget` 上的 Label |
| `Hp Label` | （暫時留空，之後再加 HP 節點） |
| `Oc Name Label` | `OcNameLabel > TouchTarget` 上的 Label |
| `Bell Button Node` | `BellButton` |
| `Settings Button Node` | `SettingsBtn` |
| `Bell Badge Node` | `BellBadge` |
| `Bell Badge Label` | `BellBadge > BadgeLabel` 上的 Label |
| `Nav Buttons` | 先不填（等 18 建好左側導航後再拖） |

### 17-12. 確認清單

- [x] `HUD_TopRight` 節點建好
- [x] Widget 右上角對齊
- [x] Layout 水平排列
- [x] HUDController 腳本已掛
- [x] 4 個子節點建好：CoinsLabel, OcNameLabel, SettingsBtn, BellButton
- [x] 每個子節點都有 TouchTarget
- [x] BellBadge 紅點建好且 Active = false

---

## 18. 建立 LeftNavBar（左側導航按鈕列）

### 18-1. 建立主節點

1. 在 Canvas 下建立空節點，命名為 `LeftNavBar`
2. UITransform：**W = 120, H = 452**（7個按鈕  44 + 6個間距  18）

### 18-2. 添加 Widget

- 勾選 `Left`：**20**
- 勾選 `Vertical Center`：**0**

### 18-3. 添加 Layout

- `Type`：**VERTICAL**
- `Spacing Y`：**18**
- `Resize Mode`：**NONE**

### 18-4. 建立 7 個導航按鈕

對以下每個按鈕重複相同步驟：

| 順序 | 節點名稱 | 標籤文字 |
|------|---------|---------|
| 1 | `NavBtn_公告` | 公告 |
| 2 | `NavBtn_任務` | 任務 |
| 3 | `NavBtn_日誌` | 日誌 |
| 4 | `NavBtn_圖鑑` | 圖鑑 |
| 5 | `NavBtn_背包` | 背包 |
| 6 | `NavBtn_NPC` | NPC |
| 7 | `NavBtn_設定` | 設定 |

每個按鈕的建立步驟（以「公告」為例）：

1. 在 `LeftNavBar` 下建立空節點，命名為 `NavBtn_公告`
2. UITransform：**W = 96, H = 44**
3. 建立 `TouchTarget` 子節點
4. UITransform：**W = 96, H = 44**
5. Widget  全填充
6. Sprite  Color **(100, 116, 139, 235)**
7. Button
8. BlockInputEvents
9. Label  string = **公告**, fontSize = **17**, 水平/垂直都置中

### 18-5. 建立隱藏的 ChapterStoryBtn

1. 在 `LeftNavBar` 下建立空節點，命名為 `ChapterStoryBtn`
2. UITransform：**W = 96, H = 44**
3. **取消勾選 Active**（預設隱藏）
4. 建立 `TouchTarget` 子節點（同上）
5. Label  string = **劇情**, fontSize = **17**

### 18-6. 回去 HUDController 補填 Nav Buttons

1. 選中 `HUD_TopRight`（HUDController 節點）
2. 在 Inspector 找到 `Nav Buttons` 陣列
3. 設定陣列大小為 **7**
4. 按順序拖入：

| 索引 | 拖入節點 |
|------|---------|
| 0 | `NavBtn_公告` |
| 1 | `NavBtn_任務` |
| 2 | `NavBtn_日誌` |
| 3 | `NavBtn_圖鑑` |
| 4 | `NavBtn_背包` |
| 5 | `NavBtn_NPC` |
| 6 | `NavBtn_設定` |

5. `Chapter Story Btn Node` 欄位拖入 `ChapterStoryBtn`

### 18-7. 確認清單

- [x] `LeftNavBar` 建好
- [x] 7 個 NavBtn 順序正確
- [x] 每個都有 TouchTarget + Sprite + Button + BlockInputEvents + Label
- [x] ChapterStoryBtn 隱藏
- [x] HUDController 的 Nav Buttons 陣列已填好

---

## 19. 建立 RightToolbar（右側縮放按鈕）

### 19-1. 建立主節點

1. 在 Canvas 下建立空節點，命名為 `RightToolbar`
2. UITransform：**W = 48, H = 72**

### 19-2. 添加 Widget

- 勾選 `Right`：**24**
- 勾選 `Vertical Center`：**0**

### 19-3. 添加 Layout

- `Type`：**VERTICAL**
- `Spacing Y`：**4**

### 19-4. 建立 ZoomInBtn

1. 在 `RightToolbar` 下建立空節點，命名為 `ZoomInBtn`
2. UITransform：**W = 32, H = 32**
3. 建立 `TouchTarget`：W = 32, H = 32
4. Widget 全填充
5. Sprite  Color **(25, 12, 45, 230)**
6. Button
7. Label  string = **+**, fontSize = **18**

### 19-5. 建立 ZoomOutBtn

1. 同上步驟，命名為 `ZoomOutBtn`
2. Label  string = **−**, fontSize = **18**

### 19-6. 確認清單

- [x] RightToolbar 建好
- [x] ZoomInBtn 和 ZoomOutBtn 各有 TouchTarget
- [x] Widget 右側居中

---

## 20. 建立 PanelLayer（面板容器層）

這是最大的區塊。PanelLayer 包含所有彈窗面板。

### 20-1. 建立主節點

1. 在 Canvas 下建立空節點，命名為 `PanelLayer`
2. UITransform：**W = 1280, H = 720**

### 20-2. 通用面板結構（所有面板共用）

每個面板都包含相同的「殼」結構。以下是建立一個面板的通用步驟：

> **通用面板建立步驟**（以「XXXNode」為例）

**步驟 A：建立面板根節點**
1. 在 `PanelLayer` 下建立空節點，命名為 `XXXNode`
2. UITransform：**W = 450, H = 480**
3. 加上 Widget  勾選 `Horizontal Center` = 0, `Vertical Center` = 0
4. **取消勾選 Active**（預設隱藏）

**步驟 B：建立 Backdrop（全螢幕半透明遮罩）**
1. 在 `XXXNode` 下建立空節點，命名為 `Backdrop`
2. UITransform：**W = 1280, H = 720**
3. 加上 Sprite  Color **(0, 0, 0, 150)**
4. 加上 Button
5. ⚠️ **不要** 加 BlockInputEvents（Backdrop 需要接收點擊來關閉面板）

**步驟 C：建立 PanelBG（面板主體背景）**
1. 在 `XXXNode` 下建立空節點，命名為 `PanelBG`（必須在 Backdrop 之後，這樣層級更高、會優先接收觸控）
2. UITransform：**W = 520, H = 560**
3. 加上 Sprite  Color **(19, 24, 39, 245)**
4. 加上 **BlockInputEvents**（防止點擊穿透到 Backdrop）

**步驟 D：建立 HeaderBar（標題欄背景）**
1. 在 `PanelBG` 下建立空節點，命名為 `HeaderBar`
2. UITransform：**W = 520, H = 56**
3. Position：**(0, 252, 0)**
4. Sprite  Color **(74, 85, 104, 255)**

**步驟 E：建立 BodyFrame（內容區域背景）**
1. 在 `PanelBG` 下建立空節點，命名為 `BodyFrame`
2. UITransform：**W = 456, H = 390**
3. Position：**(0, -18, 0)**
4. Sprite  Color **(255, 255, 255, 28)**（極淡白色）

**步驟 F：建立 TitleLabel（標題文字）**
1. 在 `PanelBG` 下建立空節點，命名為 `TitleLabel`
2. UITransform：**W = 280, H = 36**
3. Position：**(0, 252, 0)**
4. Label  string = **面板標題**, fontSize = **20**, 水平/垂直置中

**步驟 G：建立 CloseButton（關閉按鈕）**
1. 在 `PanelBG` 下建立空節點，命名為 `CloseButton`
2. UITransform：**W = 54, H = 54**
3. Position：**(218, 252, 0)**
4. Button
5. Label  string = **X**, fontSize = **34**, Color = **(248, 113, 113, 255)**（紅色）

**步驟 H：建立 CloseHintLabel**
1. 在 `PanelBG` 下建立空節點，命名為 `CloseHintLabel`
2. UITransform：**W = 320, H = 24**
3. Position：**(0, -214, 0)**
4. Label  string = **點空白區域也可關閉**, fontSize = **13**, Color = **(226, 232, 240, 220)**

**步驟 I：建立 BodyRoot（內容容器）**
1. 在 `PanelBG` 下建立空節點，命名為 `BodyRoot`
2. UITransform：**W = 430, H = 360**
3. Position：**(0, -20, 0)**

---

### 20-3. 建立各面板

以下列出 PanelLayer 裡需要建的所有面板。每個面板都先用 20-2 的通用步驟 A~I 建好外殼，再加上各自的內容節點。

#### 面板 1：WhiteCrowCardNode（白鴉檔案）

1. 用通用步驟建好，節點名 = `WhiteCrowCardNode`，TitleLabel = **白鴉檔案**
2. 掛載 `WhiteCrowCard` 腳本（在 XXXNode 根節點上）
3. 在 BodyRoot 下建立以下子節點：

| 子節點名 | UITransform | Position | Label string | fontSize |
|----------|-------------|----------|-------------|----------|
| `CodeLabel` | 36028 | (0, 120, 0) | 公告 / 日誌 placeholder | 14 |
| `CoinsLabel` | 36028 | (0, 70, 0) | 金幣：0 | 13 |
| `HpLabel` | 36028 | (0, 40, 0) | HP：0 / 0 | 13 |
| `RelicHintLabel` | 36028 | (0, -120, 0) | 白鴉卡片內容待補齊 | 12 |

#### 面板 2：QuestPanelNode（任務面板）

1. 通用步驟建好，節點名 = `QuestPanelNode`，TitleLabel = **任務面板**
2. 掛載 `QuestPanel` 腳本
3. 在 BodyRoot 下建立：

| 子節點名 | UITransform | Position | 元件 |
|----------|-------------|----------|------|
| `QuestContent` | 380250 | (0, -10, 0) | Layout (VERTICAL, spacingY=8, resizeMode=CONTAINER) |
| `QuestEmptyLabel` | 36028 | (0, 0, 0) | Label: "目前沒有可用任務", fontSize=14 |

#### 面板 3：CollectionPanelNode（圖鑑面板）

1. 通用步驟建好，節點名 = `CollectionPanelNode`，TitleLabel = **圖鑑面板**
2. 掛載 `CollectionPanel` 腳本
3. 在 BodyRoot 下建立：

| 子節點名 | UITransform | Position | 元件 |
|----------|-------------|----------|------|
| `CountLabel` | 36028 | (0, 130, 0) | Label: "0 / 0", fontSize=12 |
| `CollectionContent` | 380240 | (0, -10, 0) | Layout (VERTICAL, spacingY=8, resizeMode=CONTAINER) |
| `CollectionEmptyLabel` | 36028 | (0, 0, 0) | Label: "尚無資料", fontSize=14 |

#### 面板 4：SettingsPanelNode（設定面板）

1. 通用步驟建好，節點名 = `SettingsPanelNode`，TitleLabel = **設定面板**
2. 掛載 `SettingsPanel` 腳本
3. 在 BodyRoot 下建立：

| 子節點名 | UITransform | Position | 元件 |
|----------|-------------|----------|------|
| `BgmValueLabel` | 36028 | (0, 95, 0) | Label: "BGM：100%", fontSize=14 |
| `SfxValueLabel` | 36028 | (0, 60, 0) | Label: "SFX：100%", fontSize=14 |
| `LanguageTitleLabel` | 36028 | (0, 5, 0) | Label: "語言切換 V4", fontSize=15 |
| `LanguageValueLabel` | 32038 | (0, -28, 0) | Sprite Color=(51,65,85,220) |
| `TraditionalChineseButton` | 22042 | (0, -82, 0) | 「膠囊按鈕」結構（見下方） |
| `SimplifiedChineseButton` | 22042 | (0, -136, 0) | 「膠囊按鈕」結構（見下方） |
| `SettingsHintLabel` | 36028 | (0, -190, 0) | Label: "音量 slider 與進階設定 UI 待補齊", fontSize=12 |

**「膠囊按鈕」結構**（TraditionalChineseButton 和 SimplifiedChineseButton 都用這個）：
1. 建立空節點（例如 `TraditionalChineseButton`）
2. UITransform：22042
3. 建立 `TouchTarget` 子節點
4. UITransform：22042，Widget 全填充
5. Sprite  Color **(71, 85, 105, 240)**
6. Button
7. Label  string = **繁體中文**（或 **简体中文**），fontSize = **20**, Color = **(248, 250, 252, 255)**

#### 面板 5：NotificationPanelNode（通知中心）

1. 通用步驟建好，節點名 = `NotificationPanelNode`，TitleLabel = **通知中心**
2. 掛載 `NotificationPanel` 腳本
3. 在 BodyRoot 下建立：

| 子節點名 | UITransform | Position | 元件 |
|----------|-------------|----------|------|
| `NotificationContent` | 380240 | (0, -10, 0) | Layout (VERTICAL, spacingY=8, resizeMode=CONTAINER) |
| `NotificationEmptyLabel` | 36028 | (0, 0, 0) | Label: "目前沒有新通知", fontSize=14 |

#### 面板 6：InventoryPanelNode（背包面板）

1. 通用步驟建好，節點名 = `InventoryPanelNode`，TitleLabel = **背包**
2. 掛載 `InventoryPanel` 腳本
3. 在 BodyRoot 下建立：

| 子節點名 | UITransform | Position | 元件 |
|----------|-------------|----------|------|
| `GridContainer` | 420400 | (0, -10, 0) | Layout (type=GRID, spacingX=8, spacingY=8, constraintNum=5) |

#### 面板 7：NPCModalNode（NPC 互動面板）

1. 通用步驟建好，節點名 = `NPCModalNode`，TitleLabel = **NPC 互動**
2. 掛載 `NPCModal` 腳本
3. 在 BodyRoot 下建立：

| 子節點名 | UITransform | Position | 元件 |
|----------|-------------|----------|------|
| `DialogueLabel` | 36028 | (0, 110, 0) | Label: "請選擇互動項目", fontSize=13 |
| `ShopContainer` | 380180 | (0, -10, 0) | Layout (VERTICAL, spacingY=8, resizeMode=CONTAINER) |
| `ActionButton` | 18036 | (0, -125, 0) | 膠囊按鈕結構，Label = "互動", fontSize=15 |

#### 面板 8：ItemDetailModalNode（道具詳情）

1. 通用步驟建好，節點名 = `ItemDetailModalNode`，TitleLabel = **道具詳情**
2. 掛載 `ItemDetailModal` 腳本
3. 在 BodyRoot 下建立：

| 子節點名 | UITransform | Position | 元件 |
|----------|-------------|----------|------|
| `NameLabel` | 36028 | (0, 110, 0) | Label: "道具名稱", fontSize=16 |
| `TypeLabel` | 36028 | (0, 75, 0) | Label: "類型", fontSize=12 |
| `DescLabel` | 36028 | (0, 25, 0) | Label: "描述內容", fontSize=12 |
| `QuantityLabel` | 36028 | (0, -20, 0) | Label: "x0", fontSize=12 |
| `UseButton` | 14036 | (0, -110, 0) | 膠囊按鈕結構，Label = "使用", fontSize=15 |

#### 面板 9：CharacterCardNode（角色卡片）

1. 在 PanelLayer 下建立空節點 `CharacterCardNode`
2. UITransform：**450480**
3. Widget 居中
4. **取消勾選 Active**
5. （內容暫時為空殼，後續再補）

### 20-4. PanelLayer 確認清單

- [x] PanelLayer 建好
- [x] 9 個面板節點全部建好：WhiteCrowCardNode, QuestPanelNode, CollectionPanelNode, SettingsPanelNode, NotificationPanelNode, InventoryPanelNode, NPCModalNode, ItemDetailModalNode, CharacterCardNode
- [x] 每個面板都有 Backdrop + PanelBG + HeaderBar + BodyFrame + TitleLabel + CloseButton + CloseHintLabel + BodyRoot
- [x] 每個 PanelBG 都有 **BlockInputEvents**
- [x] 每個面板的 Active = **false**
- [x] 各面板的特有子節點建好

---

## 21. 建立 TransitionLayer（轉場特效層）

### 21-1. 建立主節點

1. 在 Canvas 下建立空節點，命名為 `TransitionLayer`
2. UITransform：**W = 1280, H = 720**

### 21-2. 建立 4 個全螢幕轉場節點

每個轉場節點的建立步驟都相同（以 BreathingSceneNode 為例）：

| 節點名 | 掛載腳本 |
|--------|---------|
| `BreathingSceneNode` | `BreathingSceneController` |
| `ChapterOpeningNode` | `ChapterOpeningController` |
| `ChapterStoryModalNode` | `ChapterStoryModal` |
| `DiceResultOverlayNode` | `DiceResultOverlay` |

每個的建立步驟：
1. 在 `TransitionLayer` 下建立空節點
2. UITransform：**W = 1280, H = 720**
3. Widget  全填充（四邊 = 0）
4. **取消勾選 Active**
5. 掛載對應腳本

### 21-3. 確認清單

- [x] TransitionLayer 建好
- [x] 4 個轉場節點全建好
- [x] 都有 Widget 全螢幕
- [x] 都 Active = false
- [x] 都掛了對應腳本

---

## 22. 建立 OverlayLayer（最頂層覆蓋）

### 22-1. 建立主節點

1. 在 Canvas 下建立空節點，命名為 `OverlayLayer`
2. UITransform：**W = 1280, H = 720**

### 22-2. 建立覆蓋節點

| 節點名 | 掛載腳本 |
|--------|---------|
| `BalanceSettlementNode` | `BalanceSettlementModal` |
| `RelicPoemModalNode` | `RelicPoemModal` |

每個的建立步驟：
1. 在 `OverlayLayer` 下建立空節點
2. UITransform：**W = 1280, H = 720**
3. Widget  全填充（四邊 = 0）
4. **取消勾選 Active**
5. 掛載對應腳本

### 22-3. 確認清單

- [x] OverlayLayer 建好
- [x] 2 個覆蓋節點全建好
- [x] 都 Active = false

---

## 23. 調整節點層級順序

節點在 Hierarchy 裡的順序決定了渲染和觸控的優先級。**越下面的節點越靠前（會蓋在上面）**。

在 Canvas 下面，節點順序應該是（從上到下）：

```
Canvas
 MapArea           最底層（地圖）
 HUD_TopRight      在地圖上方
 LeftNavBar        在地圖上方
 RightToolbar      在地圖上方
 PanelLayer        彈窗層（會蓋住 HUD 和地圖）
 TransitionLayer   轉場層（會蓋住彈窗）
 OverlayLayer      最頂層
```

你可以在 Hierarchy 裡用滑鼠拖曳來調整順序。

---

## 24. Inspector 拖綁 MainGameController

選中掛有 `MainGameController` 的節點（Canvas），在 Inspector 中依序拖入：

| 欄位 | 拖入的節點/元件 |
|------|---------------|
| `Map Controller` | `MapArea` 上的 MapController 元件 |
| `Hud Controller` | `HUD_TopRight` 上的 HUDController 元件 |
| `White Crow Card` | `WhiteCrowCardNode` 上的 WhiteCrowCard 元件 |
| `Quest Panel` | `QuestPanelNode` 上的 QuestPanel 元件 |
| `Collection Panel` | `CollectionPanelNode` 上的 CollectionPanel 元件 |
| `Settings Panel` | `SettingsPanelNode` 上的 SettingsPanel 元件 |
| `Notification Panel` | `NotificationPanelNode` 上的 NotificationPanel 元件 |
| `Inventory Panel` | `InventoryPanelNode` 上的 InventoryPanel 元件 |
| `Npc Modal` | `NPCModalNode` 上的 NPCModal 元件 |
| `Item Detail Modal` | `ItemDetailModalNode` 上的 ItemDetailModal 元件 |
| `Apostate Panel` | （這個面板目前不在 PanelLayer，如果沒有可以先留空） |
| `Liquidator Panel` | （同上） |
| `Breathing Scene` | `BreathingSceneNode` 上的 BreathingSceneController 元件 |
| `Chapter Opening` | `ChapterOpeningNode` 上的 ChapterOpeningController 元件 |
| `Chapter Story Modal` | `ChapterStoryModalNode` 上的 ChapterStoryModal 元件 |
| `Dice Result Overlay` | `DiceResultOverlayNode` 上的 DiceResultOverlay 元件 |
| `Balance Settlement Modal` | `BalanceSettlementNode` 上的 BalanceSettlementModal 元件 |
| `Relic Poem Modal` | `RelicPoemModalNode` 上的 RelicPoemModal 元件 |

---

## 25. 完成後的驗證

### 25-1. 場景結構擷圖

完成所有節點建立後，請截圖以下幾個畫面：

1. **Hierarchy 全展開圖**：Canvas 下面所有節點都展開
2. **MainGameController 的 Inspector**：確認所有欄位都有綁定
3. **HUDController 的 Inspector**：確認 Nav Buttons 陣列、各按鈕欄位都有值
4. **任意一個面板節點展開圖**：確認 Backdrop + PanelBG + HeaderBar + BodyFrame + TitleLabel + CloseButton 結構正確

### 25-2. Preview 測試

1. 按下 Preview
2. 確認畫面基本正常（地圖、HUD、左側按鈕可見）
3. 點擊左側任一按鈕  面板應該打開
4. 點擊 Backdrop  面板應該關閉
5. 點擊 X  面板應該關閉
6. 關閉後再點按鈕  應一次就開

---

## 26. 這一階段完成後接下來做什麼

> ✅ 第 26 項的程式碼修改已完成（MapSceneBuilder V4 Inspector 偵測守衛）。
> 請接續下方第 27 項，補建 HUD 和導航列的子節點。

---

## 27. 補建 HUD_TopRight 內部子節點

> **為什麼需要這一步？**
> 你之前建立的 `HUD_TopRight` 是空的容器節點。在舊的動態模式中，
> `_buildHUD()` 會在 Runtime 自動建立金幣標籤、OC 名稱、鈴鐺等子元件。
> 現在跳過動態建構後，這些子元件需要你在編輯器中手動建立。

> **⚡ Layer 設定習慣（整份手冊通用）**
> 每次建立新節點後，**立刻做這件事**：
> 1. 選中剛建好的節點
> 2. Inspector 面板最上方 → **Layer** 下拉 → 改為 **`UI_2D`**
> 3. 彈窗問你「是否套用到子節點？」→ 選 **「是 / Yes / Apply to children」**
>
> 這樣所有子節點會一起改好。**只要在最上層的父節點做一次就好。**
> 
> ⚠️ 如果忘了改 Layer，預覽時節點會完全看不見（Canvas Camera 只渲染 UI_2D）。

### 27-1. 目標節點結構（巢狀層級）

```
HUD_TopRight                         ← 已建立（不用再建）
├── CoinsLabel                       ← 新建節點
│   └── TouchTarget                  ← 新建節點
│       └── Label                    ← 新建節點
├── OcNameLabel                      ← 新建節點
│   └── TouchTarget                  ← 新建節點
│       └── Label                    ← 新建節點
├── SettingsBtn                      ← 新建節點
│   └── TouchTarget                  ← 新建節點
│       └── Label                    ← 新建節點
└── BellButton                       ← 新建節點
    ├── TouchTarget                  ← 新建節點
    │   └── Label                    ← 新建節點
    └── BellBadge                    ← 新建節點
        └── BadgeLabel               ← 新建節點
```

### 27-2. 建立 CoinsLabel 膠囊按鈕

1. 在 Hierarchy 面板，**右鍵** `HUD_TopRight` → **建立空節點 (Create Empty Node)**
2. 將新節點改名為 `CoinsLabel`
3. **🔴 Layer 設定**：Inspector 最上方 → Layer → 改為 `UI_2D` → 彈窗選「套用到子節點」
4. 選中 `CoinsLabel`，在 Inspector 面板：
   - 點擊 **Add Component** → 搜尋 `UITransform` → 加入
   - 設定 `Content Size`: W = `120`, H = `40`

4. **右鍵** `CoinsLabel` → **建立空節點** → 改名為 `TouchTarget`
5. 選中 `TouchTarget`，在 Inspector：
   - **Add Component** → `UITransform` → W = `120`, H = `40`
   - **Add Component** → `Widget` → 勾選 Top/Bottom/Left/Right 全部四個 → 全設為 `0`
   - **Add Component** → `Sprite` → SizeMode 設為 `CUSTOM` → Color 設為 `(71, 85, 105, 240)`
   - **Add Component** → `Button`（直接加就好，不用改設定）
   - **Add Component** → `BlockInputEvents`

6. **右鍵** `TouchTarget` → **建立空節點** → 改名為 `Label`
7. 選中 `Label`：
   - **Add Component** → `UITransform` → W = `120`, H = `40`
   - **Add Component** → `Label` → 內容輸入 `0` → Font Size = `15`
   - Label 的 Horizontal Align = `CENTER`, Vertical Align = `CENTER`
   - Color = `(228, 213, 245, 255)`

### 27-3. 建立 OcNameLabel 膠囊按鈕

完全複製 CoinsLabel 的步驟，差異如下：

| 項目 | CoinsLabel | OcNameLabel |
|------|-----------|-------------|
| 節點名稱 | `CoinsLabel` | `OcNameLabel` |
| UITransform W/H | 120 × 40 | **180** × 40 |
| TouchTarget UITransform W/H | 120 × 40 | **180** × 40 |
| Label UITransform W/H | 120 × 40 | **180** × 40 |
| Label 文字 | `0` | `未登入` |

> 💡 **快速複製法**：右鍵 `CoinsLabel` → **Duplicate**，然後改名和調整寬度。
> 
> 📌 Duplicate 出來的節點會繼承父節點的 Layer 設定（`UI_2D`），**不需要再改一次**。

### 27-4. 建立 SettingsBtn 圓形按鈕

1. **右鍵** `HUD_TopRight` → **建立空節點** → 改名為 `SettingsBtn`
2. **🔴 Layer**：改為 `UI_2D`，套用到子節點
3. Inspector：**Add Component** → `UITransform` → W = `40`, H = `40`

3. **右鍵** `SettingsBtn` → **建立空節點** → 改名為 `TouchTarget`
4. Inspector：
   - `UITransform` → W = `40`, H = `40`
   - `Widget` → Top/Bottom/Left/Right 全勾、全設為 `0`
   - `Sprite` → SizeMode = `CUSTOM`, Color = `(71, 85, 105, 255)`
   - `Button`
   - `BlockInputEvents`

5. **右鍵** `TouchTarget` → **建立空節點** → 改名為 `Label`
6. Inspector：
   - `UITransform` → W = `40`, H = `40`
   - `Label` → 文字 `⚙` → Font Size = `18`
   - Horizontal = `CENTER`, Vertical = `CENTER`
   - Color = `(228, 213, 245, 255)`

### 27-5. 建立 BellButton 圓形按鈕（含紅點）

1. **右鍵** `HUD_TopRight` → **建立空節點** → 改名為 `BellButton`
2. **🔴 Layer**：改為 `UI_2D`，套用到子節點
3. Inspector：`UITransform` → W = `40`, H = `40`

3. 在 `BellButton` 下建立 `TouchTarget`（同 SettingsBtn 的 TouchTarget 步驟）
   - Label 文字改為 `🔔`

4. **右鍵** `BellButton` → **建立空節點** → 改名為 `BellBadge`
5. Inspector：
   - `UITransform` → W = `16`, H = `16`
   - `Sprite` → SizeMode = `CUSTOM`, Color = `(239, 68, 68, 255)`（紅色）
   - Position = `(12, 12, 0)`

6. **右鍵** `BellBadge` → **建立空節點** → 改名為 `BadgeLabel`
7. Inspector：
   - `UITransform` → W = `16`, H = `16`
   - `Label` → 文字 `0` → Font Size = `10`
   - Color = `(255, 255, 255, 255)`
   - Horizontal = `CENTER`, Vertical = `CENTER`

8. 選中 `BellBadge` → Inspector 最上方取消勾選 **Active**（預設隱藏）

### 27-6. HUD_TopRight 自身的排版元件

選中 `HUD_TopRight` 節點本身，確認有以下元件：

- `UITransform` → W = `620`, H = `48`
- `Widget` → 勾選 Top = `20`, Right = `8`
- `Layout` → Type = `HORIZONTAL`, Spacing X = `12`, Resize Mode = `NONE`

### 27-7. 綁定 HUDController 的 @property

選中掛有 `HUDController` 腳本的節點（即 `HUD_TopRight`），在 Inspector 拖入：

| @property 欄位 | 拖入什麼 |
|---------------|---------|
| `coinsLabel` | `CoinsLabel` > `TouchTarget` > `Label` 節點上的 **Label 元件** |
| `ocNameLabel` | `OcNameLabel` > `TouchTarget` > `Label` 節點上的 **Label 元件** |
| `bellButtonNode` | `BellButton` **節點** |
| `settingsButtonNode` | `SettingsBtn` **節點** |
| `bellBadgeNode` | `BellBadge` **節點** |
| `bellBadgeLabel` | `BadgeLabel` 節點上的 **Label 元件** |

> ⚠️ 注意：拖「節點」和拖「元件」不同！
> - 如果欄位型別是 `Node`，直接拖節點過去。
> - 如果欄位型別是 `Label`，要拖節點上面 Label 元件的標題列。

---

## 28. 補建 LeftNavBar 內部子節點

### 28-1. 目標節點結構

```
LeftNavBar                           ← 已建立
├── NavBtn_公告                      ← 新建節點
│   └── TouchTarget
│       └── Label
├── NavBtn_任務                      ← 新建節點
│   └── TouchTarget
│       └── Label
├── NavBtn_日誌                      ← 新建節點
│   └── TouchTarget
│       └── Label
├── NavBtn_圖鑑                      ← 新建節點
│   └── TouchTarget
│       └── Label
├── NavBtn_背包                      ← 新建節點
│   └── TouchTarget
│       └── Label
├── NavBtn_NPC                       ← 新建節點
│   └── TouchTarget
│       └── Label
├── NavBtn_設定                      ← 新建節點
│   └── TouchTarget
│       └── Label
└── ChapterStoryBtn                  ← 新建節點（預設隱藏）
    └── TouchTarget
        └── Label
```

### 28-2. 建立第一個導航按鈕（以 NavBtn_公告 為例）

1. **右鍵** `LeftNavBar` → **建立空節點** → 改名為 `NavBtn_公告`
2. **🔴 Layer**：改為 `UI_2D`，套用到子節點
3. Inspector：`UITransform` → W = `96`, H = `44`

3. **右鍵** `NavBtn_公告` → **建立空節點** → 改名為 `TouchTarget`
4. Inspector：
   - `UITransform` → W = `96`, H = `44`
   - `Widget` → Top/Bottom/Left/Right = `0`
   - `Sprite` → SizeMode = `CUSTOM`, Color = `(100, 116, 139, 235)`
   - `Button`
   - `BlockInputEvents`

5. **右鍵** `TouchTarget` → **建立空節點** → 改名為 `Label`
6. Inspector：
   - `UITransform` → W = `96`, H = `44`
   - `Label` → 文字 `公告` → Font Size = `17`
   - Horizontal = `CENTER`, Vertical = `CENTER`
   - Color = `(228, 213, 245, 255)`

### 28-3. 複製建立其餘 6 個導航按鈕 + ChapterStoryBtn

**右鍵** `NavBtn_公告` → **Duplicate** → 改名 + 改文字：

| 節點名稱 | Label 文字 |
|---------|-----------|
| `NavBtn_任務` | `任務` |
| `NavBtn_日誌` | `日誌` |
| `NavBtn_圖鑑` | `圖鑑` |
| `NavBtn_背包` | `背包` |
| `NavBtn_NPC` | `NPC` |
| `NavBtn_設定` | `設定` |
| `ChapterStoryBtn` | `劇情` |

> `ChapterStoryBtn` 建好後，取消勾選 **Active**（預設隱藏）。

### 28-4. LeftNavBar 自身的排版元件

選中 `LeftNavBar`，確認：

- `UITransform` → W = `120`, H = `462`（= 8 按鈕 × 44 + 7 間距 × 18）
- `Widget` → 勾選 Left = `20`, Vertical Center = `0`
- `Layout` → Type = `VERTICAL`, Spacing Y = `18`, Resize Mode = `NONE`

### 28-5. 綁定 HUDController 的 navButtons 陣列

1. 選中掛有 `HUDController` 的節點
2. 找到 `navButtons` 欄位（陣列型別）
3. 設定 陣列長度 = `7`
4. **按順序** 拖入以下節點：

| 索引 | 節點 |
|------|------|
| 0 | `NavBtn_公告` |
| 1 | `NavBtn_任務` |
| 2 | `NavBtn_日誌` |
| 3 | `NavBtn_圖鑑` |
| 4 | `NavBtn_背包` |
| 5 | `NavBtn_NPC` |
| 6 | `NavBtn_設定` |

> ⚠️ **順序絕對不能錯！** 必須對應 HUDController.NAV_PANELS 的定義順序。

5. 找到 `chapterStoryBtnNode` 欄位 → 拖入 `ChapterStoryBtn` 節點

---

## 29. 補建 RightToolbar 子節點

### 29-1. 目標結構

```
RightToolbar                         ← 已建立
├── ZoomInBtn                        ← 新建節點
│   └── TouchTarget
│       └── Label
└── ZoomOutBtn                       ← 新建節點
    └── TouchTarget
        └── Label
```

### 29-2. 建立步驟

1. **右鍵** `RightToolbar` → **建立空節點** → 改名為 `ZoomInBtn`
2. **🔴 Layer**：改為 `UI_2D`，套用到子節點
3. Inspector：`UITransform` → W = `32`, H = `32`
3. 子節點 `TouchTarget`：
   - `UITransform` W = `32`, H = `32`
   - `Widget` → 全 `0`
   - `Sprite` → Color = `(25, 12, 45, 230)`
   - `Button`
   - `BlockInputEvents`
4. 子節點 `Label`：
   - `UITransform` W = `32`, H = `32`
   - `Label` → 文字 `+` → Font Size = `18`
   - Color = `(200, 190, 220, 255)`

5. **Duplicate** `ZoomInBtn` → 改名為 `ZoomOutBtn` → Label 文字改為 `−`

### 29-3. RightToolbar 排版

- `UITransform` → W = `48`, H = `72`
- `Widget` → Right = `24`, Vertical Center = `0`
- `Layout` → Type = `VERTICAL`, Spacing Y = `4`, Resize Mode = `NONE`

---

## 30. 補建完成後的驗證清單

在 Cocos Creator 按下 **Play** 預覽，檢查 Console：

### ✅ 應該看到的
```
=== MapSceneBuilder V4 已載入 ===
[MapSceneBuilder] ✅ 偵測到 Inspector 已綁定核心插座，跳過動態 UI 建構
```

### ✅ 畫面上應該看到的
- [ ] 右上角出現「0」金幣膠囊、OC 名稱膠囊、⚙ 按鈕、🔔 按鈕
- [ ] 左側出現 7 個導航按鈕（公告 / 任務 / 日誌 / 圖鑑 / 背包 / NPC / 設定）
- [ ] 右側出現縮放 + / − 按鈕
- [ ] 點擊左側「任務」按鈕，Console 印出 `[MainGameController] 開啟面板：quest`
- [ ] 點擊「⚙」設定按鈕，設定面板出現

### ❌ 如果仍然不可見，檢查以下項目
1. 節點的 `Layer` 是否為 `UI_2D`（不是 `DEFAULT`）
2. 節點的 `Active` 勾選是否開啟
3. `Sprite` 的 `SpriteFrame` 是否為空白（如果是佔位色塊，可用 `getWhiteSpriteFrame()` 或自己建立一個純白 1×1 圖片）
4. HUDController 的 @property 欄位是否全部拖綁完成

---

## 31. Layer 設定完整指南（編輯器解法）

> **核心概念**：Cocos Creator 的 Canvas Camera 只會渲染 `UI_2D` Layer 的節點。
> 如果一個節點的 Layer 是 `DEFAULT`（新建節點的預設值），你在**編輯器裡看得到，但預覽時完全不可見**。

### 31-1. 需要改 Layer 的節點清單

以下是你目前所有手動建立的節點，如果之前建立時沒有改 Layer，請現在一次性修正：

| 父節點 | 需要改 Layer 的節點 | 操作 |
|--------|-------------------|------|
| Canvas 下 | `HUD_TopRight` | 選中 → Layer → `UI_2D` → 彈窗選「套用到子節點」 |
| Canvas 下 | `LeftNavBar` | 同上 |
| Canvas 下 | `RightToolbar` | 同上 |
| Canvas 下 | `MapArea` | 同上 |
| Canvas 下 | `PanelLayer` | 同上 |
| Canvas 下 | `TransitionLayer` | 同上 |
| Canvas 下 | `OverlayLayer` | 同上 |

> 💡 **只需要在七個頂層節點上各做一次**，選「套用到子節點」就會連帶改好裡面所有的 CoinsLabel、TouchTarget、Label 等子節點。

### 31-2. 操作步驟（圖文說明）

```
步驟 1：在 Hierarchy 選中一個頂層節點（如 HUD_TopRight）

步驟 2：Inspector 面板 → 最上方第一行 → 找到「Layer」下拉選單
         ┌──────────────────────────┐
         │  Node: HUD_TopRight      │
         │  Active: ☑               │
         │  Layer: [DEFAULT  ▼]     │  ← 點這裡
         └──────────────────────────┘

步驟 3：下拉選單中選擇 「UI_2D」
         ┌──────────────────────────┐
         │  Layer: [UI_2D    ▼]     │  ← 改成這個
         └──────────────────────────┘

步驟 4：彈出對話框：
         ┌──────────────────────────────────┐
         │  Apply to child nodes?           │
         │                                  │
         │  [Cancel]  [No]  [Yes / 是]      │  ← 選「Yes」或「是」
         └──────────────────────────────────┘
```

### 31-3. 新建節點的好習慣

**以後每次在 Hierarchy 右鍵建立空節點後，第一件事就是：**

```
右鍵建立空節點 → 改名 → 🔴 Layer 改成 UI_2D → 然後才加 Component
```

> 這條規則已經標註在手冊第 27 ~ 29 節的每個「新建」步驟中。

---

## 32. Inspector @property 綁定教學（互動功能的關鍵）

> **為什麼按鈕看得到卻不能點？**
> 因為按鈕的點擊事件是由 `HUDController` 腳本的 `_registerEvents()` 在 Runtime 註冊的。
> 這個方法會讀取 `@property` 欄位（如 `navButtons`、`bellButtonNode`），
> 如果這些欄位是空的（沒有在 Inspector 中綁定），事件就不會被註冊。

### 32-1. 前置確認：HUDController 掛在哪裡？

1. 在 Hierarchy 找到 `HUD_TopRight` 節點
2. 選中它，看 Inspector 面板
3. 確認下方有一個 **HUDController** 腳本元件
4. 如果沒有：**Add Component** → 搜尋 `HUDController` → 加入

### 32-2. 綁定 HUD 按鈕的 @property（逐欄指引）

選中 `HUD_TopRight`（掛有 HUDController 的節點），在 Inspector 找到 HUDController 腳本區塊。

你會看到這些空欄位。按照以下表格，**從 Hierarchy 面板把指定的東西拖到對應欄位**：

#### 🏷️ 文字標籤類（型別：Label，要拖「元件」不是「節點」）

| Inspector 欄位 | 從 Hierarchy 拖什麼 | 怎麼拖元件 |
|---------------|-------------------|-----------|
| `coinsLabel` | `HUD_TopRight` > `CoinsLabel` > `TouchTarget` > `Label` | 見下方說明 |
| `ocNameLabel` | `HUD_TopRight` > `OcNameLabel` > `TouchTarget` > `Label` | 見下方說明 |
| `bellBadgeLabel` | `HUD_TopRight` > `BellButton` > `BellBadge` > `BadgeLabel` | 見下方說明 |

> **怎麼拖「Label 元件」而不是「節點」？**
> 
> 方法 A（推薦）：
> 1. 先在 Hierarchy 選中目標節點（如 `CoinsLabel > TouchTarget > Label`）
> 2. 在 Inspector 中找到 `Label` 元件的**標題列**（顯示 `Label` 加一個小圖示的那行）
> 3. 按住標題列，直接拖到 HUDController 的欄位上
> 
> 方法 B：
> 1. 直接把節點拖到欄位上
> 2. 如果欄位型別是 `Label`，Cocos 會自動找到節點上的 Label 元件
> 3. 如果節點上沒有 Label 元件，欄位會顯示 `None`

#### 🔲 節點類（型別：Node，直接拖節點）

| Inspector 欄位 | 從 Hierarchy 拖什麼 |
|---------------|-------------------|
| `bellButtonNode` | `HUD_TopRight` > `BellButton` |
| `settingsButtonNode` | `HUD_TopRight` > `SettingsBtn` |
| `bellBadgeNode` | `HUD_TopRight` > `BellButton` > `BellBadge` |
| `chapterStoryBtnNode` | `LeftNavBar` > `ChapterStoryBtn` |

> 節點類很直覺：直接從 Hierarchy 拖過去就好。

#### 📋 陣列類（navButtons：Node 陣列）

| Inspector 欄位 | 操作 |
|---------------|------|
| `navButtons` | 先把陣列長度改為 `7` |
| Element 0 | 拖入 `LeftNavBar` > `NavBtn_公告` |
| Element 1 | 拖入 `LeftNavBar` > `NavBtn_任務` |
| Element 2 | 拖入 `LeftNavBar` > `NavBtn_日誌` |
| Element 3 | 拖入 `LeftNavBar` > `NavBtn_圖鑑` |
| Element 4 | 拖入 `LeftNavBar` > `NavBtn_背包` |
| Element 5 | 拖入 `LeftNavBar` > `NavBtn_NPC` |
| Element 6 | 拖入 `LeftNavBar` > `NavBtn_設定` |

> ⚠️ **陣列設定方式**：
> 1. 找到 `navButtons` 欄位，旁邊會有一個數字（目前可能是 `0`）
> 2. 把數字改成 `7`，按 Enter
> 3. 會出現 Element 0 ~ Element 6 共七個空格
> 4. 按順序把導航按鈕節點一個一個拖進去
> 
> ⚠️ **順序極重要！** 必須完全對應上表。錯位會導致點「任務」卻打開「日誌」。

### 32-3. 綁定完成後的 Inspector 應該長這樣

```
HUDController (Script)
├── coinsLabel:       [Label]     ← 顯示 CoinsLabel>TouchTarget>Label 的 Label 元件
├── ocNameLabel:      [Label]     ← 顯示 OcNameLabel>TouchTarget>Label 的 Label 元件
├── hpLabel:          [None]      ← 目前沒有 HP 顯示，留空即可
├── bellButtonNode:   [Node]      ← BellButton
├── bellBadgeNode:    [Node]      ← BellBadge
├── bellBadgeLabel:   [Label]     ← BadgeLabel 的 Label 元件
├── settingsButtonNode: [Node]    ← SettingsBtn
├── navButtons:       [7]
│   ├── Element 0:    [Node]      ← NavBtn_公告
│   ├── Element 1:    [Node]      ← NavBtn_任務
│   ├── Element 2:    [Node]      ← NavBtn_日誌
│   ├── Element 3:    [Node]      ← NavBtn_圖鑑
│   ├── Element 4:    [Node]      ← NavBtn_背包
│   ├── Element 5:    [Node]      ← NavBtn_NPC
│   └── Element 6:    [Node]      ← NavBtn_設定
└── chapterStoryBtnNode: [Node]   ← ChapterStoryBtn
```

> 如果任何欄位顯示 `None` 或 `Missing`，就是沒拖好，需要重新拖。

---

## 33. 綁定後的互動驗證

### 33-1. 預覽前檢查

1. **Ctrl + S** 存檔場景
2. 確認 Hierarchy 中 `HUD_TopRight` 的 HUDController 所有欄位都不是 `None`
3. 確認 `LeftNavBar` 所有子節點的 Layer 是 `UI_2D`

### 33-2. 預覽測試步驟

按下 **Play**，依序測試以下項目：

| 測試項目 | 操作 | 預期結果 |
|---------|------|---------|
| 導航按鈕 - 公告 | 點擊左側「公告」 | Console: `[HUDController] togglePanel: announcement`，畫面彈出公告面板 |
| 導航按鈕 - 任務 | 點擊左側「任務」 | Console: `[HUDController] togglePanel: quest`，畫面彈出任務面板 |
| 導航按鈕 - 背包 | 點擊左側「背包」 | Console: `[HUDController] togglePanel: inventory`，畫面彈出背包面板 |
| 設定按鈕 | 點擊右上 ⚙ | Console: `[HUDController] togglePanel: settings`，設定面板出現 |
| 鈴鐺按鈕 | 點擊右上 🔔 | Console: `[HUDController] togglePanel: notification`，通知面板出現 |
| 再次點擊同按鈕 | 再點同一個按鈕 | 面板關閉（toggle 行為） |

### 33-3. 如果點擊無反應，排查步驟

1. **Console 有沒有 Error？**
   - 如果有 `navButtons[x] is null` → 陣列元素沒拖好
   - 如果有 `bellButtonNode is null` → 鈴鐺節點沒綁

2. **確認 TouchTarget 有 Button 元件**
   - 選中任何一個按鈕的 `TouchTarget` 子節點
   - Inspector 裡應該看到 `Button` 元件
   - 如果沒有：**Add Component** → `Button`

3. **確認 TouchTarget 有 Sprite 元件**
   - Button 元件需要一個可渲染的目標（Sprite）才能接收觸控
   - 如果 TouchTarget 沒有 Sprite，按鈕不會響應觸控

4. **確認節點尺寸大於 0**
   - 如果 UITransform 的 W 或 H 是 0，觸控面積為零，點不到
   - 回去檢查手冊第 27/28 節的尺寸設定

5. **HUDController 是否掛在正確的節點上？**
   - HUDController 必須掛在 `HUD_TopRight` 上
   - 如果掛在 Canvas 或其他節點上，`_getTouchTarget()` 會找不到 TouchTarget 子節點

### 33-4. 驗證成功的完整 Console 輸出範例

```
=== MapSceneBuilder V4 已載入 ===
[MapSceneBuilder] ✅ 偵測到 Inspector 已綁定核心插座，跳過動態 UI 建構
[MapSceneBuilder] ⚙️ 已對所有子節點遞迴套用 UI_2D layer
[DIAG] Canvas worldPos=(640, 360) size=(1280, 720) anchor=(0.5, 0.5)
[DIAG]   child "MapArea" active=true layer=33554432 ...
[DIAG]   child "HUD_TopRight" active=true layer=33554432 ...
[DIAG]   child "LeftNavBar" active=true layer=33554432 ...
```

> `layer=33554432` 就是 `UI_2D` 的數值，代表 Layer 設定正確。

---

## 34. 面板關閉方式總覽

> 面板 shell（Backdrop / PanelBG / CloseButton / BodyRoot）由 MapSceneBuilder 自動建構，
> 你不需要手動做任何事，只要面板節點存在於 PanelLayer 下即可。
> Bug 修復詳情見 HANDOFF 文件 Bug 16。

### 34-1. 面板關閉的三種方式

| 方式 | 操作 | 觸發邏輯 |
|------|------|---------|
| 再次點擊同一導航按鈕 | 如：已開啟任務面板，再點「任務」 | HUDController.togglePanel() |
| 點擊面板右上角 ✕ 按鈕 | CloseButton | 各面板 hide() → emit 'panel-closed' |
| 點擊面板外的半透明遮罩 | Backdrop | 同上 |

---

## 35. 系統功能完整清單與現況

> 以下列出所有遊戲系統功能的完成狀態。
> ✅ = 可運作、⚠️ = 部分完成/需補內容、❌ = 尚未開始

### 35-1. 核心框架

| 功能 | 狀態 | 節點/腳本 | 說明 |
|------|------|----------|------|
| 場景載入與初始化 | ✅ | MapSceneBuilder.ts | V4 Inspector 偵測 + fallback |
| MVC 架構 | ✅ | MainGameController.ts | 所有事件中樞 |
| 資料管理 | ✅ | PTD_DataManager.ts | Supabase 整合 |
| 事件匯流排 | ✅ | DataEventBus.ts | 跨元件通訊 |
| 音效管理 | ✅ | SoundManager.ts | 面板開關音效 |

### 35-2. HUD 與導航

| 功能 | 狀態 | 節點 | 說明 |
|------|------|------|------|
| 金幣顯示 | ✅ | CoinsLabel | 綁定 DataEventBus.COINS_CHANGED |
| OC 名稱顯示 | ✅ | OcNameLabel | 登入後顯示 |
| HP 顯示 | ⚠️ | 尚未建立 | HUDController 有 hpLabel @property，但手冊未包含建立步驟 |
| 鈴鐺按鈕 + 紅點 | ✅ | BellButton + BellBadge | 呼叫 setUnreadCount() 控制 |
| 設定按鈕 | ✅ | SettingsBtn | 開啟設定面板 |
| 7 個導航按鈕 | ✅ | NavBtn_* | 對應 7 個面板 |
| 劇情按鈕 | ⚠️ | ChapterStoryBtn | 節點建好但預設隱藏，觸發條件待實作 |
| 縮放按鈕 | ⚠️ | ZoomInBtn / ZoomOutBtn | 節點建好，MapController 的縮放邏輯待綁定 |

### 35-3. 面板功能

| 面板 | 狀態 | 節點名稱 | 缺少什麼 |
|------|------|---------|---------|
| 設定面板 | ⚠️ | SettingsPanelNode | 音量 slider 待替換為真實 Slider 元件 |
| 任務面板 | ⚠️ | QuestPanelNode | 任務資料載入 + 列表渲染待完成 |
| 圖鑑面板 | ⚠️ | CollectionPanelNode | 圖鑑資料載入 + 格子渲染待完成 |
| 通知面板 | ⚠️ | NotificationPanelNode | 通知列表邏輯待完成 |
| 背包面板 | ⚠️ | InventoryPanelNode | Grid slot prefab + 道具載入待完成 |
| NPC 互動 | ⚠️ | NPCModalNode | NPC 對話 + 商店邏輯待完成 |
| 公告面板 | ⚠️ | WhiteCrowCardNode (tab:公告) | 公告資料來源待接入 |
| 日誌面板 | ⚠️ | WhiteCrowCardNode (tab:日誌) | 每日日誌資料待接入 |
| 道具詳情 | ⚠️ | ItemDetailModalNode | 使用按鈕邏輯待完成 |
| 據點故事 | ⚠️ | LandmarkStoryModalNode | 據點資料載入待完成 |

### 35-4. 地圖系統

| 功能 | 狀態 | 說明 |
|------|------|------|
| 據點標記顯示 | ✅ | MapController 載入 landmark-chapters.json |
| 據點點擊 | ✅ | emit 'landmark-selected' |
| 據點故事彈窗 | ⚠️ | LandmarkStoryModal shell 建好，資料待填入 |
| 地圖拖曳 | ❌ | MapArea 的觸控拖曳移動尚未實作 |
| 地圖縮放 | ❌ | ZoomIn/Out 按鈕已建，但 pinch/click 縮放邏輯未綁定 |

### 35-5. 戰鬥/敘事系統

| 功能 | 狀態 | 說明 |
|------|------|------|
| 章節開場動畫 | ⚠️ | ChapterOpeningController 腳本存在，動畫資源待製作 |
| 劇情對話 | ⚠️ | ChapterStoryModal 腳本存在，對白資料待接入 |
| 骰子結果 | ⚠️ | DiceResultOverlay 腳本存在，擲骰邏輯待完成 |
| 呼吸場景 | ⚠️ | BreathingSceneController 存在，機制待設計 |
| 遺物詩篇 | ⚠️ | RelicPoemModal 存在，觸發條件待設計 |

### 35-6. 陣營/對抗系統

| 功能 | 狀態 | 說明 |
|------|------|------|
| 叛教者面板 | ⚠️ | ApostatePanel 腳本存在，內容待設計 |
| 清算者面板 | ⚠️ | LiquidatorPanel 腳本存在，內容待設計 |
| 綁架彈窗 | ⚠️ | KidnapPopup 腳本存在，機制待設計 |
| 天秤結算 | ⚠️ | BalanceSettlementModal 存在，結算邏輯待完成 |
| 排行榜 | ⚠️ | LeaderboardPanel 存在，資料來源待接入 |
| 暴政排行 | ⚠️ | LeaderTyrannyPanel 存在，資料來源待接入 |

---

## 36. PanelLayer 內部節點清單（確認你已建立的）

> 以下是 PanelLayer 下所有面板節點。如果你之前已經在手冊 Phase 2 建立過，
> 請對照確認。如果有遺漏，請按照以下結構補建。

### 36-1. 目標結構

```
PanelLayer                            ← 已建立
├── SettingsPanelNode                 ← 確認已存在
├── QuestPanelNode                    ← 確認已存在
├── CollectionPanelNode               ← 確認已存在
├── NotificationPanelNode             ← 確認已存在
├── InventoryPanelNode                ← 確認已存在
├── NPCModalNode                      ← 確認已存在
├── WhiteCrowCardNode                 ← 確認已存在
├── ItemDetailModalNode               ← 確認已存在
├── LandmarkStoryModalNode            ← 可能遺漏
├── ApostatePanelNode                 ← 可能遺漏
├── LiquidatorPanelNode               ← 可能遺漏
├── KidnapPopupNode                   ← 可能遺漏
├── BalanceSettlementNode             ← 可能遺漏
├── LeaderboardPanelNode              ← 可能遺漏
└── LeaderTyrannyPanelNode            ← 可能遺漏
```

### 36-2. 每個面板節點的建立方式（統一步驟）

**所有面板節點結構相同，只要建一個空殼，程式會自動補建內部結構。**

1. **右鍵** `PanelLayer` → **建立空節點** → 改名（如 `LandmarkStoryModalNode`）
2. **🔴 Layer**：改為 `UI_2D`
3. **Add Component** → `UITransform` → W = `450`, H = `480`
4. **Add Component** → `Widget` → 勾選 Horizontal Center = `0`, Vertical Center = `0`
5. 取消勾選 **Active**（面板預設隱藏）
6. **Add Component** → 加入對應的**腳本元件**（見下表）

| 節點名稱 | 要加的腳本元件 |
|---------|-------------|
| `SettingsPanelNode` | `SettingsPanel` |
| `QuestPanelNode` | `QuestPanel` |
| `CollectionPanelNode` | `CollectionPanel` |
| `NotificationPanelNode` | `NotificationPanel` |
| `InventoryPanelNode` | `InventoryPanel` |
| `NPCModalNode` | `NPCModal` |
| `WhiteCrowCardNode` | `WhiteCrowCard` |
| `ItemDetailModalNode` | `ItemDetailModal` |
| `LandmarkStoryModalNode` | `LandmarkStoryModal` |
| `ApostatePanelNode` | `ApostatePanel` |
| `LiquidatorPanelNode` | `LiquidatorPanel` |
| `KidnapPopupNode` | `KidnapPopup` |
| `BalanceSettlementNode` | `BalanceSettlementModal` |
| `LeaderboardPanelNode` | `LeaderboardPanel` |
| `LeaderTyrannyPanelNode` | `LeaderTyrannyPanel` |

> 💡 不需要手動建立 Backdrop、PanelBG、CloseButton 等子節點！
> `MapSceneBuilder` 在 Runtime 會自動偵測並補建這些內部結構。

### 36-3. 綁定 MainGameController 的 @property

在掛有 `MainGameController` 腳本的節點上，把每個面板拖到對應欄位：

| Inspector 欄位 | 拖入的節點（上面的腳本元件） |
|---------------|------------------------|
| `settingsPanel` | `SettingsPanelNode` 上的 `SettingsPanel` 元件 |
| `questPanel` | `QuestPanelNode` 上的 `QuestPanel` 元件 |
| `collectionPanel` | `CollectionPanelNode` 上的 `CollectionPanel` 元件 |
| `notificationPanel` | `NotificationPanelNode` 上的 `NotificationPanel` 元件 |
| `inventoryPanel` | `InventoryPanelNode` 上的 `InventoryPanel` 元件 |
| `npcModal` | `NPCModalNode` 上的 `NPCModal` 元件 |
| `whiteCrowCard` | `WhiteCrowCardNode` 上的 `WhiteCrowCard` 元件 |
| `itemDetailModal` | `ItemDetailModalNode` 上的 `ItemDetailModal` 元件 |
| `landmarkStoryModal` | `LandmarkStoryModalNode` 上的 `LandmarkStoryModal` 元件 |
| `apostatePanel` | `ApostatePanelNode` 上的 `ApostatePanel` 元件 |
| `liquidatorPanel` | `LiquidatorPanelNode` 上的 `LiquidatorPanel` 元件 |
| `kidnapPopup` | `KidnapPopupNode` 上的 `KidnapPopup` 元件 |
| `balanceSettlementModal` | `BalanceSettlementNode` 上的 `BalanceSettlementModal` 元件 |
| `leaderboardPanel` | `LeaderboardPanelNode` 上的 `LeaderboardPanel` 元件 |
| `leaderTyrannyPanel` | `LeaderTyrannyPanelNode` 上的 `LeaderTyrannyPanel` 元件 |

> ⚠️ 注意：這些欄位的型別不是 Node，而是**腳本元件**。
> 拖節點過去時，Cocos 會自動抓取節點上的對應腳本。
> 如果抓不到（顯示 None），代表你還沒有在那個節點上 Add Component 加入對應腳本。

---

## 37. TransitionLayer 和 OverlayLayer 節點

### 37-1. TransitionLayer 內部節點

```
TransitionLayer                       ← 已建立
├── BreathingSceneNode               ← 確認/補建
├── ChapterOpeningNode               ← 確認/補建
├── ChapterStoryModalNode            ← 確認/補建
└── DiceResultOverlayNode            ← 確認/補建
```

建立方式同第 36-2 節（空節點 + UITransform + Widget + Active 取消 + 加腳本元件）：

| 節點名稱 | 要加的腳本元件 |
|---------|-------------|
| `BreathingSceneNode` | `BreathingSceneController` |
| `ChapterOpeningNode` | `ChapterOpeningController` |
| `ChapterStoryModalNode` | `ChapterStoryModal` |
| `DiceResultOverlayNode` | `DiceResultOverlay` |

### 37-2. OverlayLayer 內部節點

```
OverlayLayer                          ← 已建立
└── RelicPoemModalNode               ← 確認/補建
```

| 節點名稱 | 要加的腳本元件 |
|---------|-------------|
| `RelicPoemModalNode` | `RelicPoemModal` |

### 37-3. 綁定 MainGameController

| Inspector 欄位 | 拖入 |
|---------------|------|
| `breathingSceneCtrl` | BreathingSceneNode 上的 BreathingSceneController |
| `chapterOpeningCtrl` | ChapterOpeningNode 上的 ChapterOpeningController |
| `chapterStoryModal` | ChapterStoryModalNode 上的 ChapterStoryModal |
| `diceOverlay` | DiceResultOverlayNode 上的 DiceResultOverlay |
| `relicPoemModal` | RelicPoemModalNode 上的 RelicPoemModal |

---

## 38. Hierarchy 節點的順序（Z-Order 規則）

> **重要**：Cocos Creator 中，Hierarchy 越下面的節點越「上層」（後渲染 = 蓋住前面的）。
> 如果 HUD 被面板遮住無法點擊，就是順序有問題。

### 38-1. 正確的 Canvas 子節點順序（由上到下）

```
Canvas
├── MapArea              ← 最底層（地圖背景 + 據點）
├── PanelLayer           ← 面板層（開啟面板時顯示）
├── HUD_TopRight         ← 必須在 PanelLayer 下方（Hierarchy 中更下面）
├── LeftNavBar           ← 同上，確保不被面板遮住
├── RightToolbar         ← 同上
├── TransitionLayer      ← 轉場動畫（蓋住一切）
└── OverlayLayer         ← 最頂層（遺物詩篇等全螢幕覆蓋）
```

### 38-2. 如何調整順序

在 Hierarchy 面板中，**拖曳節點上下移動**即可調整渲染順序。
- 把 `HUD_TopRight` 拖到 `PanelLayer` 的**下方（Hierarchy 中更下面的位置）**
- 這樣 HUD 會渲染在面板上面，不會被遮住

> ⚠️ 如果你的 HUD/NavBar 目前在 PanelLayer 上面（Hierarchy 中更上面的位置），
> 請把它們往下拖，讓它們排在 PanelLayer 的後面。

---

## 39. 完整預覽驗證清單（更新版）

### Phase 1：基本渲染
- [ ] 登入後看到深色地圖背景
- [ ] 地圖上有黃色據點標記
- [ ] 右上角有金幣 / OC 名稱 / ⚙ / 🔔 按鈕
- [ ] 左側有 7 個導航按鈕
- [ ] 右側有 + / − 縮放按鈕

### Phase 2：面板互動
- [ ] 點左側「任務」→ 彈出任務面板（有背景、標題、✕ 按鈕）
- [ ] 點 ✕ → 面板關閉
- [ ] 點面板外的暗色區域 → 面板關閉
- [ ] 再次點「任務」→ 面板再開
- [ ] 點「任務」時已開 → 面板關閉（toggle）
- [ ] 點 ⚙ → 設定面板出現，有「繁體中文 / 简体中文」按鈕
- [ ] 點 🔔 → 通知面板出現

### Phase 3：Console 無錯誤
- [ ] Console 中沒有紅色 Error（黃色 Warning 目前可以忽略）
- [ ] 顯示 `[MapSceneBuilder] ✅ 偵測到 Inspector 已綁定核心插座`
- [ ] 顯示 `⚙️ 自動補建面板 shell` 相關訊息

### 常見問題速查

| 現象 | 原因 | 解法 |
|------|------|------|
| 按鈕看得到但不能點 | HUDController @property 未綁定 | 第 32 節 |
| 節點編輯器看得到但預覽看不到 | Layer 是 DEFAULT | 第 31 節 |
| 面板無法關閉 | PanelLayer 下面板節點缺少腳本元件 | 第 36 節 |
| HUD 被面板遮住 | Hierarchy 節點順序不對 | 第 38 節 |
| 點導航按鈕打開了錯誤的面板 | navButtons 陣列順序錯 | 第 32 節 |

---

## ★ §40 以後章節分類速查

> 每個章節標題旁附有責任方標記：
> - 🎮 = **Cocos Editor 端**（需要手動在編輯器操作）
> - 🖥️ = **程式端**（由 TypeScript 腳本處理，不需要在編輯器動手）
> - 📖 = **參考文件**（純閱讀，不需要操作）
> - ➡️ HANDOFF = 已移至 `COCOS_PREVIEW_DEBUG_HANDOFF.md`

| § | 標題 | 責任方 | 需要在 Editor 動手？ |
|---|------|--------|-------------------|
| 40 | 左側設定按鈕已移除 | 🎮 Cocos | ✅ 刪除 LeftNavBar 按鈕 |
| 41 | (已移至 HANDOFF) | ➡️ | — |
| 42 | MapSceneBuilder 擺放 | 🎮 Cocos | ✅ 確認節點層級 |
| 43 | (已移至 HANDOFF) | ➡️ | — |
| 44 | 面板 Shell 結構 | 🎮📖 Cocos 參考 | ⚠️ 對照用，不需額外操作 |
| 45 | (已移至 HANDOFF) | ➡️ | — |
| 46 | Console Log 速查 | 📖 參考 | — |
| 47 | (已移至 HANDOFF) | ➡️ | — |
| 48 | BlockInputEvents | 📖 參考 | — |
| 49-52 | (已移至 HANDOFF) | ➡️ | — |
| 53 | 新增面板的步驟 | 🎮 Cocos | ✅ 建節點 + 掛腳本 + 拖綁 |
| 54-58 | (已移至 HANDOFF) | ➡️ | — |
| 59 | Phase 6 API 準備 | 🎮+🖥️ 混合 | ✅ Server 啟動 + 確認面板拖綁 |
| 60 | Phase 7-A 任務回報 | 🎮 外殼確認 / 🖥️ 動態內容 | ⚠️ 內部列表由程式動態建立 |
| 61 | Phase 7-B 組隊面板 | 🎮 建外殼+靜態控件 / 🖥️ 成員列表 | ✅ 需建面板 + 按鈕 |
| 62 | Phase 7-C NPC 商人 | 🎮 建 TabBar+容器 / 🖥️ 商品列表 | ✅ 需建 TabBar + ShopTabContainer |
| 63 | Phase 7-D 漂流瓶 | 🎮 建外殼+WriteArea / 🖥️ 瓶列表 | ✅ 需建面板 + EditBox |
| 64 | Phase 7-D 公報 | 🎮 建 FilterBar / 🖥️ 公報列表 | ✅ 需建面板 + FilterBar |
| 65 | Phase 8 視覺效果 | 🎮 Cocos | ✅ 預留 FogLayer + GlitchGhost 空節點 |
| 66 | 驗證清單 | 📖 參考 | — |
| 67 | (已移至 HANDOFF) | ➡️ | — |

---

## 40. 左側設定按鈕已移除 🎮

> 設定功能現在只有右上角齒輪按鈕。Bug 詳情見 HANDOFF Bug 17。

### 編輯器內需要做的
1. 選中 `LeftNavBar`
2. 找到第 7 個按鈕子節點（可能名為 `NavBtn_設定` 或最後一個）
3. **右鍵 → 刪除** 該節點
4. 選中 `HUD_TopRight` → Inspector → `HUDController` → `navButtons`
5. 確認陣列大小為 **6**，順序對應：公告 / 任務 / 日誌 / 圖鑑 / 背包 / NPC

---

## 41. （已移至 HANDOFF 文件）

> 齒輪按鈕修復原理已移至 `COCOS_PREVIEW_DEBUG_HANDOFF.md` Bug 18-21。
> 事件冒泡機制的通用說明見 §47。

---

## 42. MapSceneBuilder 節點擺放規則 🎮

### 正確位置
```
Scene Root
├── Canvas            ← MainGameController 掛在這裡
│   ├── Camera
│   ├── MapArea
│   ├── HUD_TopRight
│   ├── LeftNavBar
│   ├── PanelLayer
│   └── ...
└── MapSceneBuilder   ← 放在 Scene Root 下，與 Canvas 同層
```

### 在編輯器中的操作
1. 在 Hierarchy 中右鍵 **Scene Root**（不是 Canvas）→ **建立空節點**
2. 改名為 `MapSceneBuilder`
3. 掛載 `MapSceneBuilder` 腳本
4. 確認它和 Canvas 是**同層**（兄弟節點），不是 Canvas 的子節點

---

## 43. （程式碼原理 — 已移至 HANDOFF / CLAUDE.md）

> `this.node` 陷阱、面板事件綁定原理等程式碼層面的說明，
> 請參閱 `COCOS_PREVIEW_DEBUG_HANDOFF.md` 及 `CLAUDE.md` §2a-2d。

---

## 44. 面板 Shell 結構（編輯器內的節點層級）🎮📖

每個面板節點（如 `SettingsPanelNode`）的完整結構如下：

```
SettingsPanelNode          ← 面板根節點（在 PanelLayer 下）
├── Backdrop               ← 全螢幕半透明遮罩（點擊可關閉）
│   ├── UITransform 1280×720
│   ├── Sprite (黑色 alpha=150)
│   └── Button
└── PanelBG                ← 面板主體背景
    ├── UITransform 520×560
    ├── Sprite (深色底)
    ├── BlockInputEvents   ← 防止點擊穿透到 Backdrop
    ├── HeaderBar          ← 標題灰色橫條
    ├── TitleLabel         ← 標題文字
    ├── BodyFrame          ← 半透明內容邊框
    ├── CloseButton        ← 右上角 X（紅色 34px）
    ├── CloseHintLabel     ← 「點空白區域也可關閉」提示
    └── BodyRoot           ← 面板專屬內容區域
```

### 重要
- `Backdrop` 不加 `BlockInputEvents`（需要接收點擊來關閉面板）
- `PanelBG` 一定要加 `BlockInputEvents`（防止穿透到 Backdrop）
- 如果你在 Inspector 中手動建了這些子節點，V4 會跳過自動補建

---

## 45. （程式碼原理 — 已移至 HANDOFF）

> 面板事件綁定原理（每次 runtime 都要重綁）的技術細節，
> 請參閱 `COCOS_PREVIEW_DEBUG_HANDOFF.md`。

---

## 46. Console Log 關鍵字速查 📖

Preview 後在瀏覽器 F12 → Console 搜尋以下關鍵字確認狀態：

| 關鍵字 | 含義 | 正常/異常 |
|--------|------|----------|
| `V4 已載入` | MapSceneBuilder 腳本有執行 | ✅ 正常 |
| `✅ 偵測到 Inspector` | V4 路徑啟用，跳過動態建構 | ✅ 正常 |
| `⚙️ 面板 shell 就緒` | 面板內部結構已建構 + 事件已綁定 | ✅ 正常 |
| `⏭️ panel 未綁定` | MainGameController 缺少該面板的 @property | ⚠️ 需補綁 |
| `⏭️ 找不到此節點` | PanelLayer 下沒有對應名稱的節點 | ⚠️ 需建立 |
| `PanelLayer 不存在` | Canvas 下沒有 PanelLayer | 🔴 結構錯誤 |
| `settingsButtonNode 未綁定` | 齒輪按鈕沒拖入 Inspector | ⚠️ 需補綁 |
| `齒輪 TOUCH_END → settings` | 齒輪點擊觸發 | ✅ 正常 |
| `開啟面板：XXX` | MainGameController 收到面板開啟請求 | ✅ 正常 |

---

## 47. （程式碼原理 — 已移至 HANDOFF）

> 事件冒泡機制的技術原理，
> 請參閱 `COCOS_PREVIEW_DEBUG_HANDOFF.md` §十一 Bug Pattern Framework。

---

## 48. BlockInputEvents 元件說明 📖

### 用途
阻止觸控事件穿透到**下方（Z-Order 更低）**的節點。

### 什麼時候要加
- 面板主體（PanelBG）→ 防止點擊面板內容時觸發 Backdrop 關閉
- 彈窗對話框 → 防止點擊對話框時操作底下的地圖
- 各 NavBtn / SettingsBtn 的 TouchTarget → 防止事件穿透

### 什麼時候不加
- Backdrop → 需要接收點擊來關閉面板，不能阻擋

---

## 49–52. （程式碼原理 — 已移至 HANDOFF / CLAUDE.md）

> 以下內容為程式碼層面的說明，已移至對應文件：
> - 面板 open/close 流程圖 → `COCOS_PREVIEW_DEBUG_HANDOFF.md`
> - HUD/LeftNavBar 配置 → 見 §27-28 的建立步驟
> - MapSceneBuilder Auto-Fix 機制 → `COCOS_PREVIEW_DEBUG_HANDOFF.md`

---

## 53. 新增面板的編輯器步驟 🎮

如果未來需要新增一個面板（例如「成就面板」），在編輯器中的操作步驟：

### 步驟 1：建立節點
1. 在 PanelLayer 下新增空節點 → 命名 `AchievementPanelNode`
2. 加入 UITransform → 450×480
3. 設 Layer → UI_2D（套用到子節點）
4. 取消勾選 Active（預設隱藏）
5. Add Component → `AchievementPanel`（腳本需先由程式端建立）

### 步驟 2：建立面板殼
按照 §20-2 的通用面板結構（步驟 A~I），建立 Backdrop、PanelBG、HeaderBar、TitleLabel、CloseButton、BodyRoot 等子節點。

### 步驟 3：Inspector 拖綁
1. 選中掛有 `MainGameController` 的節點
2. 找到 `achievementPanel` 欄位 → 拖入 `AchievementPanelNode`

### 步驟 4：新增入口按鈕（可選）
如果需要從左側導航開啟，在 `LeftNavBar` 下新增一個 NavBtn 按鈕（參照 §28）。

---

## 54–58. （程式碼原理 — 已移至 HANDOFF / CLAUDE.md）

> 以下內容為程式碼層面的說明，已移至對應文件：
> - 面板 show/hide/toggle 模式 → `CLAUDE.md`
> - SoundManager / DataEventBus / 場景轉場 → `CLAUDE.md`
> - Cocos Creator 3.8.2 常見陷阱 → `COCOS_PREVIEW_DEBUG_HANDOFF.md`


---

## 59. Phase 6 — API 接通前的編輯器準備 🎮🖥️

> **背景**：目前 6 個面板使用模擬資料（Mock），接下來需要改為呼叫真實 Server API。
> 編輯器端不需要修改節點結構，但需要確認以下項目。

### 59-1. 確認 Server 環境就緒

1. 打開終端機，進入專案根目錄
2. 執行 `npm run server`（啟動 `server/index.ts`）
3. 確認 Console 出現 `Server listening on port 3001`
4. 如果沒出現，檢查 `server/index.ts` 是否存在

### 59-2. 確認 Supabase 連線（由程式端處理）

> 不需要在編輯器中做任何事。這些面板改為真實 API 後，資料走向變為：
> - 面板 → DataManager.fetchXxx() → `fetch()` 呼叫 Server → Supabase DB

### 59-3. 完成後要確認的 6 個面板

完成 API 接通後，回到編輯器 Preview，逐一測試：

| 面板 | Preview 時的預期行為 | Console 應該看到 |
|------|---------------------|-----------------|
| ApostatePanel | 問卷提交後 → 不再只存 localStorage，Console 出現 API 回應 | `[DataManager] submitScreening 成功` |
| LiquidatorPanel | 輸入名字掃描 → 結果來自 Server，不再隨機 | `[DataManager] liquidatorScan 成功` |
| LeaderTyrannyPanel | 徵稅/詛咒/法令/懸賞/國庫 → Console 出現 API 回應 | `[DataManager] leader.tax 成功` 等 |
| LeaderboardPanel | 開啟後 → 排行榜資料來自 DB | `[DataManager] fetchLeaderboard 成功` |
| BalanceSettlementModal | 結算動畫 → 數值來自 Server | `[DataManager] getSettlementResult 成功` |
| InventoryPanel | 背包 → 顯示 DB 中的道具而非 8 筆假資料 | `[DataManager] fetchInventory 成功` |

---

## 60. Phase 7-A — 任務回報系統 🎮🖥️

> **涉及腳本**：`QuestPanel.ts`（修改）、`PTD_DataManager.ts`（修改）
> **前提**：`QuestPanelNode` 已經在 §20-3 面板 2 中建好外殼。本節在其 BodyRoot 內補建回報功能節點。
>
> ⚠️ **責任分工**：
> - 🎮 **Cocos 端**：確認 QuestContent、QuestEmptyLabel 存在；可選建立 ScrollView
> - 🖥️ **程式端**：每一筆任務行（Title / Status / ReportBtn）由 `_createQuestRow()` 動態建立，**不需要在 Editor 建模板**

### 60-1. 目標節點結構

```
QuestPanelNode                       ← 已建立（§20-3 面板 2）
├── Backdrop                         ← 已建立
└── PanelBG                          ← 已建立
    ├── HeaderBar                    ← 已建立
    ├── TitleLabel                   ← 已建立（string = 任務面板）
    ├── CloseButton                  ← 已建立
    ├── CloseHintLabel               ← 已建立
    └── BodyRoot                     ← 已建立
        ├── QuestContent             ← 已建立 🎮（Layout）→ 綁到 contentContainer
        ├── QuestEmptyLabel          ← 已建立 🎮（Label）→ 綁到 emptyLabel
        ├── QuestListScrollView      ← 🆕 🎮 可選建（ScrollView 元件）
        │   └── view                 ← ScrollView 自動產生
        │       └── content          ← 🆕 🎮 可選建（Layout 元件）
        └── 🖥️ 以下由程式動態建立（不需手動建）──
            └── Quest_XXX            ← 🖥️ _createQuestRow() 動態產生
                ├── Title            ← 🖥️ Label
                ├── Status           ← 🖥️ Label
                ├── Reward           ← 🖥️ Label
                └── ReportBtn        ← 🖥️（待程式端新增回報功能後加入）
```

### 60-2. 建立 QuestListScrollView

1. 在 Hierarchy 面板，**右鍵** `BodyRoot` → **建立空節點 (Create Empty Node)**
2. 改名為 `QuestListScrollView`
3. **🔴 Layer 設定**：Inspector 最上方 → Layer → 改為 `UI_2D` → 彈窗選「套用到子節點」
4. 選中 `QuestListScrollView`，在 Inspector：
   - **Add Component** → `UITransform` → W = `410`, H = `320`
   - **Add Component** → `ScrollView`
   - ScrollView 設定：Direction = `VERTICAL`
5. ScrollView 加好後會自動產生 `view` 子節點
6. **右鍵** `view` → **建立空節點** → 改名為 `content`
7. 選中 `con🖥️ 任務項目（程式端動態建立）

> **以下由 `QuestPanel._createQuestRow()` 在 runtime 動態建立，不需要在 Editor 手動建模板。**
> 
> 程式端為每一筆任務建立的節點結構：
> - `Quest_XXX`（UITransform 400×60）
>   - `Title`（Label, fontSize=14, 任務名稱）
>   - `Status`（Label, fontSize=11, 進行中/已完成/未解鎖）
>   - `Reward`（Label, fontSize=11, 獎勵幣數）
>   - `ReportBtn`（待程式端加入，Button + Label = 回報）
>
> ⚠️ 如果之後要改任務行的外觀、大小、字體，**請找程式端修改 `_createQuestRow()` 函數**。

### 60-4. Inspector 拖綁 🎮

1. 選中 `QuestPanelNode`（掛有 `QuestPanel` 腳本的節點）
2. 在 Inspector 中確認以下欄位已拖綁：

| Inspector 欄位名 | 拖入節點 | 節點類型 | 狀態 |
|-----------------|---------|---------|------|
| `bgSprite` | `PanelBG` | Sprite | §20-3 已建 |
| `titleLabel` | `TitleLabel` | Label | §20-3 已建 |
| `closeButton` | `CloseButton` | Node | §20-3 已建 |
| `contentContainer` | `QuestContent` | Node | §20-3 已建 |
| `emptyLabel` | `QuestEmptyLabel` | Label | §20-3 已建 |
| `scrollView` | `QuestListScrollView` | ScrollView | 🆕 若已建則綁 |

### 60-5. 確認清單

- [ ] `QuestContent` (Layout VERTICAL) 存在於 `BodyRoot` 下 → 已綁到 `contentContainer`
- [ ] `QuestEmptyLabel` (Label) 存在於 `BodyRoot` 下 → 已綁到 `emptyLabel`
- [ ] （可選）`QuestListScrollView` 若已建，綁到 `scrollView`
- [ ] ⚠️ **不需要**建立 QuestItemTemplate — 由程式端 `_createQuestRow()` 動態建立el
            │   ├── JoinPartyBtn     ← 🆕 新建（Button 元件 + 子 Label）
            │   │   └── Label
            │   └── EndPartyBtn      ← 🆕 新建（Button 元件 + 子 Label）
            │       └── Label
            └── PartyStoryScrollView ← 🆕 新建（ScrollView 元件）
                └── view
                    └── content      ← 🆕 新建
                        └── StoryLabel ← 🆕 新建（Label 元件）
```

### 61-2. 建立面板外殼（步驟 A~I）

按 §20-2 通用步驟逐步建立。以下標出差異：

1. **右鍵** `PanelLayer` → **建立空節點** → 改名為 `PartyPanelNode`
2. `UITransform`：W = `500`, H = `520`
3. `Widget`：勾選 `Horizontal Center` = 0, `Vertical Center` = 0
4. **⚠️ 取消勾選 Active**
5. **Add Component** → `PartyPanel`（腳本需先由程式端建立，若尚未建立則先跳過此步）
6. **🔴 Layer**：改為 `UI_2D` → 「套用到子節點」
7. 按 §20-2 步驟 B~I 建立 Backdrop、PanelBG、HeaderBar、TitleLabel（string = **組隊**）、CloseButton、CloseHintLabel、BodyRoot
   - Backdrop：W = `1280`, H = `720`, Sprite Color = `(0, 0, 0, 150)`, Button, **不加** BlockInputEvents
   - PanelBG：W = `520`, H = `560`, Sprite Color = `(19, 24, 39, 245)`, **加** BlockInputEvents

### 61-3. 建立 PartyStatusLabel（Label 元件）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `PartyStatusLabel`
2. `UITransform`：W = `380`, H = `30`
3. Position：`(0, 150, 0)`
4. **Add Component** → `Label` → string = `尚未加入隊伍`, fontSize = `15`
5. Label → Horizontal Align = `CENTER`, Color = `(248, 250, 252, 255)`

### 61-4. 建立 MemberListScrollView（ScrollView 元件）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `MemberListScrollView`
2. `UITransform`：W = `380`, H = `180`
>
> ⚠️ **責任分工**：
> - 🎮 **Cocos 端**：建面板外殼 + PartyStatusLabel + ButtonBar（3 個按鈕）→ 靜態控件
> - 🖥️ **程式端**：成員列表內容由程式動態建立；PartyStoryScrollView 的文字由程式更新
3. Position：`(0, 30, 0)`
4. **Add Component** → `ScrollView` → Direction = `VERTICAL`
5. 在自動產生的 `view` 下建立 `content` 節點：
   - `UITransform`：W = `380`, H = `180`
   - **Add Component** → `Layout` → Type = `VERTICAL`, SpacingY = `6`, ResizeMode = `CONTAINER`
6. 回到 ScrollView 元件 → 拖入 `content` 到 `Content` 欄位

### 61-5. 建立 ButtonBar（Layout 元件，水平排列按鈕）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `ButtonBar`
2. `UITransform`：W = `380`, H = `52`
3. Position：`(0, -80, 0)`
4. **Add Component** → `Layout` → Type = `HORIZONTAL`, SpacingX = `12`, ResizeMode = `NONE`

#### 建立 DrawCardBtn（Button 元件）

1. **右鍵** `ButtonBar` → **建立空節點** → 改名為 `DrawCardBtn`
2. `UITransform`：W = `110`, H = `42`
3. **Add Component** → `Sprite` → Color = `(168, 85, 247, 240)`（紫色）
4. **Add Component** → `Button`
5. **右鍵** `DrawCardBtn` → **建立空節點** → 改名為 `Label`
6. `UITransform`：W = `110`, H = `42`
7. **Add Component** → `Label` → string = `抽牌`, fontSize = `15`, Horizontal/Vertical = `CENTER`
8. Color = `(255, 255, 255, 255)`

#### 建立 JoinPartyBtn（Button 元件）

複製 DrawCardBtn 的步驟，差異：
- 節點名 = `JoinPartyBtn`
- Sprite Color = `(34, 197, 94, 240)`（綠色）
- Label string = `加入隊伍`

#### 建立 EndPartyBtn（Button 元件）

複製 DrawCardBtn 的步驟，差異：
- 節點名 = `EndPartyBtn`
- Sprite Color = `(239, 68, 68, 240)`（紅色）
- Label string = `結束隊伍`
- **⚠️ 取消勾選 Active**（僅隊長可見，由程式控制）

### 61-6. 建立 PartyStoryScrollView（ScrollView 元件）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `PartyStoryScrollView`
2. `UITransform`：W = `380`, H = `120`
3. Position：`(0, -170, 0)`
4. **Add Component** → `ScrollView` → Direction = `VERTICAL`
5. 在 `view` 下建立 `content`：
   - `UITransform`：W = `380`, H = `120`
   - **Add Component** → `Layout` → Type = `VERTICAL`, ResizeMode = `CONTAINER`
6. **右鍵** `content` → **建立空節點** → 改名為 `StoryLabel`
   - `UITransform`：W = `360`, H = `100`
   - **Add Component** → `Label` → string = `組隊敘事將顯示在此`, fontSize = `12`, Overflow = `CLAMP`
   - Color = `(203, 213, 225, 255)`（淺灰）

### 61-7. Inspector 拖綁 MainGameController

1. 選中掛有 `MainGameController` 的節點（Canvas 或 GameRoot）
2. 等程式端新增 `partyPanel` @property 後，拖入 `PartyPanelNode`

| Inspector 欄位名 | 拖入節點 | 節點類型 |
|-----------------|---------|---------|
| `partyPanel` | `PartyPanelNode` | PartyPanel (Component) |

### 61-8. 新增組隊入口按鈕（在 LeftNavBar）

> 如果決定從 LeftNavBar 開啟組隊面板：

1. **右鍵** `LeftNavBar` → **建立空節點** → 改名為 `NavBtn_Party`
2. `UITransform`：W = `40`, H = `40`
3. **Add Component** → `Sprite` → Color = `(71, 85, 105, 240)`
4. **Add Component** → `Button`
5. **Add Component** → `BlockInputEvents`
6. **右鍵** `NavBtn_Party` → **建立空節點** → 改名為 `Label`
   - `UITransform`：W = `40`, H = `40`
   - **Add Component** → `Label` → string = `組`, fontSize = `18`
   - Horizontal/Vertical = `CENTER`, Color = `(248, 250, 252, 255)`
7. 回去 `HUDController` → `navButtons` 陣列 → 將 `NavBtn_Party` 加入到正確位置

### 61-9. 確認清單

- [ ] `PartyPanelNode` 在 `PanelLayer` 下，**Active = false**
- [ ] 面板外殼完整：Backdrop (Sprite+Button) / PanelBG (Sprite+BlockInputEvents) / HeaderBar / TitleLabel (組隊) / CloseButton / BodyRoot
- [ ] `PartyStatusLabel` (Label) 在 BodyRoot 下
- [ ] `MemberListScrollView` (ScrollView) 在 BodyRoot 下，內有 `content` (Layout)
- [ ] `ButtonBar` (Layout HORIZONTAL) 在 BodyRoot 下，內有 3 個 Button：DrawCardBtn(紫) / JoinPartyBtn(綠) / EndPartyBtn(紅, Active=false)
- [ ] `PartyStoryScrollView` (ScrollView) 在 BodyRoot 下
- [ ] 所有節點 Layer = `UI_2D`

---

## 62. Phase 7-C — NPC 商人交易 UI 🎮🖥️

> **涉及腳本**：`NPCModal.ts`（修改）
> **操作位置**：在已建好的 `NPCModalNode` 內部增加商店功能節點

### 62-1. 目標節點結構

```
NPCModalNode                         ← 已建立
├── Backdrop                         ← 已建立
└── PanelBG                          ← 已建立
    ├── HeaderBar                    ← 已建立
    ├── TitleLabel                   ← 已建立
    ├── CloseButton                  ← 已建立
    ├── TabBar                       ← 🆕 新建（Layout 元件，水平排列）
    │   ├── TabBtn_Dialog            ← 🆕 新建（Button 元件 + 子 Label）
    │   │   └── Label
    │   └── TabBtn_Shop              ← 🆕 新建（Button 元件 + 子 Label）
    │       └── Label
    └── BodyRoot                     ← 已建立
        ├── DialogueLabel            ← 已建立
        ├── ShopContainer            ← 已建立（或需確認）
        ├── ActionButton             ← 已建立
        └── ShopTabContainer         ← 🆕 新建（Active=false）
            ├── ShopScrollView       ← 🆕 新建（ScrollView 元件）
            │   └── view
            │       └── content      ← 🆕 新建（Layout 元件）
            ├── ShopItemTemplate     ← 🆕 新建（Active=false，模板用）
            │   ├── ItemIcon         ← 🆕 新建（Sprite 元件，佔位色塊）
            │   ├── ItemName         ← 🆕 新建（Label 元件）
            │   ├── ItemPrice        ← 🆕 新建（Label 元件）
            │   └── ItemBuyBtn       ← 🆕 新建（Button 元件 + 子 Label）
            │       └── Label
            └── BuyConfirmBtn        ← 🆕 新建（Button 元件 + 子 Label）
                └── Label
```

### 62-2. 建立 TabBar（Layout 元件）

1. **右鍵** `PanelBG` → **建立空節點** → 改名為 `TabBar`
2. `UITransform`：W = `300`, H = `36`
3. Position：`(0, 220, 0)`（在 HeaderBar 正下方）
4. **Add Component** → `Layout` → Type = `HORIZONTAL`, SpacingX = `8`, ResizeMode = `NONE`
5. **🔴 Layer**：`UI_2D`

#### 建立 TabBtn_Dialog（Button 元件）

1. **右鍵** `TabBar` → **建立空節點** → 改名為 `TabBtn_Dialog`
2. `UITransform`：W = `90`, H = `30`
3. **Add Component** → `Sprite` → Color = `(59, 130, 246, 240)`（藍色 = 選中態）
4. **Add Component** → `Button`
5. **右鍵** `TabBtn_Dialog` → **建立空節點** → 改名為 `Label`
6. `UITransform`：W = `90`, H = `30`
7. **Add Component** → `Label` → string = `對話`, fontSize = `14`, Horizontal/Vertical = `CENTER`
8. Color = `(255, 255, 255, 255)`

#### 建立 TabBtn_Shop（Button 元件）

複製 TabBtn_Dialog 的步驟，差異：
- 節點名 = `TabBtn_Shop`
- Sprite Color = `(71, 85, 105, 240)`（灰色 = 未選中態）
- Label string = `商店`

### 62-3. 建立 ShopTabContainer

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `ShopTabContainer`
2. `UITransform`：W = `430`, H = `340`
3. **⚠️ 取消勾選 Active**（預設顯示對話頁，切換到商店時才開啟）

### 62-4. 建立 ShopScrollView（ScrollView 元件）

1. **右鍵** `ShopTabContainer` → **建立空節點** → 改名為 `ShopScrollView`
2. `UITransform`：W = `410`, H = `270`
3. Position：`(0, 15, 0)`
4. **Add Component** → `ScrollView` → Direction = `VERTICAL`
5. 在 `view` 下建立 `content`：
   - `UITransform`：W = `410`, H = `270`
   - **Add Component** → `Layout` → Type = `VERTICAL`, SpacingY = `6`, ResizeMode = `CONTAINER`

### 62-5. 建立 ShopItemTemplate（模板，Active=false）

1. **右鍵** `ShopTabContainer` → **建立空節點** → 改名為 `ShopItemTemplate`
2. `UITransform`：W = `400`, H = `60`
3. **Add Component** → `Sprite` → Color = `(30, 36, 50, 180)`
4. **Add Component** → `Layout` → Type = `HORIZONTAL`, SpacingX = `8`, Padding = `(6, 6, 6, 6)`
5. **⚠️ 取消勾選 Active**

#### 在 ShopItemTemplate 內建立子節點

| 步驟 | 節點名 | 元件 | UITransform | 設定 |
|------|--------|------|-------------|------|
| 1 | `ItemIcon` | Sprite | W=48, H=48 | Color = `(100, 100, 100, 255)`（灰色佔位） |
| 2 | `ItemName` | Label | W=180, H=24 | string = `商品名稱`, fontSize = `13`, Color = `(228, 232, 240, 255)` |
| 3 | `ItemPrice` | Label | W=80, H=24 | string = `0 幣`, fontSize = `13`, Color = `(250, 204, 21, 255)`（金色） |
| 4 | `ItemBuyBtn` | Button + Sprite | W=70, H=30 | Sprite Color = `(34, 197, 94, 240)`（綠色） |
| 4a | `ItemBuyBtn/Label` | Label | W=70, H=30 | string = `購買`, fontSize = `13`, Color = `(255, 255, 255, 255)` |

### 62-6. 建立 BuyConfirmBtn（Button 元件）

1. **右鍵** `ShopTabContainer` → **建立空節點** → 改名為 `BuyConfirmBtn`
2. `UITransform`：W = `120`, H = `40`
3. Position：`(0, -145, 0)`
4. **Add Component** → `Sprite` → Color = `(59, 130, 246, 240)`
5. **Add Component** → `Button`
6. **右鍵** `BuyConfirmBtn` → **建立空節點** → 改名為 `Label`
   - `UITransform`：W = `120`, H = `40`
   - **Add Component** → `Label` → string = `確認購買`, fontSize = `14`, Horizontal/Vertical = `CENTER`
   - Color = `(255, 255, 255, 255)`

### 62-7. Inspector 拖綁

等程式端在 `NPCModal` 腳本中新增 @property 後：

| Inspector 欄位名 | 拖入節點 | 節點類型 |
|-----------------|---------|---------|
| `shopTabContainer` | `ShopTabContainer` | Node |
| `tabBtnDialog` | `TabBtn_Dialog` | Node |
| `tabBtnShop` | `TabBtn_Shop` | Node |
| `shopScrollContent` | `ShopScrollView > view > content` | Node |
| `shopItemTemplate` | `ShopItemTemplate` | Node |

### 62-8. 確認清單

- [ ] `TabBar` 在 `PanelBG` 下，有 `Layout` (HORIZONTAL)
- [ ] `TabBtn_Dialog` (Button + 子 Label = 對話) 和 `TabBtn_Shop` (Button + 子 Label = 商店) 在 TabBar 下
- [ ] `ShopTabContainer` 在 `BodyRoot` 下，**Active = false**
- [ ] `ShopScrollView` (ScrollView) 在 ShopTabContainer 下
- [ ] `ShopItemTemplate` 在 ShopTabContainer 下,**Active = false**，內有 ItemIcon(Sprite) / ItemName(Label) / ItemPrice(Label) / ItemBuyBtn(Button+Label)
- [ ] `BuyConfirmBtn` (Button + 子 Label = 確認購買) 在 ShopTabContainer 下
- [ ] 所有節點 Layer = `UI_2D`

---

## 63. Phase 7-D — 漂流瓶系統 🎮🖥️

> **涉及腳本**：新建 `DriftFragmentPanel.ts`（由程式端建立）
> **新增節點**：在 `PanelLayer` 下新建 `DriftFragmentPanelNode`

### 63-1. 目標節點結構

```
PanelLayer                           ← 已建立
└── DriftFragmentPanelNode           ← 🆕 新建（DriftFragmentPanel 腳本）
    ├── Backdrop                     ← 🆕 新建（Sprite + Button）
    └── PanelBG                      ← 🆕 新建（Sprite + BlockInputEvents）
        ├── HeaderBar                ← 🆕 新建（Sprite）
        ├── TitleLabel               ← 🆕 新建（Label，string = 漂流瓶）
        ├── CloseButton              ← 🆕 新建（Button + Label）
        ├── CloseHintLabel           ← 🆕 新建（Label）
        └── BodyRoot                 ← 🆕 新建
            ├── FragmentScrollView   ← 🆕 新建（ScrollView 元件）
            │   └── view
            │       └── content      ← 🆕 新建（Layout 元件）
            ├── FragmentTemplate     ← 🆕 新建（Active=false）
            │   ├── SenderLabel      ← 🆕 新建（Label 元件）
            │   └── ContentLabel     ← 🆕 新建（Label 元件）
            ├── WriteArea            ← 🆕 新建
            │   ├── ContentEditBox   ← 🆕 新建（EditBox 元件）
            │   └── SendBtn          ← 🆕 新建（Button 元件 + 子 Label）
            │       └── Label
            └── EmptyLabel           ← 🆕 新建（Label 元件）
```

### 63-2. 建立面板外殼

與 §61-2 相同步驟，差異：
- 節點名 = `DriftFragmentPanelNode`
- `UITransform`：W = `420`, H = `460`
- TitleLabel string = **漂流瓶**

### 63-3. 建立 FragmentScrollView（ScrollView 元件）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `FragmentScrollView`
2. `UITransform`：W = `380`, H = `220`
3. Position：`(0, 30, 0)`
4. **Add Component** → `ScrollView` → Direction = `VERTICAL`
5. 在 `view` 下建立 `content`：
   - `UITransform`：W = `380`, H = `220`
   - **Add Component** → `Layout` → Type = `VERTICAL`, SpacingY = `6`, ResizeMode = `CONTAINER`

### 63-4. 建立 FragmentTemplate（模板，Active=false）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `FragmentTemplate`
2. `UITransform`：W = `370`, H = `56`
3. **Add Component** → `Sprite` → Color = `(30, 36, 50, 180)`
4. **⚠️ 取消勾選 Active**

#### FragmentTemplate 子節點

| 步驟 | 節點名 | 元件 | UITransform | 設定 |
|------|--------|------|-------------|------|
| 1 | `SenderLabel` | Label | W=100, H=20 | string = `寄件者`, fontSize = `11`, Position = `(-120, 14, 0)`, Color = `(163, 230, 53, 255)` |
| 2 | `ContentLabel` | Label | W=340, H=30 | string = `瓶中信內容`, fontSize = `12`, Position = `(0, -8, 0)`, Color = `(203, 213, 225, 255)` |

### 63-5. 建立 WriteArea（撰寫區）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `WriteArea`
2. `UITransform`：W = `380`, H = `100`
3. Position：`(0, -120, 0)`

#### 建立 ContentEditBox（EditBox 元件）

1. **右鍵** `WriteArea` → **建立空節點** → 改名為 `ContentEditBox`
2. `UITransform`：W = `280`, H = `70`
3. Position：`(-40, 0, 0)`
4. **Add Component** → `EditBox`
   - Input Mode = `ANY`
   - Max Length = `100`
   - Placeholder = `寫下你的漂流瓶訊息...`
   - Font Size = `13`

#### 建立 SendBtn（Button 元件）

1. **右鍵** `WriteArea` → **建立空節點** → 改名為 `SendBtn`
2. `UITransform`：W = `80`, H = `36`
3. Position：`(155, 0, 0)`
4. **Add Component** → `Sprite` → Color = `(59, 130, 246, 240)`
5. **Add Component** → `Button`
6. **右鍵** `SendBtn` → **建立空節點** → 改名為 `Label`
   - `UITransform`：W = `80`, H = `36`
   - **Add Component** → `Label` → string = `投放`, fontSize = `14`, Horizontal/Vertical = `CENTER`
   - Color = `(255, 255, 255, 255)`

### 63-6. 建立 EmptyLabel（Label 元件）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `EmptyLabel`
2. `UITransform`：W = `360`, H = `28`
3. Position：`(0, 30, 0)`
4. **Add Component** → `Label` → string = `目前沒有漂流瓶`, fontSize = `14`
5. Horizontal Align = `CENTER`, Color = `(148, 163, 184, 255)`

### 63-7. Inspector 拖綁 MainGameController

| Inspector 欄位名 | 拖入節點 | 節點類型 |
|-----------------|---------|---------|
| `driftFragmentPanel` | `DriftFragmentPanelNode` | DriftFragmentPanel (Component) |

### 63-8. 確認清單

- [ ] `DriftFragmentPanelNode` 在 `PanelLayer` 下，**Active = false**
- [ ] 面板外殼完整（Backdrop / PanelBG / HeaderBar / TitleLabel = 漂流瓶 / CloseButton / BodyRoot）
- [ ] `FragmentScrollView` (ScrollView) 在 BodyRoot 下
- [ ] `FragmentTemplate` (Active=false) 內有 SenderLabel(Label) + ContentLabel(Label)
- [ ] `WriteArea` 內有 ContentEditBox(EditBox) + SendBtn(Button+Label)
- [ ] `EmptyLabel` (Label) 在 BodyRoot 下
- [ ] 所有節點 Layer = `UI_2D`

---

## 64. Phase 7-D 續 — 公報系統 🎮🖥️

> **涉及腳本**：新建 `GazettePanel.ts`（由程式端建立）
> **新增節點**：在 `PanelLayer` 下新建 `GazettePanelNode`

### 64-1. 目標節點結構

```
PanelLayer                           ← 已建立
└── GazettePanelNode                 ← 🆕 新建（GazettePanel 腳本）
    ├── Backdrop                     ← 🆕 新建（Sprite + Button）
    └── PanelBG                      ← 🆕 新建（Sprite + BlockInputEvents）
        ├── HeaderBar                ← 🆕 新建（Sprite）
        ├── TitleLabel               ← 🆕 新建（Label，string = 公報）
        ├── CloseButton              ← 🆕 新建（Button + Label）
        ├── CloseHintLabel           ← 🆕 新建（Label）
        └── BodyRoot                 ← 🆕 新建
            ├── FilterBar            ← 🆕 新建（Layout 元件，水平排列）
            │   ├── FilterBtn_All    ← 🆕 新建（Button 元件 + 子 Label）
            │   ├── FilterBtn_Mission← 🆕 新建（Button 元件 + 子 Label）
            │   ├── FilterBtn_System ← 🆕 新建（Button 元件 + 子 Label）
            │   └── FilterBtn_Leader ← 🆕 新建（Button 元件 + 子 Label）
            ├── GazetteScrollView    ← 🆕 新建（ScrollView 元件）
            │   └── view
            │       └── content      ← 🆕 新建（Layout 元件）
            ├── GazetteEntryTemplate ← 🆕 新建（Active=false）
            │   ├── EntryType        ← 🆕 新建（Label 元件）
            │   ├── EntryContent     ← 🆕 新建（Label 元件）
            │   └── EntryTime        ← 🆕 新建（Label 元件）
            └── GazetteEmptyLabel    ← 🆕 新建（Label 元件）
```

### 64-2. 建立面板外殼

與 §61-2 相同步驟，差異：
- 節點名 = `GazettePanelNode`
- `UITransform`：W = `480`, H = `520`
- TitleLabel string = **公報**

### 64-3. 建立 FilterBar（Layout 元件）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `FilterBar`
2. `UITransform`：W = `400`, H = `32`
3. Position：`(0, 150, 0)`
4. **Add Component** → `Layout` → Type = `HORIZONTAL`, SpacingX = `6`, ResizeMode = `NONE`

#### 建立 4 個 FilterBtn（Button 元件）

對每個按鈕重複以下步驟（只改名字和 Label 文字）：

1. **右鍵** `FilterBar` → **建立空節點** → 改名為 `FilterBtn_All`
2. `UITransform`：W = `60`, H = `28`
3. **Add Component** → `Sprite` → Color = `(59, 130, 246, 240)`（選中態用藍色，其餘灰色）
4. **Add Component** → `Button`
5. **右鍵** → **建立空節點** → 改名為 `Label`
   - `UITransform`：W = `60`, H = `28`
   - **Add Component** → `Label` → string = `全部`, fontSize = `12`, Horizontal/Vertical = `CENTER`
   - Color = `(255, 255, 255, 255)`

| 按鈕名 | Label string | Sprite 初始 Color |
|--------|-------------|------------------|
| `FilterBtn_All` | 全部 | `(59, 130, 246, 240)` 藍色（預設選中） |
| `FilterBtn_Mission` | 任務 | `(71, 85, 105, 240)` 灰色 |
| `FilterBtn_System` | 系統 | `(71, 85, 105, 240)` 灰色 |
| `FilterBtn_Leader` | 領袖 | `(71, 85, 105, 240)` 灰色 |

### 64-4. 建立 GazetteScrollView（ScrollView 元件）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `GazetteScrollView`
2. `UITransform`：W = `420`, H = `320`
3. Position：`(0, -25, 0)`
4. **Add Component** → `ScrollView` → Direction = `VERTICAL`
5. 在 `view` 下建立 `content`：
   - `UITransform`：W = `420`, H = `320`
   - **Add Component** → `Layout` → Type = `VERTICAL`, SpacingY = `6`, ResizeMode = `CONTAINER`

### 64-5. 建立 GazetteEntryTemplate（模板，Active=false）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `GazetteEntryTemplate`
2. `UITransform`：W = `400`, H = `76`
3. **Add Component** → `Sprite` → Color = `(30, 36, 50, 180)`
4. **⚠️ 取消勾選 Active**

#### GazetteEntryTemplate 子節點

| 步驟 | 節點名 | 元件 | UITransform | Position | 設定 |
|------|--------|------|-------------|----------|------|
| 1 | `EntryType` | Label | W=60, H=20 | (-160, 22, 0) | string = `系統`, fontSize = `11`, Color = `(250, 204, 21, 255)` 金色 |
| 2 | `EntryContent` | Label | W=340, H=40 | (10, 0, 0) | string = `公報內容`, fontSize = `12`, Overflow = `CLAMP`, Color = `(228, 232, 240, 255)` |
| 3 | `EntryTime` | Label | W=100, H=18 | (145, 22, 0) | string = `00:00`, fontSize = `10`, Horizontal = `RIGHT`, Color = `(148, 163, 184, 255)` |

### 64-6. 建立 GazetteEmptyLabel（Label 元件）

1. **右鍵** `BodyRoot` → **建立空節點** → 改名為 `GazetteEmptyLabel`
2. `UITransform`：W = `360`, H = `28`
3. Position：`(0, 0, 0)`
4. **Add Component** → `Label` → string = `目前沒有公報`, fontSize = `14`
5. Horizontal = `CENTER`, Color = `(148, 163, 184, 255)`

### 64-7. Inspector 拖綁 MainGameController

| Inspector 欄位名 | 拖入節點 | 節點類型 |
|-----------------|---------|---------|
| `gazettePanel` | `GazettePanelNode` | GazettePanel (Component) |

### 64-8. 確認清單

- [ ] `GazettePanelNode` 在 `PanelLayer` 下，**Active = false**
- [ ] `FilterBar` (Layout HORIZONTAL) 在 BodyRoot 下，內有 4 個 Button：All(藍) / Mission(灰) / System(灰) / Leader(灰)
- [ ] `GazetteScrollView` (ScrollView) 在 BodyRoot 下
- [ ] `GazetteEntryTemplate` (Active=false) 內有 EntryType(Label) / EntryContent(Label) / EntryTime(Label)
- [ ] `GazetteEmptyLabel` (Label) 在 BodyRoot 下
- [ ] 所有節點 Layer = `UI_2D`

---

## 65. Phase 8 — 視覺效果準備 🎮

> **前置條件**：美術素材到位後執行。
> 在美術資源未到位前，以下只需要預留節點位置。

### 65-1. 預留霧氣層節點

1. **右鍵** `OverlayLayer` → **建立空節點** → 改名為 `FogLayerNode`
2. `UITransform`：W = `1280`, H = `720`
3. **Add Component** → `Widget` → 勾選 Top = `0`, Bottom = `0`, Left = `0`, Right = `0`（stretch all）
4. **⚠️ 取消勾選 Active**
5. **🔴 Layer**：`UI_2D`
6. ⚠️ **不掛 Sprite**（等美術提供 Shader Material 後才加 Sprite + `customMaterial`）

### 65-2. 預留幽靈效果節點

1. **右鍵** `OverlayLayer` → **建立空節點** → 改名為 `GlitchGhostNode`
2. `UITransform`：W = `256`, H = `256`
3. **⚠️ 取消勾選 Active**
4. **🔴 Layer**：`UI_2D`
5. 後續由程式動態控制位置和顯示

### 65-3. Material 接口確認

> 所有面板腳本都已預留 `turbidMaterial` / `pureMaterial` @property（見 CLAUDE.md §3）。

確認方式：
1. 在 Hierarchy 選中任一面板節點（例如 `WhiteCrowCardNode`）
2. 在 Inspector 查看 `WhiteCrowCard` 腳本組件
3. 應該看到 `Turbid Material` 和 `Pure Material` 兩個空欄位（類型 = Material）
4. 欄位存在但為空 = 正確（等美術提供 `.mtl` 後拖入）

### 65-4. 面板動畫（不需要編輯器操作）

> 面板開關動畫（淡入淡出、縮放）完全由程式端用 `tween()` 實現。
> 編輯器端不需要做任何配置。

### 65-5. 確認清單

- [ ] `FogLayerNode` 在 `OverlayLayer` 下，**Active = false**，Widget stretch all，無 Sprite
- [ ] `GlitchGhostNode` 在 `OverlayLayer` 下，**Active = false**
- [ ] 任一面板腳本 Inspector 中有 `Turbid Material` / `Pure Material` 空欄位

---

## 66. Phase 6-8 完成後的驗證清單 📖

### ✅ Phase 6 驗證（API 接通）

> 以下測試需要 Local Server 啟動：`npm run server`

1. Preview → 點導航按鈕開 InventoryPanel → Console 應出現 `[DataManager] fetchInventory` + 物品列表 ≠ 固定 8 筆
2. Preview → 開 ApostatePanel → 完成問卷 → Console 出現 `[DataManager] submitScreening 成功`
3. Preview → 開 LiquidatorPanel → 輸入名稱掃描 → Console 出現 `[DataManager] liquidatorScan` + 結果不再是 random
4. Preview → 開 LeaderTyrannyPanel → 點「徵稅」→ Console 出現 `[DataManager] leader.tax 成功`
5. Preview → 觸發結算 → Console 出現 `[DataManager] getSettlementResult` + 數值來自 Server
6. Preview → 開 LeaderboardPanel → Console 出現 `[DataManager] fetchLeaderboard` + 排行來自 DB

### ✅ Phase 7 驗證（新系統）

1. Preview → QuestPanel → 任務列表中每一筆有「回報」按鈕 → 點擊 → Console 出現回報結果
2. Preview → 開 PartyPanel（從 LeftNavBar 或 NPC）→ 看到 PartyStatusLabel + 3 個按鈕 + 敘事區
3. Preview → NPC 商人 → 點 TabBtn_Shop → ShopTabContainer 顯示商品列表
4. Preview → 開 DriftFragmentPanel → 看到漂流瓶列表 + 撰寫區 + 投放按鈕
5. Preview → 開 GazettePanel → 看到 FilterBar 4 個按鈕 + 公報列表

### ✅ Phase 8 驗證（視覺效果）

1. Hierarchy 中 `OverlayLayer` 下有 `FogLayerNode` 和 `GlitchGhostNode`（Active=false）
2. 任意面板 Inspector 中 `turbidMaterial` / `pureMaterial` 欄位存在
3. 拖入 Material 後 Preview → 面板外觀變更為陣營主題色

---

## 67. （已移至 HANDOFF 文件）

> Bug Pattern Framework 已移至 `COCOS_PREVIEW_DEBUG_HANDOFF.md` §十一。
> 包含 5 種模式（A-E）、偵錯 SOP、Bug 關聯圖。
