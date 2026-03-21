import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    tween,
    Vec3,
} from 'cc';
import { FactionType, getPageTheme } from './PTD_UI_Theme';
import { DataEventBus, DATA_EVENTS, DataManager } from './PTD_DataManager';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

// ── HUD 面板 ID ───────────────────────────────────────────────────────────────

export type HUDPanelId =
    | 'announcement'
    | 'quest'
    | 'daily'
    | 'collection'
    | 'inventory'
    | 'npc'
    | 'settings';

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('HUDController')
export class HUDController extends Component {

    // ── Inspector：頂部資訊列 ─────────────────────────────────────────────────

    @property(Label)
    coinsLabel: Label = null;

    @property(Label)
    hpLabel: Label = null;

    @property(Label)
    ocNameLabel: Label = null;

    @property(Sprite)
    factionBadgeSprite: Sprite = null;

    @property(Node)
    bellButtonNode: Node = null;

    /** 鈴鐺上方未讀數字紅點節點 */
    @property(Node)
    bellBadgeNode: Node = null;

    @property(Label)
    bellBadgeLabel: Label = null;

    // ── Inspector：左側導航按鈕（順序對應 HUDPanelId）────────────────────────

    /** 順序須對應 NAV_PANELS 陣列：announcement/quest/daily/collection/inventory/npc/settings */
    @property([Node])
    navButtons: Node[] = [];

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _activePanelId: HUDPanelId | null = null;
    private _unreadCount: number = 0;

    /** 對應 navButtons 陣列的面板 ID，順序必須與 Inspector 一致 */
    private static readonly NAV_PANELS: HUDPanelId[] = [
        'announcement',
        'quest',
        'daily',
        'collection',
        'inventory',
        'npc',
        'settings',
    ];

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this._initDataDisplay();
        this._registerEvents();
    }

    // ── 初始化 ────────────────────────────────────────────────────────────────

    /** 登入後由主場景呼叫，傳入玩家 faction 設定 HUD 主題。 */
    initTheme(faction: FactionType): void {
        const th = getPageTheme(faction);
        if (this.ocNameLabel) this.ocNameLabel.color = th.textPrimary;
        if (this.coinsLabel)  this.coinsLabel.color  = th.textPrimary;
        if (this.hpLabel)     this.hpLabel.color     = th.textPrimary;
    }

    private _initDataDisplay(): void {
        const player = DataManager.getPlayer();
        if (player) {
            if (this.ocNameLabel) this.ocNameLabel.string = player.oc_name;
            this._updateCoinsLabel(player.coins);
            this._updateHpLabel(player.hp);
        }

        DataEventBus.on(DATA_EVENTS.COINS_CHANGED, this._updateCoinsLabel, this);
        DataEventBus.on(DATA_EVENTS.HP_CHANGED,    this._updateHpLabel,    this);
    }

    // ── 數值更新 ──────────────────────────────────────────────────────────────

    private _updateCoinsLabel(coins: number): void {
        if (this.coinsLabel) this.coinsLabel.string = `${coins}`;
    }

    private _updateHpLabel(hp: number): void {
        if (!this.hpLabel) return;
        const player = DataManager.getPlayer();
        this.hpLabel.string = player ? `${hp}/${player.max_hp}` : `${hp}`;
    }

    // ── 未讀通知 ──────────────────────────────────────────────────────────────

    setUnreadCount(count: number): void {
        this._unreadCount = count;
        const visible = count > 0;
        if (this.bellBadgeNode) this.bellBadgeNode.active = visible;
        if (this.bellBadgeLabel) this.bellBadgeLabel.string = count > 99 ? '99+' : `${count}`;
    }

    // ── 導航面板開關 ──────────────────────────────────────────────────────────

    /**
     * 切換指定面板。若已開啟同一面板則關閉。
     * 向外 emit 'panel-open' 或 'panel-close'，主場景負責顯示/隱藏對應面板節點。
     */
    togglePanel(panelId: HUDPanelId): void {
        if (this._activePanelId === panelId) {
            this._activePanelId = null;
            SoundManager.panelOpen();
            this.node.emit('panel-close', panelId);
        } else {
            this._activePanelId = panelId;
            SoundManager.panelOpen();
            this.node.emit('panel-open', panelId);
        }
    }

    /** 強制關閉所有面板（點擊地圖背景時呼叫）。 */
    closeAllPanels(): void {
        if (!this._activePanelId) return;
        const prev = this._activePanelId;
        this._activePanelId = null;
        this.node.emit('panel-close', prev);
    }

    // ── 事件註冊 ──────────────────────────────────────────────────────────────

    private _registerEvents(): void {
        // 導航按鈕
        HUDController.NAV_PANELS.forEach((panelId, index) => {
            const btn = this.navButtons[index];
            if (!btn) return;
            btn.targetOff(this);
            btn.on(Node.EventType.TOUCH_END, () => this._onNavButtonTap(btn, panelId), this);
        });

        // 鈴鐺按鈕
        if (this.bellButtonNode) {
            this.bellButtonNode.targetOff(this);
            this.bellButtonNode.on(Node.EventType.TOUCH_END, this._onBellTap, this);
        }
    }

    // ── 按鈕回呼 ──────────────────────────────────────────────────────────────

    private _onNavButtonTap(btn: Node, panelId: HUDPanelId): void {
        tween(btn)
            .to(0.05, { scale: new Vec3(0.88, 0.88, 1) })
            .to(0.05, { scale: Vec3.ONE })
            .call(() => this.togglePanel(panelId))
            .start();
    }

    private _onBellTap(): void {
        tween(this.bellButtonNode)
            .to(0.05, { scale: new Vec3(0.88, 0.88, 1) })
            .to(0.05, { scale: Vec3.ONE })
            .call(() => {
                SoundManager.bell();
                this.setUnreadCount(0);
                this.node.emit('bell-tapped');
            })
            .start();
    }

    // ── 生命週期清理 ──────────────────────────────────────────────────────────

    onDestroy(): void {
        this.navButtons.forEach(btn => btn?.targetOff(this));
        this.bellButtonNode?.targetOff(this);
        DataEventBus.off(DATA_EVENTS.COINS_CHANGED, this._updateCoinsLabel, this);
        DataEventBus.off(DATA_EVENTS.HP_CHANGED,    this._updateHpLabel,    this);
    }
}
