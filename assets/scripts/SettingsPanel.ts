import {
    _decorator,
    Button,
    Color,
    Component,
    Label,
    Node,
    Sprite,
    Material,
    Slider,
    Toggle,
    sys,
    tween,
    UITransform,
    UIOpacity,
} from 'cc';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';
import { getWhiteSpriteFrame } from './PTD_SpriteHelper';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

type SettingsLanguage = 'zh-Hant' | 'zh-Hans';

const LANGUAGE_STORAGE_KEY = 'ptd_settings_language';

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

    @property(Node)
    traditionalChineseButton: Node = null;

    @property(Node)
    simplifiedChineseButton: Node = null;

    @property(Label)
    languageValueLabel: Label = null;

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _isVisible = false;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        console.log('[SettingsPanel LANG-V4] onLoad');
        this._refreshRuntimeNodeReferences();
        this._bindRuntimeEvents();
        this._refreshLanguageDisplay(undefined, 'onLoad');
    }

    refreshRuntimeBindings(): void {
        console.log('[SettingsPanel LANG-V4] refreshRuntimeBindings');
        this._refreshRuntimeNodeReferences();
        this._bindRuntimeEvents();
        this._refreshLanguageDisplay(undefined, 'refreshRuntimeBindings');
    }

    selectTraditionalChinese(): void {
        this._setLanguage('zh-Hant');
    }

    selectSimplifiedChinese(): void {
        this._setLanguage('zh-Hans');
    }

    onDestroy(): void {
        this._clearNodeEvents(this.closeButton);
        if (this.bgmSlider?.node?.isValid) this.bgmSlider.node.targetOff(this);
        if (this.sfxSlider?.node?.isValid) this.sfxSlider.node.targetOff(this);
        this._clearNodeEvents(this.traditionalChineseButton);
        this._clearNodeEvents(this.simplifiedChineseButton);
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    initTheme(faction: FactionType): void {
        const th = getPageTheme(faction);
        if (this.bgSprite) this.bgSprite.color = th.bgBase;
        if (this.titleLabel) this.titleLabel.color = th.textPrimary;

        if (this.bgSprite) {
            applyFactionMaterial(this.bgSprite, faction, this.turbidMaterial, this.pureMaterial);
        }

        this._refreshLanguageDisplay(undefined, 'initTheme');
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

        this.node.active = false;

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

    private _getTouchTarget(node: Node | null): Node | null {
        if (!node) return null;
        return node.getChildByName('TouchTarget') ?? node;
    }

    private _findNodeByName(root: Node | null, name: string): Node | null {
        if (!root) return null;
        if (root.name === name) return root;

        for (const child of root.children) {
            const match = this._findNodeByName(child, name);
            if (match) return match;
        }

        return null;
    }

    private _refreshRuntimeNodeReferences(): void {
        // 僅在 Inspector 未綁定時才動態搜尋節點
        if (!this.closeButton) {
            this.closeButton = this._findNodeByName(this.node, 'CloseButton');
        }
        if (!this.traditionalChineseButton) {
            this.traditionalChineseButton = this._findNodeByName(this.node, 'TraditionalChineseButton');
        }
        if (!this.simplifiedChineseButton) {
            this.simplifiedChineseButton = this._findNodeByName(this.node, 'SimplifiedChineseButton');
        }

        this._ensureLanguageButtonVisual(this.traditionalChineseButton, '繁體中文');
        this._ensureLanguageButtonVisual(this.simplifiedChineseButton, '简体中文');

        const titleNode = this._findNodeByName(this.node, 'LanguageTitleLabel');
        const titleLabel = titleNode?.getComponent(Label);
        if (titleLabel) {
            titleLabel.string = '語言切換 V4';
        }

        const valueNode = this._findNodeByName(this.node, 'LanguageValueLabel');
        if (!valueNode) return;

        const valueTransform = valueNode.getComponent(UITransform) ?? valueNode.addComponent(UITransform);
        valueTransform.setContentSize(320, 38);

        const valueSprite = valueNode.getComponent(Sprite) ?? valueNode.addComponent(Sprite);
        valueSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        valueSprite.spriteFrame = getWhiteSpriteFrame();
        valueSprite.color = new Color(51, 65, 85, 220);

        const rootLabel = valueNode.getComponent(Label);
        if (rootLabel) {
            rootLabel.string = '';
        }

        let valueTextNode = valueNode.getChildByName('LanguageValueText');
        if (!valueTextNode) {
            valueTextNode = new Node('LanguageValueText');
            valueNode.addChild(valueTextNode);
        }
        valueTextNode.layer = valueNode.layer;

        const textTransform = valueTextNode.getComponent(UITransform) ?? valueTextNode.addComponent(UITransform);
        textTransform.setContentSize(320, 38);
        valueTextNode.setPosition(0, 0, 0);

        const valueLabel = valueTextNode.getComponent(Label) ?? valueTextNode.addComponent(Label);
        valueLabel.fontSize = 15;
        valueLabel.color = new Color(250, 204, 21, 255);
        valueLabel.overflow = Label.Overflow.SHRINK;
        valueLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        valueLabel.verticalAlign = Label.VerticalAlign.CENTER;

        this.languageValueLabel = valueLabel;
    }

    private _ensureLanguageButtonVisual(buttonNode: Node | null, defaultText: string): void {
        if (!buttonNode) return;

        const buttonTransform = buttonNode.getComponent(UITransform) ?? buttonNode.addComponent(UITransform);
        buttonTransform.setContentSize(220, 42);

        const buttonSprite = buttonNode.getComponent(Sprite) ?? buttonNode.addComponent(Sprite);
        buttonSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        buttonSprite.spriteFrame = getWhiteSpriteFrame();

        if (!buttonNode.getComponent(Button)) {
            buttonNode.addComponent(Button);
        }

        const rootLabel = buttonNode.getComponent(Label);
        if (rootLabel) {
            rootLabel.string = '';
        }

        let textNode = buttonNode.getChildByName('ButtonText');
        if (!textNode) {
            textNode = new Node('ButtonText');
            buttonNode.addChild(textNode);
        }
        textNode.layer = buttonNode.layer;

        const textTransform = textNode.getComponent(UITransform) ?? textNode.addComponent(UITransform);
        textTransform.setContentSize(220, 42);
        textNode.setPosition(0, 0, 0);

        const textLabel = textNode.getComponent(Label) ?? textNode.addComponent(Label);
        textLabel.string = defaultText;
        textLabel.fontSize = 20;
        textLabel.color = new Color(241, 245, 249, 255);
        textLabel.overflow = Label.Overflow.SHRINK;
        textLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        textLabel.verticalAlign = Label.VerticalAlign.CENTER;
    }

    private _clearNodeEvents(node: Node | null): void {
        if (!node?.isValid) return;

        const touchTarget = this._getTouchTarget(node);
        const buttonTextNode = node.getChildByName('ButtonText');
        node.targetOff(this);
        if (touchTarget?.isValid && touchTarget !== node) {
            touchTarget.targetOff(this);
        }
        if (buttonTextNode?.isValid) {
            buttonTextNode.targetOff(this);
        }
    }

    private _bindRuntimeEvents(): void {
        const closeTarget = this._getTouchTarget(this.closeButton);
        if (closeTarget) {
            this._clearNodeEvents(this.closeButton);
            const closeButton = closeTarget.getComponent(Button);
            if (closeButton) {
                closeButton.node.on(Button.EventType.CLICK, this.hide, this);
            } else {
                closeTarget.on(Node.EventType.TOUCH_END, this.hide, this);
            }
        }

        if (this.bgmSlider) {
            this.bgmSlider.node.targetOff(this);
            this.bgmSlider.node.on('slide', this._onBgmSlide, this);
        }

        if (this.sfxSlider) {
            this.sfxSlider.node.targetOff(this);
            this.sfxSlider.node.on('slide', this._onSfxSlide, this);
        }

        const traditionalTarget = this._getTouchTarget(this.traditionalChineseButton);
        if (traditionalTarget) {
            this._clearNodeEvents(this.traditionalChineseButton);
            const traditionalButton = traditionalTarget.getComponent(Button);
            const traditionalTextNode = this.traditionalChineseButton?.getChildByName('ButtonText');
            if (traditionalButton) {
                traditionalButton.node.on(Button.EventType.CLICK, this._onSelectTraditionalChinese, this);
            } else {
                traditionalTarget.on(Node.EventType.TOUCH_END, this._onSelectTraditionalChinese, this);
            }
            if (traditionalTextNode) {
                traditionalTextNode.on(Node.EventType.TOUCH_END, this._onSelectTraditionalChinese, this);
            }
        }

        const simplifiedTarget = this._getTouchTarget(this.simplifiedChineseButton);
        if (simplifiedTarget) {
            this._clearNodeEvents(this.simplifiedChineseButton);
            const simplifiedButton = simplifiedTarget.getComponent(Button);
            const simplifiedTextNode = this.simplifiedChineseButton?.getChildByName('ButtonText');
            if (simplifiedButton) {
                simplifiedButton.node.on(Button.EventType.CLICK, this._onSelectSimplifiedChinese, this);
            } else {
                simplifiedTarget.on(Node.EventType.TOUCH_END, this._onSelectSimplifiedChinese, this);
            }
            if (simplifiedTextNode) {
                simplifiedTextNode.on(Node.EventType.TOUCH_END, this._onSelectSimplifiedChinese, this);
            }
        }
    }

    private _onSelectTraditionalChinese(): void {
        this.selectTraditionalChinese();
    }

    private _onSelectSimplifiedChinese(): void {
        this.selectSimplifiedChinese();
    }

    private _setLanguage(language: SettingsLanguage): void {
        sys.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        this._refreshLanguageDisplay(language, '_setLanguage');
        console.log(`[SettingsPanel] 已切換語言：${language}`);
        this.node.emit('language-changed', language);
    }

    private _getLanguage(): SettingsLanguage {
        const storedValue = sys.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return storedValue === 'zh-Hans' ? 'zh-Hans' : 'zh-Hant';
    }

    private _refreshLanguageDisplay(languageOverride?: SettingsLanguage, source = 'unknown'): void {
        const language = languageOverride ?? this._getLanguage();

        if (this.languageValueLabel) {
            this.languageValueLabel.string = language === 'zh-Hant' ? '目前語言：繁體中文' : '目前語言：简体中文';
            console.log(
                `[SettingsPanel] languageValueLabel 更新為：${this.languageValueLabel.string} | source=${source} | effective=${language}`,
                this.languageValueLabel.node.worldPosition,
            );
        }

        this._applyLanguageButtonState(this.traditionalChineseButton, language === 'zh-Hant');
        this._applyLanguageButtonState(this.simplifiedChineseButton, language === 'zh-Hans');
    }

    private _applyLanguageButtonState(buttonNode: Node | null, isActive: boolean): void {
        if (!buttonNode) return;

        const touchTarget = this._getTouchTarget(buttonNode);
        const sprite = touchTarget?.getComponent(Sprite);
        if (sprite) {
            sprite.color = isActive
                ? new Color(248, 250, 252, 245)
                : new Color(71, 85, 105, 235);
        }

        const labelText = buttonNode.name === 'TraditionalChineseButton'
            ? (isActive ? '✓ 繁體中文' : '繁體中文')
            : (isActive ? '✓ 简体中文' : '简体中文');

        const buttonTextLabel = buttonNode.getChildByName('ButtonText')?.getComponent(Label);
        const labels = buttonTextLabel ? [buttonTextLabel] : buttonNode.getComponentsInChildren(Label);

        for (const label of labels) {
            label.string = labelText;
            label.color = isActive
                ? new Color(250, 204, 21, 255)
                : new Color(241, 245, 249, 255);
        }

        console.log(
            `[SettingsPanel] 按鈕狀態更新：${buttonNode.name} -> ${labelText}`,
            labels.map(label => `${label.node.name}:${label.string}`),
        );
    }
}
