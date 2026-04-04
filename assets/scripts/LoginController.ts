import {
    _decorator,
    Component,
    Node,
    EditBox,
    Button,
    Label,
    director,
    sys,
    Material,
    tween,
    Vec3,
} from 'cc';
import { DataManager } from './PTD_DataManager';

const { ccclass, property } = _decorator;

// ── 常數 ──────────────────────────────────────────────────────────────────────

const INITIAL_PASSWORD  = '0000';
const STORAGE_KEY_UID   = 'ptd_user_id';
const STORAGE_KEY_TOKEN = 'ptd_token';
const MAIN_SCENE_NAME   = 'MapTestView';

/** 密碼最短長度（改密流程驗證用） */
const MIN_PASSWORD_LENGTH = 4;

// ── 控制器 ────────────────────────────────────────────────────────────────────

/**
 * LoginController
 * 掛載於登入場景的根節點（或 Canvas）。
 *
 * 職責：
 *  1. 呈現登入介面，將帳密傳給 DataManager.login()
 *  2. 偵測初始密碼 '0000'，強制切換至改密介面
 *  3. 登入成功後將 user_id / token 寫入 sys.localStorage
 *  4. 轉場至主遊戲場景 MapTestView
 *
 * ⚠️ 此檔案禁止直接呼叫 fetch，所有 API 請求皆委由 DataManager 處理。
 */
@ccclass('LoginController')
export class LoginController extends Component {

    // ── UI 面板插座 ───────────────────────────────────────────────────────────

    /** 登入介面根節點 */
    @property(Node)
    loginPanel: Node = null;

    /** 設定新密碼介面根節點（初始密碼攔截後顯示） */
    @property(Node)
    resetPasswordPanel: Node = null;

    /** 載入中遮罩（半透明黑色蓋板，操作進行中防止重複點擊） */
    @property(Node)
    loadingOverlay: Node = null;

    // ── 登入介面元件 ──────────────────────────────────────────────────────────

    @property(EditBox)
    ocNameInput: EditBox = null;

    @property(EditBox)
    passwordInput: EditBox = null;

    @property(Button)
    loginBtn: Button = null;

    /** 登入介面的錯誤訊息 Label */
    @property(Label)
    loginErrorLabel: Label = null;

    // ── 改密介面元件 ──────────────────────────────────────────────────────────

    @property(EditBox)
    newPasswordInput: EditBox = null;

    @property(EditBox)
    confirmPasswordInput: EditBox = null;

    @property(Button)
    confirmResetBtn: Button = null;

    /** 改密介面的錯誤/提示訊息 Label */
    @property(Label)
    resetErrorLabel: Label = null;

    // ── Shader 材質預留接口（§3 規範） ────────────────────────────────────────

    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    /** 登入成功但被攔截的回傳資料，改密完成後使用 */
    private _pendingLoginData: Awaited<ReturnType<typeof DataManager.login>> | null = null;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this._showLoginPanel();
        this._registerButtonEvents();
        console.log('[LoginController] 登入場景初始化完成');
    }

    onDestroy(): void {
        if (this.loginBtn?.node?.isValid) this.loginBtn.node.targetOff(this);
        if (this.confirmResetBtn?.node?.isValid) this.confirmResetBtn.node.targetOff(this);
    }

    private _registerButtonEvents(): void {
        if (this.loginBtn) {
            this.loginBtn.node.on(Node.EventType.TOUCH_END, this.onLoginPressed, this);
        }
        if (this.confirmResetBtn) {
            this.confirmResetBtn.node.on(Node.EventType.TOUCH_END, this.onConfirmResetPressed, this);
        }
    }

    // ── 公開方法（供 Inspector Button clickEvents 呼叫） ──────────────────────

    /**
     * 登入按鈕回呼。
     * Inspector 綁定路徑：LoginController → onLoginPressed
     */
    async onLoginPressed(): Promise<void> {
        const ocName   = this.ocNameInput?.string?.trim()   ?? '';
        const password = this.passwordInput?.string?.trim() ?? '';

        if (!ocName || !password) {
            this._setLoginError('請輸入 OC 名稱與密碼');
            return;
        }

        this._setLoginError('');
        this._setLoading(true);

        try {
            const data = await DataManager.login(ocName, password);

            // ── 初始密碼攔截 ───────────────────────────────────────────────
            if (data.password === INITIAL_PASSWORD) {
                console.log('[LoginController] 偵測到初始密碼 0000，攔截登入，導向改密流程');
                this._pendingLoginData = data;
                this._setLoading(false);
                this._showResetPanel();
                return;
            }

            // ── 正常登入成功 ───────────────────────────────────────────────
            this._persistSession(data.user_id, data.token);
            this._initPlayer(data);
            this._enterMainScene();

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '登入發生未知錯誤';
            console.error('[LoginController] 登入失敗', err);
            this._setLoginError(msg);
            this._setLoading(false);
        }
    }

    /**
     * 確認新密碼按鈕回呼。
     * Inspector 綁定路徑：LoginController → onConfirmResetPressed
     */
    async onConfirmResetPressed(): Promise<void> {
        const newPwd     = this.newPasswordInput?.string?.trim()     ?? '';
        const confirmPwd = this.confirmPasswordInput?.string?.trim() ?? '';

        if (newPwd.length < MIN_PASSWORD_LENGTH) {
            this._setResetError(`密碼長度至少 ${MIN_PASSWORD_LENGTH} 位`);
            return;
        }
        if (newPwd === INITIAL_PASSWORD) {
            this._setResetError('新密碼不可與初始密碼相同');
            return;
        }
        if (newPwd !== confirmPwd) {
            this._setResetError('兩次輸入的密碼不一致');
            return;
        }

        this._setResetError('');
        this._setLoading(true);

        try {
            await DataManager.updatePassword(newPwd);
            console.log('[LoginController] 密碼更新成功，完成登入流程');

            if (this._pendingLoginData) {
                this._persistSession(
                    this._pendingLoginData.user_id,
                    this._pendingLoginData.token,
                );
                this._initPlayer(this._pendingLoginData);
            }

            this._enterMainScene();

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '更新密碼時發生未知錯誤';
            console.error('[LoginController] 改密失敗', err);
            this._setResetError(msg);
            this._setLoading(false);
        }
    }

    // ── 私有輔助方法 ──────────────────────────────────────────────────────────

    /** 顯示登入面板，隱藏其他面板 */
    private _showLoginPanel(): void {
        if (this.loginPanel)        this.loginPanel.active        = true;
        if (this.resetPasswordPanel) this.resetPasswordPanel.active = false;
        if (this.loadingOverlay)    this.loadingOverlay.active    = false;
    }

    /** 切換至改密面板 */
    private _showResetPanel(): void {
        if (this.loginPanel)        this.loginPanel.active        = false;
        if (this.resetPasswordPanel) this.resetPasswordPanel.active = true;
        if (this.loadingOverlay)    this.loadingOverlay.active    = false;
    }

    /** 顯示 / 隱藏載入遮罩，並鎖定 / 解鎖登入按鈕 */
    private _setLoading(loading: boolean): void {
        if (this.loadingOverlay) this.loadingOverlay.active = loading;
        if (this.loginBtn)       this.loginBtn.interactable  = !loading;
        if (this.confirmResetBtn) this.confirmResetBtn.interactable = !loading;
    }

    /** 更新登入介面錯誤訊息 */
    private _setLoginError(msg: string): void {
        if (this.loginErrorLabel) this.loginErrorLabel.string = msg;
    }

    /** 更新改密介面錯誤訊息 */
    private _setResetError(msg: string): void {
        if (this.resetErrorLabel) this.resetErrorLabel.string = msg;
    }

    /** 將 user_id 與 token 寫入 sys.localStorage */
    private _persistSession(userId: string, token: string): void {
        sys.localStorage.setItem(STORAGE_KEY_UID,   userId);
        sys.localStorage.setItem(STORAGE_KEY_TOKEN, token);
        console.log(`[LoginController] Session 已持久化 user_id=${userId}`);
    }

    /** 用登入資料初始化 DataManager 的 PlayerData */
    private _initPlayer(data: Awaited<ReturnType<typeof DataManager.login>>): void {
        DataManager.initPlayer({
            oc_name:              data.oc_name,
            faction:              data.faction,
            coins:                data.coins,
            hp:                   data.hp,
            max_hp:               data.max_hp,
            current_landmark_id:  data.current_landmark_id,
            role:                 data.role,
            chapter:              data.chapter,
        });
    }

    /** 以淡入動畫轉場至主遊戲場景 */
    private _enterMainScene(): void {
        console.log(`[LoginController] 轉場至主場景：${MAIN_SCENE_NAME}`);
        // 淡出場景根節點後再載入（遵循規範：只 tween 單一屬性）
        const root = this.node;
        tween(root)
            .to(0.3, { opacity: 0 })
            .call(() => { director.loadScene(MAIN_SCENE_NAME); })
            .start();
    }
}
