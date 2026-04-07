import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    Material,
    ScrollView,
    tween,
    UIOpacity,
    UITransform,
    Color,
} from 'cc';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';
import { DataManager } from './PTD_DataManager';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

/** 圖鑑項目結構 */
interface CollectionEntry {
    id: string;
    name: string;
    category: 'landmark' | 'npc' | 'relic' | 'creature';
    description: string;
    unlocked: boolean;
    icon_url?: string;
}

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * CollectionPanel
 * 圖鑑面板 — 已探索地標、NPC、遺物、生物的收集紀錄。
 *
 * 使用 WhiteCrowCard 風格（DESIGN_SPEC §4: 450px max, 8px radius）。
 * Tab 列區分四大分類：地標 / NPC / 遺物 / 生物。
 *
 * 開啟方式：
 *  MainGameController._onPanelOpen('collection') → 顯示此面板
 */
@ccclass('CollectionPanel')
export class CollectionPanel extends Component {

    @property(Sprite)
    bgSprite: Sprite = null;

    @property(Label)
    titleLabel: Label = null;

    @property(Node)
    closeButton: Node = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Node)
    contentContainer: Node = null;

    @property(Label)
    emptyLabel: Label = null;

    /** Tab 按鈕節點，順序：地標 / NPC / 遺物 / 生物 */
    @property([Node])
    tabButtons: Node[] = [];

    @property(Label)
    countLabel: Label = null;

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _entries: CollectionEntry[] = [];
    private _activeTab: CollectionEntry['category'] = 'landmark';
    private _isVisible = false;
    private _faction: FactionType = 'Pure';

    private static readonly TAB_ORDER: CollectionEntry['category'][] = [
        'landmark', 'npc', 'relic', 'creature',
    ];
    private static readonly TAB_LABELS: string[] = ['地標', 'NPC', '遺物', '生物'];

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        if (this.closeButton) {
            this.closeButton.on(Node.EventType.TOUCH_END, this.hide, this);
        }

        // Tab 按鈕事件
        this.tabButtons.forEach((btn, idx) => {
            if (!btn) return;
            btn.on(Node.EventType.TOUCH_END, () => {
                this._switchTab(CollectionPanel.TAB_ORDER[idx]);
            }, this);
        });
    }

    onDestroy(): void {
        if (this.closeButton?.isValid) this.closeButton.targetOff(this);
        this.tabButtons?.forEach(btn => {
            if (btn?.isValid) btn.targetOff(this);
        });
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    initTheme(faction: FactionType): void {
        this._faction = faction;
        const th = getPageTheme(faction);
        if (this.bgSprite) this.bgSprite.color = th.bgBase;
        if (this.titleLabel) this.titleLabel.color = th.textPrimary;

        if (this.bgSprite) {
            applyFactionMaterial(this.bgSprite, faction, this.turbidMaterial, this.pureMaterial);
        }
    }

    setEntries(entries: CollectionEntry[]): void {
        this._entries = entries;
        this._render();
    }

    async refresh(): Promise<void> {
        try {
            const entries = await DataManager.fetchCollection();
            this._entries = entries.map(e => ({
                id: e.id,
                name: e.name,
                category: e.category,
                description: e.description,
                unlocked: e.unlocked,
                icon_url: e.image_url,
            }));
            this._render();
        } catch (err) {
            console.error('[CollectionPanel] refresh 失敗', err);
        }
    }

    show(): void {
        if (this._isVisible) return;
        this._isVisible = true;

        this.node.active = true;
        SoundManager.panelOpen();
        this.refresh();

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.2, { opacity: 255 }).start();
    }

    hide(): void {
        if (!this._isVisible) return;
        this._isVisible = false;

        this.node.active = false;

        this.node.emit('panel-closed', 'collection');
    }

    toggle(): void {
        if (this._isVisible) this.hide();
        else this.show();
    }

    // ── Tab 切換 ──────────────────────────────────────────────────────────────

    private _switchTab(category: CollectionEntry['category']): void {
        if (this._activeTab === category) return;
        this._activeTab = category;
        this._render();
    }

    // ── 渲染 ──────────────────────────────────────────────────────────────────

    private _render(): void {
        if (!this.contentContainer) return;

        this.contentContainer.removeAllChildren();

        const filtered = this._entries.filter(e => e.category === this._activeTab);
        const unlocked = filtered.filter(e => e.unlocked);

        // 更新數量
        if (this.countLabel) {
            this.countLabel.string = `${unlocked.length} / ${filtered.length}`;
        }

        if (filtered.length === 0) {
            if (this.emptyLabel) {
                this.emptyLabel.string = '尚無資料';
                this.emptyLabel.node.active = true;
            }
            return;
        }

        if (this.emptyLabel) this.emptyLabel.node.active = false;

        const th = getPageTheme(this._faction);

        for (const entry of filtered) {
            this._createEntryRow(entry, th);
        }
    }

    private _createEntryRow(entry: CollectionEntry, th: ReturnType<typeof getPageTheme>): void {
        if (!this.contentContainer) return;

        const row = new Node(`Entry_${entry.id}`);
        this.contentContainer.addChild(row);

        row.addComponent(UITransform).setContentSize(400, 50);

        // 名稱
        const nameNode = new Node('Name');
        row.addChild(nameNode);
        const nameLbl = nameNode.addComponent(Label);
        nameLbl.string = entry.unlocked ? entry.name : '？？？';
        nameLbl.fontSize = 14;
        nameLbl.color = entry.unlocked ? th.textPrimary : new Color(100, 116, 139);
        nameNode.addComponent(UITransform).setContentSize(300, 20);
        nameNode.setPosition(-50, 8, 0);

        // 描述
        if (entry.unlocked) {
            const descNode = new Node('Desc');
            row.addChild(descNode);
            const descLbl = descNode.addComponent(Label);
            descLbl.string = entry.description.length > 40
                ? entry.description.slice(0, 40) + '…'
                : entry.description;
            descLbl.fontSize = 11;
            descLbl.color = th.textSecondary;
            descNode.addComponent(UITransform).setContentSize(300, 16);
            descNode.setPosition(-50, -10, 0);
        }

        // 點擊展開詳情
        if (entry.unlocked) {
            row.on(Node.EventType.TOUCH_END, () => {
                this.node.emit('collection-detail', entry);
            });
        }
    }
}
