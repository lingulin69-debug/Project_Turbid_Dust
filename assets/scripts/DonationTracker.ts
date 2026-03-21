import {
    _decorator,
    Color,
    Component,
    Label,
    Node,
    ProgressBar,
    Sprite,
    tween,
    Vec3,
} from 'cc';
import { DataEventBus, DATA_EVENTS, DataManager } from './PTD_DataManager';
import { SoundManager } from './SoundManager';
import { getPageTheme, FactionType } from './PTD_UI_Theme';

const { ccclass, property } = _decorator;

// ── 常數 ──────────────────────────────────────────────────────────────────────

const MAX_DONATIONS_PER_WEEK = 10;   // 每週捐獻上限
const DONATION_COST = 1;             // 每次捐獻消耗金幣

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * DonationTracker
 * 
 * 捐獻追蹤器，顯示本週已捐獻次數並限制玩家捐獻。
 * 每週日 20:00 結算時自動重置（由 MainGameController 呼叫）。
 * 
 * UI 佈局建議：
 *   ┌──────────────────────┐
 *   │  本週捐獻  7/10      │
 *   │  ████████░░░         │ ← ProgressBar
 *   │  [+1 捐獻]           │ ← 捐獻按鈕
 *   └──────────────────────┘
 */
@ccclass('DonationTracker')
export class DonationTracker extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /** 捐獻次數文字（例：7/10）*/
    @property(Label)
    countLabel: Label = null;

    /** 進度條（視覺化捐獻進度）*/
    @property(ProgressBar)
    progressBar: ProgressBar = null;

    /** 捐獻按鈕 */
    @property(Node)
    donateButton: Node = null;

    /** 按鈕上的文字（例：「+1 捐獻」）*/
    @property(Label)
    donateButtonLabel: Label = null;

    /** 已達上限提示文字（初始隱藏）*/
    @property(Label)
    maxReachedLabel: Label = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _donationsThisWeek: number = 0;
    private _currentChapter: number = 1;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

onLoad(): void {
        this._registerEvents(); // 確保按鈕被綁定
    }

    onDestroy(): void {
        this.donateButton?.targetOff(this);
        DataEventBus.off(DATA_EVENTS.COINS_CHANGED, this._onCoinsChanged, this);
    }

    /** 由主場景在確認章節後呼叫，初始化並載入資料 */
    async initForChapter(chapterNumber: number): Promise<void> {
        this._currentChapter = chapterNumber;
        await this._loadDonationData();
        this._updateDisplay();
        console.log(`[DonationTracker] 已初始化章節 ${chapterNumber} 的捐獻進度`);
    }

    // ── 初始化 ────────────────────────────────────────────────────────────────

    /** 從 Supabase 拉取玩家本週捐獻次數 */
    private async _loadDonationData(): Promise<void> {
        try {
            const player = DataManager.getPlayer();
            if (!player) return;

            const response = await fetch(
                `https://你的專案.supabase.co/rest/v1/td_player_donations?player_id=eq.${player.id}&chapter_number=eq.${this._currentChapter}`,
                {
                    headers: {
                        'apikey': 'YOUR_ANON_KEY',
                        'Authorization': 'Bearer YOUR_ANON_KEY'
                    }
                }
            );

            const data = await response.json();
            if (data && data.length > 0) {
                this._donationsThisWeek = data[0].donation_count || 0;
            }
        } catch (err) {
            console.warn('[DonationTracker] 載入捐獻資料失敗', err);
        }
    }

    /** 設定主題顏色（由 HUD 或主場景呼叫）*/
    initTheme(faction: FactionType): void {
        const theme = getPageTheme(faction);

        if (this.countLabel) {
            this.countLabel.color = theme.textPrimary;
        }

        if (this.progressBar) {
            const barSprite = this.progressBar.node
                .getChildByName('bar')
                ?.getComponent(Sprite);
            if (barSprite) {
                barSprite.color = theme.primary;
            }
        }
    }

    // ── 顯示更新 ──────────────────────────────────────────────────────────────

    private _updateDisplay(): void {
        const remaining = MAX_DONATIONS_PER_WEEK - this._donationsThisWeek;
        const isMaxed = remaining <= 0;

        // 次數標籤
        if (this.countLabel) {
            this.countLabel.string = `${this._donationsThisWeek}/${MAX_DONATIONS_PER_WEEK}`;
        }

        // 進度條
        if (this.progressBar) {
            const progress = this._donationsThisWeek / MAX_DONATIONS_PER_WEEK;
            tween(this.progressBar)
                .to(0.3, { progress })
                .start();
        }

        // 按鈕狀態
        if (this.donateButton) {
            this.donateButton.active = !isMaxed;
        }

        // 上限提示
        if (this.maxReachedLabel) {
            this.maxReachedLabel.node.active = isMaxed;
        }

        // 按鈕文字（顯示剩餘次數）
        if (this.donateButtonLabel && remaining > 0) {
            this.donateButtonLabel.string = `+1 捐獻 (剩 ${remaining} 次)`;
        }
    }

    // ── 捐獻邏輯 ──────────────────────────────────────────────────────────────

    private async _onDonateClick(): Promise<void> {
        const player = DataManager.getPlayer();
        if (!player) return;

        // 檢查上限
        if (this._donationsThisWeek >= MAX_DONATIONS_PER_WEEK) {
            console.warn('[DonationTracker] 已達本週捐獻上限');
            this._showMaxReachedAnimation();
            return;
        }

        // 檢查金幣
        if (player.coins < DONATION_COST) {
            console.warn('[DonationTracker] 金幣不足');
            // TODO: 顯示金幣不足提示
            return;
        }

        // 按鈕動畫
        tween(this.donateButton)
            .to(0.05, { scale: new Vec3(0.88, 0.88, 1) })
            .to(0.08, { scale: Vec3.ONE })
            .call(async () => {
                await this._processDonation();
            })
            .start();
    }

    /** 執行捐獻：扣金幣、更新次數、寫入資料庫 */
    private async _processDonation(): Promise<void> {
        const player = DataManager.getPlayer();
        if (!player) return;

        try {
            // 1. 扣除金幣（本地）
            DataManager.updateCoins(-DONATION_COST);

            // 2. 增加捐獻次數
            this._donationsThisWeek++;

            // 3. 寫入資料庫
            await fetch(
                'https://你的專案.supabase.co/rest/v1/rpc/increment_donation',
                {
                    method: 'POST',
                    headers: {
                        'apikey': 'YOUR_ANON_KEY',
                        'Authorization': 'Bearer YOUR_ANON_KEY',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        p_player_id: player.id,
                        p_chapter_number: this._currentChapter
                    })
                }
            );

            // 4. 更新顯示
            this._updateDisplay();

            // 5. 音效
            SoundManager.coin();

            console.log(`[DonationTracker] 捐獻成功，本週第 ${this._donationsThisWeek} 次`);

        } catch (err) {
            console.error('[DonationTracker] 捐獻失敗', err);
            // 回滾本地金幣
            DataManager.updateCoins(DONATION_COST);
            this._donationsThisWeek--;
        }
    }

    // ── 動畫效果 ──────────────────────────────────────────────────────────────

    private _showMaxReachedAnimation(): void {
        if (!this.maxReachedLabel) return;

        this.maxReachedLabel.node.active = true;

        tween(this.maxReachedLabel.node)
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.1, { scale: Vec3.ONE })
            .start();
    }

    // ── 事件註冊 ──────────────────────────────────────────────────────────────

    private _registerEvents(): void {
        if (this.donateButton) {
            this.donateButton.targetOff(this);
            this.donateButton.on(Node.EventType.TOUCH_END, this._onDonateClick, this);
        }

        // 監聽金幣變化，確保按鈕狀態即時更新
        DataEventBus.on(DATA_EVENTS.COINS_CHANGED, this._onCoinsChanged, this);
    }

    private _onCoinsChanged(coins: number): void {
        // 金幣不足時禁用按鈕
        if (this.donateButton) {
            const canAfford = coins >= DONATION_COST;
            const notMaxed = this._donationsThisWeek < MAX_DONATIONS_PER_WEEK;
            this.donateButton.active = canAfford && notMaxed;
        }
    }

    // ── 公開 API（由 MainGameController 呼叫）────────────────────────────────

    /**
     * 章節重置時呼叫，清空捐獻次數。
     * 通常在週日 20:00 結算後或新章節開始時觸發。
     */
    resetForNewChapter(chapterNumber: number): void {
        this._currentChapter = chapterNumber;
        this._donationsThisWeek = 0;
        this._updateDisplay();
        console.log(`[DonationTracker] 已重置捐獻次數（章節 ${chapterNumber}）`);
    }

    /** 取得本週剩餘捐獻次數 */
    getRemainingDonations(): number {
        return Math.max(0, MAX_DONATIONS_PER_WEEK - this._donationsThisWeek);
    }

    /** 取得捐獻進度（0.0 ~ 1.0）*/
    getProgress(): number {
        return this._donationsThisWeek / MAX_DONATIONS_PER_WEEK;
    }
}
