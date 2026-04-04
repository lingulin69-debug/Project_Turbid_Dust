import {
    _decorator,
    Component,
    Node,
    Sprite,
    Label,
    Button,
    UIOpacity,
    ScrollView,
    Layout,
    UITransform,
    Color,
    tween,
    Material,
} from 'cc';
import { DataManager } from './PTD_DataManager';
import { getPageTheme, FactionType, applyFactionMaterial } from './PTD_UI_Theme';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

// ── 排行榜條目 ────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
    rank:     number;
    oc_name:  string;
    faction:  FactionType;
    coins:    number;
    hp:       number;
    actions:  number;  // 本章行動次數
}

// ── 組件 ──────────────────────────────────────────────────────────────────────

/**
 * 排行榜面板 — 僅最高管理者（GM）可見。
 * 顯示所有玩家的排名資訊，依貨幣數排序。
 *
 * ⚠️ 此面板在 show() 時會檢查管理者身份，非管理者無法開啟。
 */
@ccclass('LeaderboardPanel')
export class LeaderboardPanel extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /** 全螢幕遮罩 */
    @property(Node)
    maskNode: Node = null;

    /** 背景 Sprite */
    @property(Sprite)
    bgSprite: Sprite = null;

    /** 標題 */
    @property(Label)
    titleLabel: Label = null;

    /** 關閉按鈕 */
    @property(Button)
    closeButton: Button = null;

    /** 載入提示 */
    @property(Label)
    loadingLabel: Label = null;

    /** 無資料提示 */
    @property(Label)
    emptyLabel: Label = null;

    /** 權限不足提示 */
    @property(Label)
    unauthorizedLabel: Label = null;

    /** 排行榜捲動區域 */
    @property(ScrollView)
    scrollView: ScrollView = null;

    /** 排行榜內容容器（Layout） */
    @property(Node)
    contentContainer: Node = null;

    /** 濁息合計標籤 */
    @property(Label)
    turbidTotalLabel: Label = null;

    /** 淨塵合計標籤 */
    @property(Label)
    pureTotalLabel: Label = null;

    /** 總玩家人數標籤 */
    @property(Label)
    playerCountLabel: Label = null;

    /** 重新整理按鈕 */
    @property(Button)
    refreshButton: Button = null;

    /** 濁息狀態覆蓋材質 */
    @property(Material)
    turbidMaterial: Material = null;

    /** 淨塵狀態覆蓋材質 */
    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _entries: LeaderboardEntry[] = [];
    private _isAdmin = false;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this.node.active = false;

        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.hide, this);
        }
        if (this.refreshButton) {
            this.refreshButton.node.on(Button.EventType.CLICK, this._refresh, this);
        }
        if (this.maskNode) {
            this.maskNode.on(Node.EventType.TOUCH_END, () => { /* 吞掉背景點擊 */ });
        }
    }

    onDestroy(): void {
        if (this.closeButton?.node?.isValid) this.closeButton.node.targetOff(this);
        if (this.refreshButton?.node?.isValid) this.refreshButton.node.targetOff(this);
        if (this.maskNode?.isValid) this.maskNode.targetOff(this);
    }

    // ── 公開方法 ──────────────────────────────────────────────────────────────

    /** 顯示排行榜（僅管理員可用） */
    show(): void {
        // 權限檢查
        const player = DataManager.getPlayer();
        this._isAdmin = player?.role === 'admin' || player?.role === 'gm';

        this.node.active = true;
        this._updateVisibility('loading');

        const op = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.3, { opacity: 255 }).start();

        SoundManager.panelOpen();

        if (!this._isAdmin) {
            this._updateVisibility('unauthorized');
            return;
        }

        this._refresh();
    }

    /** 隱藏面板 */
    hide(): void {
        if (!this.node.active) return;
        const op = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        tween(op).to(0.25, { opacity: 0 }).call(() => {
            this.node.active = false;
            this.node.emit('panel-closed');
        }).start();
    }

    // ── 資料載入 ──────────────────────────────────────────────────────────────

    private async _refresh(): Promise<void> {
        this._updateVisibility('loading');

        try {
            // TODO: 正式版改為 apiClient.leaderboard.getAll()
            // 目前使用模擬資料
            const entries = await this._fetchLeaderboard();
            this._entries = entries;

            if (entries.length === 0) {
                this._updateVisibility('empty');
                return;
            }

            this._renderEntries();
            this._renderSummary();
            this._updateVisibility('data');
        } catch (err) {
            console.error('[LeaderboardPanel] 載入排行榜失敗', err);
            this._updateVisibility('empty');
        }
    }

    /** 模擬排行榜資料 — 正式版替換為 API 呼叫 */
    private async _fetchLeaderboard(): Promise<LeaderboardEntry[]> {
        // TODO: 正式版接入 Supabase
        // const { data, error } = await supabase
        //     .from('td_players')
        //     .select('oc_name, faction, coins, hp_current, actions_count')
        //     .order('coins', { ascending: false });

        // 模擬資料 — 提供基本功能驗證
        return [
            { rank: 1, oc_name: '[GM] 測試管理員', faction: 'Turbid', coins: 999, hp: 100, actions: 42 },
            { rank: 2, oc_name: '模擬玩家A', faction: 'Pure', coins: 50, hp: 80, actions: 15 },
            { rank: 3, oc_name: '模擬玩家B', faction: 'Turbid', coins: 30, hp: 60, actions: 8 },
        ];
    }

    // ── 渲染 ──────────────────────────────────────────────────────────────────

    private _renderEntries(): void {
        if (!this.contentContainer) return;

        // 清除舊條目
        this.contentContainer.removeAllChildren();

        const turbidColor = new Color(155, 127, 232); // #9b7fe8
        const pureColor   = new Color(212, 175, 55);  // #d4af37

        for (const entry of this._entries) {
            const row = new Node(`Row_${entry.rank}`);
            const rowTr = row.addComponent(UITransform);
            rowTr.setContentSize(560, 36);

            // 排名
            const rankNode = new Node('Rank');
            const rankTr = rankNode.addComponent(UITransform);
            rankTr.setContentSize(40, 36);
            const rankLabel = rankNode.addComponent(Label);
            rankLabel.string = `#${entry.rank}`;
            rankLabel.fontSize = 14;
            rankLabel.color = new Color(180, 160, 120);
            rankNode.setPosition(-260, 0);
            rankNode.parent = row;

            // OC 名
            const nameNode = new Node('Name');
            const nameTr = nameNode.addComponent(UITransform);
            nameTr.setContentSize(180, 36);
            const nameLabel = nameNode.addComponent(Label);
            nameLabel.string = entry.oc_name;
            nameLabel.fontSize = 13;
            nameLabel.color = entry.faction === 'Turbid' ? turbidColor : pureColor;
            nameNode.setPosition(-120, 0);
            nameNode.parent = row;

            // 陣營
            const factionNode = new Node('Faction');
            const factionTr = factionNode.addComponent(UITransform);
            factionTr.setContentSize(50, 36);
            const factionLabel = factionNode.addComponent(Label);
            factionLabel.string = entry.faction === 'Turbid' ? '濁息' : '淨塵';
            factionLabel.fontSize = 11;
            factionLabel.color = entry.faction === 'Turbid' ? turbidColor : pureColor;
            factionNode.setPosition(20, 0);
            factionNode.parent = row;

            // 貨幣
            const coinsNode = new Node('Coins');
            const coinsTr = coinsNode.addComponent(UITransform);
            coinsTr.setContentSize(60, 36);
            const coinsLabel = coinsNode.addComponent(Label);
            coinsLabel.string = `${entry.coins}幣`;
            coinsLabel.fontSize = 13;
            coinsLabel.color = new Color(200, 180, 120);
            coinsNode.setPosition(100, 0);
            coinsNode.parent = row;

            // HP
            const hpNode = new Node('HP');
            const hpTr = hpNode.addComponent(UITransform);
            hpTr.setContentSize(50, 36);
            const hpLabel = hpNode.addComponent(Label);
            hpLabel.string = `HP:${entry.hp}`;
            hpLabel.fontSize = 11;
            hpLabel.color = new Color(140, 180, 140);
            hpNode.setPosition(170, 0);
            hpNode.parent = row;

            // 行動次數
            const actNode = new Node('Actions');
            const actTr = actNode.addComponent(UITransform);
            actTr.setContentSize(60, 36);
            const actLabel = actNode.addComponent(Label);
            actLabel.string = `行動:${entry.actions}`;
            actLabel.fontSize = 11;
            actLabel.color = new Color(160, 150, 130);
            actNode.setPosition(240, 0);
            actNode.parent = row;

            row.parent = this.contentContainer;
        }
    }

    private _renderSummary(): void {
        const turbidCount = this._entries.filter(e => e.faction === 'Turbid').length;
        const pureCount   = this._entries.filter(e => e.faction === 'Pure').length;

        if (this.turbidTotalLabel) {
            this.turbidTotalLabel.string = `濁息：${turbidCount} 人`;
            this.turbidTotalLabel.color = new Color(155, 127, 232);
        }
        if (this.pureTotalLabel) {
            this.pureTotalLabel.string = `淨塵：${pureCount} 人`;
            this.pureTotalLabel.color = new Color(212, 175, 55);
        }
        if (this.playerCountLabel) {
            this.playerCountLabel.string = `共 ${this._entries.length} 名玩家`;
        }
    }

    // ── 狀態顯示 ──────────────────────────────────────────────────────────────

    private _updateVisibility(state: 'loading' | 'unauthorized' | 'empty' | 'data'): void {
        if (this.loadingLabel)      this.loadingLabel.node.active      = state === 'loading';
        if (this.unauthorizedLabel) this.unauthorizedLabel.node.active = state === 'unauthorized';
        if (this.emptyLabel)        this.emptyLabel.node.active        = state === 'empty';
        if (this.scrollView)        this.scrollView.node.active        = state === 'data';
        if (this.turbidTotalLabel)  this.turbidTotalLabel.node.active  = state === 'data';
        if (this.pureTotalLabel)    this.pureTotalLabel.node.active    = state === 'data';
        if (this.playerCountLabel)  this.playerCountLabel.node.active  = state === 'data';
        if (this.refreshButton)     this.refreshButton.node.active     = state === 'data';

        // 設定 title
        if (this.titleLabel) {
            this.titleLabel.string = state === 'unauthorized' ? '⛔ 權限不足' : '玩家排行榜';
        }
    }

    // ── Material 預留接口 ─────────────────────────────────────────────────────

    applyFactionMaterial(faction: FactionType): void {
        const mat = faction === 'Turbid' ? this.turbidMaterial : this.pureMaterial;
        if (mat && this.bgSprite) {
            this.bgSprite.customMaterial = mat;
        }
    }
}
