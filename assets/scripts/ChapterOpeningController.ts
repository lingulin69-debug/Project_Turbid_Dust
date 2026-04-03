import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    Material,
    UIOpacity,
    tween,
    Vec3,
    assetManager,
    ImageAsset,
    Texture2D,
    SpriteFrame,
} from 'cc';
import { SoundManager } from './SoundManager';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';

const { ccclass, property } = _decorator;

/**
 * 章節開幕標題卡控制器 — 呼吸場景結束後顯示新章節標題與開幕文字。
 *
 * 使用方式：
 *   1. 在場景中建立一個全螢幕遮罩節點，掛上此腳本
 *   2. Inspector 綁定各 Label / Node / Sprite 插座
 *   3. 由 MainGameController 呼叫 `show(opening, faction)` 啟動
 *   4. 玩家按「進入章節」後 emit 'opening-continue' 事件
 */
@ccclass('ChapterOpeningController')
export class ChapterOpeningController extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────

    @property(Label)
    chapterSubtitle: Label = null;

    @property(Label)
    chapterTitleLabel: Label = null;

    @property(Label)
    openingTextLabel: Label = null;

    @property(Node)
    continueButton: Node = null;

    @property(Label)
    continueButtonLabel: Label = null;

    @property(Sprite)
    backgroundSprite: Sprite = null;

    @property(Sprite)
    dividerSprite: Sprite = null;

    @property(Node)
    backdropNode: Node = null;

    // ── Material 預留接口（濁息 / 淨塵視覺效果）──────────────────

    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────

    private _openingText: string = '';

    // ── 生命週期 ──────────────────────────────────────────────────

    onLoad(): void {
        this.node.active = false;

        if (this.continueButton) {
            this.continueButton.on(Node.EventType.TOUCH_END, this._onContinue, this);
        }
    }

    onDestroy(): void {
        this.continueButton?.targetOff(this);
    }

    // ── 公開 API ──────────────────────────────────────────────────

    async show(opening: {
        chapter_version: string;
        faction: string;
        title: string;
        opening_text: string;
        background_image?: string;
    }, playerFaction: FactionType): Promise<void> {

        this._openingText = opening.opening_text || '';

        // 解析章節號碼（例如 "ch3_turbid" → 3）
        const chapterMatch = opening.chapter_version.match(/ch(\d+)/);
        const chapterNum = chapterMatch ? chapterMatch[1] : '?';

        // 設定副標
        if (this.chapterSubtitle) {
            this.chapterSubtitle.string = `Chapter ${chapterNum}`;
        }

        // 設定章節標題
        if (this.chapterTitleLabel) {
            this.chapterTitleLabel.string = opening.title;
        }

        // 設定開幕文字
        if (this.openingTextLabel) {
            this.openingTextLabel.string = this._openingText;
        }

        // 按鈕文字
        if (this.continueButtonLabel) {
            this.continueButtonLabel.string = '進入章節 ›';
        }

        // 套用陣營主題色
        const theme = getPageTheme(playerFaction);
        if (this.chapterSubtitle) {
            this.chapterSubtitle.color = theme.textSecondary;
        }
        if (this.chapterTitleLabel) {
            this.chapterTitleLabel.color = theme.textPrimary;
        }
        if (this.openingTextLabel) {
            this.openingTextLabel.color = theme.textSecondary;
        }

        // 分隔線顏色
        if (this.dividerSprite) {
            this.dividerSprite.color = theme.primary;
        }

        // 套用陣營材質
        if (this.backgroundSprite) {
            applyFactionMaterial(this.backgroundSprite, playerFaction, this.turbidMaterial, this.pureMaterial);

            // 載入遠端背景圖（如有提供）
            if (opening.background_image) {
                await this._loadBgImage(opening.background_image);
            }
        }

        // 顯示 + 動畫
        this.node.active = true;
        const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        opacity.opacity = 0;

        // 整體淡入
        tween(opacity).to(0.5, { opacity: 255 }).start();

        // 標題從下方滑入
        if (this.chapterTitleLabel) {
            const titleNode = this.chapterTitleLabel.node;
            const originY = titleNode.position.y;
            titleNode.setPosition(titleNode.position.x, originY - 20, titleNode.position.z);
            tween(titleNode)
                .delay(0.2)
                .to(0.6, { position: new Vec3(titleNode.position.x, originY, titleNode.position.z) },
                    { easing: 'quartOut' })
                .start();
        }

        SoundManager.panelOpen();
    }

    // ── 私有方法 ──────────────────────────────────────────────────

    private _onContinue(): void {
        const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        tween(opacity).to(0.3, { opacity: 0 }).call(() => {
            this.node.active = false;
            this.node.emit('opening-continue', this._openingText);
        }).start();
    }

    private async _loadBgImage(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            assetManager.loadRemote<ImageAsset>(url, (err: Error | null, imageAsset: ImageAsset) => {
                if (err) {
                    console.warn('[ChapterOpeningController] 載入背景圖失敗', err);
                    reject(err);
                    return;
                }

                const texture = new Texture2D();
                texture.image = imageAsset;

                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;

                if (this.backgroundSprite) {
                    this.backgroundSprite.spriteFrame = spriteFrame;
                }

                resolve();
            });
        });
    }
}
