# 白鴉之繭 | 觀測者終端 (Project Turbid Dust)

> 「世界並非由物質構成，而是由觀測者的視線編織而成。」 —— 1999, 佚名

## 🗃️ 專案機密層級：TOP SECRET

這是一個基於 **React + Vite + Supabase + SQLite** 構建的異想世界觀測系統。本系統專為「白鴉之繭」企劃設計，用於追蹤 **濁息 (Turbid)** 與 **淨塵 (Pure)** 陣營之間的平衡，以及那群遊走於命運邊緣的 **背道者 (Apostates)**。

## 🗝️ 核心協議 (Features)

- **[雙翼視界]**：根據登入身分自動切換地圖視角，確保資訊的陣營隔離。
- **[宿命抽選]**：由後端 Prisma 驅動的對稱性背道者選拔邏輯（Chapter 1: 3+3, Chapter 3: 1+1）。
- **[天平觀測]**：即時同步的勢力天平，反映世界線的偏移。
- **[清算系統]**：針對失控個體的行政清算協議。
- **[GPU 加速地圖]**：使用 Framer Motion 與 GPU 最佳化，提供流暢的 1920x1080 巨幅地圖交互體驗。

## 🛠️ 技術組件 (Tech Stack)

- **Frontend**: React 18, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js Express, Prisma 7 (with Better-SQLite3 Adapter).
- **Database**: 
  - **Supabase**: 雲端數據同步（用戶進度、資產）。
  - **SQLite**: 本地宿命紀錄（抽選權限、身分標記）。
- **Protocol**: 1999-style CRT Visuals & CRT Filter.

## 🚀 啟動協議 (Quick Start)

1. **環境配置**：
   確保 `.env` 文件包含正確的 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY`。

2. **啟動觀測終端**：
   ```bash
   npm install      # 加載依賴
   npm run server   # 喚醒後端核心 (Port 3001)
   npm run dev      # 啟動觀測介面 (Port 3088)
   ```

3. **生產環境封存**：
   ```bash
   npm run build    # 執行最終編譯
   ```

## ⚠️ 觀測者警告

- **管理員權限**：僅 `vonn` 擁有 ROOT 權限，可無視陣營限制查看全地圖與執行抽選。
- **資料庫路徑**：本地資料庫位於 `server/dev.db`，請定期進行數據備份。
- **視覺延遲**：若地圖移動不流暢，請檢查 `transition-property` 是否誤設為 `all`。

---

*「當最後一片羽毛落地時，你選擇站在哪一邊？」*

© 2026 Project Turbid Dust. All Rights Reserved.
