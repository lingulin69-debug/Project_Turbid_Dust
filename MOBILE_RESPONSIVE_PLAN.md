# 手機響應式修整計畫
# Project Turbid Dust — Mobile Responsive Plan

> 建立日期：2026-03-17
> 最後驗證：2026-03-31
> 執行順序：Phase 1 → Phase 3 → Phase 2 → Phase 4
> **狀態：✅ 全部完成（Phase 1-4 皆已實作）**

---

## 問題總表

| # | 等級 | 檔案 | 行數 | 問題描述 |
|---|------|------|------|----------|
| 1 | CRITICAL | MapTestView.tsx | 1550 | Modal `w-[500px]` 固定寬，手機溢出 |
| 2 | CRITICAL | MapTestView.tsx | 1617 | Modal `w-[400px]` 固定寬，手機溢出 |
| 3 | HIGH | WhiteCrowCard.tsx | 206, 226 | 卡片 `width: 450px` 固定寬 |
| 4 | HIGH | MapTestView.tsx | 1045 | 通知下拉 `w-80`，小螢幕溢出右側 |
| 5 | HIGH | MapTestView.tsx | 995 | 頂部右側 HUD 列在手機螢幕過於擁擠 |
| 6 | MEDIUM | PTD_UI_Theme.tsx | 全域 | 缺少 `@media (max-width: 640px)` 斷點 |
| 7 | MEDIUM | index.css | 全域 | 缺少手機最小字體、最小點擊區域規範 |
| 8 | MEDIUM | 多處按鈕 | — | 缺少 `touch-manipulation`，雙擊縮放干擾 |

---

## Phase 1 — Modal 與卡片寬度（最高優先）✅ 已完成

### 1-A. WhiteCrowCard.tsx
- **修改**：`width: '450px'` → `width: 'min(450px, calc(100vw - 32px))'`
- **CSS 類別**：`.wc-card-wrapper { width: 450px }` → `width: min(450px, calc(100vw - 32px))`
- **補充**：`.wc-card-content` padding 在手機縮為 `16px 12px`

### 1-B. MapTestView.tsx — 刻寫殘卷 Modal（L1550）
- **修改**：`w-[500px]` → `w-full max-w-[500px] mx-4`
- wordBank `grid-cols-4` → `grid-cols-3 sm:grid-cols-4`（手機較窄時 3 欄）

### 1-C. MapTestView.tsx — 設定密碼 Modal（L1617）
- **修改**：`w-[400px]` → `w-full max-w-[400px] mx-4`

### 1-D. MapTestView.tsx — 通知下拉（L1045）
- **修改**：`w-80` → `w-80 max-w-[calc(100vw-32px)]`
- 補充 `right-0` 改 `right-0 sm:right-0`（已是 right-0 但父容器寬度加上限）

---

## Phase 3 — 全域響應式斷點 ✅ 已完成

### 3-A. PTD_UI_Theme.tsx — generatePTDUIStyles()
新增 `@media (max-width: 640px)` 區塊：
- `.ptd-ui-nav-button`：縮減 padding
- `.ptd-ui-list-item`：縮減 padding，font-size 最小 12px
- `.ptd-ui-tag`：font-size 最小 11px
- `.ptd-ui-title-xl`：縮為 20px；`.ptd-ui-title-lg`：縮為 17px

### 3-B. index.css
新增手機基礎規範：
- 全域 `button`：最小高度 `44px`（Apple HIG），`touch-action: manipulation`
- 全域 `input`：最小高度 `44px`，`font-size: 16px`（防 iOS 自動放大）
- 最小字體保護：`min-font-size` polyfill via `clamp()`

---

## Phase 2 — 地圖操作與 HUD 按鈕 ✅ 已完成

### 2-A. 地圖容器（已有 touch-none，維持不變）
地圖本身使用 `@use-gesture/react` 的 `useGesture` 處理拖曳，
`touch-none` 防止瀏覽器捲動干擾 — **不修改**。
手機使用者可用雙指縮放（已有 scale 邏輯）或單指拖曳瀏覽地圖。

### 2-B. 頂部右側 HUD（L995）
`fixed top-6 right-8` → `fixed top-3 right-3 sm:top-6 sm:right-8`
- 貨幣列 px-4 → px-2 sm:px-4
- 登入按鈕：手機隱藏「TERMINAL DISCONNECTED」文字，只顯示點狀態燈
- 鈴鐺按鈕維持

---

## Phase 4 — 觸控體驗優化 ✅ 已完成

### 4-A. 全域 touch-manipulation
在 `index.css` 對所有互動元素加：
```css
button, [role="button"], a {
  touch-action: manipulation;
}
```
防止雙擊縮放干擾按鈕。

### 4-B. 按鈕最小點擊區域
透過 Phase 3-B 的 `min-height: 44px` 達成，不需逐一修改。

---

## 不動的部分

| 項目 | 原因 |
|------|------|
| 地圖尺寸 (2048×1080) | 遊戲地圖設計，保持拖曳瀏覽方式 |
| CharacterCard max-w-[300px] | 手機上剛好合適 |
| 左側 DraggableUIButton 群 | 已支援拖曳定位，玩家可自行調整 |
| 極小裝飾字（9px）| 為裝飾用途，非主要資訊，可接受 |

---

## 測試清單（修改後驗證）

- [ ] iPhone SE（375px）：頂部 HUD 不溢出
- [ ] iPhone 14（390px）：Modal 正常顯示
- [ ] Android 常規（360px）：WhiteCrowCard 面板可讀
- [ ] iPad（768px）：layout 正確，無斷裂
- [ ] 桌機（1280px）：維持原始外觀不變
