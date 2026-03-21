import { EventTarget } from 'cc';
import { FactionType } from './PTD_UI_Theme';
import type { LandmarkData } from './MapLandmark';

// ── Supabase 連線設定（統一管理，修改時只需改這裡） ──────────────────────────
const SUPABASE_CONFIG = {
    URL: 'https://yavrjxsmxzxihjaibxek.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdnJqeHNteHp4aWhqYWlieGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDU1MDMsImV4cCI6MjA4NTg4MTUwM30.U7HQ34v6HyPdd6npY0ejzIYhdsIftQ660T8CTuycORs',
};

const HEADERS = {
    'apikey': SUPABASE_CONFIG.ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
    'Content-Type': 'application/json',
};
// ── 介面定義 ──────────────────────────────────────────────────────────────────

/** 背包道具資料 */
export interface ItemData {
    id:          string;
    name:        string;
    description: string;
    quantity:    number;
    type:        string;
    price:       number;
    rarity?:     number;
}

/** 玩家基本資料 */
export interface PlayerData {
    id?:                 string;  // 新增：Supabase UUID（向下相容）
    oc_name:             string;
    faction:             FactionType;
    coins:               number;
    hp:                  number;
    max_hp:              number;
    current_landmark_id?: string;
}

/** 登入 API 回傳資料（含 password 用於偵測初始密碼 0000） */
export interface LoginResponse {
    user_id:              string;
    token:                string;
    oc_name:              string;
    faction:              FactionType;
    password:             string;
    coins:                number;
    hp:                   number;
    max_hp:               number;
    current_landmark_id?: string;
}

/** 天平計算所需的據點快照 */
export interface LandmarkSnapshot {
    id:      string;
    faction: FactionType | 'Common';
    status:  'open' | 'closed';
    weight:  number;
}

/** 天平計算結果 */
export interface BalanceResult {
    turbid_weight: number;
    pure_weight:   number;
    balance_value: number;  // -100（純 Turbid） ↔ 0（平衡） ↔ +100（純 Pure）
    dominant: FactionType | 'Draw';
}

/** 遊戲狀態（章節系統） */
export interface GameState {
    phase: 'battle' | 'story' | 'transition';
    current_chapter: number;
}

/** 章節劇情資料 */
export interface ChapterStoryData {
    title:           string;
    content:         string;
    bg_image_url?:   string;
    bg_music_url?:   string;
    winner_faction?: string;
}

// ── 事件名稱常數 ──────────────────────────────────────────────────────────────

export const DATA_EVENTS = {
    COINS_CHANGED:   'ptd:coins-changed',
    HP_CHANGED:      'ptd:hp-changed',
    BALANCE_UPDATED: 'ptd:balance-updated',
} as const;

// ── 全域事件總線（單例） ──────────────────────────────────────────────────────

export const DataEventBus = new EventTarget();

// ── DataManager 實作 ─────────────────────────────────────────────────────────

class PTD_DataManagerClass {

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _player:    PlayerData | null = null;
    private _landmarks: Map<string, LandmarkSnapshot> = new Map();
    private _inventory: ItemData[] = [];
    private _token:     string | null = null;

    // ── 玩家資料管理 ──────────────────────────────────────────────────────────

    initPlayer(data: PlayerData): void {
        this._player = { ...data };
    }

    getPlayer(): Readonly<PlayerData> | null {
        return this._player;
    }

    // ── 貨幣操作 ──────────────────────────────────────────────────────────────

    /**
     * 修改本地貨幣值並廣播事件。
     * @param amount 正值為增加，負值為扣除
     * @returns 修改後的貨幣值，未初始化時返回 null
     */
    updateCoins(amount: number): number | null {
        if (!this._player) return null;

        this._player.coins = Math.max(0, this._player.coins + amount);
        DataEventBus.emit(DATA_EVENTS.COINS_CHANGED, this._player.coins);
        
        return this._player.coins;
    }

    // ── HP 操作 ───────────────────────────────────────────────────────────────

    /**
     * 修改本地 HP 值並廣播事件。
     * @param amount 正值為回血，負值為扣血
     * @returns 修改後的 HP，未初始化時返回 null
     */
    updateHP(amount: number): number | null {
        if (!this._player) return null;

        this._player.hp = Math.min(
            this._player.max_hp,
            Math.max(0, this._player.hp + amount)
        );
        DataEventBus.emit(DATA_EVENTS.HP_CHANGED, this._player.hp);
        
        return this._player.hp;
    }

    // ── 據點資料同步（天平計算用） ────────────────────────────────────────────

    /**
     * 從地圖的 LandmarkData 陣列更新內部快照，供天平計算使用。
     * 通常在場景初始化或 Realtime 推送後呼叫。
     */
    syncLandmarks(landmarks: LandmarkData[]): void {
        this._landmarks.clear();
        for (const lm of landmarks) {
            this._landmarks.set(lm.id, {
                id:      lm.id,
                faction: lm.faction,
                status:  lm.status,
                weight:  1,  // 預設權重，特殊據點可呼叫 setLandmarkWeight() 調整
            });
        }
    }

    /**
     * 覆寫單一據點的佔領權重（用於特殊關鍵地點）。
     */
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
     * ⚠️ 此函數僅計算本地快照；實際寫入資料庫須透過 API。
     */
    calculateBalance(): BalanceResult {
        let turbidWeight = 0;
        let pureWeight   = 0;

        for (const lm of this._landmarks.values()) {
            if (lm.status !== 'open') continue;
            if (lm.faction === 'Turbid') turbidWeight += lm.weight;
            else if (lm.faction === 'Pure') pureWeight += lm.weight;
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
     * 目前回傳 Mock Data 供 UI 測試使用。
     */
    async fetchInventory(): Promise<ItemData[]> {
        // TODO：正式版替換為以下邏輯
        // const url = `${SUPABASE_CONFIG.URL}/rest/v1/td_inventory?player_id=eq.${this._player?.id}`;
        // const response = await fetch(url, { headers: HEADERS });
        // if (!response.ok) return [];
        // this._inventory = await response.json();
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

    /**
     * 取得本地快取的背包（不發網路請求）。
     */
    getInventory(): Readonly<ItemData[]> {
        return this._inventory;
    }

    /**
     * 購買道具：扣除金幣並加入背包。
     * ⚠️ 此方法只操作本地快取，實際寫入資料庫須在 Controller 層呼叫對應 API。
     * 
     * @returns success: false 若金幣不足；success: true 並附說明訊息
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

    // ── 遊戲狀態與章節劇情 API ────────────────────────────────────────────────

    async fetchGameState(): Promise<GameState | null> {
        try {
            const url = `${SUPABASE_CONFIG.URL}/rest/v1/td_game_state?id=eq.1`;
            const response = await fetch(url, { headers: HEADERS });
            
            if (!response.ok) return null;
            
            const data = await response.json();
            return data && data.length > 0 ? data[0] as GameState : null;
        } catch (err) {
            console.error('[DataManager] fetchGameState 失敗', err);
            return null;
        }
    }

    async fetchChapterStory(chapterNumber: number): Promise<ChapterStoryData | null> {
        try {
            const url = `${SUPABASE_CONFIG.URL}/rest/v1/td_chapter_stories?chapter_number=eq.${chapterNumber}`;
            const response = await fetch(url, { headers: HEADERS });
            
            if (!response.ok) return null;
            
            const data = await response.json();
            return data && data.length > 0 ? data[0] as ChapterStoryData : null;
        } catch (err) {
            console.error('[DataManager] fetchChapterStory 失敗', err);
            return null;
        }
    }

    // ── 登入與權限 API ────────────────────────────────────────────────────────

    /**
     * 向後端 Edge Function 驗證 OC 名稱與密碼。
     * 回傳值中含原始 password，控制層須自行判斷是否為 '0000' 並攔截流程。
     * 成功後將 token 存入內部 _token，供後續 API 呼叫使用。
     * 
     * @throws Error 登入失敗（帳號/密碼錯誤或網路異常）
     */
    async login(ocName: string, password: string): Promise<LoginResponse> {
    const url = `${SUPABASE_CONFIG.URL}/functions/v1/login`;  // ← 確認這行
    
    const response = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ oc_name: ocName, password }),
    });
        if (!response.ok) {
            const err = await response.json().catch(() => ({})) as { message?: string };
            throw new Error(err?.message ?? `登入失敗（HTTP ${response.status}）`);
        }

        const data = await response.json() as LoginResponse;
        this._token = data.token;
        
        return data;
    }

    /**
     * 更新玩家密碼。必須在 login() 成功後呼叫（需要 _token）。
     * 
     * @throws Error 若尚未登入或 API 回傳錯誤
     */
    async updatePassword(newPassword: string): Promise<void> {
    if (!this._token) {
        throw new Error('[DataManager] updatePassword：尚未登入，缺少 token');
    }

    const url = `${SUPABASE_CONFIG.URL}/functions/v1/update-password`;  // ← 確認這行
    
    const response = await fetch(url, {
        method:  'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${this._token}`,  // ← 確認這行
        },
        body: JSON.stringify({ new_password: newPassword }),  // ← 確認這行
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(err?.message ?? `改密失敗（HTTP ${response.status}）`);
    }
}

    // ── 重置（換章 / 登出時使用） ─────────────────────────────────────────────

    reset(): void {
        this._player    = null;
        this._landmarks.clear();
        this._inventory = [];
        this._token     = null;
    }
}

// ── 單例匯出 ──────────────────────────────────────────────────────────────────

export const DataManager = new PTD_DataManagerClass();
