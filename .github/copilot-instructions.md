# 核心開發邏輯與省 Token 模式

1. **先規劃後動手**：在撰寫任何程式碼前，請先在 `<thought>` 標籤中簡短分析變動範圍與潛在風險。
2. **省 Token 模式**：當優化或修改程式碼時，僅輸出受影響的函數或組件，**禁止全文輸出**，並使用註釋 `// ... existing code ...` 標註未修改位置。
3. **TypeScript 規範**：必須為導出的函數添加明確類型，嚴禁使用 `any`，優先使用 Spread Operator 進行不可變更新，非同步操作必須包含 try-catch。
4. **C# 規範** (若有使用)：優先使用 `record` 定義資料模型，非同步方法必須傳遞 `CancellationToken` 並使用 `async/await`，嚴禁字串拼接 SQL 或硬編碼密鑰。


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
