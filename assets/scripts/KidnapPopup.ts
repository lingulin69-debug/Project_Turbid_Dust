import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    Material,
    tween,
    UIOpacity,
    Color,
    BlockInputEvents,
} from 'cc';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';

const { ccclass, property } = _decorator;

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * KidnapPopup
 * 綁架事件彈窗 — 不可手動關閉的全螢幕鎖定式覆蓋層。
 *
 * 當玩家被人販子綁架時彈出，顯示倒計時。
 * 倒計時歸零後自動解除並 emit 'kidnap-expired'。
 * 期間僅提供「查看角色卡」按鈕。
 *
 * 外部開啟：MainGameController 呼叫 show(content, lostUntil)
 * 事件輸出：
 *   'kidnap-expired'        — 倒計時結束，自動解除
 *   'open-character-card'   — 使用者點擊查看角色卡
 */
@ccclass('KidnapPopup')
export class KidnapPopup extends Component {

    // ── Inspector 插座 ───────────────────────────────────────────────────────

    /** 全螢幕遮罩（不可點擊關閉） */
    @property(Node)
    maskNode: Node = null;

    /** 面板容器 */
    @property(Node)
    panelNode: Node = null;

    /** 標題 "TERMINAL RESTRICTED" */
    @property(Label)
    titleLabel: Label = null;

    /** 警告文字（紅色 pulse） */
    @property(Label)
    warningLabel: Label = null;

    /** 通知內容文字 */
    @property(Label)
    contentLabel: Label = null;

    /** 倒計時文字 (HH:MM:SS) */
    @property(Label)
    countdownLabel: Label = null;

    /** 查看角色卡按鈕 */
    @property(Node)
    characterCardBtn: Node = null;

    /** 底部說明文字 */
    @property(Label)
    footerLabel: Label = null;

    /** 面板背景 */
    @property(Sprite)
    bgSprite: Sprite = null;

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _isVisible = false;
    private _remaining = 0;  // 剩餘秒數
    private _lostUntilMs = 0;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this.node.active = false;

        if (this.characterCardBtn) {
            this.characterCardBtn.on(Node.EventType.TOUCH_END, this._onCharacterCardTap, this);
        }

        // 阻止遮罩點擊穿透（但不關閉）
        if (this.maskNode) {
            if (!this.maskNode.getComponent(BlockInputEvents)) {
                this.maskNode.addComponent(BlockInputEvents);
            }
        }
    }

    onDestroy(): void {
        if (this.characterCardBtn?.isValid) this.characterCardBtn.targetOff(this);
        this.unscheduleAllCallbacks();
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    initTheme(faction: FactionType): void {
        if (this.bgSprite) {
            // 綁架彈窗一律深黑底
            this.bgSprite.color = new Color(10, 10, 10, 230);
        }
        if (this.titleLabel) {
            this.titleLabel.color = new Color(239, 68, 68);
        }
        if (this.warningLabel) {
            this.warningLabel.color = new Color(239, 68, 68);
        }
        if (this.countdownLabel) {
            this.countdownLabel.color = new Color(239, 68, 68);
        }
        if (this.footerLabel) {
            this.footerLabel.color = new Color(100, 100, 100);
        }
    }

    /**
     * 顯示綁架彈窗
     * @param content 通知文字內容
     * @param lostUntil ISO 時間戳（倒計時截止時間）
     */
    show(content: string, lostUntil: string): void {
        if (this._isVisible) return;
        this._isVisible = true;

        this._lostUntilMs = new Date(lostUntil).getTime();
        this._remaining = Math.max(0, Math.floor((this._lostUntilMs - Date.now()) / 1000));

        // 填入內容
        if (this.titleLabel) this.titleLabel.string = 'TERMINAL RESTRICTED';
        if (this.warningLabel) this.warningLabel.string = '⚠ 你已被捕獲 ⚠';
        if (this.contentLabel) this.contentLabel.string = content;
        if (this.footerLabel) this.footerLabel.string = '其餘終端功能暫時停用';

        this._updateCountdown();
        this._startWarningPulse();

        this.node.active = true;

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.3, { opacity: 255 }).start();

        // 啟動每秒倒計時
        this.schedule(this._tick, 1.0);
    }

    /** 強制關閉（由外部呼叫，例如 GM 操作） */
    forceClose(): void {
        if (!this._isVisible) return;
        this._isVisible = false;
        this.unscheduleAllCallbacks();

        this.node.active = false;
    }

    // ── 倒計時邏輯 ──────────────────────────────────────────────────────────

    private _tick(): void {
        this._remaining = Math.max(0, Math.floor((this._lostUntilMs - Date.now()) / 1000));
        this._updateCountdown();

        if (this._remaining <= 0) {
            this.unschedule(this._tick);
            this._onExpired();
        }
    }

    private _updateCountdown(): void {
        if (!this.countdownLabel) return;

        const h = Math.floor(this._remaining / 3600);
        const m = Math.floor((this._remaining % 3600) / 60);
        const s = this._remaining % 60;

        this.countdownLabel.string =
            `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    private _onExpired(): void {
        this._isVisible = false;

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);

        tween(opacity).to(0.3, { opacity: 0 }).call(() => {
            this.node.active = false;
        }).start();

        this.node.emit('kidnap-expired');
    }

    // ── 警告 Pulse 動畫 ─────────────────────────────────────────────────────

    private _startWarningPulse(): void {
        if (!this.warningLabel) return;

        const warningOpacity = this.warningLabel.node.getComponent(UIOpacity)
            ?? this.warningLabel.node.addComponent(UIOpacity);

        tween(warningOpacity)
            .repeatForever(
                tween(warningOpacity)
                    .to(0.8, { opacity: 100 })
                    .to(0.8, { opacity: 255 })
            )
            .start();
    }

    // ── 按鈕回呼 ──────────────────────────────────────────────────────────────

    private _onCharacterCardTap(): void {
        this.node.emit('open-character-card');
    }
}
