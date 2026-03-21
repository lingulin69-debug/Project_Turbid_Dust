import {
    _decorator,
    Color,
    Component,
    Label,
    Material,
    Node,
    Sprite,
    tween,
    Vec3,
} from 'cc';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';
import { SoundManager } from './SoundManager';
import { DataEventBus, DATA_EVENTS, DataManager } from './PTD_DataManager';

const { ccclass, property } = _decorator;

// ── 遺物彩蛋觸發組合 ──────────────────────────────────────────────────────────

const RELIC_POEM_TRIGGER = new Set<string>([
    '昔日的餘溫',
    '碎裂的鏡面',
    '無名者的手稿',
    '鏽蝕的徽章',
]);

// ── 顏色常數（對應 FACTION_THEMES 的 Cocos 版本）────────────────────────────

const WC_COLORS: Record<FactionType, {
    bg:            Color;
    titleText:     Color;
    secondaryText: Color;
    closeBtn:      Color;
    border:        Color;
}> = {
    Pure: {
        bg:            new Color(245, 242, 237),   // #f5f2ed
        titleText:     new Color(90,  78,  68),    // #5a4e44
        secondaryText: new Color(139, 115, 85),    // #8b7355
        closeBtn:      new Color(139, 115, 85),    // #8b7355
        border:        new Color(184, 159, 134, 89), // rgba(184,159,134,0.35)
    },
    Turbid: {
        bg:            new Color(19,  8,   38),    // #130826
        titleText:     new Color(228, 213, 245),   // #e4d5f5
        secondaryText: new Color(197, 168, 224),   // #c5a8e0
        closeBtn:      new Color(197, 168, 224),   // #c5a8e0
        border:        new Color(124, 58,  237, 102), // rgba(124,58,237,0.4)
    },
};

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('WhiteCrowCard')
export class WhiteCrowCard extends Component {

    // ── 暴露給 Inspector 的 UI 節點 ──────────────────────────────────────────

    @property(Sprite)
    bgSprite: Sprite = null;

    @property(Label)
    titleLabel: Label = null;

    @property(Label)
    codeLabel: Label = null;

    @property(Node)
    closeButtonNode: Node = null;

    /** 僅在桌機（Canvas ≥ 640）顯示 */
    @property(Node)
    portraitNode: Node = null;

    @property(Label)
    coinsLabel: Label = null;

    @property(Label)
    hpLabel: Label = null;

    @property(Label)
    relicHintLabel: Label = null;

    /** Tab 按鈕節點陣列，順序對應 tabIndex 0, 1, 2… */
    @property([Node])
    tabButtons: Node[] = [];

    // ── Shader / Material 預留接口 ────────────────────────────────────────────

    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _faction: FactionType = 'Pure';
    private _activeTab: number = 0;

    // ── 公開初始化 ────────────────────────────────────────────────────────────

    init(faction: FactionType, title?: string, code?: string): void {
        this._faction = faction;
        this._applyTheme();
        if (title && this.titleLabel) this.titleLabel.string = title;
        if (code  && this.codeLabel)  this.codeLabel.string  = code;
        this._initCoinsDisplay();
        this._initHpDisplay();
        this._registerEvents();
    }

    // ── 主題套用 ──────────────────────────────────────────────────────────────

    private _applyTheme(): void {
        const c  = WC_COLORS[this._faction];
        const th = getPageTheme(this._faction);

        if (this.bgSprite) {
            this.bgSprite.color = c.bg;
            applyFactionMaterial(
                this.bgSprite,
                this._faction,
                this.turbidMaterial,
                this.pureMaterial,
            );
        }

        if (this.titleLabel) {
            this.titleLabel.color = c.titleText;
        }

        if (this.codeLabel) {
            this.codeLabel.color = th.textSecondary;
        }

        // 關閉按鈕圖示顏色
        const closeIcon = this.closeButtonNode
            ?.getComponentInChildren(Sprite);
        if (closeIcon) closeIcon.color = c.closeBtn;
    }

    // ── 貨幣顯示 ──────────────────────────────────────────────────────────────

    private _initCoinsDisplay(): void {
        if (!this.coinsLabel) return;

        const player = DataManager.getPlayer();
        this._updateCoinsLabel(player?.coins ?? 0);

        DataEventBus.on(DATA_EVENTS.COINS_CHANGED, this._updateCoinsLabel, this);
    }

    private _updateCoinsLabel(coins: number): void {
        if (this.coinsLabel) {
            this.coinsLabel.string = `${coins}`;
        }
    }

    // ── HP 顯示 ───────────────────────────────────────────────────────────────

    private _initHpDisplay(): void {
        if (!this.hpLabel) return;

        const player = DataManager.getPlayer();
        this._updateHpLabel(player?.hp ?? 0);

        DataEventBus.on(DATA_EVENTS.HP_CHANGED, this._updateHpLabel, this);
    }

    private _updateHpLabel(hp: number): void {
        if (!this.hpLabel) return;
        const player = DataManager.getPlayer();
        this.hpLabel.string = player ? `${hp}/${player.max_hp}` : `${hp}`;
        const isLow = player ? hp < player.max_hp / 2 : false;
        this.hpLabel.color = isLow
            ? new Color(200, 50, 50)   // 低血量 → 紅
            : Color.WHITE;
    }

    // ── Tab 切換 ──────────────────────────────────────────────────────────────

    switchTab(index: number): void {
        if (index === this._activeTab) return;
        this._activeTab = index;
        SoundManager.panelOpen();
        this.node.emit('tab-changed', index);
    }

    // ── 事件註冊 ──────────────────────────────────────────────────────────────

    private _registerEvents(): void {
        // 關閉按鈕
        if (this.closeButtonNode) {
            this.closeButtonNode.targetOff(this);
            this.closeButtonNode.on(Node.EventType.TOUCH_END, this._onClose, this);
        }

        // Tab 按鈕：自動綁定，index 對應陣列位置
        this.tabButtons.forEach((btn, index) => {
            btn.targetOff(this);
            btn.on(Node.EventType.TOUCH_END, () => this.switchTab(index), this);
        });
    }

    // ── 關閉邏輯 ──────────────────────────────────────────────────────────────

    private _onClose(): void {
        tween(this.closeButtonNode)
            .to(0.05, { scale: new Vec3(0.88, 0.88, 1) })
            .to(0.05, { scale: Vec3.ONE })
            .call(() => {
                SoundManager.panelOpen();
                this.node.emit('close-card');
            })
            .start();
    }

    // ── 隱藏彩蛋：遺物詩篇 ───────────────────────────────────────────────────

    /**
     * 傳入玩家已收集的遺物 ID 陣列。
     * 若包含觸發組合中的所有遺物，廣播 'show-relic-poem'。
     */
    checkRelicPoem(collectedRelics: string[]): void {
        const collected = new Set(collectedRelics);
        const matched = [...RELIC_POEM_TRIGGER].filter(id => collected.has(id));
        if (matched.length === RELIC_POEM_TRIGGER.size) {
            if (this.relicHintLabel) this.relicHintLabel.string = '';
            SoundManager.unlock();
            this.node.emit('show-relic-poem');
        } else if (matched.length > 0) {
            const remaining = RELIC_POEM_TRIGGER.size - matched.length;
            if (this.relicHintLabel) this.relicHintLabel.string = `還差 ${remaining} 件`;
            this.node.emit('show-relic-hint', matched.length, RELIC_POEM_TRIGGER.size);
        } else {
            if (this.relicHintLabel) this.relicHintLabel.string = '';
        }
    }

    // ── 生命週期清理 ──────────────────────────────────────────────────────────

    onDestroy(): void {
        this.closeButtonNode?.targetOff(this);
        this.tabButtons.forEach(btn => btn.targetOff(this));
        DataEventBus.off(DATA_EVENTS.COINS_CHANGED, this._updateCoinsLabel, this);
        DataEventBus.off(DATA_EVENTS.HP_CHANGED,    this._updateHpLabel,    this);
    }

    // ── 公開工具：讓子節點透過 getComponentInParent 取得 faction ──────────────

    get faction(): FactionType { return this._faction; }
}
