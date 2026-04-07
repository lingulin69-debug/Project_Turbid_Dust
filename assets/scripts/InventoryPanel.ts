import {
    _decorator,
    Component,
    Node,
    Layers,
    Prefab,
    instantiate,
    UITransform,
    Sprite,
    Label,
    Color,
} from 'cc';
import { ItemData } from './PTD_DataManager';
import { ItemSlot } from './ItemSlot';
import { getWhiteSpriteFrame } from './PTD_SpriteHelper';

const { ccclass, property } = _decorator;

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('InventoryPanel')
export class InventoryPanel extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /**
     * 掛載 GridLayout 元件的容器節點。
     * ⚠️ 排版（欄數、間距、對齊）全權由編輯器 GridLayout 元件設定，
     *    腳本嚴禁出現任何 X/Y 座標計算。
     */
    @property(Node)
    gridContainer: Node = null;

    /** 單一物品格 Prefab（須掛載 ItemSlot 元件）*/
    @property(Prefab)
    itemSlotPrefab: Prefab = null;

    private _uiLayer = Layers.Enum.UI_2D;

    // ── 公開 API ──────────────────────────────────────────────────────────────

    /**
     * 由 MainGameController 呼叫，傳入道具列表後重新渲染所有格子。
     * @param items 道具資料陣列（來自 DataManager.fetchInventory()）
     */
    init(items: ItemData[]): void {
        if (!this.gridContainer) {
            console.warn('[InventoryPanel] gridContainer 未綁定');
            return;
        }

        // 清空舊有格子（自動解除舊有監聽器）
        this.gridContainer.removeAllChildren();

        for (const item of items) {
            let slotNode: Node;

            if (this.itemSlotPrefab) {
                slotNode = instantiate(this.itemSlotPrefab);
                this._setUILayerRecursive(slotNode);
                slotNode.getComponent(ItemSlot)?.init(item);
            } else {
                // 無 Prefab 時建立色塊佔位格
                slotNode = this._createPlaceholderSlot(item);
            }

            // 排版由 GridLayout 自動處理，此處只負責掛入容器
            this.gridContainer.addChild(slotNode);

            // 監聽每個格子的點擊事件，向上中繼給主場景
            slotNode.on('item-clicked', this._onItemClicked, this);
        }
    }

    private _createPlaceholderSlot(item: ItemData): Node {
        const node = new Node(`Slot_${item.id}`);
        node.layer = this._uiLayer;
        node.addComponent(UITransform).setContentSize(72, 72);
        const sp = node.addComponent(Sprite);
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        sp.spriteFrame = getWhiteSpriteFrame();
        sp.color = new Color(90, 80, 120, 200);

        const labelNode = new Node('Label');
        labelNode.layer = this._uiLayer;
        node.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(70, 20);
        const lb = labelNode.addComponent(Label);
        lb.string = item.name ?? item.id;
        lb.fontSize = 11;
        lb.color = new Color(255, 255, 255, 255);
        lb.overflow = Label.Overflow.SHRINK;

        return node;
    }

    private _setUILayerRecursive(node: Node): void {
        node.layer = this._uiLayer;
        for (const child of node.children) {
            this._setUILayerRecursive(child);
        }
    }

    // ── 事件處理 ──────────────────────────────────────────────────────────────

    /**
     * 收到格子點擊後，向上廣播 'show-item-detail'，
     * 由主場景（MainGameController）負責開啟 ItemDetailModal。
     */
    private _onItemClicked(data: ItemData): void {
        this.node.emit('show-item-detail', data);
    }

    // ── 生命週期清理 ──────────────────────────────────────────────────────────

    onDestroy(): void {
        // 清理動態建立的格子上的事件監聽
        if (this.gridContainer?.isValid) {
            for (const child of this.gridContainer.children) {
                if (child?.isValid) {
                    child.off('item-clicked', this._onItemClicked, this);
                }
            }
        }
    }
}
