import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    Material,
    UIOpacity,
    tween,
    Color,
} from 'cc';
import { SoundManager } from './SoundManager';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';

const { ccclass, property } = _decorator;

/**
 * 呼吸場景控制器 — 章節切換前的 30 秒氛圍文字過場。
 *
 * 使用方式：
 *   1. 在場景中建立一個全螢幕遮罩節點，掛上此腳本
 *   2. Inspector 綁定各 Label / Node 插座
 *   3. 由 MainGameController 呼叫 `show(scene, faction)` 啟動
 *   4. 完成後自動 emit 'breathing-complete' 事件
 */
@ccclass('BreathingSceneController')
export class BreathingSceneController extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────

    @property(Label)
    titleLabel: Label = null;

    @property(Label)
    textLabel: Label = null;

    @property(Label)
    skipLabel: Label = null;

    @property(Node)
    skipButton: Node = null;

    @property(Sprite)
    progressBar: Sprite = null;

    @property(Sprite)
    backgroundSprite: Sprite = null;

    @property(Node)
    backdropNode: Node = null;

    // ── Material 預留接口（濁息 / 淨塵視覺效果）──────────────────

    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────

    private _duration: number = 30;
    private _elapsed: number = 0;
    private _running: boolean = false;
    private _paragraphs: string[] = [];
    private _revealedCount: number = 0;
    private _paragraphInterval: number = 0;

    // ── 生命週期 ──────────────────────────────────────────────────

    onLoad(): void {
        this.node.active = false;

        if (this.skipButton) {
            this.skipButton.on(Node.EventType.TOUCH_END, this._onSkip, this);
        }
        if (this.backdropNode) {
            this.backdropNode.on(Node.EventType.TOUCH_END, this._onSkip, this);
        }
    }

    onDestroy(): void {
        this.unscheduleAllCallbacks();
        if (this.skipButton?.isValid) this.skipButton.targetOff(this);
        if (this.backdropNode?.isValid) this.backdropNode.targetOff(this);
    }

    update(dt: number): void {
        if (!this._running) return;

        this._elapsed += dt;
        const progress = Math.min(this._elapsed / this._duration, 1);

        // 更新進度條（用 fillRange，假設 Sprite Type = Filled）
        if (this.progressBar) {
            this.progressBar.fillRange = progress;
        }

        // 逐段揭露文字
        const shouldReveal = Math.min(
            Math.floor(this._elapsed / this._paragraphInterval) + 1,
            this._paragraphs.length,
        );
        if (shouldReveal > this._revealedCount) {
            this._revealedCount = shouldReveal;
            this._updateText();
        }

        // 時間到
        if (progress >= 1) {
            this._complete();
        }
    }

    // ── 公開 API ──────────────────────────────────────────────────

    show(scene: {
        transition: string;
        title: string;
        faction: string;
        text: string;
        duration_seconds: number;
    }, playerFaction: FactionType): void {
        this._duration = scene.duration_seconds || 30;
        this._elapsed = 0;
        this._running = true;
        this._paragraphs = scene.text.split('\n').filter(Boolean);
        this._revealedCount = 0;
        this._paragraphInterval = this._duration / Math.max(this._paragraphs.length, 1);

        // 設定標題
        if (this.titleLabel) {
            this.titleLabel.string = scene.title;
        }

        // 清空文字
        if (this.textLabel) {
            this.textLabel.string = '';
        }

        // 重置進度條
        if (this.progressBar) {
            this.progressBar.fillRange = 0;
        }

        // 套用陣營主題色
        const theme = getPageTheme(playerFaction);
        if (this.titleLabel) {
            this.titleLabel.color = theme.textPrimary;
        }
        if (this.textLabel) {
            this.textLabel.color = theme.textSecondary;
        }

        // 套用陣營材質
        if (this.backgroundSprite) {
            applyFactionMaterial(this.backgroundSprite, playerFaction, this.turbidMaterial, this.pureMaterial);
        }

        // 顯示 + 淡入
        this.node.active = true;
        const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.6, { opacity: 255 }).start();

        SoundManager.panelOpen();
    }

    // ── 私有方法 ──────────────────────────────────────────────────

    private _updateText(): void {
        if (!this.textLabel) return;
        this.textLabel.string = this._paragraphs.slice(0, this._revealedCount).join('\n\n');
    }

    private _onSkip(): void {
        if (!this._running) return;
        this._complete();
    }

    private _complete(): void {
        this._running = false;
        this.unscheduleAllCallbacks();

        const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        tween(opacity).to(0.4, { opacity: 0 }).call(() => {
            this.node.active = false;
            this.node.emit('breathing-complete');
        }).start();
    }
}
