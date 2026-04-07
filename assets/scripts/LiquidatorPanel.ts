import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    Material,
    EditBox,
    tween,
    UIOpacity,
    Color,
    BlockInputEvents,
    sys,
} from 'cc';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

type ScanStatus = 'idle' | 'scanning' | 'result';
type ScanResult = 'positive' | 'negative' | null;

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * LiquidatorPanel
 * 清算者系統面板 — 輸入目標 OC 名稱進行掃描，偵測對方是否為叛教者。
 *
 * 流程：idle → 輸入名稱 → scanning (2s 模擬) → result
 * 每章節限用一次。
 *
 * 外部開啟：MainGameController 呼叫 show()
 * 事件輸出：
 *   'scan-complete' — 掃描完成 (payload: { target, result: 'positive'|'negative' })
 *   'panel-closed'  — 面板關閉
 */
@ccclass('LiquidatorPanel')
export class LiquidatorPanel extends Component {

    // ── Inspector 插座 ───────────────────────────────────────────────────────

    /** 全螢幕遮罩 */
    @property(Node)
    maskNode: Node = null;

    /** 面板背景 */
    @property(Sprite)
    bgSprite: Sprite = null;

    /** 面板標題 */
    @property(Label)
    titleLabel: Label = null;

    /** 關閉按鈕 */
    @property(Node)
    closeButton: Node = null;

    // ── Idle 狀態節點 ────────────────────────────────────────────────────────

    /** 輸入區塊容器 */
    @property(Node)
    idlePanel: Node = null;

    /** 目標名稱輸入框 */
    @property(EditBox)
    targetInput: EditBox = null;

    /** 啟動掃描按鈕 */
    @property(Node)
    scanBtn: Node = null;

    /** 啟動掃描按鈕文字 */
    @property(Label)
    scanBtnLabel: Label = null;

    /** 錯誤提示 */
    @property(Label)
    errorLabel: Label = null;

    // ── Scanning 狀態節點 ────────────────────────────────────────────────────

    /** 掃描中動畫容器 */
    @property(Node)
    scanningPanel: Node = null;

    /** "ANALYZING..." 文字 */
    @property(Label)
    scanningLabel: Label = null;

    // ── Result 狀態節點 ──────────────────────────────────────────────────────

    /** 結果容器 */
    @property(Node)
    resultPanel: Node = null;

    /** 結果標題（HETEROGENEOUS / STABLE） */
    @property(Label)
    resultTitleLabel: Label = null;

    /** 結果描述 */
    @property(Label)
    resultDescLabel: Label = null;

    // ── Cooldown 狀態 ────────────────────────────────────────────────────────

    /** 冷卻提示文字 */
    @property(Label)
    cooldownLabel: Label = null;

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _isVisible = false;
    private _ocName = '';
    private _chapter = '';
    private _scanStatus: ScanStatus = 'idle';
    private _scanResult: ScanResult = null;
    private _actionUsed = false;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this.node.active = false;

        if (this.closeButton) {
            this.closeButton.on(Node.EventType.TOUCH_END, this.hide, this);
        }
        if (this.scanBtn) {
            this.scanBtn.on(Node.EventType.TOUCH_END, this._onScanTap, this);
        }
    }

    onDestroy(): void {
        if (this.closeButton?.isValid) this.closeButton.targetOff(this);
        if (this.scanBtn?.isValid) this.scanBtn.targetOff(this);
        this.unscheduleAllCallbacks();
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    initTheme(faction: FactionType): void {
        const th = getPageTheme(faction);
        if (this.bgSprite) {
            // 清算者使用深紅色調
            this.bgSprite.color = new Color(15, 5, 5);
            applyFactionMaterial(this.bgSprite, faction, this.turbidMaterial, this.pureMaterial);
        }
        if (this.titleLabel) this.titleLabel.color = new Color(239, 68, 68);
    }

    /**
     * 顯示清算者面板
     * @param ocName 玩家 OC 名稱
     * @param chapter 當前章節 (e.g. "ch1")
     */
    show(ocName: string, chapter: string): void {
        if (this._isVisible) return;
        this._isVisible = true;
        this._ocName = ocName;
        this._chapter = chapter;

        // 檢查本章是否已使用
        const usedKey = `liquidator_used_${chapter}_${ocName}`;
        this._actionUsed = sys.localStorage.getItem(usedKey) === 'true';

        this._scanStatus = 'idle';
        this._scanResult = null;

        this.node.active = true;
        SoundManager.panelOpen();

        this._updatePanelState();

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.22, { opacity: 255 }).start();
    }

    hide(): void {
        if (!this._isVisible) return;
        this._isVisible = false;

        this.unscheduleAllCallbacks();
        this.node.active = false;
        this._resetState();

        this.node.emit('panel-closed', 'liquidator');
    }

    // ── 內部狀態管理 ─────────────────────────────────────────────────────────

    private _resetState(): void {
        this._scanStatus = 'idle';
        this._scanResult = null;
        if (this.targetInput) this.targetInput.string = '';
        if (this.errorLabel) this.errorLabel.node.active = false;
    }

    private _updatePanelState(): void {
        // 所有面板先隱藏
        if (this.idlePanel) this.idlePanel.active = false;
        if (this.scanningPanel) this.scanningPanel.active = false;
        if (this.resultPanel) this.resultPanel.active = false;
        if (this.cooldownLabel) this.cooldownLabel.node.active = false;

        if (this._actionUsed) {
            // 已使用 — 顯示冷卻提示
            if (this.cooldownLabel) {
                this.cooldownLabel.string = '本章掃描次數已用完，等待下一章節。';
                this.cooldownLabel.node.active = true;
            }
            return;
        }

        switch (this._scanStatus) {
            case 'idle':
                if (this.idlePanel) this.idlePanel.active = true;
                if (this.errorLabel) this.errorLabel.node.active = false;
                if (this.scanBtnLabel) this.scanBtnLabel.string = '啟動掃描';
                break;

            case 'scanning':
                if (this.scanningPanel) this.scanningPanel.active = true;
                if (this.scanningLabel) this.scanningLabel.string = 'ANALYZING...';
                this._animateScanningText();
                break;

            case 'result':
                if (this.resultPanel) this.resultPanel.active = true;
                this._renderResult();
                break;
        }
    }

    // ── 掃描流程 ─────────────────────────────────────────────────────────────

    private _onScanTap(): void {
        if (this._actionUsed || this._scanStatus !== 'idle') return;

        const target = this.targetInput?.string?.trim();
        if (!target) {
            if (this.errorLabel) {
                this.errorLabel.string = '請輸入目標 OC 名稱';
                this.errorLabel.node.active = true;
            }
            return;
        }

        if (target === this._ocName) {
            if (this.errorLabel) {
                this.errorLabel.string = '不能掃描自己';
                this.errorLabel.node.active = true;
            }
            return;
        }

        // 進入掃描狀態
        this._scanStatus = 'scanning';
        this._updatePanelState();

        // 2 秒模擬掃描延遲
        this.scheduleOnce(() => {
            this._completeScan(target);
        }, 2.0);
    }

    private _completeScan(target: string): void {
        // 模擬結果（正式版應呼叫 API）
        // 簡單隨機：20% 機率偵測到叛教者
        this._scanResult = Math.random() < 0.2 ? 'positive' : 'negative';
        this._scanStatus = 'result';
        this._actionUsed = true;

        // 儲存使用記錄
        const usedKey = `liquidator_used_${this._chapter}_${this._ocName}`;
        sys.localStorage.setItem(usedKey, 'true');

        this.node.emit('scan-complete', {
            target,
            result: this._scanResult,
        });

        this._updatePanelState();
    }

    private _renderResult(): void {
        if (this._scanResult === 'positive') {
            if (this.resultTitleLabel) {
                this.resultTitleLabel.string = 'HETEROGENEOUS';
                this.resultTitleLabel.color = new Color(239, 68, 68);
            }
            if (this.resultDescLabel) {
                this.resultDescLabel.string = '目標身份異常 — 偵測到叛教者特徵。';
                this.resultDescLabel.color = new Color(252, 165, 165);
            }
        } else {
            if (this.resultTitleLabel) {
                this.resultTitleLabel.string = 'STABLE';
                this.resultTitleLabel.color = new Color(34, 197, 94);
            }
            if (this.resultDescLabel) {
                this.resultDescLabel.string = '目標身份正常 — 未偵測到異常特徵。';
                this.resultDescLabel.color = new Color(134, 239, 172);
            }
        }
    }

    private _animateScanningText(): void {
        if (!this.scanningLabel) return;

        let dots = 0;
        this.schedule(() => {
            dots = (dots + 1) % 4;
            if (this.scanningLabel) {
                this.scanningLabel.string = 'ANALYZING' + '.'.repeat(dots);
            }
        }, 0.5, 5); // 最多 6 次（3 秒）
    }
}
