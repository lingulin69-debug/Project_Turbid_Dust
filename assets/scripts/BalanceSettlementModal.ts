import {
    _decorator,
    Component,
    Node,
    Sprite,
    Label,
    Button,
    UIOpacity,
    UITransform,
    Color,
    Vec3,
    tween,
    Material,
} from 'cc';
import { DataManager, BalanceResult } from './PTD_DataManager';
import { getPageTheme, FactionType, applyFactionMaterial } from './PTD_UI_Theme';

const { ccclass, property } = _decorator;

// ── 結算資料介面 ──────────────────────────────────────────────────────────────

export interface SettlementData {
    chapter_version: string;
    final_balance_value: number;
    winning_faction: FactionType | 'Draw';
}

// ── 演出階段 ──────────────────────────────────────────────────────────────────

type SettlementPhase = 'loading' | 'appear' | 'tilt' | 'reveal' | 'error';

// ── 組件 ──────────────────────────────────────────────────────────────────────

@ccclass('BalanceSettlementModal')
export class BalanceSettlementModal extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /** 全螢幕遮罩 */
    @property(Node)
    maskNode: Node = null;

    /** 主面板容器 */
    @property(Node)
    panelNode: Node = null;

    /** 背景 Sprite */
    @property(Sprite)
    bgSprite: Sprite = null;

    /** 章節標記（例：ch3 · 陣營結算） */
    @property(Label)
    chapterLabel: Label = null;

    /** 天平圖示 — 濁息側 Sprite */
    @property(Sprite)
    turbidScaleSprite: Sprite = null;

    /** 天平圖示 — 淨塵側 Sprite */
    @property(Sprite)
    pureScaleSprite: Sprite = null;

    /** 天平橫樑節點（旋轉用） */
    @property(Node)
    beamNode: Node = null;

    /** 「濁息」文字標籤 */
    @property(Label)
    turbidLabel: Label = null;

    /** 「淨塵」文字標籤 */
    @property(Label)
    pureLabel: Label = null;

    /** 裝飾分隔線節點 */
    @property(Node)
    dividerNode: Node = null;

    /** 獲勝陣營文字 */
    @property(Label)
    winnerLabel: Label = null;

    /** 天平數值文字 */
    @property(Label)
    balanceValueLabel: Label = null;

    /** 載入中提示文字 */
    @property(Label)
    loadingLabel: Label = null;

    /** 錯誤提示文字 */
    @property(Label)
    errorLabel: Label = null;

    /** 確認（關閉）按鈕 */
    @property(Button)
    confirmButton: Button = null;

    /** 確認按鈕文字 */
    @property(Label)
    confirmBtnLabel: Label = null;

    /** 濁息狀態覆蓋材質 */
    @property(Material)
    turbidMaterial: Material = null;

    /** 淨塵狀態覆蓋材質 */
    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _phase: SettlementPhase = 'loading';
    private _data: SettlementData | null = null;

    // ── 公開方法 ──────────────────────────────────────────────────────────────

    /**
     * 顯示天平結算動畫。
     * @param chapterVersion 章節版本字串，如 'ch3'
     */
    show(chapterVersion?: string): void {
        this.node.active = true;
        this._phase = 'loading';
        this._updateVisibility();

        const op = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.4, { opacity: 255 }).start();

        this._loadSettlement(chapterVersion);
    }

    /** 關閉面板 */
    hide(): void {
        if (!this.node.active) return;
        this.unscheduleAllCallbacks();
        const op = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        tween(op).to(0.3, { opacity: 0 }).call(() => {
            this.node.active = false;
            this.node.emit('panel-closed');
        }).start();
    }

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this.node.active = false;

        if (this.confirmButton) {
            this.confirmButton.node.on(Button.EventType.CLICK, this._onConfirm, this);
        }
        if (this.maskNode) {
            this.maskNode.on(Node.EventType.TOUCH_END, () => { /* 吞掉背景點擊 */ });
        }
    }

    onDestroy(): void {
        this.unscheduleAllCallbacks();
        this.confirmButton?.node.targetOff(this);
        this.maskNode?.targetOff(this);
    }

    // ── 載入結算資料 ──────────────────────────────────────────────────────────

    private async _loadSettlement(chapterVersion?: string): Promise<void> {
        try {
            // 使用 DataManager 的天平計算
            const balance: BalanceResult = DataManager.calculateBalance();

            this._data = {
                chapter_version: chapterVersion ?? `ch${DataManager.getPlayer()?.chapter ?? '?'}`,
                final_balance_value: balance.balance_value,
                winning_faction: balance.dominant,
            };

            // 演出時序：appear → 1.2s → tilt → 2.0s → reveal
            this._phase = 'appear';
            this._updateVisibility();
            this._initScaleAppearance();

            this.scheduleOnce(() => {
                this._phase = 'tilt';
                this._animateBeamTilt();
            }, 1.2);

            this.scheduleOnce(() => {
                this._phase = 'reveal';
                this._updateVisibility();
                this._showResult();
            }, 3.2);

        } catch (err) {
            console.error('[BalanceSettlementModal] 載入結算資料失敗', err);
            this._phase = 'error';
            this._updateVisibility();
        }
    }

    // ── 天平動畫 ──────────────────────────────────────────────────────────────

    /** 天平初始：水平姿態 + 兩側標籤 */
    private _initScaleAppearance(): void {
        if (this.beamNode) {
            this.beamNode.setRotationFromEuler(0, 0, 0);
        }

        // 設定陣營文字色
        const turbidColor = new Color(155, 127, 232); // #9b7fe8
        const pureColor   = new Color(212, 175, 55);  // #d4af37
        const dimColor     = new Color(90, 80, 96);    // #5a5060

        if (this.turbidLabel) this.turbidLabel.color = dimColor;
        if (this.pureLabel)   this.pureLabel.color   = dimColor;

        // 初始章節標記
        if (this.chapterLabel && this._data) {
            this.chapterLabel.string = `${this._data.chapter_version} · 陣營結算`;
            this.chapterLabel.color = new Color(90, 74, 48); // #5a4a30
        }
    }

    /** 天平傾斜動畫 */
    private _animateBeamTilt(): void {
        if (!this.beamNode || !this._data) return;

        // balance_value: -100 ~ +100
        // rotation: -22° (Turbid 重) ~ +22° (Pure 重)
        const targetAngle = (this._data.final_balance_value / 100) * 22;

        tween(this.beamNode)
            .to(1.8, { eulerAngles: new Vec3(0, 0, targetAngle) }, { easing: 'elasticOut' })
            .start();

        // 發光：勝方側高亮
        const turbidColor = new Color(155, 127, 232);
        const pureColor   = new Color(212, 175, 55);

        if (this._data.winning_faction === 'Turbid') {
            if (this.turbidLabel) this.turbidLabel.color = turbidColor;
            if (this.turbidScaleSprite) this.turbidScaleSprite.color = turbidColor;
        } else if (this._data.winning_faction === 'Pure') {
            if (this.pureLabel) this.pureLabel.color = pureColor;
            if (this.pureScaleSprite) this.pureScaleSprite.color = pureColor;
        }
    }

    /** 顯示結果（分數 + 勝方 + 確認按鈕） */
    private _showResult(): void {
        if (!this._data) return;

        const faction = this._data.winning_faction;
        const factionLabel =
            faction === 'Turbid' ? '濁息者勝出' :
            faction === 'Pure'   ? '淨塵者勝出' :
            '天平平衡';

        const factionColor =
            faction === 'Turbid' ? new Color(155, 127, 232) :
            faction === 'Pure'   ? new Color(212, 175, 55) :
            new Color(160, 144, 112);

        // 勝方文字
        if (this.winnerLabel) {
            this.winnerLabel.string = factionLabel;
            this.winnerLabel.color = factionColor;
            this.winnerLabel.node.active = true;
        }

        // 天平數值
        if (this.balanceValueLabel) {
            this.balanceValueLabel.string = `最終天平值 ${this._data.final_balance_value.toFixed(1)}`;
            this.balanceValueLabel.color = new Color(factionColor.r, factionColor.g, factionColor.b, 230);
            this.balanceValueLabel.node.active = true;
        }

        // 裝飾線
        if (this.dividerNode) {
            this.dividerNode.active = true;
        }

        // 確認按鈕（延遲 1.2s 淡入）
        if (this.confirmButton) {
            const btnOp = this.confirmButton.node.getComponent(UIOpacity) || this.confirmButton.node.addComponent(UIOpacity);
            btnOp.opacity = 0;
            this.confirmButton.node.active = true;
            this.scheduleOnce(() => {
                tween(btnOp).to(0.6, { opacity: 255 }).start();
            }, 1.2);
        }

        if (this.confirmBtnLabel) {
            this.confirmBtnLabel.string = '確認存檔';
            this.confirmBtnLabel.color = factionColor;
        }
    }

    // ── 狀態切換 ──────────────────────────────────────────────────────────────

    private _updateVisibility(): void {
        const isLoading = this._phase === 'loading';
        const isError   = this._phase === 'error';
        const isMain    = this._phase === 'appear' || this._phase === 'tilt' || this._phase === 'reveal';
        const isReveal  = this._phase === 'reveal';

        if (this.loadingLabel)      this.loadingLabel.node.active      = isLoading;
        if (this.errorLabel)        this.errorLabel.node.active        = isError;
        if (this.panelNode)         this.panelNode.active              = isMain;
        if (this.winnerLabel)       this.winnerLabel.node.active       = isReveal;
        if (this.balanceValueLabel) this.balanceValueLabel.node.active = isReveal;
        if (this.dividerNode)       this.dividerNode.active            = isReveal;
        if (this.confirmButton)     this.confirmButton.node.active     = false; // reveal 階段才另外開
    }

    // ── 按鈕事件 ──────────────────────────────────────────────────────────────

    private _onConfirm(): void {
        this.node.emit('settlement-confirmed', this._data);
        this.hide();
    }

    // ── Material 預留接口 ─────────────────────────────────────────────────────

    applyFactionMaterial(faction: FactionType): void {
        const mat = faction === 'Turbid' ? this.turbidMaterial : this.pureMaterial;
        if (mat && this.bgSprite) {
            this.bgSprite.customMaterial = mat;
        }
    }
}
