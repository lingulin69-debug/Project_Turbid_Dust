import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
} from 'cc';
import { ItemData } from './PTD_DataManager';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('ItemSlot')
export class ItemSlot extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /** 道具圖示 */
    @property(Sprite)
    iconSprite: Sprite = null;

    /** 數量標籤（數量為 1 時清空文字保持畫面乾淨）*/
    @property(Label)
    quantityLabel: Label = null;

    /** 背景 / 稀有度底色 Sprite */
    @property(Sprite)
    bgSprite: Sprite = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _data: ItemData | null = null;

    // ── 公開 API ──────────────────────────────────────────────────────────────

    /**
     * 由 InventoryPanel 在 instantiate 後立即呼叫，將資料灌入格子。
     * @param data 單一道具資料
     */
    init(data: ItemData): void {
        this._data = data;

        // 數量顯示：數量為 1 時清空標籤以保持畫面乾淨
        if (this.quantityLabel) {
            this.quantityLabel.string = data.quantity > 1 ? `${data.quantity}` : '';
        }

        // TODO：依 data.id 或 data.type 從 resources 動態載入圖示 SpriteFrame
        // resources.load(`items/${data.id}`, SpriteFrame, (err, sf) => {
        //     if (!err && this.iconSprite) this.iconSprite.spriteFrame = sf;
        // });

        this._registerTouchEvent();
    }

    // ── 互動事件 ──────────────────────────────────────────────────────────────

    private _registerTouchEvent(): void {
        // 先移除舊綁定，防止 init 被重複呼叫時累積監聽器
        this.node.targetOff(this);
        this.node.on(Node.EventType.TOUCH_END, this._onTap, this);
    }

    private _onTap(): void {
        if (!this._data) return;
        SoundManager.panelOpen();
        this.node.emit('item-clicked', this._data);
    }

    // ── 生命週期清理 ──────────────────────────────────────────────────────────

    onDestroy(): void {
        this.node.targetOff(this);
    }
}
