import {
    _decorator,
    Component,
    Label,
    Node,
} from 'cc';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

// ── 常數 ──────────────────────────────────────────────────────────────────────

const TYPEWRITER_INTERVAL = 0.08;   // 每字間隔（秒）
const SOUND_EVERY_N_CHARS = 3;      // 每 N 個字播一次音效（避免音效過度密集）

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('RelicPoemModal')
export class RelicPoemModal extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /** 詩歌本文，由打字機效果逐字填入 */
    @property(Label)
    poemLabel: Label = null;

    /** 署名，詩歌打完後才顯示 */
    @property(Label)
    authorLabel: Label = null;

    /**
     * 深色遮罩背景節點。
     * ⚠️ 設計師注意：Color 請設為 (0, 0, 0, 180)。
     *    嚴禁使用 backdrop-filter — Cocos 無原生支援且極耗效能。
     *    尺寸需撐滿整個 Canvas，層級置於 Modal 內容節點下方。
     */
    @property(Node)
    backdropNode: Node = null;

    /** 關閉按鈕（打字機播完後才啟用，或點擊直接略過）*/
    @property(Node)
    closeButtonNode: Node = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _fullText:    string = '';
    private _authorText:  string = '';
    private _charIndex:   number = 0;
    private _isTyping:    boolean = false;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this._registerEvents();
    }

    onDestroy(): void {
        this.unscheduleAllCallbacks();
        if (this.closeButtonNode?.isValid) this.closeButtonNode.targetOff(this);
        if (this.backdropNode?.isValid) this.backdropNode.targetOff(this);
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    /**
     * 由 MainGameController 在收到 'show-relic-poem' 後呼叫。
     * @param content 詩歌全文
     * @param author  署名（可選，預設空白）
     */
    init(content: string, author: string = ''): void {
        this._fullText   = content;
        this._authorText = author;
        this._charIndex  = 0;
        this._isTyping   = true;

        if (this.poemLabel)   this.poemLabel.string   = '';
        if (this.authorLabel) {
            this.authorLabel.string = '';
            this.authorLabel.node.active = false;
        }

        this.node.active = true;
        this.unscheduleAllCallbacks();
        this.schedule(this._typeNextChar, TYPEWRITER_INTERVAL);
    }

    // ── 打字機邏輯 ────────────────────────────────────────────────────────────

    private _typeNextChar(): void {
        if (!this.poemLabel) return;

        if (this._charIndex < this._fullText.length) {
            this._charIndex++;
            this.poemLabel.string = this._fullText.slice(0, this._charIndex);

            // 每 N 個字播一次音效，避免密集播放造成噪音
            if (this._charIndex % SOUND_EVERY_N_CHARS === 0) {
                SoundManager.panelOpen();
            }
        } else {
            // 全文播完
            this.unscheduleAllCallbacks();
            this._isTyping = false;
            this._showAuthor();
        }
    }

    private _showAuthor(): void {
        if (!this.authorLabel || !this._authorText) return;
        this.authorLabel.string = this._authorText;
        this.authorLabel.node.active = true;
    }

    // ── 略過功能 ──────────────────────────────────────────────────────────────

    /** 點擊遮罩或關閉按鈕時：若仍在打字則直接顯示全文，否則關閉 Modal。*/
    private _onTap(): void {
        if (this._isTyping) {
            // 略過打字機，直接顯示完整詩文
            this.unscheduleAllCallbacks();
            this._isTyping = false;
            if (this.poemLabel) this.poemLabel.string = this._fullText;
            this._showAuthor();
        } else {
            this._close();
        }
    }

    private _close(): void {
        SoundManager.panelOpen();
        this.node.emit('close-modal');
        this.node.active = false;
    }

    // ── 事件註冊 ──────────────────────────────────────────────────────────────

    private _registerEvents(): void {
        if (this.closeButtonNode) {
            this.closeButtonNode.targetOff(this);
            this.closeButtonNode.on(Node.EventType.TOUCH_END, this._onTap, this);
        }
        if (this.backdropNode) {
            this.backdropNode.targetOff(this);
            this.backdropNode.on(Node.EventType.TOUCH_END, this._onTap, this);
        }
    }
}
