# Cocos 61 / 63 / 64 程式端交接文件

> 適用範圍：`PartyPanelNode`、`DriftFragmentPanelNode`、`GazettePanelNode`
>
> 目的：把「程式端已經存在什麼、Cocos 端實際要怎麼拖綁、目前哪些是 Mock / 哪些還沒接 API」一次講清楚，避免 Editor 端照舊手冊做完後還不知道要拖哪個欄位。

---

## 0. 先講結論

手冊第 61、63、64 節原本寫「等程式端建好再做」，這句現在已經過期。

目前程式端**已經存在**以下內容：

1. `PartyPanel.ts`
2. `DriftFragmentPanel.ts`
3. `GazettePanel.ts`
4. `MainGameController.ts` 內的 `partyPanel`、`driftFragmentPanel`、`gazettePanel` 三個 Inspector 插座
5. `HUDPanelId` 型別已包含 `party`、`drift`、`gazette`

但也要注意三個現況：

1. 這三個面板目前的資料仍以 `PTD_DataManager.ts` 的 Mock 為主，不是正式 API。
2. 這三個面板**目前沒有 backdrop 插座**，所以「點空白區域關閉」不是現成行為，現階段主關閉方式是 `CloseButton`。
3. `HUDController` 的固定左欄 `NAV_PANELS` 目前仍只有 6 顆：`announcement / quest / daily / collection / inventory / npc`。也就是說，`party / drift / gazette` 雖然有路由型別，但**不是既有左欄固定入口**。

---

## 1. MainGameController 已有的插座

以下三個欄位已經在 `MainGameController.ts` 宣告完成：

| 欄位 | 型別 | 用途 |
|---|---|---|
| `partyPanel` | `PartyPanel` | 開啟 / 關閉組隊面板 |
| `driftFragmentPanel` | `DriftFragmentPanel` | 開啟 / 關閉漂流瓶面板 |
| `gazettePanel` | `GazettePanel` | 開啟 / 關閉公報面板 |

對應路由也已存在：

| 面板 ID | `MainGameController._onPanelOpen()` 行為 |
|---|---|
| `party` | `this.partyPanel.show()` |
| `drift` | `this.driftFragmentPanel.show()` |
| `gazette` | `this.gazettePanel.show()` |

> 這代表：只要 Cocos 端把節點建好、腳本掛好、Inspector 拖好，程式端就能正常接住這三個面板。

---

## 2. PartyPanel 實際插座清單

`PartyPanel.ts` 目前需要的 Inspector 欄位如下：

| `PartyPanel.ts` 欄位 | 類型 | Cocos 端應拖入 |
|---|---|---|
| `bgSprite` | `Sprite` | `PanelBG` 上的 `Sprite` 元件 |
| `titleLabel` | `Label` | `TitleLabel` 上的 `Label` 元件 |
| `closeButton` | `Node` | `CloseButton` 節點 |
| `partyStatusLabel` | `Label` | `PartyStatusLabel` 上的 `Label` 元件 |
| `memberListScrollView` | `ScrollView` | `MemberListScrollView` 上的 `ScrollView` 元件 |
| `memberContent` | `Node` | `MemberListScrollView/view/content` 節點 |
| `drawCardBtn` | `Node` | `DrawCardBtn` 節點 |
| `joinPartyBtn` | `Node` | `JoinPartyBtn` 節點 |
| `endPartyBtn` | `Node` | `EndPartyBtn` 節點 |
| `partyStoryScrollView` | `ScrollView` | `PartyStoryScrollView` 上的 `ScrollView` 元件 |
| `storyLabel` | `Label` | `PartyStoryScrollView/view/content/StoryLabel` 上的 `Label` 元件 |
| `turbidMaterial` | `Material` | 可先留空 |
| `pureMaterial` | `Material` | 可先留空 |

### PartyPanel 目前的真實行為

1. `show()` 時會呼叫 `refresh()`。
2. `refresh()` 會向 `DataManager.fetchPartyInfo()` 取資料。
3. `DrawCardBtn` 會呼叫 `DataManager.partyDrawCard()`。
4. `JoinPartyBtn` 會呼叫 `DataManager.joinParty()`。
5. `EndPartyBtn` 會呼叫 `DataManager.endParty()`。

### PartyPanel 目前限制

1. `fetchPartyInfo()`、`partyDrawCard()`、`joinParty()`、`endParty()` 目前都是 Mock。
2. `closeButton` 事件已內建，但 `Backdrop` 沒有程式插座，因此 backdrop 先當視覺遮罩即可。
3. `memberContent` 必須拖 `ScrollView` 裡最深層的 `content`，不是拖整個 `ScrollView` 節點。

---

## 3. DriftFragmentPanel 實際插座清單

`DriftFragmentPanel.ts` 目前需要的 Inspector 欄位如下：

| `DriftFragmentPanel.ts` 欄位 | 類型 | Cocos 端應拖入 |
|---|---|---|
| `bgSprite` | `Sprite` | `PanelBG` 上的 `Sprite` 元件 |
| `titleLabel` | `Label` | `TitleLabel` 上的 `Label` 元件 |
| `closeButton` | `Node` | `CloseButton` 節點 |
| `fragmentScrollView` | `ScrollView` | `FragmentScrollView` 上的 `ScrollView` 元件 |
| `fragmentContent` | `Node` | `FragmentScrollView/view/content` 節點 |
| `contentEditBox` | `EditBox` | `ContentEditBox` 上的 `EditBox` 元件 |
| `sendBtn` | `Node` | `SendBtn` 節點 |
| `emptyLabel` | `Label` | `EmptyLabel` 上的 `Label` 元件 |
| `turbidMaterial` | `Material` | 可先留空 |
| `pureMaterial` | `Material` | 可先留空 |

### DriftFragmentPanel 目前的真實行為

1. `show()` 時會呼叫 `refresh()`。
2. `refresh()` 會向 `DataManager.fetchDriftFragments()` 取列表。
3. `SendBtn` 會觸發 `DataManager.sendDriftFragment(text)`。
4. 若輸入框是空字串，會在 Console 印出 `[DriftFragmentPanel] 內容為空，忽略`。

### DriftFragmentPanel 目前限制

1. `fetchDriftFragments()` 與 `sendDriftFragment()` 目前仍是 Mock。
2. Server 端其實已經有 `/api/drift/place` 與 `/api/drift/fragments`，但 Cocos `DataManager` 還沒切過去。
3. 目前主關閉方式一樣是 `CloseButton`，不是 backdrop。

---

## 4. GazettePanel 實際插座清單

`GazettePanel.ts` 目前需要的 Inspector 欄位如下：

| `GazettePanel.ts` 欄位 | 類型 | Cocos 端應拖入 |
|---|---|---|
| `bgSprite` | `Sprite` | `PanelBG` 上的 `Sprite` 元件 |
| `titleLabel` | `Label` | `TitleLabel` 上的 `Label` 元件 |
| `closeButton` | `Node` | `CloseButton` 節點 |
| `filterBtnAll` | `Node` | `FilterBtn_All` 節點 |
| `filterBtnMission` | `Node` | `FilterBtn_Mission` 節點 |
| `filterBtnSystem` | `Node` | `FilterBtn_System` 節點 |
| `filterBtnLeader` | `Node` | `FilterBtn_Leader` 節點 |
| `gazetteScrollView` | `ScrollView` | `GazetteScrollView` 上的 `ScrollView` 元件 |
| `gazetteContent` | `Node` | `GazetteScrollView/view/content` 節點 |
| `gazetteEmptyLabel` | `Label` | `GazetteEmptyLabel` 上的 `Label` 元件 |
| `turbidMaterial` | `Material` | 可先留空 |
| `pureMaterial` | `Material` | 可先留空 |

### GazettePanel 目前的真實行為

1. `show()` 時會先把 `_activeFilter` 重設成 `all`。
2. `refresh()` 會向 `DataManager.fetchGazette()` 取資料。
3. 四顆 Filter 按鈕會改變 `_activeFilter` 並重畫列表。
4. `_updateFilterButtons()` 會直接讀取**按鈕節點本身**的 `Sprite` 來換色。

### GazettePanel 目前限制

1. `fetchGazette()` 目前是 Mock。
2. Server 端真正的資料入口目前是 `GET /api/gossip`，不是 `fetchGazette()` 現在這個 Mock。
3. Filter 按鈕的 `Sprite` 必須掛在 `FilterBtn_*` 節點本身，不能只掛在子節點，不然程式換色時抓不到。
4. 目前主關閉方式也是 `CloseButton`。

---

## 5. Cocos 端最容易拖錯的 6 個點

1. `memberContent`、`fragmentContent`、`gazetteContent` 都要拖 `ScrollView/view/content`，不是拖 `ScrollView` 本體。
2. `bgSprite` 要拖 `PanelBG` 的 `Sprite` 元件，不是拖 `PanelBG` 節點。
3. `closeButton` 要拖 `CloseButton` 節點，不是 `Label` 元件。
4. `GazettePanel` 的四顆 filter 按鈕要拖節點本身，而且節點本身要有 `Sprite`。
5. 這三個面板目前沒有 backdrop 插座，所以不要把「點空白處關閉」當成必過驗證條件。
6. 這三個面板可以被程式打開，但目前不是固定左欄入口，除非之後另外擴充 `HUDController.NAV_PANELS` 或做自訂按鈕事件。

---

## 6. 目前對應的 Server / DataManager 狀態

| 系統 | Cocos DataManager 現況 | Server 現況 | 結論 |
|---|---|---|---|
| Party | Mock | `/api/party/draw-card`、`/api/party/join`、`/api/party/end`、`/api/party/story`、`/api/party/report-mission` 已存在 | 先可接節點，之後再切 API |
| Drift | Mock | `/api/drift/place`、`/api/drift/fragments` 已存在 | 先可接節點，之後再切 API |
| Gazette | Mock | `/api/gossip` 已存在 | 先可接節點，之後再切 API |

---

## 7. 建議的 Cocos 驗證順序

1. 先把三個面板節點建完並掛上腳本。
2. 先完成 `PartyPanel`、`DriftFragmentPanel`、`GazettePanel` 本體的 Inspector 拖綁。
3. 再把 `MainGameController.partyPanel`、`driftFragmentPanel`、`gazettePanel` 三個欄位補齊。
4. Preview 時先驗證 `CloseButton`、列表顯示、Filter 換色、按鈕 Console，有過再談真 API。

### 預期 Console 關鍵字

| 面板 | 預期 Console |
|---|---|
| Party | `[PartyPanel] 執行抽牌`、`[PartyPanel] 加入隊伍`、`[PartyPanel] 結束隊伍` |
| Drift | `[DriftFragmentPanel] 投放漂流瓶` |
| Gazette | 篩選按鈕目前不會額外印 log，主要看列表切換與按鈕顏色 |

---

## 8. 給後續程式端的下一步

如果下一輪要補功能，不是先改 Cocos 節點，而是優先做這 3 件：

1. 把 `PTD_DataManager.ts` 的 Party / Drift / Gazette 從 Mock 改成真 API。
2. 為這三個面板補 backdrop 插座或通用 shell 綁定，讓 backdrop 真正可關閉。
3. 決定 `party / drift / gazette` 的正式入口是左欄新增按鈕、右上角擴充入口，還是地圖 / NPC 事件觸發。