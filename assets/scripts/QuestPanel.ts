import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    Material,
    ScrollView,
    Prefab,
    instantiate,
    tween,
    UIOpacity,
    UITransform,
    Color,
} from 'cc';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';
import { DataManager } from './PTD_DataManager';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

/** 任務結構 */
interface QuestItem {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'locked';
    reward_coins: number;
    chapter: number;
}

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * QuestPanel
 * 任務面板 — 顯示當前章節任務清單（含完成/進行中/鎖定狀態）。
 *
 * 使用 WhiteCrowCard 風格（DESIGN_SPEC §4: 450px max, 8px radius）。
 *
 * 開啟方式：
 *  MainGameController._onPanelOpen('quest') → 顯示此面板
 */
@ccclass('QuestPanel')
export class QuestPanel extends Component {

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

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _quests: QuestItem[] = [];
    private _isVisible = false;
    private _faction: FactionType = 'Pure';

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        if (this.closeButton) {
            this.closeButton.on(Node.EventType.TOUCH_END, this.hide, this);
        }
    }

    onDestroy(): void {
        if (this.closeButton?.isValid) this.closeButton.targetOff(this);
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

    /** 更新任務清單並重新渲染 */
    setQuests(quests: QuestItem[]): void {
        this._quests = quests;
        this._render();
    }

    /** 從 DataManager 重新載入任務 */
    async refresh(): Promise<void> {
        try {
            const quests = await DataManager.fetchQuests();
            this._quests = quests.map(q => ({
                id: q.id,
                title: q.title,
                description: q.description,
                status: q.status,
                reward_coins: 0,
                chapter: q.chapter ?? 1,
            }));
            this._render();
        } catch (err) {
            console.error('[QuestPanel] refresh 失敗', err);
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

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);

        tween(opacity).to(0.15, { opacity: 0 }).call(() => {
            this.node.active = false;
        }).start();

        this.node.emit('panel-closed', 'quest');
    }

    toggle(): void {
        if (this._isVisible) this.hide();
        else this.show();
    }

    // ── 渲染 ──────────────────────────────────────────────────────────────────

    private _render(): void {
        if (!this.contentContainer) return;

        this.contentContainer.removeAllChildren();

        if (this._quests.length === 0) {
            if (this.emptyLabel) {
                this.emptyLabel.string = '目前沒有可用任務';
                this.emptyLabel.node.active = true;
            }
            return;
        }

        if (this.emptyLabel) this.emptyLabel.node.active = false;

        const th = getPageTheme(this._faction);

        // 分組排序：active → completed → locked
        const sorted = [...this._quests].sort((a, b) => {
            const order = { active: 0, completed: 1, locked: 2 };
            return order[a.status] - order[b.status];
        });

        for (const quest of sorted) {
            this._createQuestRow(quest, th);
        }
    }

    private _createQuestRow(quest: QuestItem, th: ReturnType<typeof getPageTheme>): void {
        if (!this.contentContainer) return;

        const row = new Node(`Quest_${quest.id}`);
        this.contentContainer.addChild(row);

        row.addComponent(UITransform).setContentSize(400, 60);

        // 標題
        const titleNode = new Node('Title');
        row.addChild(titleNode);
        const titleLbl = titleNode.addComponent(Label);
        titleLbl.string = quest.title;
        titleLbl.fontSize = 14;
        titleLbl.color = quest.status === 'locked' ? th.textSecondary : th.textPrimary;
        titleNode.addComponent(UITransform).setContentSize(300, 20);
        titleNode.setPosition(-50, 12, 0);

        // 狀態標記
        const statusNode = new Node('Status');
        row.addChild(statusNode);
        const statusLbl = statusNode.addComponent(Label);
        statusLbl.fontSize = 11;
        statusNode.addComponent(UITransform).setContentSize(80, 20);
        statusNode.setPosition(160, 12, 0);

        switch (quest.status) {
            case 'active':
                statusLbl.string = '進行中';
                statusLbl.color = new Color(34, 197, 94);
                break;
            case 'completed':
                statusLbl.string = '已完成';
                statusLbl.color = th.textSecondary;
                break;
            case 'locked':
                statusLbl.string = '未解鎖';
                statusLbl.color = new Color(100, 116, 139);
                break;
        }

        // 獎勵
        const rewardNode = new Node('Reward');
        row.addChild(rewardNode);
        const rewardLbl = rewardNode.addComponent(Label);
        rewardLbl.string = `獎勵: ${quest.reward_coins} 幣`;
        rewardLbl.fontSize = 11;
        rewardLbl.color = th.textSecondary;
        rewardNode.addComponent(UITransform).setContentSize(300, 16);
        rewardNode.setPosition(-50, -8, 0);
    }
}
