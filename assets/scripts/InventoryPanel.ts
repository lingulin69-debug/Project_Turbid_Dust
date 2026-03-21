import {
    _decorator,
    Component,
    Node,
    Prefab,
    instantiate,
} from 'cc';
import { ItemData } from './PTD_DataManager';
import { ItemSlot } from './ItemSlot';

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
        if (!this.itemSlotPrefab) {
            console.warn('[InventoryPanel] itemSlotPrefab 未綁定');
            return;
        }

        // 清空舊有格子（自動解除舊有監聽器）
        this.gridContainer.removeAllChildren();

        for (const item of items) {
            const slotNode = instantiate(this.itemSlotPrefab);

            // 資料灌入：在 addChild 前完成，確保 init 時節點已具備正確狀態
            slotNode.getComponent(ItemSlot)?.init(item);

            // 排版由 GridLayout 自動處理，此處只負責掛入容器
            this.gridContainer.addChild(slotNode);

            // 監聽每個格子的點擊事件，向上中繼給主場景
            // 注意：Cocos 的 node.emit() 不會自動冒泡，
            //       因此必須在 init() 逐格綁定，而非監聽 gridContainer
            slotNode.on('item-clicked', this._onItemClicked, this);
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
}
