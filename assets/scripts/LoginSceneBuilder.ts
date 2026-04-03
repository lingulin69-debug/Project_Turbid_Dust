import {
    _decorator,
    Component,
    Node,
    UITransform,
    Widget,
    Sprite,
    Label,
    EditBox,
    Button,
    Color,
    Size,
    UIOpacity,
    Layout,
    BlockInputEvents,
    Material,
} from 'cc';
import { LoginController } from './LoginController';

const { ccclass, property } = _decorator;

// ── 常數 ──────────────────────────────────────────────────────────────────────

/** 設計解析度 */
const DESIGN_W = 1280;
const DESIGN_H = 720;

/** 面板尺寸 */
const LOGIN_PANEL_W = 380;
const LOGIN_PANEL_H = 320;
const RESET_PANEL_W = 380;
const RESET_PANEL_H = 340;

/** 色彩（初始為中性色調，登入後由 faction 覆蓋） */
const BG_COLOR      = new Color(30, 20, 45);       // 深色底
const PANEL_BG      = new Color(40, 30, 55, 230);  // 半透明面板
const TEXT_COLOR    = new Color(228, 213, 245);     // 淺紫白
const ERROR_COLOR   = new Color(239, 68, 68);       // #ef4444
const BTN_COLOR     = new Color(155, 89, 182);      // #9b59b6
const BTN_TEXT      = new Color(255, 255, 255);
const INPUT_BG      = new Color(25, 15, 40, 200);
const PLACEHOLDER   = new Color(150, 130, 170, 150);

// ── 主體 ──────────────────────────────────────────────────────────────────────

/**
 * LoginSceneBuilder
 * 在 onLoad 時程式化建構 LoginScene 的完整 UI 節點樹，
 * 並自動綁定 LoginController 的所有 @property 插座。
 *
 * 使用方式：
 *  1. 在 LoginScene 場景中新增一個空節點（名稱隨意，例如 "SceneBuilder"）
 *  2. 掛載本腳本
 *  3. 將場景根節點的 LoginController 拖入 `loginController` 插座
 *  4. 執行即自動生成 UI
 *
 * ⚠️ 此腳本僅用於快速建構場景結構。
 *    美術資源到位後，應以編輯器手動佈局取代，屆時可移除本腳本。
 */
@ccclass('LoginSceneBuilder')
export class LoginSceneBuilder extends Component {

    @property(LoginController)
    loginController: LoginController = null;

    // ── Shader 材質預留接口（§3 規範）────────────────────────────────────────
    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    onLoad(): void {
        if (!this.loginController) {
            console.error('[LoginSceneBuilder] loginController 未綁定，無法建構場景');
            return;
        }

        const canvas = this.node;
        this._ensureUITransform(canvas, DESIGN_W, DESIGN_H);

        // 1. 背景
        this._createBackground(canvas);

        // 2. Logo
        this._createLogo(canvas);

        // 3. 登入面板
        const loginPanel = this._createLoginPanel(canvas);

        // 4. 改密面板
        const resetPanel = this._createResetPasswordPanel(canvas);
        resetPanel.active = false;

        // 5. 載入遮罩
        const loadingOverlay = this._createLoadingOverlay(canvas);
        loadingOverlay.active = false;

        // 6. 綁定插座
        this.loginController.loginPanel = loginPanel;
        this.loginController.resetPasswordPanel = resetPanel;
        this.loginController.loadingOverlay = loadingOverlay;

        console.log('[LoginSceneBuilder] 場景建構完成');
    }

    // ── 背景 ──────────────────────────────────────────────────────────────────

    private _createBackground(parent: Node): Node {
        const bg = new Node('Background');
        parent.addChild(bg);

        const ut = bg.addComponent(UITransform);
        ut.setContentSize(DESIGN_W, DESIGN_H);

        const sprite = bg.addComponent(Sprite);
        sprite.color = BG_COLOR;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        const widget = bg.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;

        return bg;
    }

    // ── Logo ──────────────────────────────────────────────────────────────────

    private _createLogo(parent: Node): Node {
        const logo = new Node('Logo');
        parent.addChild(logo);

        const ut = logo.addComponent(UITransform);
        ut.setContentSize(260, 80);

        const sprite = logo.addComponent(Sprite);
        sprite.color = new Color(200, 190, 220, 180);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        // 佔位文字
        const label = new Node('LogoText');
        logo.addChild(label);
        const lbl = label.addComponent(Label);
        lbl.string = '白鴉之繭';
        lbl.fontSize = 32;
        lbl.color = TEXT_COLOR;
        label.addComponent(UITransform).setContentSize(260, 80);

        const widget = logo.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignHorizontalCenter = true;
        widget.top = 100;
        widget.horizontalCenter = 0;

        return logo;
    }

    // ── 登入面板 ──────────────────────────────────────────────────────────────

    private _createLoginPanel(parent: Node): Node {
        const panel = new Node('LoginPanel');
        parent.addChild(panel);

        const ut = panel.addComponent(UITransform);
        ut.setContentSize(LOGIN_PANEL_W, LOGIN_PANEL_H);

        const sprite = panel.addComponent(Sprite);
        sprite.color = PANEL_BG;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        const widget = panel.addComponent(Widget);
        widget.isAlignVerticalCenter = true;
        widget.isAlignHorizontalCenter = true;
        widget.verticalCenter = 60;
        widget.horizontalCenter = 0;

        // 佈局容器
        const layout = panel.addComponent(Layout);
        layout.type = Layout.Type.VERTICAL;
        layout.spacingY = 16;
        layout.paddingTop = 24;
        layout.paddingBottom = 24;
        layout.paddingLeft = 32;
        layout.paddingRight = 32;
        layout.resizeMode = Layout.ResizeMode.NONE;

        // 標題
        this._createLabel(panel, 'TitleLabel', '觀測者終端 — 登入', 20, TEXT_COLOR, 316, 32);

        // 錯誤 Label（在輸入框上方）
        const errorLabel = this._createLabel(panel, 'ErrorLabel', '', 13, ERROR_COLOR, 316, 20);
        this.loginController.loginErrorLabel = errorLabel.getComponent(Label)!;

        // OC 名稱輸入框
        const ocNameNode = this._createEditBox(panel, 'OcNameInput', 'OC 名稱', false);
        this.loginController.ocNameInput = ocNameNode.getComponent(EditBox)!;

        // 密碼輸入框
        const passwordNode = this._createEditBox(panel, 'PasswordInput', '密碼', true);
        this.loginController.passwordInput = passwordNode.getComponent(EditBox)!;

        // 登入按鈕
        const loginBtn = this._createButton(panel, 'LoginBtn', '進入觀測', BTN_COLOR, BTN_TEXT);
        this.loginController.loginBtn = loginBtn.getComponent(Button)!;

        return panel;
    }

    // ── 改密面板 ──────────────────────────────────────────────────────────────

    private _createResetPasswordPanel(parent: Node): Node {
        const panel = new Node('ResetPasswordPanel');
        parent.addChild(panel);

        const ut = panel.addComponent(UITransform);
        ut.setContentSize(RESET_PANEL_W, RESET_PANEL_H);

        const sprite = panel.addComponent(Sprite);
        sprite.color = PANEL_BG;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        const widget = panel.addComponent(Widget);
        widget.isAlignVerticalCenter = true;
        widget.isAlignHorizontalCenter = true;
        widget.verticalCenter = 0;
        widget.horizontalCenter = 0;

        const layout = panel.addComponent(Layout);
        layout.type = Layout.Type.VERTICAL;
        layout.spacingY = 16;
        layout.paddingTop = 24;
        layout.paddingBottom = 24;
        layout.paddingLeft = 32;
        layout.paddingRight = 32;
        layout.resizeMode = Layout.ResizeMode.NONE;

        // 標題
        this._createLabel(panel, 'ResetTitle', '初訪者 — 請設定新密碼', 18, TEXT_COLOR, 316, 28);

        // 錯誤 Label
        const resetErrorLabel = this._createLabel(panel, 'ResetErrorLabel', '', 13, ERROR_COLOR, 316, 20);
        this.loginController.resetErrorLabel = resetErrorLabel.getComponent(Label)!;

        // 新密碼
        const newPwNode = this._createEditBox(panel, 'NewPasswordInput', '新密碼（至少 4 位）', true);
        this.loginController.newPasswordInput = newPwNode.getComponent(EditBox)!;

        // 確認密碼
        const confirmPwNode = this._createEditBox(panel, 'ConfirmPasswordInput', '再次輸入新密碼', true);
        this.loginController.confirmPasswordInput = confirmPwNode.getComponent(EditBox)!;

        // 確認按鈕
        const confirmBtn = this._createButton(panel, 'ConfirmResetBtn', '確認設定', BTN_COLOR, BTN_TEXT);
        this.loginController.confirmResetBtn = confirmBtn.getComponent(Button)!;

        return panel;
    }

    // ── 載入遮罩 ──────────────────────────────────────────────────────────────

    private _createLoadingOverlay(parent: Node): Node {
        const overlay = new Node('LoadingOverlay');
        parent.addChild(overlay);

        const ut = overlay.addComponent(UITransform);
        ut.setContentSize(DESIGN_W, DESIGN_H);

        const sprite = overlay.addComponent(Sprite);
        sprite.color = new Color(0, 0, 0, 180);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        // 擋住底下的觸控事件
        overlay.addComponent(BlockInputEvents);

        const widget = overlay.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;

        // 載入中文字
        const loadingLabel = new Node('LoadingLabel');
        overlay.addChild(loadingLabel);
        const lbl = loadingLabel.addComponent(Label);
        lbl.string = '進入觀測中…';
        lbl.fontSize = 18;
        lbl.color = TEXT_COLOR;
        loadingLabel.addComponent(UITransform).setContentSize(200, 40);

        return overlay;
    }

    // ── 工具方法 ──────────────────────────────────────────────────────────────

    private _ensureUITransform(node: Node, w: number, h: number): UITransform {
        let ut = node.getComponent(UITransform);
        if (!ut) ut = node.addComponent(UITransform);
        ut.setContentSize(w, h);
        return ut;
    }

    private _createLabel(parent: Node, name: string, text: string, fontSize: number, color: Color, w: number, h: number): Node {
        const node = new Node(name);
        parent.addChild(node);

        node.addComponent(UITransform).setContentSize(w, h);

        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.CLAMP;

        return node;
    }

    private _createEditBox(parent: Node, name: string, placeholder: string, isPassword: boolean): Node {
        const node = new Node(name);
        parent.addChild(node);

        node.addComponent(UITransform).setContentSize(316, 40);

        const bgSprite = node.addComponent(Sprite);
        bgSprite.color = INPUT_BG;
        bgSprite.sizeMode = Sprite.SizeMode.CUSTOM;

        const editBox = node.addComponent(EditBox);
        editBox.placeholder = placeholder;
        editBox.placeholderFontColor = PLACEHOLDER;
        editBox.fontSize = 14;
        editBox.fontColor = TEXT_COLOR;
        editBox.maxLength = 30;

        if (isPassword) {
            editBox.inputFlag = EditBox.InputFlag.PASSWORD;
        }

        return node;
    }

    private _createButton(parent: Node, name: string, text: string, bgColor: Color, textColor: Color): Node {
        const node = new Node(name);
        parent.addChild(node);

        node.addComponent(UITransform).setContentSize(316, 44);

        const sprite = node.addComponent(Sprite);
        sprite.color = bgColor;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        node.addComponent(Button);

        // 按鈕文字
        const labelNode = new Node('Label');
        node.addChild(labelNode);
        labelNode.addComponent(UITransform).setContentSize(316, 44);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 16;
        label.color = textColor;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        return node;
    }
}
