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