import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    Material,
    Slider,
    Toggle,
    tween,
    UIOpacity,
} from 'cc';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * SettingsPanel
 * 設定面板，控制音量、語言等遊戲選項。
 *
 * 開啟方式：
 *  MainGameController._onPanelOpen('settings') → 顯示此面板
 */
@ccclass('SettingsPanel')
export class SettingsPanel extends Component {

    @property(Sprite)
    bgSprite: Sprite = null;

    @property(Label)
    titleLabel: Label = null;

    @property(Node)
    closeButton: Node = null;

    /** BGM 音量 Slider（0~1） */
    @property(Slider)
    bgmSlider: Slider = null;

    /** 音效音量 Slider（0~1） */
    @property(Slider)
    sfxSlider: Slider = null;

    /** BGM 音量數值 Label */
    @property(Label)
    bgmValueLabel: Label = null;

    /** 音效音量數值 Label */
    @property(Label)
    sfxValueLabel: Label = null;

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _isVisible = false;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        if (this.closeButton) {
            this.closeButton.on(Node.EventType.TOUCH_END, this.hide, this);
        }

        if (this.bgmSlider) {
            this.bgmSlider.node.on('slide', this._onBgmSlide, this);
        }
        if (this.sfxSlider) {
            this.sfxSlider.node.on('slide', this._onSfxSlide, this);
        }
    }

    onDestroy(): void {
        this.closeButton?.targetOff(this);
        this.bgmSlider?.node.targetOff(this);
        this.sfxSlider?.node.targetOff(this);
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    initTheme(faction: FactionType): void {
        const th = getPageTheme(faction);
        if (this.bgSprite) this.bgSprite.color = th.bgBase;
        if (this.titleLabel) this.titleLabel.color = th.textPrimary;

        if (this.bgSprite) {
            applyFactionMaterial(this.bgSprite, faction, this.turbidMaterial, this.pureMaterial);
        }
    }

    show(): void {
        if (this._isVisible) return;
        this._isVisible = true;

        this.node.active = true;
        SoundManager.panelOpen();

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.2, { opacity: 255 }).start();
    }

    hide(): void {
        if (!this._isVisible) return;
        this._isVisible = false;

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);

        tween(opacity).to(0.15, { opacity: 0 }).call(() => {
            this.node.active = false;
        }).start();

        this.node.emit('panel-closed', 'settings');
    }

    toggle(): void {
        if (this._isVisible) this.hide();
        else this.show();
    }

    // ── Slider 回呼 ──────────────────────────────────────────────────────────

    private _onBgmSlide(): void {
        if (!this.bgmSlider) return;
        const val = Math.round(this.bgmSlider.progress * 100);
        if (this.bgmValueLabel) this.bgmValueLabel.string = `${val}%`;
        SoundManager.setBgmVolume(this.bgmSlider.progress);
    }

    private _onSfxSlide(): void {
        if (!this.sfxSlider) return;
        const val = Math.round(this.sfxSlider.progress * 100);
        if (this.sfxValueLabel) this.sfxValueLabel.string = `${val}%`;
        SoundManager.setSfxVolume(this.sfxSlider.progress);
    }
}
