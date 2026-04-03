import {
    _decorator,
    Component,
    Label,
    Material,
    Node,
    Sprite,
    AudioSource,
    assetManager,
    ImageAsset,
    Texture2D,
    SpriteFrame,
} from 'cc';
import { SoundManager } from './SoundManager';
import { applyFactionMaterial, FactionType } from './PTD_UI_Theme';

const { ccclass, property } = _decorator;

@ccclass('ChapterStoryModal')
export class ChapterStoryModal extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────

    @property(Label)
    chapterTitleLabel: Label = null;

    @property(Label)
    storyContentLabel: Label = null;

    @property(Label)
    winnerLabel: Label = null;

    @property(Sprite)
    bgImageSprite: Sprite = null;

    @property(AudioSource)
    bgMusicSource: AudioSource = null;

    @property(Node)
    closeButton: Node = null;

    @property(Node)
    backdropNode: Node = null;

    // ── Material 預留接口（濁息 / 淨塵視覺效果）──────────────────

    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────

    private _fullText: string = '';
    private _charIndex: number = 0;
    private _typing: boolean = false;

    // ── 生命週期 ──────────────────────────────────────────────────

    onLoad(): void {
        this._registerEvents();
    }

    onDestroy(): void {
        this.unscheduleAllCallbacks();
        this.closeButton?.targetOff(this);
        this.backdropNode?.targetOff(this);
    }

    // ── 公開 API ──────────────────────────────────────────────────

    async init(config: {
        chapter: number;
        title: string;
        content: string;
        bgImageUrl?: string;
        bgMusicUrl?: string;
        winnerFaction?: string;
    }): Promise<void> {
        
        // 套用陣營材質
        if (config.winnerFaction && this.bgImageSprite) {
            const faction: FactionType = config.winnerFaction === 'Pure' ? 'Pure' : 'Turbid';
            applyFactionMaterial(this.bgImageSprite, faction, this.turbidMaterial, this.pureMaterial);
        }

        // 設定標題
        if (this.chapterTitleLabel) {
            this.chapterTitleLabel.string = config.title;
        }

        // 設定勝利陣營
        if (this.winnerLabel && config.winnerFaction) {
            const factionName = config.winnerFaction === 'Pure' ? '淨塵者' : '濁息者';
            this.winnerLabel.string = `${factionName} 獲勝`;
        }

        // 載入背景圖
        if (config.bgImageUrl && this.bgImageSprite) {
            await this._loadBgImage(config.bgImageUrl);
        }

        // 播放背景音樂
        if (config.bgMusicUrl && this.bgMusicSource) {
            // TODO: 載入並播放音樂
            // 需要先把音樂檔案放到 Cocos 的 resources 資料夾
        }

        // 啟動打字機效果
        this._fullText = config.content;
        this._charIndex = 0;
        this._typing = true;

        if (this.storyContentLabel) {
            this.storyContentLabel.string = '';
        }

        this.unscheduleAllCallbacks();
        this.schedule(this._typeNextChar, 0.08);
    }

    // ── 打字機效果 ────────────────────────────────────────────────

    private _typeNextChar(): void {
        if (!this.storyContentLabel) return;

        if (this._charIndex < this._fullText.length) {
            this._charIndex++;
            this.storyContentLabel.string = this._fullText.slice(0, this._charIndex);

            if (this._charIndex % 3 === 0) {
                SoundManager.panelOpen();
            }
        } else {
            this.unscheduleAllCallbacks();
            this._typing = false;
        }
    }

    // ── 載入背景圖（從網址） ──────────────────────────────────────

    private async _loadBgImage(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            assetManager.loadRemote<ImageAsset>(url, (err, imageAsset) => {
                if (err) {
                    console.warn('[ChapterStoryModal] 載入背景圖失敗', err);
                    reject(err);
                    return;
                }

                const texture = new Texture2D();
                texture.image = imageAsset;

                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;

                if (this.bgImageSprite) {
                    this.bgImageSprite.spriteFrame = spriteFrame;
                }

                resolve();
            });
        });
    }

    // ── 關閉邏輯 ──────────────────────────────────────────────────

    private _onTap(): void {
        if (this._typing) {
            // 略過打字機
            this.unscheduleAllCallbacks();
            this._typing = false;
            if (this.storyContentLabel) {
                this.storyContentLabel.string = this._fullText;
            }
        } else {
            // 關閉 Modal
            this._close();
        }
    }

    private _close(): void {
        SoundManager.panelOpen();
        this.node.emit('close-modal');
        this.node.active = false;
    }

    // ── 事件註冊 ──────────────────────────────────────────────────

    private _registerEvents(): void {
        if (this.closeButton) {
            this.closeButton.targetOff(this);
            this.closeButton.on(Node.EventType.TOUCH_END, this._onTap, this);
        }
        if (this.backdropNode) {
            this.backdropNode.targetOff(this);
            this.backdropNode.on(Node.EventType.TOUCH_END, this._onTap, this);
        }
    }
}