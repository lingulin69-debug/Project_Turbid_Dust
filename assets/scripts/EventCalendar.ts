import {
    _decorator,
    Color,
    Component,
    Label,
    Node,
    Prefab,
    instantiate,
    tween,
    Vec3,
    Sprite,
    sys, // <-- 加在這裡！
} from 'cc';
import { getPageTheme, FactionType } from './PTD_UI_Theme';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

// ── 日曆事件資料介面 ──────────────────────────────────────────────────────────

export interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    event_date: string;      // ISO 8601 格式（例：2025-04-06T20:00:00+08:00）
    event_type: 'chapter_end' | 'maintenance' | 'special' | 'announcement';
    is_reminder_sent?: boolean;
}

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * EventCalendar
 * 
 * 企劃活動日曆，顯示未來一週的重要事件。
 * 特別標示每週日 20:00 的章節結算時間。
 * 
 * UI 佈局建議：
 *   ┌─────────────────────────────────┐
 *   │  📅 本週活動                     │
 *   │  ────────────────────────────   │
 *   │  04/06 週日 20:00               │
 *   │  🏆 第一章結算                   │
 *   │  ────────────────────────────   │
 *   │  04/08 週二 14:00               │
 *   │  🔧 系統維護                     │
 *   └─────────────────────────────────┘
 */
@ccclass('EventCalendar')
export class EventCalendar extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /** 日曆容器（ScrollView 內容區）*/
    @property(Node)
    eventContainer: Node = null;

    /** 事件卡片 Prefab */
    @property(Prefab)
    eventCardPrefab: Prefab = null;

    /** 空狀態提示（當沒有事件時顯示）*/
    @property(Label)
    emptyLabel: Label = null;

    /** 關閉按鈕 */
    @property(Node)
    closeButton: Node = null;

    /** 遮罩層 */
    @property(Node)
    backdropNode: Node = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _events: CalendarEvent[] = [];

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this._loadEvents();  // 異步載入，不阻塞 onLoad
        this._registerEvents();
    }

    start(): void {
        this._renderEvents();  // 確保資料載入後才渲染
    }

    onDestroy(): void {
        this.closeButton?.targetOff(this);
        this.backdropNode?.targetOff(this);
    }

    // ── 資料載入 ──────────────────────────────────────────────────────────────

    // <-- 記得在最上面 import sys

    /** 從 Supabase 拉取未來三個月的事件，並自動補上週日結算 */
    private async _loadEvents(): Promise<void> {
        try {
            const now = new Date();
            // 改為 90 天 (約三個月)
            const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

            const response = await fetch(
                `https://你的專案.supabase.co/rest/v1/td_calendar_events?event_date=gte.${now.toISOString()}&event_date=lte.${threeMonthsLater.toISOString()}&order=event_date.asc`,
                { headers: { 'apikey': 'YOUR_ANON_KEY', 'Authorization': 'Bearer YOUR_ANON_KEY' } }
            );

            this._events = (await response.json()) || [];
            this._checkDailyReminder(); // 執行每日登入提醒

        } catch (err) {
            console.warn('[EventCalendar] 載入事件失敗', err);
        }
    }

    /** 每日登入時檢查 24 小時內的事件並提醒一次 */
    private _checkDailyReminder(): void {
        const todayStr = new Date().toDateString(); // 例如 "Sun Mar 22 2026"
        const lastReminder = sys.localStorage.getItem('last_calendar_reminder');
        
        // 如果今天已經提醒過，就不再打擾
        if (lastReminder === todayStr) return;

        const upcoming = this.getUpcomingEvents();
        if (upcoming.length > 0) {
            console.log(`[EventCalendar] 每日提醒：您今天有 ${upcoming.length} 個即將到來的事件！`);
            // TODO: 呼叫 UI 彈出提醒視窗
            SoundManager.bell();
            sys.localStorage.setItem('last_calendar_reminder', todayStr);
        }
    }

    // ── 主題設定 ──────────────────────────────────────────────────────────────

    initTheme(faction: FactionType): void {
        const theme = getPageTheme(faction);

        if (this.emptyLabel) {
            this.emptyLabel.color = theme.textSecondary;
        }
    }

    // ── 事件渲染 ──────────────────────────────────────────────────────────────

    private _renderEvents(): void {
        if (!this.eventContainer || !this.eventCardPrefab) {
            console.warn('[EventCalendar] eventContainer 或 eventCardPrefab 未綁定');
            return;
        }

        // 清空舊卡片
        this.eventContainer.removeAllChildren();

        if (this._events.length === 0) {
            if (this.emptyLabel) this.emptyLabel.node.active = true;
            return;
        }

        if (this.emptyLabel) this.emptyLabel.node.active = false;

        // 生成事件卡片
        for (const event of this._events) {
            const card = instantiate(this.eventCardPrefab);
            this._populateCard(card, event);
            this.eventContainer.addChild(card);
        }
    }

    /** 填充事件卡片內容 */
    private _populateCard(card: Node, event: CalendarEvent): void {
        // 日期標籤（例：04/06 週日 20:00）
        const dateLabel = card.getChildByName('DateLabel')?.getComponent(Label);
        if (dateLabel) {
            dateLabel.string = this._formatDate(event.event_date);
        }

        // 標題標籤（例：第一章結算）
        const titleLabel = card.getChildByName('TitleLabel')?.getComponent(Label);
        if (titleLabel) {
            titleLabel.string = this._getEventIcon(event.event_type) + ' ' + event.title;
        }

        // 描述標籤（可選）
        const descLabel = card.getChildByName('DescLabel')?.getComponent(Label);
        if (descLabel && event.description) {
            descLabel.string = event.description;
        }

        // 高亮顯示章節結算
        if (event.event_type === 'chapter_end') {
            const bgSprite = card.getComponent(Sprite);
            if (bgSprite) {
                bgSprite.color = new Color(255, 215, 0, 50);  // 金色半透明
            }
        }

        // 檢查是否需要提醒（事件開始前 1 小時）
        this._checkReminder(event);
    }

    // ── 日期格式化 ────────────────────────────────────────────────────────────

    private _formatDate(isoString: string): string {
        const date = new Date(isoString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');

        return `${month}/${day} 週${weekday} ${hour}:${minute}`;
    }

    /** 取得事件類型對應的 Emoji 圖標 */
    private _getEventIcon(type: CalendarEvent['event_type']): string {
        switch (type) {
            case 'chapter_end':  return '🏆';
            case 'maintenance':  return '🔧';
            case 'special':      return '🎉';
            case 'announcement': return '📢';
            default:             return '📅';
        }
    }

    // ── 提醒功能 ──────────────────────────────────────────────────────────────

    /** 檢查是否需要發送提醒 */
    private _checkReminder(event: CalendarEvent): void {
        if (event.is_reminder_sent) return;

        const now = new Date();
        const eventTime = new Date(event.event_date);
        const oneHourBefore = new Date(eventTime.getTime() - 60 * 60 * 1000);

        // 如果當前時間在「事件開始前 1 小時」到「事件開始」之間
        if (now >= oneHourBefore && now < eventTime) {
            this._showReminder(event);
            this._markReminderSent(event.id);
        }
    }

    /** 顯示提醒彈窗 */
    private _showReminder(event: CalendarEvent): void {
        console.log(`[EventCalendar] 提醒：${event.title} 即將在 ${this._formatDate(event.event_date)} 開始`);
        
        // TODO: 實作提醒 Toast 或 Modal
        // 建議使用類似 RelicPoemModal 的小彈窗
        SoundManager.bell();
    }

    /** 標記提醒已發送（寫回資料庫）*/
    private async _markReminderSent(eventId: string): Promise<void> {
        try {
            await fetch(
                `https://你的專案.supabase.co/rest/v1/td_calendar_events?id=eq.${eventId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': 'YOUR_ANON_KEY',
                        'Authorization': 'Bearer YOUR_ANON_KEY',
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ is_reminder_sent: true })
                }
            );
        } catch (err) {
            console.warn('[EventCalendar] 標記提醒失敗', err);
        }
    }

    // ── 事件註冊 ──────────────────────────────────────────────────────────────

    private _registerEvents(): void {
        if (this.closeButton) {
            this.closeButton.targetOff(this);
            this.closeButton.on(Node.EventType.TOUCH_END, this._onClose, this);
        }
        if (this.backdropNode) {
            this.backdropNode.targetOff(this);
            this.backdropNode.on(Node.EventType.TOUCH_END, this._onClose, this);
        }
    }

    private _onClose(): void {
        tween(this.closeButton)
            .to(0.05, { scale: new Vec3(0.88, 0.88, 1) })
            .to(0.05, { scale: Vec3.ONE })
            .call(() => {
                SoundManager.panelOpen();
                this.node.emit('close-modal');
                this.node.active = false;
            })
            .start();
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    /** 刷新事件列表（手動重新載入）*/
    async refresh(): Promise<void> {
        await this._loadEvents();
        this._renderEvents();
    }

    /** 取得即將到來的事件（24 小時內）*/
    getUpcomingEvents(): CalendarEvent[] {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        return this._events.filter(event => {
            const eventTime = new Date(event.event_date);
            return eventTime >= now && eventTime <= tomorrow;
        });
    }
}
