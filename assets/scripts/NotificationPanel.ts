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
    Vec3,
} from 'cc';
import { applyFactionMaterial, FactionType, getPageTheme } from './PTD_UI_Theme';
import { DataManager } from './PTD_DataManager';
import { SoundManager } from './SoundManager';

const { ccclass, property } = _decorator;

/** 單一通知項目結構 */
interface NotificationItem {
    id: string;
    title: string;
    body: string;
    timestamp: string;
    read: boolean;
}

// ── 組件 ─────────────────────────────────────────────────────────────────────

/**
 * NotificationPanel
 * 通知下拉面板（DESIGN_SPEC §6-C: 320px 寬, max 384px 高, 絕對定位於鈴鐺下方）。
 *
 * 掛載方式：
 *  1. 在 PanelLayer 下建立 NotificationPanelNode
 *  2. 掛載本腳本
 *  3. Inspector 綁定 scrollView、emptyLabel、掛載 Sprite 的面板底圖節點
 *
 * 開啟方式：
 *  MainGameController 監聽 HUD 'bell-tapped' 事件 → 呼叫 show()
 */
@ccclass('NotificationPanel')
export class NotificationPanel extends Component {

    @property(Node)
    panelRoot: Node = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Node)
    contentContainer: Node = null;

    @property(Label)
    emptyLabel: Label = null;

    @property(Sprite)
    bgSprite: Sprite = null;

    @property(Label)
    titleLabel: Label = null;

    @property(Node)
    closeButton: Node = null;

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _notifications: NotificationItem[] = [];
    private _isVisible = false;

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

    /** 初始化主題色 */
    initTheme(faction: FactionType): void {
        const th = getPageTheme(faction);
        if (this.bgSprite) this.bgSprite.color = th.bgBase;
        if (this.titleLabel) this.titleLabel.color = th.textPrimary;

        if (this.bgSprite) {
            applyFactionMaterial(this.bgSprite, faction, this.turbidMaterial, this.pureMaterial);
        }
    }

    /** 設定通知清單並重新渲染 */
    setNotifications(items: NotificationItem[]): void {
        this._notifications = items;
        this._render();
    }

    /** 顯示面板（淡入） */
    show(): void {
        if (this._isVisible) return;
        this._isVisible = true;

        this.node.active = true;
        SoundManager.panelOpen();

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.2, { opacity: 255 }).start();
    }

    /** 隱藏面板（淡出） */
    hide(): void {
        if (!this._isVisible) return;
        this._isVisible = false;

        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);

        tween(opacity).to(0.15, { opacity: 0 }).call(() => {
            this.node.active = false;
        }).start();
    }

    toggle(): void {
        if (this._isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // ── 渲染 ──────────────────────────────────────────────────────────────────

    private _render(): void {
        if (!this.contentContainer) return;

        this.contentContainer.removeAllChildren();

        if (this._notifications.length === 0) {
            if (this.emptyLabel) {
                this.emptyLabel.string = '目前沒有新通知';
                this.emptyLabel.node.active = true;
            }
            return;
        }

        if (this.emptyLabel) this.emptyLabel.node.active = false;

        for (const item of this._notifications) {
            this._createNotificationRow(item);
        }
    }

    private _createNotificationRow(item: NotificationItem): void {
        if (!this.contentContainer) return;

        const row = new Node(`Notification_${item.id}`);
        this.contentContainer.addChild(row);

        const label = row.addComponent(Label);
        label.string = `${item.read ? '' : '● '}${item.title}\n${item.body}`;
        label.fontSize = 12;
        label.overflow = Label.Overflow.RESIZE_HEIGHT;

        row.on(Node.EventType.TOUCH_END, () => {
            item.read = true;
            this._render();
            this.node.emit('notification-read', item.id);
        });
    }
}
