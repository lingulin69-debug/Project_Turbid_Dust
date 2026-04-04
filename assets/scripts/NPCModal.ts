import {
    _decorator,
    Component,
    Label,
    Node,
    Prefab,
    instantiate,
    tween,
    Vec3,
} from 'cc';
import { ItemData } from './PTD_DataManager';
import { ItemSlot } from './ItemSlot';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

// ── Mock 商店商品（正式版替換為 DataManager.getShopItems(npcId)）────────────

const MOCK_SHOP_ITEMS: Record<'black_merchant' | 'item_merchant', import('./PTD_DataManager').ItemData[]> = {
    black_merchant: [
        { id: 'shop_b01', name: '禁忌藥劑',  description: '效果不明，風險自負。', quantity: 1, type: 'consumable', price: 8,  rarity: 3 },
        { id: 'shop_b02', name: '黑市情報',  description: '某個據點的秘密弱點。', quantity: 1, type: 'key',        price: 12, rarity: 3 },
        { id: 'shop_b03', name: '遮面頭巾',  description: '讓人難以辨認你的臉。', quantity: 1, type: 'equipment',  price: 6,  rarity: 2 },
    ],
    item_merchant: [
        { id: 'shop_i01', name: '急救包',   description: '立即恢復 10 HP。',     quantity: 1, type: 'consumable', price: 3,  rarity: 1 },
        { id: 'shop_i02', name: '火把',     description: '照亮黑暗的角落。',      quantity: 1, type: 'material',   price: 1,  rarity: 1 },
        { id: 'shop_i03', name: '繩索',     description: '多用途，看你怎麼用。',   quantity: 1, type: 'material',   price: 2,  rarity: 1 },
        { id: 'shop_i04', name: '解毒草藥', description: '中和輕度毒素。',         quantity: 1, type: 'consumable', price: 4,  rarity: 2 },
    ],
};

// ── NPC ID 型別（對應 CLAUDE.md npc_role 欄位值）────────────────────────────

export type NpcId =
    | 'black_merchant'
    | 'item_merchant'
    | 'inn_owner'
    | 'trafficker'
    | 'pet_merchant';

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('NPCModal')
export class NPCModal extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    @property(Label)
    npcNameLabel: Label = null;

    @property(Label)
    dialogueLabel: Label = null;

    /**
     * 商品列表容器，掛載 GridLayout 元件。
     * ⚠️ 排版（欄數、間距）全權由編輯器 GridLayout 設定，腳本不計算任何座標。
     */
    @property(Node)
    shopContainer: Node = null;

    /** 商品格 Prefab，重用 ItemSlot 組件 */
    @property(Prefab)
    itemSlotPrefab: Prefab = null;

    /** 旅店補血等特殊行動按鈕 */
    @property(Node)
    actionButtonNode: Node = null;

    /** 行動按鈕文字標籤（掛在 actionButtonNode 子節點上）*/
    @property(Label)
    actionButtonLabel: Label = null;

    /** 關閉按鈕 */
    @property(Node)
    closeButtonNode: Node = null;

    /**
     * 半透明黑底遮罩節點。
     * ⚠️ 設計師注意：Color 請設為 (0, 0, 0, 180)。
     *    嚴禁使用背景模糊（backdrop-filter）— Cocos 無原生支援且極耗效能。
     *    尺寸需撐滿整個 Canvas，層級置於 Modal 內容節點下方。
     */
    @property(Node)
    backdropNode: Node = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _npcId: NpcId | null = null;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this._registerEvents();
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    /**
     * 由主場景在點擊地圖 NPC 圖標後呼叫。
     * 依 npcId 切換面板狀態、對話文字與可用按鈕。
     *
     * @param npcId     對應 CLAUDE.md 中 npc_role 欄位值
     * @param customData 預留擴充（例如旅店傳入費用、商人傳入商品列表等）
     */
    init(npcId: NpcId, customData?: any): void {
        this._npcId = npcId;

        this._applyState(npcId, customData);
        this.node.active = true;
    }

    // ── 狀態切換 ──────────────────────────────────────────────────────────────

    private _applyState(npcId: NpcId, customData?: any): void {
        switch (npcId) {
            case 'black_merchant':
            case 'item_merchant': {
                this._setNpcName(npcId === 'black_merchant' ? '黑心商人' : '道具商人');
                this._setDialogue('需要些什麼？能讓你滿意的東西，我都有。');
                this._showShop(true);
                this._showAction(false);
                this._populateShop(MOCK_SHOP_ITEMS[npcId]);
                break;
            }

            case 'pet_merchant': {
                this._setNpcName('寵物商人');
                this._setDialogue('這些生物都是我親手養大的，保證健康。');
                this._showShop(true);
                this._showAction(false);

                // TODO：呼叫 DataManager 取得寵物列表並生成格子
                break;
            }

            case 'inn_owner': {
                this._setNpcName('旅店老闆');
                this._setDialogue('要休息嗎？先付錢。');
                this._showShop(false);
                this._showAction(true);
                if (this.actionButtonLabel) {
                    this.actionButtonLabel.string = '治療 (需 2 金幣)';
                }
                break;
            }

            case 'trafficker': {
                this._setNpcName('人販子');
                this._setDialogue('（此人在暗處注視著你，一言不發）');
                this._showShop(false);
                this._showAction(false);
                break;
            }

            default: {
                console.warn(`[NPCModal] 未知的 npcId：${npcId}`);
                break;
            }
        }
    }

    // ── 商品生成 ──────────────────────────────────────────────────────────────

    private _populateShop(items: ItemData[]): void {
        if (!this.shopContainer || !this.itemSlotPrefab) return;

        this.shopContainer.removeAllChildren();

        for (const item of items) {
            const slotNode = instantiate(this.itemSlotPrefab);
            slotNode.getComponent(ItemSlot)?.init(item);
            this.shopContainer.addChild(slotNode);

            // 收到格子點擊 → 向外廣播 buy-item，決策權交給 Controller
            slotNode.on('item-clicked', (data: ItemData) => {
                this.node.emit('buy-item', data);
            }, this);
        }
    }

    // ── 輔助方法 ──────────────────────────────────────────────────────────────

    private _setNpcName(name: string): void {
        if (this.npcNameLabel) this.npcNameLabel.string = name;
    }

    private _setDialogue(text: string): void {
        if (this.dialogueLabel) this.dialogueLabel.string = text;
    }

    private _showShop(visible: boolean): void {
        if (this.shopContainer) this.shopContainer.active = visible;
    }

    private _showAction(visible: boolean): void {
        if (this.actionButtonNode) this.actionButtonNode.active = visible;
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
        if (this.actionButtonNode) {
            this.actionButtonNode.targetOff(this);
            this.actionButtonNode.on(Node.EventType.TOUCH_END, this._onAction, this);
        }
    }

    // ── 按鈕回呼 ──────────────────────────────────────────────────────────────

    private _onClose(): void {
        SoundManager.panelOpen();
        this.node.emit('close-modal');
        this.node.active = false;
    }

    private _onAction(): void {
        if (!this._npcId || !this.actionButtonNode) return;

        tween(this.actionButtonNode)
            .to(0.05, { scale: new Vec3(0.88, 0.88, 1) })
            .to(0.08, { scale: Vec3.ONE })
            .call(() => {
                SoundManager.panelOpen();
                this.node.emit('npc-action', this._npcId);
            })
            .start();
    }

    // ── 生命週期清理 ──────────────────────────────────────────────────────────

    onDestroy(): void {
        if (this.shopContainer?.isValid) this.shopContainer.removeAllChildren();
        if (this.closeButtonNode?.isValid) this.closeButtonNode.targetOff(this);
        if (this.backdropNode?.isValid) this.backdropNode.targetOff(this);
        if (this.actionButtonNode?.isValid) this.actionButtonNode.targetOff(this);
    }
}
