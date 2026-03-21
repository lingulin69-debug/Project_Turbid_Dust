import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    tween,
    Vec3,
} from 'cc';
import { ItemData } from './PTD_DataManager';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('ItemDetailModal')
export class ItemDetailModal extends Component {

    // ── Inspector 插座：顯示區 ────────────────────────────────────────────────

    @property(Label)
    nameLabel: Label = null;

    @property(Label)
    typeLabel: Label = null;

    @property(Label)
    descLabel: Label = null;

    @property(Label)
    quantityLabel: Label = null;

    @property(Sprite)
    iconSprite: Sprite = null;

    // ── Inspector 插座：互動區 ────────────────────────────────────────────────

    /** 使用 / 裝備道具按鈕（數量 <= 0 時自動隱藏）*/
    @property(Node)
    useButtonNode: Node = null;

    /** 關閉按鈕 */
    @property(Node)
    closeButtonNode: Node = null;

    // ── Inspector 插座：遮罩層 ────────────────────────────────────────────────

    /**
     * 半透明黑底遮罩節點。
     * ⚠️ 設計師注意：此節點 Color 請設為 (0, 0, 0, 180)。
     *    絕對禁止使用背景模糊（backdrop-filter）— Cocos 無原生支援且極耗效能。
     *    尺寸必須撐滿整個 Canvas，層級置於 Modal 內容節點下方（先渲染）。
     */
    @property(Node)
    backdropNode: Node = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _data: ItemData | null = null;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this._registerEvents();
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    /**
     * 由主場景在收到 'show-item-detail' 後呼叫。
     * @param data 被點擊的道具資料
     */
    init(data: ItemData): void {
        this._data = data;

        if (this.nameLabel)     this.nameLabel.string     = data.name;
        if (this.typeLabel)     this.typeLabel.string     = data.type;
        if (this.descLabel)     this.descLabel.string     = data.description;
        if (this.quantityLabel) this.quantityLabel.string = `x${data.quantity}`;

        // TODO：依 data.id 從 resources 動態載入圖示 SpriteFrame
        // resources.load(`items/${data.id}`, SpriteFrame, (err, sf) => {
        //     if (!err && this.iconSprite) this.iconSprite.spriteFrame = sf;
        // });

        // 數量 <= 0 時隱藏使用按鈕
        if (this.useButtonNode) {
            this.useButtonNode.active = data.quantity > 0;
        }

        this.node.active = true;
    }

    // ── 事件註冊 ──────────────────────────────────────────────────────────────

    private _registerEvents(): void {
        if (this.closeButtonNode) {
            this.closeButtonNode.targetOff(this);
            this.closeButtonNode.on(Node.EventType.TOUCH_END, this._onClose, this);
        }
        if (this.backdropNode) {
            this.backdropNode.targetOff(this);
            this.backdropNode.on(Node.EventType.TOUCH_END, this._onClose, this);
        }
        if (this.useButtonNode) {
            this.useButtonNode.targetOff(this);
            this.useButtonNode.on(Node.EventType.TOUCH_END, this._onUse, this);
        }
    }

    // ── 按鈕回呼 ──────────────────────────────────────────────────────────────

    private _onClose(): void {
        SoundManager.panelOpen();
        this.node.emit('close-modal');
        this.node.active = false;
    }

    private _onUse(): void {
        if (!this._data || !this.useButtonNode) return;

        tween(this.useButtonNode)
            .to(0.05, { scale: new Vec3(0.88, 0.88, 1) })
            .to(0.08, { scale: Vec3.ONE })
            .call(() => {
                SoundManager.panelOpen();
                this.node.emit('use-item', this._data);
            })
            .start();
    }

    // ── 生命週期清理 ──────────────────────────────────────────────────────────

    onDestroy(): void {
        this.closeButtonNode?.targetOff(this);
        this.backdropNode?.targetOff(this);
        this.useButtonNode?.targetOff(this);
    }
}
