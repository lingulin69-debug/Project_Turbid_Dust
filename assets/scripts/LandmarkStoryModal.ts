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
    BlockInputEvents,
} from 'cc';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

/** 據點資料（由 MapController 傳入） */
export interface LandmarkStoryInfo {
    id:             string;
    name:           string;
    faction:        FactionType | 'Common';
    status:         'open' | 'closed';
    occupants:      number;
    capacity:       number;
    intro_text:     string;
    mission_text?:  string;
    teamup_text?:   string;
    outro_text?:    string;
    chapter_number: number;
}

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * LandmarkStoryModal
 * 地標劇情彈窗 — 點擊據點後顯示據點故事與組隊資訊。
 *
 * 佈局結構：
 *   全螢幕半透明遮罩 → 居中面板 (max 480×600)
 *   Header: 據點名稱 + 陣營標籤 + 組隊人數
 *   Body:   ScrollView 顯示 4 段劇情文字
 *   Footer: 章節編號 + 狀態 + 加入按鈕
 *
 * 外部開啟：MainGameController 監聽 'landmark-selected' 後呼叫 show(info)
 * 事件輸出：
 *   'join-party' — 使用者點擊加入組隊 (payload: { landmarkId, capacity })
 *   'modal-closed' — 彈窗關閉
 */
@ccclass('LandmarkStoryModal')
export class LandmarkStoryModal extends Component {

    // ── Inspector 插座 ───────────────────────────────────────────────────────

    /** 半透明背景遮罩 */
    @property(Node)
    maskNode: Node = null;

    /** 面板容器節點 */
    @property(Node)
    panelNode: Node = null;

    /** 面板背景 Sprite */
    @property(Sprite)
    bgSprite: Sprite = null;

    /** 據點名稱 */
    @property(Label)
    nameLabel: Label = null;

    /** 陣營標籤 */
    @property(Label)
    factionLabel: Label = null;

    /** 組隊人數 (e.g. "3/5") */
    @property(Label)
    occupantsLabel: Label = null;

    /** 狀態標籤 (OPEN / CLOSED) */
    @property(Label)
    statusLabel: Label = null;

    /** 章節編號 */
    @property(Label)
    chapterLabel: Label = null;

    /** 劇情內容 ScrollView */
    @property(ScrollView)
    contentScrollView: ScrollView = null;

    /** ScrollView 內部的內容節點（放置段落 Label） */
    @property(Node)
    contentContainer: Node = null;

    /** 關閉按鈕 */
    @property(Node)
    closeButton: Node = null;

    /** 加入組隊按鈕 */
    @property(Node)
    joinButton: Node = null;

    /** 加入按鈕上的文字 */
    @property(Label)
    joinButtonLabel: Label = null;

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _isVisible = false;
    private _currentInfo: LandmarkStoryInfo | null = null;
    private _playerFaction: FactionType = 'Pure';
    private _joinLoading = false;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this.node.active = false;

        if (this.closeButton) {
            this.closeButton.on(Node.EventType.TOUCH_END, this.hide, this);
        }
        if (this.maskNode) {
            this.maskNode.on(Node.EventType.TOUCH_END, this.hide, this);
        }
        if (this.joinButton) {
            this.joinButton.on(Node.EventType.TOUCH_END, this._onJoinTap, this);
        }
    }

    onDestroy(): void {
        this.closeButton?.targetOff(this);
        this.maskNode?.targetOff(this);
        this.joinButton?.targetOff(this);
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    /** 設定玩家陣營（用於判斷是否顯示加入按鈕） */
    setPlayerFaction(faction: FactionType): void {
        this._playerFaction = faction;
    }

    /** 初始化主題色 */
    initTheme(faction: FactionType): void {
        this._playerFaction = faction;
        const th = getPageTheme(faction);
        if (this.bgSprite) {
            this.bgSprite.color = th.bgBase;
            applyFactionMaterial(this.bgSprite, faction, this.turbidMaterial, this.pureMaterial);
        }
        if (this.nameLabel) this.nameLabel.color = th.textPrimary;
    }

    /** 顯示彈窗並填入據點資料 */
    show(info: LandmarkStoryInfo): void {
        if (this._isVisible) return;
        this._isVisible = true;
        this._currentInfo = info;
        this._joinLoading = false;

        this._populateUI(info);
        this.node.active = true;
        SoundManager.panelOpen();

        // fade in
        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.22, { opacity: 255 }).start();
    }

    /** 關閉彈窗 */
    hide(): void {
        if (!this._isVisible) return;
        this._isVisible = false;

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);

        tween(opacity).to(0.15, { opacity: 0 }).call(() => {
            this.node.active = false;
            this._currentInfo = null;
        }).start();

        this.node.emit('modal-closed');
    }

    // ── 內部渲染 ──────────────────────────────────────────────────────────────

    private _populateUI(info: LandmarkStoryInfo): void {
        const th = getPageTheme(this._playerFaction);

        // Header
        if (this.nameLabel) this.nameLabel.string = info.name;
        if (this.factionLabel) {
            this.factionLabel.string = info.faction === 'Common' ? '中立' :
                info.faction === 'Turbid' ? '濁息' : '淨塵';
            this.factionLabel.color = info.faction === 'Turbid'
                ? new Color(155, 89, 182) : info.faction === 'Pure'
                    ? new Color(184, 159, 134) : new Color(128, 128, 128);
        }
        if (this.occupantsLabel) {
            this.occupantsLabel.string = `${info.occupants}/${info.capacity}`;
            this.occupantsLabel.color = th.textSecondary;
        }

        // Footer
        if (this.statusLabel) {
            this.statusLabel.string = info.status === 'open' ? 'OPEN' : 'CLOSED';
            this.statusLabel.color = info.status === 'open'
                ? new Color(34, 197, 94) : new Color(239, 68, 68);
        }
        if (this.chapterLabel) {
            this.chapterLabel.string = `第 ${info.chapter_number} 章`;
            this.chapterLabel.color = th.textSecondary;
        }

        // 加入按鈕可見性
        if (this.joinButton) {
            const canJoin = info.status === 'open'
                && info.occupants < info.capacity
                && info.faction !== 'Common'
                && (info.faction as string) === this._playerFaction;
            this.joinButton.active = canJoin;
        }
        if (this.joinButtonLabel) {
            this.joinButtonLabel.string = '加入組隊';
        }

        // 劇情內容
        this._renderStoryContent(info, th);
    }

    private _renderStoryContent(info: LandmarkStoryInfo, th: ReturnType<typeof getPageTheme>): void {
        if (!this.contentContainer) return;

        // 清空舊內容
        this.contentContainer.removeAllChildren();

        const sections: { title: string; text: string }[] = [];
        if (info.intro_text) sections.push({ title: '據點概述', text: info.intro_text });
        if (info.mission_text) sections.push({ title: '任務描述', text: info.mission_text });
        if (info.teamup_text) sections.push({ title: '組隊資訊', text: info.teamup_text });
        if (info.outro_text) sections.push({ title: '結局線索', text: info.outro_text });

        for (const section of sections) {
            // 段落標題
            const titleNode = new Node(`Title_${section.title}`);
            titleNode.parent = this.contentContainer;
            const titleTransform = titleNode.addComponent(UITransform);
            titleTransform.setContentSize(400, 28);
            const titleLbl = titleNode.addComponent(Label);
            titleLbl.string = `— ${section.title} —`;
            titleLbl.fontSize = 16;
            titleLbl.color = th.textPrimary;
            titleLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
            titleLbl.overflow = Label.Overflow.RESIZE_HEIGHT;

            // 段落內容
            const bodyNode = new Node(`Body_${section.title}`);
            bodyNode.parent = this.contentContainer;
            const bodyTransform = bodyNode.addComponent(UITransform);
            bodyTransform.setContentSize(400, 0);
            const bodyLbl = bodyNode.addComponent(Label);
            bodyLbl.string = section.text;
            bodyLbl.fontSize = 14;
            bodyLbl.lineHeight = 22;
            bodyLbl.color = th.textSecondary;
            bodyLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
            bodyLbl.overflow = Label.Overflow.RESIZE_HEIGHT;
        }
    }

    // ── 按鈕回呼 ──────────────────────────────────────────────────────────────

    private _onJoinTap(): void {
        if (this._joinLoading || !this._currentInfo) return;
        this._joinLoading = true;

        if (this.joinButtonLabel) this.joinButtonLabel.string = '加入中...';

        this.node.emit('join-party', {
            landmarkId: this._currentInfo.id,
            capacity: this._currentInfo.capacity,
        });
    }

    /** 由外部呼叫，回饋加入結果 */
    setJoinResult(result: 'success' | 'full' | 'already' | 'error'): void {
        this._joinLoading = false;

        const messages: Record<string, string> = {
            success: '已成功加入！',
            full: '隊伍已滿',
            already: '你已在隊伍中',
            error: '加入失敗，請稍後再試',
        };

        if (this.joinButtonLabel) {
            this.joinButtonLabel.string = messages[result] ?? '加入組隊';
        }

        if (result === 'success') {
            // 延遲關閉
            this.scheduleOnce(() => this.hide(), 1.5);
        } else {
            // 恢復按鈕文字
            this.scheduleOnce(() => {
                if (this.joinButtonLabel) this.joinButtonLabel.string = '加入組隊';
            }, 2.0);
        }
    }
}
