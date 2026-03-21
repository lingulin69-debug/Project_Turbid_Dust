import { EventTarget } from 'cc';
import { FactionType } from './PTD_UI_Theme';
import type { LandmarkData } from './MapLandmark';

// ── 事件名稱常數 ──────────────────────────────────────────────────────────────

export const DATA_EVENTS = {
    COINS_CHANGED:   'ptd:coins-changed',
    HP_CHANGED:      'ptd:hp-changed',
    BALANCE_UPDATED: 'ptd:balance-updated',
} as const;

// ── 資料介面 ──────────────────────────────────────────────────────────────────

export interface PlayerData {
    oc_name:  string;
    faction:  FactionType;
    coins:    number;
    hp:       number;
    max_hp:   number;
}

/** 天平計算所需的據點快照 */
export interface LandmarkSnapshot {
    id:      string;
    faction: FactionType | 'Common';
    status:  'open' | 'closed';
    weight:  number;   // 佔領權重（預設 1，特殊據點可設高值）
}

export interface BalanceResult {
    turbid_weight: number;
    pure_weight:   number;
    /** -100（純 Turbid） ↔ 0（平衡） ↔ +100（純 Pure） */
    balance_value: number;
    dominant: FactionType | 'Draw';
}

// ── 全域事件總線（單例） ──────────────────────────────────────────────────────

export const DataEventBus = new EventTarget();

// ── DataManager（單例） ───────────────────────────────────────────────────────

class PTD_DataManagerClass {

    private _player: PlayerData | null = null;
    private _landmarks: Map<string, LandmarkSnapshot> = new Map();

    // ── 玩家初始化 ────────────────────────────────────────────────────────────

    initPlayer(data: PlayerData): void {
        this._player = { ...data };
    }

    getPlayer(): Readonly<PlayerData> | null {
        return this._player;
    }

    // ── 貨幣操作 ──────────────────────────────────────────────────────────────

    /**
     * 修改本地貨幣值並廣播 DATA_EVENTS.COINS_CHANGED。
     * @param amount 正值為增加，負值為扣除。
     * @returns 修改後的貨幣值，或 null（未初始化時）。
     */
    updateCoins(amount: number): number | null {
        if (!this._player) return null;

        this._player.coins = Math.max(0, this._player.coins + amount);

        DataEventBus.emit(DATA_EVENTS.COINS_CHANGED, this._player.coins);
        return this._player.coins;
    }

    // ── HP 操作 ───────────────────────────────────────────────────────────────

    /**
     * 修改本地 HP 值並廣播 DATA_EVENTS.HP_CHANGED。
     * @param amount 正值為回血，負值為扣血。
     * @returns 修改後的 HP，或 null（未初始化時）。
     */
    updateHP(amount: number): number | null {
        if (!this._player) return null;

        this._player.hp = Math.min(
            this._player.max_hp,
            Math.max(0, this._player.hp + amount),
        );

        DataEventBus.emit(DATA_EVENTS.HP_CHANGED, this._player.hp);
        return this._player.hp;
    }

    // ── 據點資料同步 ──────────────────────────────────────────────────────────

    /**
     * 從地圖的 LandmarkData 陣列更新內部快照，供天平計算使用。
     * 通常在場景初始化或 Supabase Realtime 推送後呼叫。
     */
    syncLandmarks(landmarks: LandmarkData[]): void {
        this._landmarks.clear();
        for (const lm of landmarks) {
            this._landmarks.set(lm.id, {
                id:      lm.id,
                faction: lm.faction,
                status:  lm.status,
                weight:  1,   // 預設權重；特殊據點可在初始化後呼叫 setLandmarkWeight()
            });
        }
    }

    /** 覆寫單一據點的佔領權重（用於特殊關鍵地點）。 */
    setLandmarkWeight(id: string, weight: number): void {
        const lm = this._landmarks.get(id);
        if (lm) lm.weight = weight;
    }

    // ── 天平計算 ──────────────────────────────────────────────────────────────

    /**
     * 統計所有 open 據點的陣營佔領情況，計算天平值。
     *
     * 計算規則：
     *   - 只計算 status = 'open' 且 faction ≠ 'Common' 的據點
     *   - balance_value = ((pure_weight - turbid_weight) / total_weight) * 100
     *   - 結果區間：-100（全 Turbid） → 0（均勢） → +100（全 Pure）
     *
     * ⚠️ 此函數僅計算本地快照；實際寫入資料庫須透過
     *    POST /api/balance/update（遵循 CLAUDE.md 核心原則 §1）。
     */
    calculateBalance(): BalanceResult {
        let turbidWeight = 0;
        let pureWeight   = 0;

        for (const lm of this._landmarks.values()) {
            if (lm.status !== 'open') continue;
            if (lm.faction === 'Turbid') turbidWeight += lm.weight;
            else if (lm.faction === 'Pure') pureWeight += lm.weight;
            // Common 不計入
        }

        const totalWeight = turbidWeight + pureWeight;

        let balanceValue = 0;
        if (totalWeight > 0) {
            balanceValue = ((pureWeight - turbidWeight) / totalWeight) * 100;
        }

        const dominant: FactionType | 'Draw' =
            balanceValue > 0  ? 'Pure'   :
            balanceValue < 0  ? 'Turbid' :
            'Draw';

        const result: BalanceResult = {
            turbid_weight: turbidWeight,
            pure_weight:   pureWeight,
            balance_value: balanceValue,
            dominant,
        };

        DataEventBus.emit(DATA_EVENTS.BALANCE_UPDATED, result);
        return result;
    }

    // ── 重置（換章 / 登出時使用） ─────────────────────────────────────────────

    reset(): void {
        this._player    = null;
        this._landmarks.clear();
    }
}

// ── 單例匯出 ──────────────────────────────────────────────────────────────────

export const DataManager = new PTD_DataManagerClass();
