import {
    _decorator,
    Component,
    Node,
    UITransform,
    Widget,
    Sprite,
    Label,
    Button,
    Color,
    Layout,
    UIOpacity,
    BlockInputEvents,
    Material,
} from 'cc';
import { MainGameController } from './MainGameController';
import { HUDController } from './HUDController';
import { MapController } from './MapController';

const { ccclass, property } = _decorator;

// ── 常數 ──────────────────────────────────────────────────────────────────────

const DESIGN_W = 1280;
const DESIGN_H = 720;

/** DESIGN_SPEC §3-A: 導航按鈕 40×40, 間距 12, 圓角 12 */
const NAV_BTN_SIZE = 40;
const NAV_BTN_GAP  = 12;

/** DESIGN_SPEC §3-B: 縮放按鈕 32×32 */
const ZOOM_BTN_SIZE = 32;

/** DESIGN_SPEC §3-C: HUD 按鈕 32×32 */
const HUD_BTN_SIZE = 32;

/** 導航按鈕清單（對應 HUDController.NAV_PANELS 順序） */
const NAV_LABELS = [
    '公告',  // announcement
    '任務',  // quest
    '日誌',  // daily
    '圖鑑',  // collection
    '背包',  // inventory
    'NPC',  // npc
    '設定',  // settings
];

/** 色彩 — 預設 Turbid 暗色調（登入後由 theme 覆蓋） */
const C = {
    navBg:       new Color(40, 25, 60, 200),
    navText:     new Color(228, 213, 245),
    hudBg:       new Color(30, 15, 50, 220),
    hudText:     new Color(228, 213, 245),
    zoomBg:      new Color(25, 12, 45, 230),
    zoomText:    new Color(200, 190, 220),
    panelBg:     new Color(40, 30, 55, 230),
    badgeRed:    new Color(239, 68, 68),
    badgeText:   new Color(255, 255, 255),
    transparent: new Color(0, 0, 0, 0),
};

// ── 主體 ──────────────────────────────────────────────────────────────────────

/**
 * MapSceneBuilder
 * 程式化建構 MapTestView 場景的完整 UI 節點樹。
 *
 * 使用方式：
 *  1. 在 MapTestView.scene 中新增空節點（如 "SceneBuilder"）
 *  2. 掛載本腳本
 *  3. 將場景中 MainGameController 所掛載的節點拖入 `mainGameCtrl` 插座
 *  4. 執行即自動生成 HUD、導航列、面板容器、轉場層等 UI
 *
 * ⚠️ 美術資源到位後可改為編輯器手動佈局，屆時移除本腳本。
 */
@ccclass('MapSceneBuilder')
export class MapSceneBuilder extends Component {

    @property(MainGameController)
    mainGameCtrl: MainGameController = null;

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    onLoad(): void {
        if (!this.mainGameCtrl) {
            console.error('[MapSceneBuilder] mainGameCtrl 未綁定');
            return;
        }

        const gameRoot = this.mainGameCtrl.node;

        // 1. HUD 頂部右側
        const hudNode = this._buildHUD(gameRoot);

        // 2. 左側導航欄
        const leftNav = this._buildLeftNavBar(gameRoot);

        // 3. 右側工具欄
        this._buildRightToolbar(gameRoot);

        // 4. 面板容器層
        this._buildPanelLayer(gameRoot);

        // 5. 轉場覆蓋層
        this._buildTransitionLayer(gameRoot);

        // 6. 最上層覆蓋
        this._buildOverlayLayer(gameRoot);

        // 7. 綁定 HUD 插座
        this._bindHUDSlots(hudNode, leftNav);

        console.log('[MapSceneBuilder] 場景建構完成');
    }

    // ── HUD 頂部右側 ──────────────────────────────────────────────────────────

    private _buildHUD(parent: Node): Node {
        const hud = new Node('HUD_TopRight');
        parent.addChild(hud);

        hud.addComponent(UITransform).setContentSize(400, 40);

        const widget = hud.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignRight = true;
        widget.top = 24;
        widget.right = 32;

        const layout = hud.addComponent(Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.spacingX = 24;
        layout.resizeMode = Layout.ResizeMode.NONE;

        // 貨幣膠囊
        const coinsNode = this._createPillButton(hud, 'CoinsLabel', '0', 80, HUD_BTN_SIZE);

        // OC 名稱
        const ocNameNode = this._createPillButton(hud, 'OcNameLabel', '未登入', 100, HUD_BTN_SIZE);

        // 設定按鈕
        this._createCircleButton(hud, 'SettingsBtn', '⚙', HUD_BTN_SIZE);

        // 鈴鐺按鈕
        const bellNode = new Node('BellButton');
        hud.addChild(bellNode);
        bellNode.addComponent(UITransform).setContentSize(HUD_BTN_SIZE, HUD_BTN_SIZE);
        const bellSprite = bellNode.addComponent(Sprite);
        bellSprite.color = C.hudBg;
        bellSprite.sizeMode = Sprite.SizeMode.CUSTOM;

        const bellLabel = new Node('BellIcon');
        bellNode.addChild(bellLabel);
        bellLabel.addComponent(UITransform).setContentSize(HUD_BTN_SIZE, HUD_BTN_SIZE);
        const bellLbl = bellLabel.addComponent(Label);
        bellLbl.string = '🔔';
        bellLbl.fontSize = 16;
        bellLbl.color = C.hudText;

        // 紅點徽章
        const badge = new Node('BellBadge');
        bellNode.addChild(badge);
        badge.addComponent(UITransform).setContentSize(16, 16);
        badge.setPosition(12, 12, 0);
        const badgeSprite = badge.addComponent(Sprite);
        badgeSprite.color = C.badgeRed;
        badgeSprite.sizeMode = Sprite.SizeMode.CUSTOM;

        const badgeLabelNode = new Node('BadgeLabel');
        badge.addChild(badgeLabelNode);
        badgeLabelNode.addComponent(UITransform).setContentSize(16, 16);
        const badgeLbl = badgeLabelNode.addComponent(Label);
        badgeLbl.string = '0';
        badgeLbl.fontSize = 10;
        badgeLbl.color = C.badgeText;
        badgeLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        badgeLbl.verticalAlign = Label.VerticalAlign.CENTER;

        badge.active = false;

        return hud;
    }

    // ── 左側導航欄 ────────────────────────────────────────────────────────────

    private _buildLeftNavBar(parent: Node): Node {
        const nav = new Node('LeftNavBar');
        parent.addChild(nav);

        const totalH = NAV_LABELS.length * NAV_BTN_SIZE + (NAV_LABELS.length - 1) * NAV_BTN_GAP;
        nav.addComponent(UITransform).setContentSize(NAV_BTN_SIZE + 24, totalH);

        const widget = nav.addComponent(Widget);
        widget.isAlignLeft = true;
        widget.isAlignVerticalCenter = true;
        widget.left = 12;
        widget.verticalCenter = 0;

        const layout = nav.addComponent(Layout);
        layout.type = Layout.Type.VERTICAL;
        layout.spacingY = NAV_BTN_GAP;
        layout.resizeMode = Layout.ResizeMode.NONE;

        const navBtnNodes: Node[] = [];

        for (const labelText of NAV_LABELS) {
            const btn = this._createNavButton(nav, `NavBtn_${labelText}`, labelText);
            navBtnNodes.push(btn);
        }

        // 章節劇情入口按鈕（預設隱藏）
        const storyBtn = this._createNavButton(nav, 'ChapterStoryBtn', '劇情');
        storyBtn.active = false;

        // 將 navBtnNodes 儲存在節點上，供 _bindHUDSlots 使用
        (nav as any)['_navBtnNodes'] = navBtnNodes;
        (nav as any)['_storyBtnNode'] = storyBtn;

        return nav;
    }

    // ── 右側工具欄 ────────────────────────────────────────────────────────────

    private _buildRightToolbar(parent: Node): void {
        const toolbar = new Node('RightToolbar');
        parent.addChild(toolbar);

        toolbar.addComponent(UITransform).setContentSize(ZOOM_BTN_SIZE + 16, ZOOM_BTN_SIZE * 2 + 8);

        const widget = toolbar.addComponent(Widget);
        widget.isAlignRight = true;
        widget.isAlignVerticalCenter = true;
        widget.right = 24;
        widget.verticalCenter = 0;

        const layout = toolbar.addComponent(Layout);
        layout.type = Layout.Type.VERTICAL;
        layout.spacingY = 4;
        layout.resizeMode = Layout.ResizeMode.NONE;

        this._createCircleButton(toolbar, 'ZoomInBtn', '+', ZOOM_BTN_SIZE, C.zoomBg, C.zoomText);
        this._createCircleButton(toolbar, 'ZoomOutBtn', '−', ZOOM_BTN_SIZE, C.zoomBg, C.zoomText);
    }

    // ── 面板容器層 ────────────────────────────────────────────────────────────

    private _buildPanelLayer(parent: Node): void {
        const panelLayer = new Node('PanelLayer');
        parent.addChild(panelLayer);

        panelLayer.addComponent(UITransform).setContentSize(DESIGN_W, DESIGN_H);

        // 面板節點（全部預設隱藏）
        const panelNames = [
            'WhiteCrowCardNode',
            'InventoryPanelNode',
            'NPCModalNode',
            'CharacterCardNode',
            'NotificationPanelNode',
            'SettingsPanelNode',
            'QuestPanelNode',
            'CollectionPanelNode',
            'ItemDetailModalNode',
        ];

        for (const name of panelNames) {
            const node = new Node(name);
            panelLayer.addChild(node);
            node.addComponent(UITransform).setContentSize(450, 480);

            // 置中
            const w = node.addComponent(Widget);
            w.isAlignVerticalCenter = true;
            w.isAlignHorizontalCenter = true;
            w.verticalCenter = 0;
            w.horizontalCenter = 0;

            node.active = false;
        }
    }

    // ── 轉場覆蓋層 ────────────────────────────────────────────────────────────

    private _buildTransitionLayer(parent: Node): void {
        const layer = new Node('TransitionLayer');
        parent.addChild(layer);

        layer.addComponent(UITransform).setContentSize(DESIGN_W, DESIGN_H);

        const transNodes = [
            'BreathingSceneNode',
            'ChapterOpeningNode',
            'ChapterStoryModalNode',
            'DiceResultOverlayNode',
        ];

        for (const name of transNodes) {
            const node = new Node(name);
            layer.addChild(node);

            const ut = node.addComponent(UITransform);
            ut.setContentSize(DESIGN_W, DESIGN_H);

            // 全螢幕
            const w = node.addComponent(Widget);
            w.isAlignTop = true;
            w.isAlignBottom = true;
            w.isAlignLeft = true;
            w.isAlignRight = true;
            w.top = 0;
            w.bottom = 0;
            w.left = 0;
            w.right = 0;

            node.active = false;
        }
    }

    // ── 最上層覆蓋 ────────────────────────────────────────────────────────────

    private _buildOverlayLayer(parent: Node): void {
        const layer = new Node('OverlayLayer');
        parent.addChild(layer);

        layer.addComponent(UITransform).setContentSize(DESIGN_W, DESIGN_H);

        const overlays = ['BalanceOverlayNode', 'RelicPoemModalNode'];

        for (const name of overlays) {
            const node = new Node(name);
            layer.addChild(node);
            node.addComponent(UITransform).setContentSize(DESIGN_W, DESIGN_H);

            const w = node.addComponent(Widget);
            w.isAlignTop = true;
            w.isAlignBottom = true;
            w.isAlignLeft = true;
            w.isAlignRight = true;
            w.top = 0;
            w.bottom = 0;
            w.left = 0;
            w.right = 0;

            node.active = false;
        }
    }

    // ── 綁定 HUD 插座 ────────────────────────────────────────────────────────

    private _bindHUDSlots(hudNode: Node, navNode: Node): void {
        // 取得或建立 HUDController
        let hud = hudNode.getComponent(HUDController);
        if (!hud) {
            hud = hudNode.addComponent(HUDController);
        }

        // Label 插座
        const coinsNode = hudNode.getChildByName('CoinsLabel');
        if (coinsNode) hud.coinsLabel = coinsNode.getComponentInChildren(Label);

        const ocNameNode = hudNode.getChildByName('OcNameLabel');
        if (ocNameNode) hud.ocNameLabel = ocNameNode.getComponentInChildren(Label);

        // 鈴鐺
        const bellNode = hudNode.getChildByName('BellButton');
        if (bellNode) {
            hud.bellButtonNode = bellNode;
            const badge = bellNode.getChildByName('BellBadge');
            if (badge) {
                hud.bellBadgeNode = badge;
                const badgeLabel = badge.getChildByName('BadgeLabel');
                if (badgeLabel) hud.bellBadgeLabel = badgeLabel.getComponent(Label);
            }
        }

        // 導航按鈕陣列
        const navBtnNodes: Node[] = (navNode as any)['_navBtnNodes'] ?? [];
        hud.navButtons = navBtnNodes;

        // 綁定主場景插座
        this.mainGameCtrl.hudController = hud;

        // 章節劇情按鈕
        const storyBtn: Node | null = (navNode as any)['_storyBtnNode'] ?? null;
        if (storyBtn) {
            (hud as any)['chapterStoryBtnNode'] = storyBtn;
        }
    }

    // ── 工具方法 ──────────────────────────────────────────────────────────────

    private _createNavButton(parent: Node, name: string, labelText: string): Node {
        const node = new Node(name);
        parent.addChild(node);

        node.addComponent(UITransform).setContentSize(NAV_BTN_SIZE, NAV_BTN_SIZE);

        const sprite = node.addComponent(Sprite);
        sprite.color = C.navBg;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        node.addComponent(Button);

        // 按鈕圖標文字（佔位）
        const labelNode = new Node('Label');
        node.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(NAV_BTN_SIZE, NAV_BTN_SIZE);
        const lbl = labelNode.addComponent(Label);
        lbl.string = labelText.slice(0, 2);
        lbl.fontSize = 12;
        lbl.color = C.navText;
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;

        return node;
    }

    private _createPillButton(parent: Node, name: string, text: string, w: number, h: number): Node {
        const node = new Node(name);
        parent.addChild(node);

        node.addComponent(UITransform).setContentSize(w, h);

        const sprite = node.addComponent(Sprite);
        sprite.color = C.hudBg;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        // 文字
        const labelNode = new Node('Label');
        node.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(w, h);
        const lbl = labelNode.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = 13;
        lbl.color = C.hudText;
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;

        return node;
    }

    private _createCircleButton(
        parent: Node,
        name: string,
        symbol: string,
        size: number,
        bgColor: Color = C.hudBg,
        textColor: Color = C.hudText,
    ): Node {
        const node = new Node(name);
        parent.addChild(node);

        node.addComponent(UITransform).setContentSize(size, size);

        const sprite = node.addComponent(Sprite);
        sprite.color = bgColor;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        node.addComponent(Button);

        const labelNode = new Node('Label');
        node.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(size, size);
        const lbl = labelNode.addComponent(Label);
        lbl.string = symbol;
        lbl.fontSize = 14;
        lbl.color = textColor;
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;

        return node;
    }
}
