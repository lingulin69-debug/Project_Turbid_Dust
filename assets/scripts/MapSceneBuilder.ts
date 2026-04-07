import {
    _decorator,
    Component,
    Node,
    Layers,
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
    Graphics,
} from 'cc';
import { MainGameController } from './MainGameController';
import { HUDController } from './HUDController';
import { MapController } from './MapController';
import { NotificationPanel } from './NotificationPanel';
import { SettingsPanel } from './SettingsPanel';
import { QuestPanel } from './QuestPanel';
import { CollectionPanel } from './CollectionPanel';
import { InventoryPanel } from './InventoryPanel';
import { ItemDetailModal } from './ItemDetailModal';
import { NPCModal } from './NPCModal';
import { WhiteCrowCard } from './WhiteCrowCard';
import { DiceResultOverlay } from './DiceResultOverlay';
import { RelicPoemModal } from './RelicPoemModal';
import { ChapterStoryModal } from './ChapterStoryModal';
import { LandmarkStoryModal } from './LandmarkStoryModal';
import { ApostatePanel } from './ApostatePanel';
import { LiquidatorPanel } from './LiquidatorPanel';
import { KidnapPopup } from './KidnapPopup';
import { BalanceSettlementModal } from './BalanceSettlementModal';
import { LeaderboardPanel } from './LeaderboardPanel';
import { LeaderTyrannyPanel } from './LeaderTyrannyPanel';
import { BreathingSceneController } from './BreathingSceneController';
import { ChapterOpeningController } from './ChapterOpeningController';
import { DonationTracker } from './DonationTracker';
import { EventCalendar } from './EventCalendar';
import { MusicDiscController } from './MusicDiscController';
import { getWhiteSpriteFrame } from './PTD_SpriteHelper';

const { ccclass, property } = _decorator;

// ── 常數 ──────────────────────────────────────────────────────────────────────

const DESIGN_W = 1280;
const DESIGN_H = 720;

/** DESIGN_SPEC §3-A: 導航按鈕放大為更易點擊的尺寸 */
const NAV_BTN_W = 96;
const NAV_BTN_H = 44;
const NAV_BTN_GAP  = 18;

/** DESIGN_SPEC §3-B: 縮放按鈕 32×32 */
const ZOOM_BTN_SIZE = 32;

/** DESIGN_SPEC §3-C: HUD 按鈕 32×32 */
const HUD_BTN_SIZE = 32;

/** 導航按鈕清單（對應 HUDController.NAV_PANELS 順序） */
const NAV_PANEL_IDS = [
    'announcement',
    'quest',
    'daily',
    'collection',
    'inventory',
    'npc',
    'settings',
] as const;

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

type PanelShellRefs = {
    backdrop: Node;
    bgNode: Node;
    bgSprite: Sprite;
    titleLabel: Label;
    closeButton: Node;
    bodyRoot: Node;
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
        console.log('=== MapSceneBuilder V4 已載入 ===');

        if (!this.mainGameCtrl) {
            console.error('[MapSceneBuilder] mainGameCtrl 未綁定');
            return;
        }

        const ctrl = this.mainGameCtrl;
        // gameRoot = Canvas 節點（MainGameController 掛載處）。
        // 不論 MapSceneBuilder 掛在哪裡，ctrl.node 一定是 Canvas。
        const gameRoot = ctrl.node;

        // ── Phase 0: 偵測 Inspector 是否已完成手動綁定 ──────────────────────
        // 若核心控制器插座已在 Inspector 綁好，代表場景已由編輯器佈局完成，
        // 跳過所有動態建構，避免重複建立節點。
        if (ctrl.hudController && ctrl.mapController) {
            console.log('[MapSceneBuilder] ✅ 偵測到 Inspector 已綁定核心插座，跳過動態 UI 建構');
            this._postValidateInspectorBindings(ctrl);
            return;
        }

        console.log('[MapSceneBuilder] 未偵測到 Inspector 綁定，啟動動態建構 (fallback)…');

        // ── Phase 1: 建立缺失的 UI 節點（已存在則直接使用）──────────────────

        // 0. 地圖容器（MapController）
        const mapNode = gameRoot.getChildByName('MapArea') ?? this._buildMapArea(gameRoot);
        this._setUILayerRecursive(mapNode);

        // 1. HUD 頂部右側
        const hudNode = gameRoot.getChildByName('HUD_TopRight') ?? this._buildHUD(gameRoot);
        this._setUILayerRecursive(hudNode);

        // 2. 左側導航欄
        const leftNav = gameRoot.getChildByName('LeftNavBar') ?? this._buildLeftNavBar(gameRoot);
        this._setUILayerRecursive(leftNav);

        // 3. 右側工具欄
        const rightToolbar = gameRoot.getChildByName('RightToolbar') ?? this._buildRightToolbar(gameRoot);
        this._setUILayerRecursive(rightToolbar);

        // 4. 面板容器層
        const panelLayer = gameRoot.getChildByName('PanelLayer') ?? this._buildPanelLayer(gameRoot);
        this._setUILayerRecursive(panelLayer);

        // 5. 轉場覆蓋層
        const transitionLayer = gameRoot.getChildByName('TransitionLayer') ?? this._buildTransitionLayer(gameRoot);
        this._setUILayerRecursive(transitionLayer);

        // 6. 最上層覆蓋
        const overlayLayer = gameRoot.getChildByName('OverlayLayer') ?? this._buildOverlayLayer(gameRoot);
        this._setUILayerRecursive(overlayLayer);

        const topUiIndex = this.node.children.length - 3;
        hudNode.setSiblingIndex(topUiIndex);
        leftNav.setSiblingIndex(topUiIndex);
        rightToolbar.setSiblingIndex(topUiIndex);

        // ── Phase 2: 綁定 HUD 插座（僅動態建構時需要）─────────────────────
        this._bindHUDSlots(hudNode, leftNav);

        // ── Phase 3: 為面板加元件並綁定（僅動態建構時需要）──────────────────
        this._addComponentsAndBind(gameRoot);

        console.log('[MapSceneBuilder] 動態場景建構完成');
    }

    private _setUILayerRecursive(node: Node): void {
        node.layer = Layers.Enum.UI_2D;
        for (const child of node.children) {
            this._setUILayerRecursive(child);
        }
    }

    // ── Inspector 綁定後的自動補驗 ────────────────────────────────────────────

    /**
     * 當偵測到 Inspector 已完成手動綁定時，仍需檢查並自動補填常見的遺漏。
     * 這是為了安全起見，不需要使用者手動設定每一個零件。
     */
    private _postValidateInspectorBindings(ctrl: MainGameController): void {
        // 0. 遞迴設 UI_2D layer：編輯器手動建立的節點預設為 DEFAULT，
        //    Canvas Camera 只渲染 UI_2D，不設就看不見。
        //    注意：ctrl.node 就是 Canvas，直接遍歷其子節點。
        for (const child of ctrl.node.children) {
            this._setUILayerRecursive(child);
        }
        console.log('[MapSceneBuilder] ⚙️ 已對 Canvas 下所有子節點遞迴套用 UI_2D layer');

        // 1. MapController.mapRoot：自解引用（如果 MapController 掛在 MapArea 上，mapRoot 就是自己）
        if (ctrl.mapController && !ctrl.mapController.mapRoot) {
            ctrl.mapController.mapRoot = ctrl.mapController.node;
            console.log('[MapSceneBuilder] ⚙️ 自動補綁 MapController.mapRoot → 自身節點');
        }

        // 2. MapArea 背景：若無任何渲染元件，加入 Graphics 底色
        if (ctrl.mapController) {
            const mapNode = ctrl.mapController.node;
            const hasSp = !!mapNode.getComponent(Sprite);
            const hasGfx = !!mapNode.getComponent(Graphics);
            if (!hasSp && !hasGfx) {
                const ut = mapNode.getComponent(UITransform);
                const w = ut?.width ?? 1280;
                const h = ut?.height ?? 720;
                const g = mapNode.addComponent(Graphics);
                g.fillColor = new Color(30, 35, 50, 255);
                g.rect(-w / 2, -h / 2, w, h);
                g.fill();
                console.log('[MapSceneBuilder] ⚙️ MapArea 缺少渲染元件，已自動加入 Graphics 底色');
            }
        }

        // 3. InventoryPanel.gridContainer：自動建立 GridContainer 子節點
        if (ctrl.inventoryPanel && !ctrl.inventoryPanel.gridContainer) {
            const invNode = ctrl.inventoryPanel.node;
            let grid = invNode.getChildByName('GridContainer');
            if (!grid) {
                grid = new Node('GridContainer');
                invNode.addChild(grid);
                grid.layer = Layers.Enum.UI_2D;
                grid.addComponent(UITransform).setContentSize(420, 400);
                const gridLayout = grid.addComponent(Layout);
                gridLayout.type = Layout.Type.GRID;
                gridLayout.spacingX = 8;
                gridLayout.spacingY = 8;
                gridLayout.startAxis = Layout.AxisDirection.HORIZONTAL;
                gridLayout.constraintNum = 5;
            }
            ctrl.inventoryPanel.gridContainer = grid;
            console.log('[MapSceneBuilder] ⚙️ 自動補建 InventoryPanel.gridContainer');
        }

        // 4. 面板內部結構（Backdrop、CloseButton、PanelBG 等）：
        //    即使跳過動態建構，面板的 shell 仍需建構，否則面板沒有關閉按鈕和遮罩。
        this._ensurePanelShellsForInspectorPath(ctrl);
    }

    /**
     * 在 Inspector 路徑下，為所有已綁定的面板補建內部 shell 結構。
     * 這是因為面板內部的 Backdrop / PanelBG / CloseButton / BodyRoot
     * 是動態建構步驟產生的，不在使用者手動建立的範圍內。
     */
    private _ensurePanelShellsForInspectorPath(ctrl: MainGameController): void {
        const canvasRoot = ctrl.node;  // Canvas
        const panelLayer = canvasRoot.getChildByName('PanelLayer');
        if (!panelLayer) {
            console.warn('[MapSceneBuilder] PanelLayer 不存在，跳過面板 shell 建構');
            return;
        }

        // 面板節點対應表：[節點名, 面板引用, 設定方法]
        type ConfigFn = (node: Node, panel: any) => void;
        const panelConfigs: Array<[string, Component | null, ConfigFn]> = [
            ['SettingsPanelNode',      ctrl.settingsPanel,      (n, p) => this._configureSettingsPanelNode(n, p)],
            ['QuestPanelNode',         ctrl.questPanel,         (n, p) => this._configureQuestPanelNode(n, p)],
            ['CollectionPanelNode',    ctrl.collectionPanel,    (n, p) => this._configureCollectionPanelNode(n, p)],
            ['NotificationPanelNode',  ctrl.notificationPanel,  (n, p) => this._configureNotificationPanelNode(n, p)],
            ['InventoryPanelNode',     ctrl.inventoryPanel,     (n, p) => this._configureInventoryPanelNode(n, p)],
            ['NPCModalNode',           ctrl.npcModal,           (n, p) => this._configureNpcModalNode(n, p)],
            ['WhiteCrowCardNode',      ctrl.whiteCrowCard,      (n, p) => this._configureWhiteCrowCardNode(n, p)],
            ['ItemDetailModalNode',    ctrl.itemDetailModal,    (n, p) => this._configureItemDetailModalNode(n, p)],
        ];

        for (const [nodeName, panel, configureFn] of panelConfigs) {
            if (!panel) {
                console.log(`[MapSceneBuilder] ⏭️ ${nodeName}：panel 未綁定，跳過`);
                continue;
            }
            const node = panelLayer.getChildByName(nodeName);
            if (!node) {
                console.log(`[MapSceneBuilder] ⏭️ ${nodeName}：PanelLayer 中找不到此節點，跳過`);
                continue;
            }
            // 永遠執行 configure（建構 shell + 綁定事件）。
            // _ensurePanelShell 內部已對每個子節點做 if (!xxx) 防重複建立，
            // 但事件綁定（_bindHideOnTap）必須每次 runtime 重新註冊。
            configureFn(node, panel);
            this._setUILayerRecursive(node);
            console.log(`[MapSceneBuilder] ⚙️ 面板 shell 就緒：${nodeName}`);
        }

        // HUDController 事件需要在面板建構後重新註冊（binding 可能已更新）
        if (ctrl.hudController) {
            ctrl.hudController.refreshRuntimeBindings();
            console.log('[MapSceneBuilder] ⚙️ 已呼叫 HUDController.refreshRuntimeBindings()');
        }
    }

    // ── 診斷 LOG（確認排版後的實際位置） ───────────────────────────────────────
    start(): void {
        if (!this.mainGameCtrl) return;
        const canvas = this.mainGameCtrl.node;  // Canvas
        const canvasUT = canvas.getComponent(UITransform);
        const wp = canvas.worldPosition;
        console.log(`[DIAG] Canvas worldPos=(${wp.x.toFixed(0)}, ${wp.y.toFixed(0)}) size=(${canvasUT?.width}, ${canvasUT?.height}) anchor=(${canvasUT?.anchorX}, ${canvasUT?.anchorY})`);

        for (const child of canvas.children) {
            const ut = child.getComponent(UITransform);
            const cwp = child.worldPosition;
            const active = child.active;
            console.log(`[DIAG]   child "${child.name}" active=${active} layer=${child.layer} worldPos=(${cwp.x.toFixed(0)}, ${cwp.y.toFixed(0)}) size=(${ut?.width ?? '?'}, ${ut?.height ?? '?'})`);
        }

        // 列出 MapArea 的渲染設定
        const mapArea = canvas.getChildByName('MapArea');
        if (mapArea) {
            const sp = mapArea.getComponent(Sprite);
            const gfx = mapArea.getComponent(Graphics);
            console.log(`[DIAG] MapArea render: layer=${mapArea.layer}, spriteFrame=${!!sp?.spriteFrame}, sizeMode=${sp?.sizeMode}, graphics=${!!gfx}, color=(${sp?.color.r},${sp?.color.g},${sp?.color.b},${sp?.color.a})`);
        }
    }

    // ── HUD 頂部右側 ──────────────────────────────────────────────────────────

    private _buildHUD(parent: Node): Node {
        const hud = new Node('HUD_TopRight');
        parent.addChild(hud);

        hud.addComponent(UITransform).setContentSize(620, 48);

        const widget = hud.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignRight = true;
        widget.top = 20;
        widget.right = 8;

        const layout = hud.addComponent(Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.spacingX = 12;
        layout.resizeMode = Layout.ResizeMode.NONE;

        // 貨幣膠囊
        const coinsNode = this._createPillButton(hud, 'CoinsLabel', '0', 120, 40);

        // OC 名稱
        const ocNameNode = this._createPillButton(hud, 'OcNameLabel', '未登入', 180, 40);

        // 設定按鈕
        this._createCircleButton(hud, 'SettingsBtn', '⚙', 40, new Color(71, 85, 105, 255), C.hudText);

        // 鈴鐺按鈕
        const bellNode = this._createCircleButton(hud, 'BellButton', '🔔', 40, new Color(71, 85, 105, 255), C.hudText);

        // 紅點徽章
        const badge = new Node('BellBadge');
        bellNode.addChild(badge);
        badge.addComponent(UITransform).setContentSize(16, 16);
        badge.setPosition(12, 12, 0);
        const badgeSprite = badge.addComponent(Sprite);
        badgeSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        badgeSprite.spriteFrame = getWhiteSpriteFrame();
        badgeSprite.color = C.badgeRed;

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

        const totalH = NAV_LABELS.length * NAV_BTN_H + (NAV_LABELS.length - 1) * NAV_BTN_GAP;
        nav.addComponent(UITransform).setContentSize(NAV_BTN_W + 24, totalH);

        const widget = nav.addComponent(Widget);
        widget.isAlignLeft = true;
        widget.isAlignVerticalCenter = true;
        widget.left = 20;
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

    private _buildRightToolbar(parent: Node): Node {
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

        return toolbar;
    }

    // ── 面板容器層 ────────────────────────────────────────────────────────────

    private _buildPanelLayer(parent: Node): Node {
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

        return panelLayer;
    }

    // ── 轉場覆蓋層 ────────────────────────────────────────────────────────────

    private _buildTransitionLayer(parent: Node): Node {
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

        return layer;
    }

    // ── 最上層覆蓋 ────────────────────────────────────────────────────────────

    private _buildOverlayLayer(parent: Node): Node {
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

        return layer;
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

        const settingsButtonNode = hudNode.getChildByName('SettingsBtn');
        if (settingsButtonNode) {
            hud.settingsButtonNode = settingsButtonNode;
        }

        // 導航按鈕陣列
        const navBtnNodes: Node[] = (navNode as any)['_navBtnNodes'] ?? [];
        hud.navButtons = navBtnNodes;

        // 章節劇情按鈕
        const storyBtn: Node | null = (navNode as any)['_storyBtnNode'] ?? null;
        if (storyBtn) {
            (hud as any)['chapterStoryBtnNode'] = storyBtn;
        }

        // 綁定主場景插座
        this.mainGameCtrl.hudController = hud;

        hud.refreshRuntimeBindings();
    }

    // ── 工具方法 ──────────────────────────────────────────────────────────────

    private _createNavButton(parent: Node, name: string, labelText: string): Node {
        const node = new Node(name);
        parent.addChild(node);

        node.addComponent(UITransform).setContentSize(NAV_BTN_W, NAV_BTN_H);

        const touchTarget = new Node('TouchTarget');
        node.addChild(touchTarget);
        touchTarget.addComponent(UITransform).setContentSize(NAV_BTN_W, NAV_BTN_H);
        const touchWidget = touchTarget.addComponent(Widget);
        touchWidget.isAlignTop = true;
        touchWidget.isAlignBottom = true;
        touchWidget.isAlignLeft = true;
        touchWidget.isAlignRight = true;
        touchWidget.top = 0;
        touchWidget.bottom = 0;
        touchWidget.left = 0;
        touchWidget.right = 0;
        if (!touchTarget.getComponent(BlockInputEvents)) {
            touchTarget.addComponent(BlockInputEvents);
        }

        const sprite = touchTarget.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = getWhiteSpriteFrame();
        sprite.color = new Color(100, 116, 139, 235);

        touchTarget.addComponent(Button);

        // 按鈕圖標文字（佔位）
        const labelNode = new Node('Label');
        touchTarget.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(NAV_BTN_W, NAV_BTN_H);
        const lbl = labelNode.addComponent(Label);
        lbl.string = labelText;
        lbl.fontSize = 17;
        lbl.color = C.navText;
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;

        return node;
    }

    private _createPillButton(parent: Node, name: string, text: string, w: number, h: number): Node {
        const node = new Node(name);
        parent.addChild(node);
        this._setUILayerRecursive(node);

        node.addComponent(UITransform).setContentSize(w, h);

        const touchTarget = new Node('TouchTarget');
        node.addChild(touchTarget);
        this._setUILayerRecursive(touchTarget);
        touchTarget.addComponent(UITransform).setContentSize(w, h);
        const touchWidget = touchTarget.addComponent(Widget);
        touchWidget.isAlignTop = true;
        touchWidget.isAlignBottom = true;
        touchWidget.isAlignLeft = true;
        touchWidget.isAlignRight = true;
        touchWidget.top = 0;
        touchWidget.bottom = 0;
        touchWidget.left = 0;
        touchWidget.right = 0;
        if (!touchTarget.getComponent(BlockInputEvents)) {
            touchTarget.addComponent(BlockInputEvents);
        }

        const sprite = touchTarget.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = getWhiteSpriteFrame();
        sprite.color = new Color(71, 85, 105, 240);

        touchTarget.addComponent(Button);

        // 文字
        const labelNode = new Node('Label');
        touchTarget.addChild(labelNode);
        this._setUILayerRecursive(labelNode);
        labelNode.addComponent(UITransform).setContentSize(w, h);
        const lbl = labelNode.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = 15;
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
        this._setUILayerRecursive(node);

        node.addComponent(UITransform).setContentSize(size, size);

        const touchTarget = new Node('TouchTarget');
        node.addChild(touchTarget);
        this._setUILayerRecursive(touchTarget);
        touchTarget.addComponent(UITransform).setContentSize(size, size);
        const touchWidget = touchTarget.addComponent(Widget);
        touchWidget.isAlignTop = true;
        touchWidget.isAlignBottom = true;
        touchWidget.isAlignLeft = true;
        touchWidget.isAlignRight = true;
        touchWidget.top = 0;
        touchWidget.bottom = 0;
        touchWidget.left = 0;
        touchWidget.right = 0;
        if (!touchTarget.getComponent(BlockInputEvents)) {
            touchTarget.addComponent(BlockInputEvents);
        }

        const sprite = touchTarget.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = getWhiteSpriteFrame();
        sprite.color = bgColor;

        touchTarget.addComponent(Button);

        const labelNode = new Node('Label');
        touchTarget.addChild(labelNode);
        this._setUILayerRecursive(labelNode);
        labelNode.addComponent(UITransform).setContentSize(size, size);
        const lbl = labelNode.addComponent(Label);
        lbl.string = symbol;
        lbl.fontSize = 18;
        lbl.color = textColor;
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        lbl.verticalAlign = Label.VerticalAlign.CENTER;

        return node;
    }

    private _createTextButton(
        parent: Node,
        name: string,
        text: string,
        width: number,
        height: number,
        fontSize: number,
        textColor: Color,
    ): Node {
        const node = new Node(name);
        parent.addChild(node);
        this._setUILayerRecursive(node);
        node.addComponent(UITransform).setContentSize(width, height);
        node.addComponent(Button);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.color = textColor;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return node;
    }

    // ── 地圖區域 ──────────────────────────────────────────────────────────────

    private _buildMapArea(parent: Node): Node {
        const mapNode = new Node('MapArea');
        parent.addChild(mapNode);

        const ut = mapNode.addComponent(UITransform);
        ut.setContentSize(DESIGN_W, DESIGN_H);

        // 全螢幕
        const w = mapNode.addComponent(Widget);
        w.isAlignTop = true;
        w.isAlignBottom = true;
        w.isAlignLeft = true;
        w.isAlignRight = true;
        w.top = 0;
        w.bottom = 0;
        w.left = 0;
        w.right = 0;

        // 地圖底色（用 Graphics 畫矩形，迴避 Sprite/SpriteFrame 問題）
        const g = mapNode.addComponent(Graphics);
        g.fillColor = new Color(30, 35, 50, 255);
        g.rect(-DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H);
        g.fill();

        // 診斷文字（確認渲染是否正常）
        const diagLabel = new Node('DiagLabel');
        mapNode.addChild(diagLabel);
        diagLabel.addComponent(UITransform).setContentSize(400, 60);
        const dl = diagLabel.addComponent(Label);
        dl.string = '=== MAP AREA OK ===';
        dl.fontSize = 32;
        dl.color = new Color(255, 255, 0, 255);
        dl.horizontalAlign = Label.HorizontalAlign.CENTER;
        dl.verticalAlign = Label.VerticalAlign.CENTER;

        // 加入 MapController 元件，並把自己當作 mapRoot
        const mc = mapNode.addComponent(MapController);
        mc.mapRoot = mapNode;

        return mapNode;
    }

    // ── 為面板加元件並綁定 MainGameController 插座 ─────────────────────────────

    private _addComponentsAndBind(gameRoot: Node): void {
        const ctrl = this.mainGameCtrl;

        // 地圖（僅在 Inspector 未綁定時才動態綁定）
        if (!ctrl.mapController) {
            const mapArea = gameRoot.getChildByName('MapArea');
            if (mapArea) {
                ctrl.mapController = mapArea.getComponent(MapController);
                if (!ctrl.mapController) console.error('[MapSceneBuilder] MapController 綁定失敗');
            }
        }

        // 面板層內的元件（每個皆先檢查 Inspector 是否已綁定）
        const panelLayer = gameRoot.getChildByName('PanelLayer');
        if (panelLayer) {
            if (!ctrl.inventoryPanel) {
                const _inv = this._ensureComp(panelLayer, 'InventoryPanelNode', InventoryPanel);
                if (_inv) { ctrl.inventoryPanel = _inv; } else { console.error('[MapSceneBuilder] InventoryPanel 綁定失敗'); }
            }

            // InventoryPanel 需要 gridContainer 子節點（僅在尚未綁定時動態建立）
            if (ctrl.inventoryPanel && !ctrl.inventoryPanel.gridContainer) {
                const invNode = panelLayer.getChildByName('InventoryPanelNode');
                if (invNode) {
                    let grid = invNode.getChildByName('GridContainer');
                    if (!grid) {
                        grid = new Node('GridContainer');
                        invNode.addChild(grid);
                        this._setUILayerRecursive(grid);
                        grid.addComponent(UITransform).setContentSize(420, 400);
                        const gridLayout = grid.addComponent(Layout);
                        gridLayout.type = Layout.Type.GRID;
                        gridLayout.spacingX = 8;
                        gridLayout.spacingY = 8;
                        gridLayout.startAxis = Layout.AxisDirection.HORIZONTAL;
                        gridLayout.constraintNum = 5;
                    }
                    ctrl.inventoryPanel.gridContainer = grid;
                }
            }

            if (!ctrl.itemDetailModal) {
                const _detail = this._ensureComp(panelLayer, 'ItemDetailModalNode', ItemDetailModal);
                if (_detail) { ctrl.itemDetailModal = _detail; } else { console.error('[MapSceneBuilder] ItemDetailModal 綁定失敗'); }
            }

            if (!ctrl.npcModal) {
                const _npc = this._ensureComp(panelLayer, 'NPCModalNode', NPCModal);
                if (_npc) { ctrl.npcModal = _npc; } else { console.error('[MapSceneBuilder] NPCModal 綁定失敗'); }
            }

            if (!ctrl.whiteCrowCard) {
                const _wc = this._ensureComp(panelLayer, 'WhiteCrowCardNode', WhiteCrowCard);
                if (_wc) { ctrl.whiteCrowCard = _wc; } else { console.error('[MapSceneBuilder] WhiteCrowCard 綁定失敗'); }
            }

            if (!ctrl.notificationPanel) {
                const _notif = this._ensureComp(panelLayer, 'NotificationPanelNode', NotificationPanel);
                if (_notif) { ctrl.notificationPanel = _notif; } else { console.error('[MapSceneBuilder] NotificationPanel 綁定失敗'); }
            }

            if (!ctrl.settingsPanel) {
                const _settings = this._ensureComp(panelLayer, 'SettingsPanelNode', SettingsPanel);
                if (_settings) { ctrl.settingsPanel = _settings; } else { console.error('[MapSceneBuilder] SettingsPanel 綁定失敗'); }
            }

            if (!ctrl.questPanel) {
                const _quest = this._ensureComp(panelLayer, 'QuestPanelNode', QuestPanel);
                if (_quest) { ctrl.questPanel = _quest; } else { console.error('[MapSceneBuilder] QuestPanel 綁定失敗'); }
            }

            if (!ctrl.collectionPanel) {
                const _collection = this._ensureComp(panelLayer, 'CollectionPanelNode', CollectionPanel);
                if (_collection) { ctrl.collectionPanel = _collection; } else { console.error('[MapSceneBuilder] CollectionPanel 綁定失敗'); }
            }

            const inventoryNode = panelLayer.getChildByName('InventoryPanelNode');
            if (inventoryNode && ctrl.inventoryPanel) {
                this._configureInventoryPanelNode(inventoryNode, ctrl.inventoryPanel);
            }

            const itemDetailNode = panelLayer.getChildByName('ItemDetailModalNode');
            if (itemDetailNode && ctrl.itemDetailModal) {
                this._configureItemDetailModalNode(itemDetailNode, ctrl.itemDetailModal);
            }

            const npcNode = panelLayer.getChildByName('NPCModalNode');
            if (npcNode && ctrl.npcModal) {
                this._configureNpcModalNode(npcNode, ctrl.npcModal);
            }

            const whiteCrowNode = panelLayer.getChildByName('WhiteCrowCardNode');
            if (whiteCrowNode && ctrl.whiteCrowCard) {
                this._configureWhiteCrowCardNode(whiteCrowNode, ctrl.whiteCrowCard);
            }

            const notificationNode = panelLayer.getChildByName('NotificationPanelNode');
            if (notificationNode && ctrl.notificationPanel) {
                this._configureNotificationPanelNode(notificationNode, ctrl.notificationPanel);
            }

            const settingsNode = panelLayer.getChildByName('SettingsPanelNode');
            if (settingsNode && ctrl.settingsPanel) {
                this._configureSettingsPanelNode(settingsNode, ctrl.settingsPanel);
            }

            const questNode = panelLayer.getChildByName('QuestPanelNode');
            if (questNode && ctrl.questPanel) {
                this._configureQuestPanelNode(questNode, ctrl.questPanel);
            }

            const collectionNode = panelLayer.getChildByName('CollectionPanelNode');
            if (collectionNode && ctrl.collectionPanel) {
                this._configureCollectionPanelNode(collectionNode, ctrl.collectionPanel);
            }
        }

        // 轉場層內的元件（僅在 Inspector 未綁定時才動態綁定）
        const transLayer = gameRoot.getChildByName('TransitionLayer');
        if (transLayer) {
            if (!ctrl.breathingSceneCtrl) {
                const _breathing = this._ensureComp(transLayer, 'BreathingSceneNode', BreathingSceneController);
                if (_breathing) { ctrl.breathingSceneCtrl = _breathing; } else { console.error('[MapSceneBuilder] BreathingSceneController 綁定失敗'); }
            }

            if (!ctrl.chapterOpeningCtrl) {
                const _opening = this._ensureComp(transLayer, 'ChapterOpeningNode', ChapterOpeningController);
                if (_opening) { ctrl.chapterOpeningCtrl = _opening; } else { console.error('[MapSceneBuilder] ChapterOpeningController 綁定失敗'); }
            }

            if (!ctrl.chapterStoryModal) {
                const _story = this._ensureComp(transLayer, 'ChapterStoryModalNode', ChapterStoryModal);
                if (_story) { ctrl.chapterStoryModal = _story; } else { console.error('[MapSceneBuilder] ChapterStoryModal 綁定失敗'); }
            }

            if (!ctrl.diceOverlay) {
                const _dice = this._ensureComp(transLayer, 'DiceResultOverlayNode', DiceResultOverlay);
                if (_dice) { ctrl.diceOverlay = _dice; } else { console.error('[MapSceneBuilder] DiceResultOverlay 綁定失敗'); }
            }
        }

        // 覆蓋層內的元件（僅在 Inspector 未綁定時才動態綁定）
        const overlayLayer = gameRoot.getChildByName('OverlayLayer');
        if (overlayLayer) {
            if (!ctrl.relicPoemModal) {
                const _relic = this._ensureComp(overlayLayer, 'RelicPoemModalNode', RelicPoemModal);
                if (_relic) { ctrl.relicPoemModal = _relic; } else { console.error('[MapSceneBuilder] RelicPoemModal 綁定失敗'); }
            }
        }

        // 還需要建立的獨立面板節點（不在已有層中的）
        const extraPanels: Array<[string, new () => Component]> = [
            ['LandmarkStoryModalNode', LandmarkStoryModal],
            ['ApostatePanelNode', ApostatePanel],
            ['LiquidatorPanelNode', LiquidatorPanel],
            ['KidnapPopupNode', KidnapPopup],
            ['BalanceSettlementNode', BalanceSettlementModal],
            ['LeaderboardPanelNode', LeaderboardPanel],
            ['LeaderTyrannyPanelNode', LeaderTyrannyPanel],
        ];

        // 面板層存在時，把額外面板也加在裡面
        const targetLayer = panelLayer ?? gameRoot;
        for (const [nodeName, CompClass] of extraPanels) {
            let node = targetLayer.getChildByName(nodeName);
            if (!node) {
                node = new Node(nodeName);
                targetLayer.addChild(node);
                this._setUILayerRecursive(node);
                node.addComponent(UITransform).setContentSize(450, 480);
                const w = node.addComponent(Widget);
                w.isAlignVerticalCenter = true;
                w.isAlignHorizontalCenter = true;
                w.verticalCenter = 0;
                w.horizontalCenter = 0;
                node.active = false;
            }
            let comp = node.getComponent(CompClass as any);
            if (!comp) comp = node.addComponent(CompClass as any);
            // 綁定到 MainGameController 對應插座
            this._bindExtraPanel(ctrl, nodeName, comp);
        }

        console.log('[MapSceneBuilder] 元件綁定完成');
    }

    private _ensureComp<T extends Component>(parent: Node, childName: string, CompClass: new () => T): T | null {
        const node = parent.getChildByName(childName);
        if (!node) return null;
        let comp = node.getComponent(CompClass);
        if (!comp) comp = node.addComponent(CompClass);
        return comp;
    }

    private _bindExtraPanel(ctrl: MainGameController, nodeName: string, comp: Component): void {
        switch (nodeName) {
            case 'LandmarkStoryModalNode': ctrl.landmarkStoryModal = comp as LandmarkStoryModal; break;
            case 'ApostatePanelNode':      ctrl.apostatePanel = comp as ApostatePanel; break;
            case 'LiquidatorPanelNode':    ctrl.liquidatorPanel = comp as LiquidatorPanel; break;
            case 'KidnapPopupNode':        ctrl.kidnapPopup = comp as KidnapPopup; break;
            case 'BalanceSettlementNode':   ctrl.balanceSettlementModal = comp as BalanceSettlementModal; break;
            case 'LeaderboardPanelNode':   ctrl.leaderboardPanel = comp as LeaderboardPanel; break;
            case 'LeaderTyrannyPanelNode': ctrl.leaderTyrannyPanel = comp as LeaderTyrannyPanel; break;
        }
    }

    private _ensurePanelShell(node: Node, title: string): PanelShellRefs {
        let backdrop = node.getChildByName('Backdrop');
        if (!backdrop) {
            backdrop = new Node('Backdrop');
            node.addChild(backdrop);
            this._setUILayerRecursive(backdrop);
            backdrop.addComponent(UITransform).setContentSize(DESIGN_W, DESIGN_H);
            const sprite = backdrop.addComponent(Sprite);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.spriteFrame = getWhiteSpriteFrame();
            sprite.color = new Color(0, 0, 0, 150);
            backdrop.addComponent(Button);
        }

        let bgNode = node.getChildByName('PanelBG');
        if (!bgNode) {
            bgNode = new Node('PanelBG');
            node.addChild(bgNode);
            this._setUILayerRecursive(bgNode);
            bgNode.addComponent(UITransform).setContentSize(450, 480);
            bgNode.addComponent(BlockInputEvents);
        }
        if (!bgNode.getComponent(BlockInputEvents)) {
            bgNode.addComponent(BlockInputEvents);
        }

        let bgSprite = bgNode.getComponent(Sprite);
        if (!bgSprite) {
            bgSprite = bgNode.addComponent(Sprite);
        }
        bgSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        bgSprite.spriteFrame = getWhiteSpriteFrame();
        bgSprite.color = new Color(19, 24, 39, 245);

        const bgTransform = bgNode.getComponent(UITransform);
        bgTransform?.setContentSize(520, 560);

        let headerBar = bgNode.getChildByName('HeaderBar');
        if (!headerBar) {
            headerBar = new Node('HeaderBar');
            bgNode.addChild(headerBar);
            this._setUILayerRecursive(headerBar);
            headerBar.addComponent(UITransform).setContentSize(520, 56);
            const headerSprite = headerBar.addComponent(Sprite);
            headerSprite.sizeMode = Sprite.SizeMode.CUSTOM;
            headerSprite.spriteFrame = getWhiteSpriteFrame();
        }
        headerBar.setPosition(0, 252, 0);
        const headerBarSprite = headerBar.getComponent(Sprite);
        if (headerBarSprite) {
            headerBarSprite.color = new Color(74, 85, 104, 255);
        }

        let bodyFrame = bgNode.getChildByName('BodyFrame');
        if (!bodyFrame) {
            bodyFrame = new Node('BodyFrame');
            bgNode.addChild(bodyFrame);
            this._setUILayerRecursive(bodyFrame);
            bodyFrame.addComponent(UITransform).setContentSize(456, 390);
            const bodySprite = bodyFrame.addComponent(Sprite);
            bodySprite.sizeMode = Sprite.SizeMode.CUSTOM;
            bodySprite.spriteFrame = getWhiteSpriteFrame();
        }
        bodyFrame.setPosition(0, -18, 0);
        bodyFrame.setSiblingIndex(1);
        const bodyFrameSprite = bodyFrame.getComponent(Sprite);
        if (bodyFrameSprite) {
            bodyFrameSprite.color = new Color(255, 255, 255, 28);
        }

        let titleNode = bgNode.getChildByName('TitleLabel');
        if (!titleNode) {
            titleNode = new Node('TitleLabel');
            bgNode.addChild(titleNode);
            this._setUILayerRecursive(titleNode);
            titleNode.addComponent(UITransform).setContentSize(280, 36);
        }
        titleNode.setPosition(0, 252, 0);
        let titleLabel = titleNode.getComponent(Label);
        if (!titleLabel) {
            titleLabel = titleNode.addComponent(Label);
        }
        titleLabel.string = title;
        titleLabel.fontSize = 20;
        titleLabel.color = C.hudText;
        titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = Label.VerticalAlign.CENTER;

        let closeButton = bgNode.getChildByName('CloseButton');
        if (!closeButton) {
            closeButton = this._createTextButton(bgNode, 'CloseButton', '✕', 40, 40, 26, new Color(255, 255, 255, 255));
        }
        closeButton.setPosition(218, 252, 0);
        closeButton.setSiblingIndex(bgNode.children.length - 1);
        const closeTransform = closeButton.getComponent(UITransform);
        closeTransform?.setContentSize(54, 54);
        const closeLabel = closeButton.getComponent(Label) ?? closeButton.getComponentInChildren(Label);
        if (closeLabel) {
            closeLabel.string = 'X';
            closeLabel.fontSize = 34;
            closeLabel.color = new Color(248, 113, 113, 255);
        }

        let closeHintNode = bgNode.getChildByName('CloseHintLabel');
        if (!closeHintNode) {
            closeHintNode = new Node('CloseHintLabel');
            bgNode.addChild(closeHintNode);
            this._setUILayerRecursive(closeHintNode);
            closeHintNode.addComponent(UITransform).setContentSize(320, 24);
        }
        closeHintNode.setPosition(0, -214, 0);
        let closeHintLabel = closeHintNode.getComponent(Label);
        if (!closeHintLabel) {
            closeHintLabel = closeHintNode.addComponent(Label);
        }
        closeHintLabel.string = '點空白區域也可關閉';
        closeHintLabel.fontSize = 13;
        closeHintLabel.color = new Color(226, 232, 240, 220);
        closeHintLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        closeHintLabel.verticalAlign = Label.VerticalAlign.CENTER;

        let bodyRoot = bgNode.getChildByName('BodyRoot');
        if (!bodyRoot) {
            bodyRoot = new Node('BodyRoot');
            bgNode.addChild(bodyRoot);
            this._setUILayerRecursive(bodyRoot);
            bodyRoot.addComponent(UITransform).setContentSize(430, 360);
        }
        bodyRoot.setPosition(0, -20, 0);

        if (!backdrop.getComponent(BlockInputEvents)) {
            backdrop.addComponent(BlockInputEvents);
        }

        return {
            backdrop,
            bgNode,
            bgSprite,
            titleLabel,
            closeButton,
            bodyRoot,
        };
    }

    private _ensureContentList(parent: Node, name: string, width: number, height: number): Node {
        let node = parent.getChildByName(name);
        if (!node) {
            node = new Node(name);
            parent.addChild(node);
            this._setUILayerRecursive(node);
            node.addComponent(UITransform).setContentSize(width, height);
            const layout = node.addComponent(Layout);
            layout.type = Layout.Type.VERTICAL;
            layout.spacingY = 8;
            layout.resizeMode = Layout.ResizeMode.CONTAINER;
        }
        node.setPosition(0, -10, 0);
        return node;
    }

    private _ensureStaticLabel(parent: Node, name: string, text: string, y: number, fontSize = 14): Label {
        let labelNode = parent.getChildByName(name);
        if (!labelNode) {
            labelNode = new Node(name);
            parent.addChild(labelNode);
            this._setUILayerRecursive(labelNode);
            labelNode.addComponent(UITransform).setContentSize(360, 28);
            labelNode.setPosition(0, y, 0);
        }
        let label = labelNode.getComponent(Label);
        if (!label) {
            label = labelNode.addComponent(Label);
        }
        label.string = text;
        label.fontSize = fontSize;
        label.color = C.hudText;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
    }

    private _getTouchTarget(node: Node): Node {
        return node.getChildByName('TouchTarget') ?? node;
    }

    private _bindHideOnTap(buttonNode: Node, onClose: () => void): void {
        const touchTarget = this._getTouchTarget(buttonNode);
        const button = touchTarget.getComponent(Button);
        buttonNode.targetOff(this);
        touchTarget.targetOff(this);
        const wrappedClose = () => {
            onClose();
        };
        if (button) {
            button.node.on(Button.EventType.CLICK, wrappedClose, this);
        } else {
            touchTarget.on(Node.EventType.TOUCH_END, wrappedClose, this);
        }
    }

    private _configureWhiteCrowCardNode(node: Node, card: WhiteCrowCard): void {
        const shell = this._ensurePanelShell(node, '白鴉檔案');
        card.bgSprite = shell.bgSprite;
        card.titleLabel = shell.titleLabel;
        card.closeButtonNode = shell.closeButton;
        card.codeLabel = this._ensureStaticLabel(shell.bodyRoot, 'CodeLabel', '公告 / 日誌 placeholder', 120, 14);
        card.coinsLabel = this._ensureStaticLabel(shell.bodyRoot, 'CoinsLabel', '金幣：0', 70, 13);
        card.hpLabel = this._ensureStaticLabel(shell.bodyRoot, 'HpLabel', 'HP：0 / 0', 40, 13);
        card.relicHintLabel = this._ensureStaticLabel(shell.bodyRoot, 'RelicHintLabel', '白鴉卡片內容待補齊', -120, 12);
        this._bindHideOnTap(shell.closeButton, () => {
            node.active = false;
        });
        this._bindHideOnTap(shell.backdrop, () => {
            node.active = false;
        });
    }

    private _configureQuestPanelNode(node: Node, panel: QuestPanel): void {
        const shell = this._ensurePanelShell(node, '任務面板');
        panel.bgSprite = shell.bgSprite;
        panel.titleLabel = shell.titleLabel;
        panel.closeButton = shell.closeButton;
        panel.contentContainer = this._ensureContentList(shell.bodyRoot, 'QuestContent', 380, 250);
        panel.emptyLabel = this._ensureStaticLabel(shell.bodyRoot, 'QuestEmptyLabel', '目前沒有可用任務', 0, 14);
        this._bindHideOnTap(shell.closeButton, () => panel.hide());
        this._bindHideOnTap(shell.backdrop, () => panel.hide());
    }

    private _configureCollectionPanelNode(node: Node, panel: CollectionPanel): void {
        const shell = this._ensurePanelShell(node, '圖鑑面板');
        panel.bgSprite = shell.bgSprite;
        panel.titleLabel = shell.titleLabel;
        panel.closeButton = shell.closeButton;
        panel.countLabel = this._ensureStaticLabel(shell.bodyRoot, 'CountLabel', '0 / 0', 130, 12);
        panel.contentContainer = this._ensureContentList(shell.bodyRoot, 'CollectionContent', 380, 240);
        panel.emptyLabel = this._ensureStaticLabel(shell.bodyRoot, 'CollectionEmptyLabel', '尚無資料', 0, 14);
        this._bindHideOnTap(shell.closeButton, () => panel.hide());
        this._bindHideOnTap(shell.backdrop, () => panel.hide());
    }

    private _configureSettingsPanelNode(node: Node, panel: SettingsPanel): void {
        const shell = this._ensurePanelShell(node, '設定面板');
        panel.bgSprite = shell.bgSprite;
        panel.titleLabel = shell.titleLabel;
        panel.closeButton = shell.closeButton;
        panel.bgmValueLabel = this._ensureStaticLabel(shell.bodyRoot, 'BgmValueLabel', 'BGM：100%', 95, 14);
        panel.sfxValueLabel = this._ensureStaticLabel(shell.bodyRoot, 'SfxValueLabel', 'SFX：100%', 60, 14);
        this._ensureStaticLabel(shell.bodyRoot, 'LanguageTitleLabel', '語言切換 V4', 5, 15);

        let languageValueNode = shell.bodyRoot.getChildByName('LanguageValueLabel');
        if (!languageValueNode) {
            languageValueNode = new Node('LanguageValueLabel');
            shell.bodyRoot.addChild(languageValueNode);
            this._setUILayerRecursive(languageValueNode);
            languageValueNode.addComponent(UITransform).setContentSize(320, 38);
        }
        languageValueNode.setPosition(0, -28, 0);
        let languageValueSprite = languageValueNode.getComponent(Sprite);
        if (!languageValueSprite) {
            languageValueSprite = languageValueNode.addComponent(Sprite);
        }
        languageValueSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        languageValueSprite.spriteFrame = getWhiteSpriteFrame();
        languageValueSprite.color = new Color(51, 65, 85, 220);
        const languageValueLabel = languageValueNode.getComponent(Label);
        if (languageValueLabel) {
            languageValueLabel.string = '';
        }
        panel.languageValueLabel = null;

        let traditionalButton = shell.bodyRoot.getChildByName('TraditionalChineseButton');
        if (!traditionalButton) {
            traditionalButton = this._createTextButton(shell.bodyRoot, 'TraditionalChineseButton', '繁體中文', 220, 42, 20, new Color(248, 250, 252, 255));
        }
        traditionalButton.setPosition(0, -82, 0);
        panel.traditionalChineseButton = traditionalButton;

        let simplifiedButton = shell.bodyRoot.getChildByName('SimplifiedChineseButton');
        if (!simplifiedButton) {
            simplifiedButton = this._createTextButton(shell.bodyRoot, 'SimplifiedChineseButton', '简体中文', 220, 42, 20, new Color(248, 250, 252, 255));
        }
        simplifiedButton.setPosition(0, -136, 0);
        panel.simplifiedChineseButton = simplifiedButton;

        this._ensureStaticLabel(shell.bodyRoot, 'SettingsHintLabel', '音量 slider 與進階設定 UI 待補齊', -190, 12);
        panel.refreshRuntimeBindings();
        this._bindHideOnTap(shell.backdrop, () => panel.hide());
    }

    private _configureNotificationPanelNode(node: Node, panel: NotificationPanel): void {
        const shell = this._ensurePanelShell(node, '通知中心');
        panel.panelRoot = shell.bgNode;
        panel.bgSprite = shell.bgSprite;
        panel.titleLabel = shell.titleLabel;
        panel.closeButton = shell.closeButton;
        panel.contentContainer = this._ensureContentList(shell.bodyRoot, 'NotificationContent', 380, 240);
        panel.emptyLabel = this._ensureStaticLabel(shell.bodyRoot, 'NotificationEmptyLabel', '目前沒有新通知', 0, 14);
        this._bindHideOnTap(shell.closeButton, () => panel.hide());
        this._bindHideOnTap(shell.backdrop, () => panel.hide());
    }

    private _configureInventoryPanelNode(node: Node, panel: InventoryPanel): void {
        const shell = this._ensurePanelShell(node, '背包');
        const grid = node.getChildByName('GridContainer');
        if (grid) {
            shell.bodyRoot.addChild(grid);
            grid.setPosition(0, -10, 0);
            panel.gridContainer = grid;
        }
        this._bindHideOnTap(shell.closeButton, () => {
            node.active = false;
        });
        this._bindHideOnTap(shell.backdrop, () => {
            node.active = false;
        });
    }

    private _configureNpcModalNode(node: Node, panel: NPCModal): void {
        const shell = this._ensurePanelShell(node, 'NPC 互動');
        panel.closeButtonNode = shell.closeButton;
        panel.backdropNode = shell.backdrop;
        panel.npcNameLabel = shell.titleLabel;
        panel.dialogueLabel = this._ensureStaticLabel(shell.bodyRoot, 'DialogueLabel', '請選擇互動項目', 110, 13);
        panel.shopContainer = this._ensureContentList(shell.bodyRoot, 'ShopContainer', 380, 180);
        let actionButton = shell.bodyRoot.getChildByName('ActionButton');
        if (!actionButton) {
            actionButton = this._createPillButton(shell.bodyRoot, 'ActionButton', '互動', 180, 36);
            actionButton.setPosition(0, -125, 0);
        }
        panel.actionButtonNode = actionButton;
        const actionLabel = actionButton.getChildByName('Label');
        if (actionLabel) {
            panel.actionButtonLabel = actionLabel.getComponent(Label);
        }
        this._bindHideOnTap(shell.closeButton, () => {
            node.active = false;
        });
        this._bindHideOnTap(shell.backdrop, () => {
            node.active = false;
        });
    }

    private _configureItemDetailModalNode(node: Node, modal: ItemDetailModal): void {
        const shell = this._ensurePanelShell(node, '道具詳情');
        modal.backdropNode = shell.backdrop;
        modal.closeButtonNode = shell.closeButton;
        modal.nameLabel = this._ensureStaticLabel(shell.bodyRoot, 'NameLabel', '道具名稱', 110, 16);
        modal.typeLabel = this._ensureStaticLabel(shell.bodyRoot, 'TypeLabel', '類型', 75, 12);
        modal.descLabel = this._ensureStaticLabel(shell.bodyRoot, 'DescLabel', '描述內容', 25, 12);
        modal.quantityLabel = this._ensureStaticLabel(shell.bodyRoot, 'QuantityLabel', 'x0', -20, 12);
        let useButton = shell.bodyRoot.getChildByName('UseButton');
        if (!useButton) {
            useButton = this._createPillButton(shell.bodyRoot, 'UseButton', '使用', 140, 36);
            useButton.setPosition(0, -110, 0);
        }
        modal.useButtonNode = useButton;
        this._bindHideOnTap(shell.closeButton, () => {
            node.active = false;
        });
        this._bindHideOnTap(shell.backdrop, () => {
            node.active = false;
        });
    }
}
