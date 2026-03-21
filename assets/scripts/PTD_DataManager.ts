import { EventTarget } from 'cc';
import { FactionType } from './PTD_UI_Theme';
import type { LandmarkData } from './MapLandmark';

// ── 背包道具介面（定義於資料層，UI 層從此處 import）────────────────────────────

export interface ItemData {
    id:          string;
    name:        string;
    description: string;
    quantity:    number;
    type:        string;
    price:       number;   // 購買所需金幣
    rarity?:     number;
}

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
    current_landmark_id?: string; // <--- 補上這行
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

// ── 新增：遊戲狀態與章節介面 ────────────────────────────────────────

export interface GameState {
    phase: 'battle' | 'story' | 'transition';
    current_chapter: number;
}

export interface ChapterStoryData {
    title:           string;
    content:         string;
    bg_image_url?:   string;
    bg_music_url?:   string;
    winner_faction?: string;
}

// ── 全域事件總線（單例） ──────────────────────────────────────────────────────

export const DataEventBus = new EventTarget();

// ── DataManager（單例） ───────────────────────────────────────────────────────

class PTD_DataManagerClass {

    private _player: PlayerData | null = null;
    private _landmarks: Map<string, LandmarkSnapshot> = new Map();
    private _inventory: ItemData[] = [];

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

    // ── 背包資料 ──────────────────────────────────────────────────────────────

    /**
     * 取得玩家背包道具列表。
     * 正式版：從 Supabase 拉取 td_inventory 表（依 player_id 過濾）。
     * 目前回傳 Mock Data，供 UI 渲染測試使用。
     */
    async fetchInventory(): Promise<ItemData[]> {
        // TODO：正式串接時替換為 Supabase fetch，範例：
        // const { data, error } = await supabase
        //     .from('td_inventory')
        //     .select('*')
        //     .eq('player_id', this._player?.id);
        // if (error) { console.warn('[DataManager] fetchInventory 失敗', error); return []; }
        // this._inventory = data as ItemData[];
        // return this._inventory;

        // ── Mock Data（8 筆測試道具） ─────────────────────────────────────────
        this._inventory = [
            { id: 'item_001', name: '濁息藥劑',  description: '恢復 20 HP，帶有濃烈苦味。',    quantity: 3, type: 'consumable', price: 3,  rarity: 1 },
            { id: 'item_002', name: '淨塵符咒',  description: '短暫驅散周圍的濁氣。',          quantity: 1, type: 'consumable', price: 5,  rarity: 2 },
            { id: 'item_003', name: '黑市通行令', description: '進入黑心商人特殊貨架的憑證。',   quantity: 1, type: 'key',        price: 10, rarity: 3 },
            { id: 'item_004', name: '破舊地圖',  description: '記載著某個廢棄據點的方位。',      quantity: 1, type: 'material',   price: 2,  rarity: 1 },
            { id: 'item_005', name: '鏽蝕鎖鏈',  description: '不知用途，也許有人想要。',        quantity: 5, type: 'material',   price: 1,  rarity: 1 },
            { id: 'item_006', name: '陣營徽章',  description: '證明歸屬的金屬徽章。',           quantity: 1, type: 'equipment',  price: 8,  rarity: 2 },
            { id: 'item_007', name: '過期藥水',  description: '已無效果，但聞起來還行。',        quantity: 0, type: 'consumable', price: 0,  rarity: 1 },
            { id: 'item_008', name: '白鴉羽毛',  description: '極為罕見，據說帶有神秘力量。',    quantity: 1, type: 'material',   price: 20, rarity: 4 },
        ];
        return this._inventory;
    }

    /** 取得本地快取的背包（不發網路請求）。 */
    getInventory(): Readonly<ItemData[]> {
        return this._inventory;
    }

    /**
     * 購買道具：扣除金幣並加入背包。
     * ⚠️ 此方法只操作本地快取，實際寫入資料庫須在 Controller 層呼叫對應 API。
     *
     * @returns success: false 若金幣不足；success: true 並附說明訊息。
     */
    purchaseItem(item: ItemData): { success: boolean; message: string } {
        const player = this._player;

        if (!player) {
            return { success: false, message: '玩家資料未初始化' };
        }
        if (player.coins < item.price) {
            return { success: false, message: '金幣不足' };
        }

        this.updateCoins(-item.price);

        // 已有同 ID 道具則累加數量，否則新增一筆
        const existing = this._inventory.find(i => i.id === item.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            this._inventory.push({ ...item, quantity: 1 });
        }

        return { success: true, message: `購買成功：${item.name}` };
    }

    // ── API：遊戲狀態與章節劇情 (從 MainGameController 移入) ────────────────

    async fetchGameState(): Promise<GameState | null> {
        try {
            const response = await fetch(
                'https://你的專案.supabase.co/rest/v1/td_game_state?id=eq.1',
                { headers: { 'apikey': 'YOUR_ANON_KEY', 'Authorization': 'Bearer YOUR_ANON_KEY' } }
            );
            const data = await response.json();
            return data && data.length > 0 ? data[0] as GameState : null;
        } catch (err) {
            console.error('[DataManager] fetchGameState 失敗', err);
            return null;
        }
    }

    async fetchChapterStory(chapterNumber: number): Promise<ChapterStoryData | null> {
        try {
            const response = await fetch(
                `https://你的專案.supabase.co/rest/v1/td_chapter_stories?chapter_number=eq.${chapterNumber}`,
                { headers: { 'apikey': 'YOUR_ANON_KEY', 'Authorization': 'Bearer YOUR_ANON_KEY' } }
            );
            const data = await response.json();
            return data && data.length > 0 ? data[0] as ChapterStoryData : null;
        } catch (err) {
            console.error('[DataManager] fetchChapterStory 失敗', err);
            return null;
        }
    }

    // ── 重置（換章 / 登出時使用） ─────────────────────────────────────────────

    reset(): void {
        this._player    = null;
        this._landmarks.clear();
        this._inventory = [];
    }
}

// ── 單例匯出 ──────────────────────────────────────────────────────────────────

export const DataManager = new PTD_DataManagerClass();
