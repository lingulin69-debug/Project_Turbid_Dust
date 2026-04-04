import {
    _decorator,
    Component,
    Node,
    Sprite,
    Label,
    Button,
    EditBox,
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

// ── 介面定義 ──────────────────────────────────────────────────────────────────

interface Decree {
    id:                 string;
    decree_type:        string;
    content:            string | null;
    target_oc:          string | null;
    target_landmark_id: string | null;
    bounty_amount:      number | null;
    bounty_completed:   boolean;
    evil_points_cost:   number;
    created_at:         string;
}

interface LeaderStats {
    leader_evil_points:      number;
    leader_treasury:         number;
    is_taxed_this_chapter:   boolean;
    faction:                 string;
}

// ── 陣營文字標籤（完全移植 Web 版） ───────────────────────────────────────────

const FACTION_LABELS = {
    Turbid: {
        statusSection:          '領主狀態',
        evilPoints:             '本章惡政點數',
        treasury:               '金庫',
        taxTitle:               '徵稅令',
        taxWarning:             '⚠ 本章已執行過徵稅令',
        taxBtn:                 '發布徵稅令',
        taxDesc:                '對本陣營所有玩家強制扣 1 幣進金庫。被徵收玩家本章任務多 +1 幣補償。',
        taxUsed:                '本章已使用',
        curseTitle:             '命名詛咒',
        curseDesc:              '在指定本陣營玩家的匿名代號前強制加上詛咒前綴，持續本章。',
        cursePrefixPlaceholder: '詛咒前綴（如：腐朽的、被遺棄的）',
        curseBtn:               '發布詛咒',
        lawTitle:               '荒謬法令',
        lawDesc:                '發布一條無機制效果的陣營公告，玩家登入後第一個畫面顯示。',
        lawBtn:                 '發布法令',
        bountyTitle:            '懸賞令',
        bountyDesc:             '賞 1 幣 → 需 3 庫幣 ／ 賞 2 幣 → 需 5 庫幣',
        curseTreasuryTitle:     '詛咒金庫',
        curseTreasuryBtn:       '燒毀金庫',
        curseTreasuryDesc:      '燒掉金庫所有貨幣。隨機一名敵方玩家本章最大 HP 上限 -3。',
        curseTreasuryConfirm:   '⚠ 金庫將清空至 0。敵方某人將受到詛咒。此操作不可撤銷。',
        historyTitle:           '本章惡政紀錄',
        emptyHistory:           '本章尚未發布任何惡政。',
        decreeLabels: { tax: '徵稅令', curse: '命名詛咒', law: '荒謬法令', bounty: '懸賞令', curse_treasury: '詛咒金庫' } as Record<string, string>,
    },
    Pure: {
        statusSection:          '教皇狀態',
        evilPoints:             '本章神恩點數',
        treasury:               '聖庫',
        taxTitle:               '什一奉獻',
        taxWarning:             '⚠ 本章已執行過什一奉獻',
        taxBtn:                 '發布什一奉獻',
        taxDesc:                '對本陣營所有玩家強制扣 1 幣進聖庫。被徵收玩家本章任務多 +1 幣補償。',
        taxUsed:                '本章已使用',
        curseTitle:             '賜福',
        curseDesc:              '在指定本陣營玩家的匿名代號前強制加上賜福前綴，持續本章。',
        cursePrefixPlaceholder: '賜福前綴（如：蒙恩的、受庇護的）',
        curseBtn:               '賜予祝福',
        lawTitle:               '教義頒布',
        lawDesc:                '發布一條無機制效果的陣營公告，玩家登入後第一個畫面顯示。',
        lawBtn:                 '頒布教義',
        bountyTitle:            '懸賞令',
        bountyDesc:             '賞 1 幣 → 需 3 庫幣 ／ 賞 2 幣 → 需 5 庫幣',
        curseTreasuryTitle:     '信仰忠誠',
        curseTreasuryBtn:       '燃盡聖庫',
        curseTreasuryDesc:      '燒掉聖庫所有貨幣。隨機一名敵方玩家本章最大 HP 上限 -3。',
        curseTreasuryConfirm:   '⚠ 聖庫將清空至 0。敵方某人將受到詛咒。此操作不可撤銷。',
        historyTitle:           '本章教令紀錄',
        emptyHistory:           '本章尚未發布任何教令。',
        decreeLabels: { tax: '什一奉獻', curse: '賜福', law: '教義頒布', bounty: '懸賞令', curse_treasury: '信仰忠誠' } as Record<string, string>,
    },
};

// ── 領袖惡政紅色主題 ──────────────────────────────────────────────────────────

const EVIL_RED      = new Color(127, 48, 48);    // #7f3030
const BRIGHT_RED    = new Color(220, 38, 38);     // #dc2626
const DARK_BG       = new Color(15, 5, 5);        // #0f0505
const DIM_RED       = new Color(133, 64, 64);     // #854040
const FEEDBACK_OK   = new Color(134, 239, 172);   // #86efac
const FEEDBACK_FAIL = new Color(252, 165, 165);   // #fca5a5

// ── 組件 ──────────────────────────────────────────────────────────────────────

@ccclass('LeaderTyrannyPanel')
export class LeaderTyrannyPanel extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /** 全螢幕遮罩 */
    @property(Node)
    maskNode: Node = null;

    /** 背景 Sprite */
    @property(Sprite)
    bgSprite: Sprite = null;

    /** 面板標題 */
    @property(Label)
    titleLabel: Label = null;

    /** 關閉按鈕 */
    @property(Button)
    closeButton: Button = null;

    // ── 領主狀態區 ──

    /** 惡政/神恩 點數標籤 */
    @property(Label)
    evilPointsLabel: Label = null;

    /** 點數圓點容器（3 個點） */
    @property([Node])
    evilDots: Node[] = [];

    /** 金庫/聖庫數值 */
    @property(Label)
    treasuryLabel: Label = null;

    /** 稅收警告標籤 */
    @property(Label)
    taxWarningLabel: Label = null;

    // ── 徵稅區 ──

    /** 徵稅按鈕 */
    @property(Button)
    taxButton: Button = null;

    /** 徵稅按鈕文字 */
    @property(Label)
    taxBtnLabel: Label = null;

    /** 徵稅描述文字 */
    @property(Label)
    taxDescLabel: Label = null;

    // ── 命名詛咒/賜福 區 ──

    /** 詛咒目標輸入框 */
    @property(EditBox)
    curseTargetInput: EditBox = null;

    /** 詛咒前綴輸入框 */
    @property(EditBox)
    cursePrefixInput: EditBox = null;

    /** 詛咒按鈕 */
    @property(Button)
    curseButton: Button = null;

    /** 詛咒按鈕文字 */
    @property(Label)
    curseBtnLabel: Label = null;

    /** 詛咒描述文字 */
    @property(Label)
    curseDescLabel: Label = null;

    // ── 荒謬法令/教義 區 ──

    /** 法令內容輸入框 */
    @property(EditBox)
    lawContentInput: EditBox = null;

    /** 法令按鈕 */
    @property(Button)
    lawButton: Button = null;

    /** 法令按鈕文字 */
    @property(Label)
    lawBtnLabel: Label = null;

    /** 法令描述文字 */
    @property(Label)
    lawDescLabel: Label = null;

    // ── 懸賞令區 ──

    /** 懸賞目標輸入框 */
    @property(EditBox)
    bountyTargetInput: EditBox = null;

    /** 懸賞據點輸入框 */
    @property(EditBox)
    bountyLandmarkInput: EditBox = null;

    /** 賞金 1 幣按鈕 */
    @property(Button)
    bounty1Button: Button = null;

    /** 賞金 2 幣按鈕 */
    @property(Button)
    bounty2Button: Button = null;

    /** 發布懸賞按鈕 */
    @property(Button)
    bountySubmitButton: Button = null;

    /** 懸賞描述文字 */
    @property(Label)
    bountyDescLabel: Label = null;

    /** 賞金需求提示 */
    @property(Label)
    bountyCostLabel: Label = null;

    // ── 詛咒金庫區 ──

    /** 詛咒金庫按鈕 */
    @property(Button)
    curseTreasuryButton: Button = null;

    /** 詛咒金庫描述 */
    @property(Label)
    curseTreasuryDescLabel: Label = null;

    /** 確認詛咒金庫按鈕（二次確認） */
    @property(Button)
    confirmCurseTreasuryBtn: Button = null;

    /** 取消詛咒金庫按鈕 */
    @property(Button)
    cancelCurseTreasuryBtn: Button = null;

    /** 二次確認提示文字 */
    @property(Label)
    curseTreasuryConfirmLabel: Label = null;

    // ── 歷史紀錄區 ──

    /** 歷史紀錄 ScrollView */
    @property(ScrollView)
    historyScrollView: ScrollView = null;

    /** 歷史紀錄容器 */
    @property(Node)
    historyContainer: Node = null;

    /** 無惡政紀錄提示 */
    @property(Label)
    emptyHistoryLabel: Label = null;

    // ── 回饋提示 ──

    /** 操作回饋文字 */
    @property(Label)
    feedbackLabel: Label = null;

    // ── Material 預留 ──

    /** 濁息狀態覆蓋材質 */
    @property(Material)
    turbidMaterial: Material = null;

    /** 淨塵狀態覆蓋材質 */
    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _leaderOcName = '';
    private _faction: FactionType = 'Turbid';
    private _stats: LeaderStats | null = null;
    private _decrees: Decree[] = [];
    private _submitting = false;
    private _bountyAmount: 1 | 2 = 1;
    private _confirmingCurseTreasury = false;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this.node.active = false;
        this._bindButtons();
    }

    onDestroy(): void {
        if (this.closeButton?.node?.isValid) this.closeButton.node.targetOff(this);
        if (this.taxButton?.node?.isValid) this.taxButton.node.targetOff(this);
        if (this.curseButton?.node?.isValid) this.curseButton.node.targetOff(this);
        if (this.lawButton?.node?.isValid) this.lawButton.node.targetOff(this);
        if (this.bountySubmitButton?.node?.isValid) this.bountySubmitButton.node.targetOff(this);
        if (this.bounty1Button?.node?.isValid) this.bounty1Button.node.targetOff(this);
        if (this.bounty2Button?.node?.isValid) this.bounty2Button.node.targetOff(this);
        if (this.curseTreasuryButton?.node?.isValid) this.curseTreasuryButton.node.targetOff(this);
        if (this.confirmCurseTreasuryBtn?.node?.isValid) this.confirmCurseTreasuryBtn.node.targetOff(this);
        if (this.cancelCurseTreasuryBtn?.node?.isValid) this.cancelCurseTreasuryBtn.node.targetOff(this);
        if (this.maskNode?.isValid) this.maskNode.targetOff(this);
    }

    // ── 公開方法 ──────────────────────────────────────────────────────────────

    /**
     * 開啟領袖暴政面板
     * @param leaderOcName 領袖 OC 名稱
     * @param faction 陣營
     */
    show(leaderOcName: string, faction?: FactionType): void {
        this._leaderOcName = leaderOcName;
        this._faction = faction ?? 'Turbid';
        this._confirmingCurseTreasury = false;

        this.node.active = true;
        const op = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.3, { opacity: 255 }).start();

        SoundManager.panelOpen();
        this._applyFactionLabels();
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

    // ── 按鈕綁定 ──────────────────────────────────────────────────────────────

    private _bindButtons(): void {
        if (this.closeButton)            this.closeButton.node.on(Button.EventType.CLICK, this.hide, this);
        if (this.taxButton)              this.taxButton.node.on(Button.EventType.CLICK, this._onTax, this);
        if (this.curseButton)            this.curseButton.node.on(Button.EventType.CLICK, this._onCurse, this);
        if (this.lawButton)              this.lawButton.node.on(Button.EventType.CLICK, this._onLaw, this);
        if (this.bountySubmitButton)     this.bountySubmitButton.node.on(Button.EventType.CLICK, this._onBounty, this);
        if (this.bounty1Button)          this.bounty1Button.node.on(Button.EventType.CLICK, () => this._setBountyAmount(1), this);
        if (this.bounty2Button)          this.bounty2Button.node.on(Button.EventType.CLICK, () => this._setBountyAmount(2), this);
        if (this.curseTreasuryButton)    this.curseTreasuryButton.node.on(Button.EventType.CLICK, this._onCurseTreasuryStart, this);
        if (this.confirmCurseTreasuryBtn) this.confirmCurseTreasuryBtn.node.on(Button.EventType.CLICK, this._onCurseTreasuryConfirm, this);
        if (this.cancelCurseTreasuryBtn) this.cancelCurseTreasuryBtn.node.on(Button.EventType.CLICK, this._onCurseTreasuryCancel, this);
        if (this.maskNode)               this.maskNode.on(Node.EventType.TOUCH_END, () => { /* 吞掉背景點擊 */ });
    }

    // ── 陣營文字設定 ──────────────────────────────────────────────────────────

    private _applyFactionLabels(): void {
        const L = this._faction === 'Pure' ? FACTION_LABELS.Pure : FACTION_LABELS.Turbid;

        if (this.titleLabel) {
            this.titleLabel.string = L.statusSection;
            this.titleLabel.color = BRIGHT_RED;
        }
        if (this.taxDescLabel)            this.taxDescLabel.string            = L.taxDesc;
        if (this.taxBtnLabel)             this.taxBtnLabel.string             = L.taxBtn;
        if (this.curseDescLabel)          this.curseDescLabel.string          = L.curseDesc;
        if (this.curseBtnLabel)           this.curseBtnLabel.string           = L.curseBtn;
        if (this.lawDescLabel)            this.lawDescLabel.string            = L.lawDesc;
        if (this.lawBtnLabel)             this.lawBtnLabel.string             = L.lawBtn;
        if (this.bountyDescLabel)         this.bountyDescLabel.string         = L.bountyDesc;
        if (this.curseTreasuryDescLabel)  this.curseTreasuryDescLabel.string  = L.curseTreasuryDesc;
        if (this.cursePrefixInput)        this.cursePrefixInput.placeholder   = L.cursePrefixPlaceholder;
    }

    // ── 資料載入 ──────────────────────────────────────────────────────────────

    private async _refresh(): Promise<void> {
        try {
            // TODO: 正式版改為 apiClient.leader.getStats() / getDecrees()
            const stats = await this._fetchStats();
            const decrees = await this._fetchDecrees();

            this._stats = stats;
            this._decrees = decrees;

            this._updateStatsUI();
            this._renderHistory();
        } catch (err) {
            console.error('[LeaderTyrannyPanel] 載入領袖資料失敗', err);
        }
    }

    /** 模擬取得領袖統計 */
    private async _fetchStats(): Promise<LeaderStats> {
        // TODO: 正式版接入 apiClient.leader.getStats(this._leaderOcName)
        return {
            leader_evil_points: 2,
            leader_treasury: 12,
            is_taxed_this_chapter: false,
            faction: this._faction,
        };
    }

    /** 模擬取得本章惡政紀錄 */
    private async _fetchDecrees(): Promise<Decree[]> {
        // TODO: 正式版接入 apiClient.leader.getDecrees(this._leaderOcName, chapter)
        return [];
    }

    // ── UI 更新 ──────────────────────────────────────────────────────────────

    private _updateStatsUI(): void {
        const evils = this._stats?.leader_evil_points ?? 0;
        const treasury = this._stats?.leader_treasury ?? 0;
        const isTaxed = this._stats?.is_taxed_this_chapter ?? false;
        const L = this._faction === 'Pure' ? FACTION_LABELS.Pure : FACTION_LABELS.Turbid;

        // 惡政點數文字
        if (this.evilPointsLabel) {
            this.evilPointsLabel.string = `${L.evilPoints}：${evils} / 3`;
            this.evilPointsLabel.color = BRIGHT_RED;
        }

        // 惡政圓點
        for (let i = 0; i < this.evilDots.length; i++) {
            const dot = this.evilDots[i];
            if (!dot) continue;
            const sp = dot.getComponent(Sprite);
            if (sp) {
                sp.color = i < evils ? BRIGHT_RED : new Color(42, 10, 10);
            }
        }

        // 金庫
        if (this.treasuryLabel) {
            this.treasuryLabel.string = `${L.treasury}：${treasury} 幣`;
            this.treasuryLabel.color = BRIGHT_RED;
        }

        // 稅收警告
        if (this.taxWarningLabel) {
            this.taxWarningLabel.node.active = isTaxed;
            this.taxWarningLabel.string = L.taxWarning;
            this.taxWarningLabel.color = EVIL_RED;
        }

        // 按鈕狀態
        if (this.taxButton) {
            this.taxButton.interactable = evils >= 1 && !isTaxed && !this._submitting;
        }
        if (this.taxBtnLabel && isTaxed) {
            this.taxBtnLabel.string = L.taxUsed;
        }
        if (this.curseButton) {
            this.curseButton.interactable = evils >= 1 && !this._submitting;
        }
        if (this.lawButton) {
            this.lawButton.interactable = evils >= 1 && !this._submitting;
        }
        if (this.bountySubmitButton) {
            const cost = this._bountyAmount === 1 ? 3 : 5;
            this.bountySubmitButton.interactable = treasury >= cost && !this._submitting;
        }
        if (this.curseTreasuryButton) {
            this.curseTreasuryButton.interactable = treasury >= 8 && !this._submitting;
        }

        // 賞金需求提示
        this._updateBountyCost();

        // 二次確認區隱藏
        this._setCurseTreasuryConfirmVisible(this._confirmingCurseTreasury);
    }

    private _updateBountyCost(): void {
        if (this.bountyCostLabel) {
            const cost = this._bountyAmount === 1 ? 3 : 5;
            this.bountyCostLabel.string = `(需 ${cost} 庫幣)`;
        }

        // 高亮選中的金額按鈕
        if (this.bounty1Button) {
            const sp = this.bounty1Button.node.getComponent(Sprite);
            if (sp) sp.color = this._bountyAmount === 1 ? EVIL_RED : DARK_BG;
        }
        if (this.bounty2Button) {
            const sp = this.bounty2Button.node.getComponent(Sprite);
            if (sp) sp.color = this._bountyAmount === 2 ? EVIL_RED : DARK_BG;
        }
    }

    // ── 歷史紀錄渲染 ──────────────────────────────────────────────────────────

    private _renderHistory(): void {
        const L = this._faction === 'Pure' ? FACTION_LABELS.Pure : FACTION_LABELS.Turbid;

        if (this._decrees.length === 0) {
            if (this.emptyHistoryLabel) {
                this.emptyHistoryLabel.string = L.emptyHistory;
                this.emptyHistoryLabel.node.active = true;
            }
            if (this.historyContainer) this.historyContainer.removeAllChildren();
            return;
        }

        if (this.emptyHistoryLabel) this.emptyHistoryLabel.node.active = false;
        if (!this.historyContainer) return;

        this.historyContainer.removeAllChildren();

        for (const d of this._decrees) {
            const row = new Node(`Decree_${d.id}`);
            const rowTr = row.addComponent(UITransform);
            rowTr.setContentSize(500, 28);

            // 類型標籤
            const typeNode = new Node('Type');
            const typeTr = typeNode.addComponent(UITransform);
            typeTr.setContentSize(80, 28);
            const typeLabel = typeNode.addComponent(Label);
            typeLabel.string = L.decreeLabels[d.decree_type] ?? d.decree_type;
            typeLabel.fontSize = 11;
            typeLabel.color = BRIGHT_RED;
            typeNode.setPosition(-210, 0);
            typeNode.parent = row;

            // 目標/內容
            const detailNode = new Node('Detail');
            const detailTr = detailNode.addComponent(UITransform);
            detailTr.setContentSize(300, 28);
            const detailLabel = detailNode.addComponent(Label);
            let detailText = '';
            if (d.target_oc) detailText += `→ ${d.target_oc} `;
            if (d.content) {
                const clipped = d.content.length > 20 ? d.content.slice(0, 20) + '…' : d.content;
                detailText += `「${clipped}」`;
            }
            if (d.bounty_amount) {
                detailText += ` 賞${d.bounty_amount}幣 ${d.bounty_completed ? '✓' : '（進行中）'}`;
            }
            detailLabel.string = detailText;
            detailLabel.fontSize = 11;
            detailLabel.color = DIM_RED;
            detailNode.setPosition(20, 0);
            detailNode.parent = row;

            // 時間
            const timeNode = new Node('Time');
            const timeTr = timeNode.addComponent(UITransform);
            timeTr.setContentSize(50, 28);
            const timeLabel = timeNode.addComponent(Label);
            const date = new Date(d.created_at);
            timeLabel.string = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            timeLabel.fontSize = 10;
            timeLabel.color = new Color(90, 32, 32);
            timeNode.setPosition(220, 0);
            timeNode.parent = row;

            row.parent = this.historyContainer;
        }
    }

    // ── 行動處理 ──────────────────────────────────────────────────────────────

    private async _onTax(): Promise<void> {
        if (this._submitting) return;
        this._submitting = true;

        try {
            // TODO: 正式版 const r = await apiClient.leader.tax(this._leaderOcName);
            // 模擬：徵稅成功
            const taxedCount = 5; // 模擬值
            const L = this._faction === 'Pure' ? FACTION_LABELS.Pure : FACTION_LABELS.Turbid;
            this._showFeedback(`${L.taxBtn}發布。共向 ${taxedCount} 人徵收，${L.treasury} +${taxedCount} 幣。`, true);
            this.node.emit('decree-issued', { type: 'tax', faction: this._faction });
            await this._refresh();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '操作失敗';
            this._showFeedback(msg, false);
        } finally {
            this._submitting = false;
        }
    }

    private async _onCurse(): Promise<void> {
        const target = this.curseTargetInput?.string?.trim() ?? '';
        const prefix = this.cursePrefixInput?.string?.trim() ?? '';

        if (!target || !prefix) {
            this._showFeedback('請填寫目標OC名與前綴', false);
            return;
        }
        if (this._submitting) return;
        this._submitting = true;

        try {
            // TODO: 正式版 await apiClient.leader.curse(this._leaderOcName, target, prefix);
            const L = this._faction === 'Pure' ? FACTION_LABELS.Pure : FACTION_LABELS.Turbid;
            this._showFeedback(`${L.curseTitle}已降下：「${prefix}」加諸於 ${target}。`, true);
            if (this.curseTargetInput) this.curseTargetInput.string = '';
            if (this.cursePrefixInput) this.cursePrefixInput.string = '';
            this.node.emit('decree-issued', { type: 'curse', faction: this._faction, target, prefix });
            await this._refresh();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '操作失敗';
            this._showFeedback(msg, false);
        } finally {
            this._submitting = false;
        }
    }

    private async _onLaw(): Promise<void> {
        const content = this.lawContentInput?.string?.trim() ?? '';

        if (!content) {
            this._showFeedback('請填寫內容', false);
            return;
        }
        if (this._submitting) return;
        this._submitting = true;

        try {
            // TODO: 正式版 await apiClient.leader.law(this._leaderOcName, content);
            const L = this._faction === 'Pure' ? FACTION_LABELS.Pure : FACTION_LABELS.Turbid;
            this._showFeedback(`${L.lawTitle}已頒布。`, true);
            if (this.lawContentInput) this.lawContentInput.string = '';
            this.node.emit('decree-issued', { type: 'law', faction: this._faction, content });
            await this._refresh();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '操作失敗';
            this._showFeedback(msg, false);
        } finally {
            this._submitting = false;
        }
    }

    private async _onBounty(): Promise<void> {
        const target   = this.bountyTargetInput?.string?.trim() ?? '';
        const landmark = this.bountyLandmarkInput?.string?.trim() ?? '';

        if (!target || !landmark) {
            this._showFeedback('請填寫目標OC名與據點', false);
            return;
        }
        if (this._submitting) return;
        this._submitting = true;

        try {
            // TODO: 正式版 await apiClient.leader.bounty(this._leaderOcName, target, landmark, this._bountyAmount);
            this._showFeedback(`懸賞令發布。目標：${target}，據點：${landmark}，賞金：${this._bountyAmount} 幣。`, true);
            if (this.bountyTargetInput)   this.bountyTargetInput.string = '';
            if (this.bountyLandmarkInput) this.bountyLandmarkInput.string = '';
            this.node.emit('decree-issued', { type: 'bounty', faction: this._faction, target, landmark, amount: this._bountyAmount });
            await this._refresh();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '操作失敗';
            this._showFeedback(msg, false);
        } finally {
            this._submitting = false;
        }
    }

    private _setBountyAmount(amount: 1 | 2): void {
        this._bountyAmount = amount;
        this._updateBountyCost();
        this._updateStatsUI();
    }

    // ── 詛咒金庫二次確認 ──────────────────────────────────────────────────────

    private _onCurseTreasuryStart(): void {
        this._confirmingCurseTreasury = true;
        this._setCurseTreasuryConfirmVisible(true);
    }

    private _onCurseTreasuryCancel(): void {
        this._confirmingCurseTreasury = false;
        this._setCurseTreasuryConfirmVisible(false);
    }

    private async _onCurseTreasuryConfirm(): Promise<void> {
        if (this._submitting) return;
        this._submitting = true;
        this._confirmingCurseTreasury = false;
        this._setCurseTreasuryConfirmVisible(false);

        try {
            // TODO: 正式版 await apiClient.leader.curseTreasury(this._leaderOcName);
            const L = this._faction === 'Pure' ? FACTION_LABELS.Pure : FACTION_LABELS.Turbid;
            this._showFeedback(`${L.treasury}焚盡。詛咒已落向敵方某人。`, true);
            this.node.emit('decree-issued', { type: 'curse_treasury', faction: this._faction });
            await this._refresh();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '操作失敗';
            this._showFeedback(msg, false);
        } finally {
            this._submitting = false;
        }
    }

    private _setCurseTreasuryConfirmVisible(visible: boolean): void {
        if (this.curseTreasuryConfirmLabel) this.curseTreasuryConfirmLabel.node.active = visible;
        if (this.confirmCurseTreasuryBtn)   this.confirmCurseTreasuryBtn.node.active   = visible;
        if (this.cancelCurseTreasuryBtn)    this.cancelCurseTreasuryBtn.node.active    = visible;
        if (this.curseTreasuryButton)       this.curseTreasuryButton.node.active       = !visible;
    }

    // ── 操作回饋 ──────────────────────────────────────────────────────────────

    private _showFeedback(msg: string, ok: boolean): void {
        if (!this.feedbackLabel) return;

        this.feedbackLabel.string = msg;
        this.feedbackLabel.color = ok ? FEEDBACK_OK : FEEDBACK_FAIL;
        this.feedbackLabel.node.active = true;

        // 3.5 秒後自動隱藏
        this.unschedule(this._hideFeedback);
        this.scheduleOnce(this._hideFeedback, 3.5);
    }

    private _hideFeedback(): void {
        if (this.feedbackLabel) {
            this.feedbackLabel.node.active = false;
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
