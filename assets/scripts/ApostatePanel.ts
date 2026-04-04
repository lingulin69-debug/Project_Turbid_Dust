import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    Material,
    tween,
    UIOpacity,
    UITransform,
    Color,
    BlockInputEvents,
    sys,
} from 'cc';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

/** 問卷題目 */
interface ScreeningQuestion {
    question: string;
    optionA: string;
    optionB: string;
    affinityA: number;
    affinityB: number;
}

/** 叛教者行動類型 */
type ApostateAction = 'A' | 'B' | 'C';

const ACTION_INFO: Record<ApostateAction, { name: string; desc: string }> = {
    A: { name: '霧後的真相', desc: '標記敵方一個據點 1 小時，使其在地圖上顯示為已被偵測。' },
    B: { name: '權力的裂縫', desc: '讀取敵方當前天平偏移值，獲得情報優勢。' },
    C: { name: '物資的截流', desc: '發起一次劫掠行動，有機會獲取敵方據點的部分資源。' },
};

/** 預設問卷題庫 */
const QUESTION_POOL: ScreeningQuestion[] = [
    { question: '你的信仰是否曾經動搖過？', optionA: '曾經', optionB: '從未', affinityA: 2, affinityB: 0 },
    { question: '面對不公時，你傾向……', optionA: '暗中行動', optionB: '公開抗議', affinityA: 2, affinityB: 1 },
    { question: '背叛同伴是否有正當理由？', optionA: '視情況而定', optionB: '絕不', affinityA: 2, affinityB: 0 },
    { question: '權力的本質是什麼？', optionA: '控制的工具', optionB: '保護的手段', affinityA: 2, affinityB: 1 },
    { question: '你願意為真相付出什麼代價？', optionA: '一切', optionB: '適可而止', affinityA: 3, affinityB: 0 },
    { question: '秩序與自由，你選擇哪一邊？', optionA: '自由', optionB: '秩序', affinityA: 2, affinityB: 1 },
];

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * ApostatePanel
 * 叛教者系統面板 — 包含兩個階段：
 *   1. Screening Modal：3 題隨機問卷，決定是否進入抽獎池
 *   2. Ability Menu：顯示分配的行動並可執行（每章限用一次）
 *
 * 外部開啟：MainGameController 呼叫 show()
 * 事件輸出：
 *   'apostate-screening-done' — 問卷完成
 *   'apostate-action-used'   — 行動已執行 (payload: { action: ApostateAction })
 *   'panel-closed'           — 面板關閉
 */
@ccclass('ApostatePanel')
export class ApostatePanel extends Component {

    // ── Inspector 插座 ───────────────────────────────────────────────────────

    /** 全螢幕遮罩 */
    @property(Node)
    maskNode: Node = null;

    /** 問卷面板 */
    @property(Node)
    screeningPanel: Node = null;

    /** 能力選單面板 */
    @property(Node)
    abilityPanel: Node = null;

    /** 問卷標題 */
    @property(Label)
    questionLabel: Label = null;

    /** 問卷題號 */
    @property(Label)
    questionIndexLabel: Label = null;

    /** 選項 A 按鈕節點 */
    @property(Node)
    optionABtn: Node = null;

    /** 選項 A 文字 */
    @property(Label)
    optionALabel: Label = null;

    /** 選項 B 按鈕節點 */
    @property(Node)
    optionBBtn: Node = null;

    /** 選項 B 文字 */
    @property(Label)
    optionBLabel: Label = null;

    /** 能力名稱 */
    @property(Label)
    actionNameLabel: Label = null;

    /** 能力描述 */
    @property(Label)
    actionDescLabel: Label = null;

    /** 執行行動按鈕 */
    @property(Node)
    executeBtn: Node = null;

    /** 執行按鈕文字 */
    @property(Label)
    executeBtnLabel: Label = null;

    /** 冷卻 / 狀態提示文字 */
    @property(Label)
    statusLabel: Label = null;

    /** 關閉按鈕 */
    @property(Node)
    closeButton: Node = null;

    /** 面板背景 Sprite */
    @property(Sprite)
    bgSprite: Sprite = null;

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _isVisible = false;
    private _ocName = '';
    private _chapter = '';
    private _questions: ScreeningQuestion[] = [];
    private _currentQIndex = 0;
    private _totalAffinity = 0;
    private _assignedAction: ApostateAction | null = null;
    private _actionUsed = false;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this.node.active = false;

        if (this.closeButton) {
            this.closeButton.on(Node.EventType.TOUCH_END, this.hide, this);
        }
        if (this.optionABtn) {
            this.optionABtn.on(Node.EventType.TOUCH_END, () => this._onAnswer('A'), this);
        }
        if (this.optionBBtn) {
            this.optionBBtn.on(Node.EventType.TOUCH_END, () => this._onAnswer('B'), this);
        }
        if (this.executeBtn) {
            this.executeBtn.on(Node.EventType.TOUCH_END, this._onExecuteAction, this);
        }
    }

    onDestroy(): void {
        if (this.closeButton?.isValid) this.closeButton.targetOff(this);
        if (this.optionABtn?.isValid) this.optionABtn.targetOff(this);
        if (this.optionBBtn?.isValid) this.optionBBtn.targetOff(this);
        if (this.executeBtn?.isValid) this.executeBtn.targetOff(this);
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    initTheme(faction: FactionType): void {
        const th = getPageTheme(faction);
        if (this.bgSprite) {
            this.bgSprite.color = th.bgBase;
            applyFactionMaterial(this.bgSprite, faction, this.turbidMaterial, this.pureMaterial);
        }
    }

    /**
     * 顯示叛教者面板
     * @param ocName 玩家 OC 名稱
     * @param chapter 當前章節 (e.g. "ch1")
     */
    show(ocName: string, chapter: string): void {
        if (this._isVisible) return;
        this._isVisible = true;
        this._ocName = ocName;
        this._chapter = chapter;

        // 檢查是否已完成問卷
        const screeningKey = `apostate_screening_done_${ocName}`;
        const screeningDone = sys.localStorage.getItem(screeningKey) === 'true';

        // 檢查是否已分配行動
        const actionKey = `apostate_action_${chapter}_${ocName}`;
        const savedAction = sys.localStorage.getItem(actionKey) as ApostateAction | null;

        // 檢查行動是否已使用
        const usedKey = `apostate_used_${chapter}_${ocName}`;
        this._actionUsed = sys.localStorage.getItem(usedKey) === 'true';

        this.node.active = true;
        SoundManager.panelOpen();

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.22, { opacity: 255 }).start();

        if (!screeningDone) {
            this._startScreening();
        } else if (savedAction) {
            this._assignedAction = savedAction;
            this._showAbilityMenu();
        } else {
            // 問卷完成但未分配行動（不太可能，保險處理）
            this._assignRandomAction();
            this._showAbilityMenu();
        }
    }

    hide(): void {
        if (!this._isVisible) return;
        this._isVisible = false;

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);

        tween(opacity).to(0.15, { opacity: 0 }).call(() => {
            this.node.active = false;
        }).start();

        this.node.emit('panel-closed', 'apostate');
    }

    // ── Screening 問卷流程 ───────────────────────────────────────────────────

    private _startScreening(): void {
        this._currentQIndex = 0;
        this._totalAffinity = 0;

        // 隨機抽 3 題
        const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
        this._questions = shuffled.slice(0, 3);

        if (this.screeningPanel) this.screeningPanel.active = true;
        if (this.abilityPanel) this.abilityPanel.active = false;

        this._renderQuestion();
    }

    private _renderQuestion(): void {
        const q = this._questions[this._currentQIndex];
        if (!q) return;

        if (this.questionIndexLabel) {
            this.questionIndexLabel.string = `問題 ${this._currentQIndex + 1} / ${this._questions.length}`;
        }
        if (this.questionLabel) this.questionLabel.string = q.question;
        if (this.optionALabel) this.optionALabel.string = q.optionA;
        if (this.optionBLabel) this.optionBLabel.string = q.optionB;
    }

    private _onAnswer(choice: 'A' | 'B'): void {
        const q = this._questions[this._currentQIndex];
        if (!q) return;

        this._totalAffinity += choice === 'A' ? q.affinityA : q.affinityB;
        this._currentQIndex++;

        if (this._currentQIndex < this._questions.length) {
            this._renderQuestion();
        } else {
            this._finishScreening();
        }
    }

    private _finishScreening(): void {
        // 標記問卷完成
        const screeningKey = `apostate_screening_done_${this._ocName}`;
        sys.localStorage.setItem(screeningKey, 'true');

        // 分配行動
        this._assignRandomAction();

        this.node.emit('apostate-screening-done', { affinity: this._totalAffinity });

        // 切換到能力選單
        this._showAbilityMenu();
    }

    // ── 能力選單 ─────────────────────────────────────────────────────────────

    private _assignRandomAction(): void {
        const actions: ApostateAction[] = ['A', 'B', 'C'];
        this._assignedAction = actions[Math.floor(Math.random() * actions.length)];

        const actionKey = `apostate_action_${this._chapter}_${this._ocName}`;
        sys.localStorage.setItem(actionKey, this._assignedAction);
    }

    private _showAbilityMenu(): void {
        if (this.screeningPanel) this.screeningPanel.active = false;
        if (this.abilityPanel) this.abilityPanel.active = true;

        if (!this._assignedAction) return;
        const info = ACTION_INFO[this._assignedAction];

        if (this.actionNameLabel) this.actionNameLabel.string = info.name;
        if (this.actionDescLabel) this.actionDescLabel.string = info.desc;

        if (this._actionUsed) {
            if (this.executeBtn) this.executeBtn.active = false;
            if (this.statusLabel) {
                this.statusLabel.string = '本章行動已使用，等待下一章節。';
                this.statusLabel.node.active = true;
            }
        } else {
            if (this.executeBtn) this.executeBtn.active = true;
            if (this.executeBtnLabel) this.executeBtnLabel.string = '執行通訊';
            if (this.statusLabel) this.statusLabel.node.active = false;
        }
    }

    private _onExecuteAction(): void {
        if (this._actionUsed || !this._assignedAction) return;
        this._actionUsed = true;

        // 儲存使用記錄
        const usedKey = `apostate_used_${this._chapter}_${this._ocName}`;
        sys.localStorage.setItem(usedKey, 'true');

        this.node.emit('apostate-action-used', { action: this._assignedAction });

        // 更新 UI
        if (this.executeBtn) this.executeBtn.active = false;
        if (this.statusLabel) {
            this.statusLabel.string = '行動已執行。';
            this.statusLabel.node.active = true;
        }
    }
}
