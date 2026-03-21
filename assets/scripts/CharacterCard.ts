import {
    _decorator,
    Component,
    Node,
    UITransform,
} from 'cc';
import { WhiteCrowCard } from './WhiteCrowCard';

const { ccclass, property } = _decorator;

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * CharacterCard
 *
 * 負責角色卡片的頁面切換與比例約束。
 * 本組件掛載於與 WhiteCrowCard 相同的節點，
 * 透過監聽 'tab-changed' 事件驅動內容頁切換。
 */
@ccclass('CharacterCard')
export class CharacterCard extends Component {

    // ── 暴露給 Inspector 的屬性 ───────────────────────────────────────────────

    /** 四個內容頁面節點，順序對應 Tab 索引 0, 1, 2, 3 */
    @property([Node])
    tabPages: Node[] = [];

    /** 卡片主要內容區塊，用於強制維持 1:2 寬高比 */
    @property(Node)
    contentNode: Node = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _whiteCrowCard: WhiteCrowCard = null;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this._whiteCrowCard = this.getComponent(WhiteCrowCard);

        if (!this._whiteCrowCard) {
            console.warn('[CharacterCard] 找不到同節點的 WhiteCrowCard 組件。');
            return;
        }

        this.node.on('tab-changed', this._onTabChanged, this);

        // 初始化：顯示第 0 頁，隱藏其餘
        this._showPage(0);
    }

    start(): void {
        this._enforceAspectRatio();
    }

    onDestroy(): void {
        this.node.off('tab-changed', this._onTabChanged, this);
    }

    // ── Tab 切換處理 ──────────────────────────────────────────────────────────

    private _onTabChanged(index: number): void {
        this._showPage(index);
    }

    private _showPage(index: number): void {
        this.tabPages.forEach((page, i) => {
            if (page) page.active = (i === index);
        });
    }

    // ── 1:2 比例約束 ──────────────────────────────────────────────────────────

    private _enforceAspectRatio(): void {
        if (!this.contentNode) return;

        const transform = this.contentNode.getComponent(UITransform);
        if (!transform) return;

        const width = transform.width;
        transform.height = width * 2;
    }
}
