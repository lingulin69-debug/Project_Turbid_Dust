# Cocos Creator onDestroy 防護規則

> 此文件記錄 2025 年 Cocos 預覽階段發現的 onDestroy 崩潰問題，  
> 所有開發者（包含 AI 助手）在撰寫或審查 `onDestroy()` 時必須遵守以下規則。

---

## 📌 Bug 根因總結

### Bug 1：`Cannot read properties of null (reading 'targetOff')`

| 項目 | 說明 |
|------|------|
| 影響範圍 | 21 個檔案、48 處 |
| 原因 | `onDestroy()` 中呼叫 `btn.targetOff(this)`，`btn` 引用不是 null，但節點已被 Cocos 引擎銷毀（`isValid === false`），內部事件處理器為 null |
| 錯誤寫法 | `this.someButton?.targetOff(this)` — `?.` 只防 null/undefined |
| 正確寫法 | `if (this.someButton?.isValid) this.someButton.targetOff(this)` |

### Bug 2：`Cannot read properties of null (reading 'off')`

| 項目 | 說明 |
|------|------|
| 影響範圍 | MainGameController.ts、9 處 |
| 原因 | `this.hudController?.node.off(...)` — `hudController` 不是 null，但其 `.node` 已被場景銷毀設為 null。`?.` 只保護了第一層 |
| 錯誤寫法 | `this.hudController?.node.off('event', handler, this)` |
| 正確寫法 | `this.hudController?.node?.off('event', handler, this)` |

### Bug 3：`You are trying to destroy a object twice or more`

| 項目 | 說明 |
|------|------|
| 影響範圍 | MapController.ts |
| 原因 | `onDestroy()` 呼叫 `_clearLandmarks()` 手動 `destroy()` 子節點，但場景銷毀時 Cocos 已自動銷毀所有子節點，導致重複銷毀 |
| 錯誤寫法 | 在 `onDestroy()` 中呼叫 `node.destroy()` |
| 正確寫法 | `onDestroy()` 中只解除事件綁定，不手動銷毀節點 |

---

## ✅ 必須遵守的三條規則

### 規則 1：`onDestroy` 中的 `targetOff()` 一律加 `isValid` 檢查

```typescript
// ❌ 錯誤
this.someButton?.targetOff(this);

// ✅ 正確
if (this.someButton?.isValid) this.someButton.targetOff(this);

// ✅ 陣列寫法
this.buttons?.forEach(btn => {
    if (btn?.isValid) btn.targetOff(this);
});
```

### 規則 2：訪問其他 Component 的 `.node` 時，每一層都要 `?.`

```typescript
// ❌ 錯誤 — ?.只保護 hudController，不保護 .node
this.hudController?.node.off('panel-open', this._onPanelOpen, this);

// ✅ 正確 — 兩層都保護
this.hudController?.node?.off('panel-open', this._onPanelOpen, this);

// ✅ 如果是 Button 等 Component 的 .node
if (this.closeButton?.node?.isValid) this.closeButton.node.targetOff(this);
```

### 規則 3：`onDestroy()` 中禁止手動 `destroy()` 子節點

```typescript
// ❌ 錯誤 — 場景銷毀時 Cocos 已自動處理
onDestroy(): void {
    for (const child of this.container.children) {
        child.destroy();  // 重複銷毀！
    }
}

// ✅ 正確 — 只解除事件
onDestroy(): void {
    for (const child of this.container.children) {
        if (child?.isValid) child.off('click', this._onClick, this);
    }
}

// ✅ 主動清除（非 onDestroy，如切換章節時）可以手動 destroy
switchChapter(): void {
    this._clearLandmarks();  // 這裡可以 destroy
}
```

---

## 🔍 自我檢查清單（每次寫完 onDestroy 後必須過）

- [ ] 每個 `.targetOff()` 呼叫前面有 `isValid` 檢查嗎？
- [ ] 每個 `.off()` 呼叫的整條鏈路都有 `?.` 嗎？
- [ ] 有沒有在 `onDestroy()` 裡手動 `destroy()` 子節點？（不應該有）
- [ ] `DataEventBus.off()` 不需要 `isValid`（它是全域事件匯流排，不是節點方法）
- [ ] `this.node.off()` 不需要 `?.`（Component 自身的 node 在 onDestroy 中保證存在）
- [ ] `unscheduleAllCallbacks()` 不需要 `isValid`（Component 自身方法）

---

## 📁 受影響的檔案清單（已全部修復）

| 檔案 | 修復項目 |
|------|---------|
| HUDController.ts | `isValid` + `?.forEach` |
| WhiteCrowCard.ts | `isValid` + `?.forEach` |
| MainGameController.ts | `?.node?.off` (9 處) + `isValid` (NPC/Transition) |
| MapController.ts | 移除 onDestroy 中的 `destroy()` + `isValid` |
| BreathingSceneController.ts | `isValid` |
| NotificationPanel.ts | `isValid` |
| SettingsPanel.ts | `isValid` + `?.node?.isValid` |
| QuestPanel.ts | `isValid` |
| CollectionPanel.ts | `isValid` + `?.forEach` |
| LandmarkStoryModal.ts | `isValid` |
| ApostatePanel.ts | `isValid` |
| LiquidatorPanel.ts | `isValid` |
| KidnapPopup.ts | `isValid` |
| BalanceSettlementModal.ts | `?.node?.isValid` |
| LeaderboardPanel.ts | `?.node?.isValid` |
| LeaderTyrannyPanel.ts | `?.node?.isValid` (11 處) |
| ChapterOpeningController.ts | `isValid` |
| DonationTracker.ts | `isValid` |
| RelicPoemModal.ts | `isValid` |
| ChapterStoryModal.ts | `isValid` |
| NPCModal.ts | `isValid` + `removeAllChildren` 防護 |
| MusicDiscController.ts | `isValid` |
| MapLandmark.ts | 自身 node，無需修改 |

---

## 📝 同期修復的其他 Bug（非 onDestroy）

| Bug | 現象 | 根因 | 修復 |
|-----|------|------|------|
| 登入按鈕未連線 | 點擊無反應 | LoginController 按鈕事件依賴 Inspector clickEvents，LoginSceneBuilder 未設定 | 新增 `_registerButtonEvents()` 程式化綁定 |
| mapController 未綁定 | 登入後空白，Console 報 `mapController 未綁定` | MapSceneBuilder 只建容器節點，未加 Component 也未綁定插座 | 新增 `_addComponentsAndBind()`；MainGameController init 從 `onLoad()` 移至 `start()` |
| 地圖無據點 | 地圖全黑 | MapController 要求 Prefab + mapRoot 都為 null | MapController 新增色塊佔位模式；MapSceneBuilder 設定 mapRoot + 底色 |
| InventoryPanel 未綁定 | Console 報 `gridContainer 未綁定` | MapSceneBuilder 未建立 GridContainer 子節點 | MapSceneBuilder 建立 GridContainer + Grid Layout；InventoryPanel 支援無 Prefab 色塊佔位 |

---

## 🧠 為什麼 `?.` 不夠用？

Cocos Creator 銷毀機制：
1. 呼叫 `node.destroy()` 或場景切換時，Cocos 標記節點為「待銷毀」
2. 在同一幀末尾，執行 `destroyImmediate`，清空內部資料
3. 此時節點物件「仍然存在於記憶體中」（不是 null），但 `isValid === false`
4. JavaScript 的 `?.` 只能判斷 `null` 或 `undefined`，無法判斷 Cocos 的「已銷毀」狀態
5. 因此必須用 `isValid` 來判斷節點是否還「活著」
