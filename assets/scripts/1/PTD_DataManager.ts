import { EventTarget, sys } from 'cc';
import { FactionType } from './PTD_UI_Theme';
import type { LandmarkData } from './MapLandmark';

// ── Supabase 連線設定（請在此填入妳的專案資訊） ────────────────────────────────
const SUPABASE_CONFIG = {
    URL: 'https://你的專案.supabase.co',
    KEY: 'YOUR_ANON_KEY',
};

const HEADERS = {
    'apikey': SUPABASE_CONFIG.KEY,
    'Authorization': `Bearer ${SUPABASE_CONFIG.KEY}`,
    'Content-Type': 'application/json',
};

// ── 介面定義 ──────────────────────────────────────────────────────────────────

export interface PlayerData {
    id:                  string;
    oc_name:             string;
    faction:             FactionType;
    coins:               number;
    hp:                  number;
    max_hp:              number;
    current_landmark_id?: string;
    simple_password?:     string; // 用於偵測 0000
}

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

export const DATA_EVENTS = {
    COINS_CHANGED:   'ptd:coins-changed',
    HP_CHANGED:      'ptd:hp-changed',
} as const;

export const DataEventBus = new EventTarget();

// ── DataManager 實作 ─────────────────────────────────────────────────────────

class PTD_DataManagerClass {
    private _player: PlayerData | null = null;
    private _token:  string | null = null;

    initPlayer(data: PlayerData): void {
        this._player = { ...data };
    }

    getPlayer(): Readonly<PlayerData> | null {
        return this._player;
    }

    // ── 登入與權限 API ────────────────────────────────────────────────────────

    /** 向 Supabase 驗證帳密 (直接查詢資料表模式) */
    async login(ocName: string, password: string): Promise<PlayerData> {
        const url = `${SUPABASE_CONFIG.URL}/rest/v1/td_users?oc_name=eq.${ocName}&select=*`;
        
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) throw new Error(`網路請求失敗: ${response.status}`);

        const users = await response.json();
        if (!users || users.length === 0) throw new Error('找不到該 OC 名稱');

        const user = users[0] as PlayerData;
        if (user.simple_password !== password) throw new Error('密碼錯誤');

        return user;
    }

    /** 更新密碼 */
    async updatePassword(userId: string, newPassword: string): Promise<void> {
        const url = `${SUPABASE_CONFIG.URL}/rest/v1/td_users?id=eq.${userId}`;
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: HEADERS,
            body: JSON.stringify({ simple_password: newPassword })
        });

        if (!response.ok) throw new Error('更新密碼失敗');
    }

    // ── 遊戲狀態 API ──────────────────────────────────────────────────────────

    async fetchGameState(): Promise<GameState | null> {
        try {
            const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/td_game_state?id=eq.1`, { headers: HEADERS });
            const data = await response.json();
            return data && data.length > 0 ? data[0] : null;
        } catch (err) {
            return null;
        }
    }

    async fetchChapterStory(chapterNumber: number): Promise<ChapterStoryData | null> {
        try {
            const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/td_chapter_stories?chapter_number=eq.${chapterNumber}`, { headers: HEADERS });
            const data = await response.json();
            return data && data.length > 0 ? data[0] : null;
        } catch (err) {
            return null;
        }
    }

    // ── 貨幣與 HP 操作 ────────────────────────────────────────────────────────

    updateCoins(amount: number): void {
        if (!this._player) return;
        this._player.coins = Math.max(0, this._player.coins + amount);
        DataEventBus.emit(DATA_EVENTS.COINS_CHANGED, this._player.coins);
    }

    updateHP(amount: number): void {
        if (!this._player) return;
        this._player.hp = Math.min(this._player.max_hp, Math.max(0, this._player.hp + amount));
        DataEventBus.emit(DATA_EVENTS.HP_CHANGED, this._player.hp);
    }
}

export const DataManager = new PTD_DataManagerClass();