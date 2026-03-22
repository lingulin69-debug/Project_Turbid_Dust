System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, EditBox, Button, Label, director, sys, Material, tween, DataManager, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _crd, ccclass, property, INITIAL_PASSWORD, STORAGE_KEY_UID, STORAGE_KEY_TOKEN, MAIN_SCENE_NAME, MIN_PASSWORD_LENGTH, LoginController;

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

  function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfDataManager(extras) {
    _reporterNs.report("DataManager", "./PTD_DataManager", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
      Node = _cc.Node;
      EditBox = _cc.EditBox;
      Button = _cc.Button;
      Label = _cc.Label;
      director = _cc.director;
      sys = _cc.sys;
      Material = _cc.Material;
      tween = _cc.tween;
    }, function (_unresolved_2) {
      DataManager = _unresolved_2.DataManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c8d38csxr1PZJHMBwKZEyKR", "LoginController", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'EditBox', 'Button', 'Label', 'director', 'sys', 'Material', 'tween', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator); // ── 常數 ──────────────────────────────────────────────────────────────────────

      INITIAL_PASSWORD = '0000';
      STORAGE_KEY_UID = 'ptd_user_id';
      STORAGE_KEY_TOKEN = 'ptd_token';
      MAIN_SCENE_NAME = 'MapTestView';
      /** 密碼最短長度（改密流程驗證用） */

      MIN_PASSWORD_LENGTH = 4; // ── 控制器 ────────────────────────────────────────────────────────────────────

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

      _export("LoginController", LoginController = (_dec = ccclass('LoginController'), _dec2 = property(Node), _dec3 = property(Node), _dec4 = property(Node), _dec5 = property(EditBox), _dec6 = property(EditBox), _dec7 = property(Button), _dec8 = property(Label), _dec9 = property(EditBox), _dec10 = property(EditBox), _dec11 = property(Button), _dec12 = property(Label), _dec13 = property(Material), _dec14 = property(Material), _dec(_class = (_class2 = class LoginController extends Component {
        constructor() {
          super(...arguments);

          // ── UI 面板插座 ───────────────────────────────────────────────────────────

          /** 登入介面根節點 */
          _initializerDefineProperty(this, "loginPanel", _descriptor, this);

          /** 設定新密碼介面根節點（初始密碼攔截後顯示） */
          _initializerDefineProperty(this, "resetPasswordPanel", _descriptor2, this);

          /** 載入中遮罩（半透明黑色蓋板，操作進行中防止重複點擊） */
          _initializerDefineProperty(this, "loadingOverlay", _descriptor3, this);

          // ── 登入介面元件 ──────────────────────────────────────────────────────────
          _initializerDefineProperty(this, "ocNameInput", _descriptor4, this);

          _initializerDefineProperty(this, "passwordInput", _descriptor5, this);

          _initializerDefineProperty(this, "loginBtn", _descriptor6, this);

          /** 登入介面的錯誤訊息 Label */
          _initializerDefineProperty(this, "loginErrorLabel", _descriptor7, this);

          // ── 改密介面元件 ──────────────────────────────────────────────────────────
          _initializerDefineProperty(this, "newPasswordInput", _descriptor8, this);

          _initializerDefineProperty(this, "confirmPasswordInput", _descriptor9, this);

          _initializerDefineProperty(this, "confirmResetBtn", _descriptor10, this);

          /** 改密介面的錯誤/提示訊息 Label */
          _initializerDefineProperty(this, "resetErrorLabel", _descriptor11, this);

          // ── Shader 材質預留接口（§3 規範） ────────────────────────────────────────
          _initializerDefineProperty(this, "turbidMaterial", _descriptor12, this);

          _initializerDefineProperty(this, "pureMaterial", _descriptor13, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────

          /** 登入成功但被攔截的回傳資料，改密完成後使用 */
          this._pendingLoginData = null;
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._showLoginPanel();

          console.log('[LoginController] 登入場景初始化完成');
        }

        onDestroy() {// EditBox / Button 事件透過 Inspector clickEvents 綁定，Cocos 自動解除
          // 若有手動 node.on() 監聽，在此解除（目前無）
        } // ── 公開方法（供 Inspector Button clickEvents 呼叫） ──────────────────────

        /**
         * 登入按鈕回呼。
         * Inspector 綁定路徑：LoginController → onLoginPressed
         */


        onLoginPressed() {
          var _this = this;

          return _asyncToGenerator(function* () {
            var _this$ocNameInput$str, _this$ocNameInput, _this$passwordInput$s, _this$passwordInput;

            var ocName = (_this$ocNameInput$str = (_this$ocNameInput = _this.ocNameInput) == null ? void 0 : _this$ocNameInput.string.trim()) != null ? _this$ocNameInput$str : '';
            var password = (_this$passwordInput$s = (_this$passwordInput = _this.passwordInput) == null ? void 0 : _this$passwordInput.string.trim()) != null ? _this$passwordInput$s : '';

            if (!ocName || !password) {
              _this._setLoginError('請輸入 OC 名稱與密碼');

              return;
            }

            _this._setLoginError('');

            _this._setLoading(true);

            try {
              var data = yield (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
                error: Error()
              }), DataManager) : DataManager).login(ocName, password); // ── 初始密碼攔截 ───────────────────────────────────────────────

              if (data.password === INITIAL_PASSWORD) {
                console.log('[LoginController] 偵測到初始密碼 0000，攔截登入，導向改密流程');
                _this._pendingLoginData = data;

                _this._setLoading(false);

                _this._showResetPanel();

                return;
              } // ── 正常登入成功 ───────────────────────────────────────────────


              _this._persistSession(data.user_id, data.token);

              _this._initPlayer(data);

              _this._enterMainScene();
            } catch (err) {
              var msg = err instanceof Error ? err.message : '登入發生未知錯誤';
              console.error('[LoginController] 登入失敗', err);

              _this._setLoginError(msg);

              _this._setLoading(false);
            }
          })();
        }
        /**
         * 確認新密碼按鈕回呼。
         * Inspector 綁定路徑：LoginController → onConfirmResetPressed
         */


        onConfirmResetPressed() {
          var _this2 = this;

          return _asyncToGenerator(function* () {
            var _this2$newPasswordInp, _this2$newPasswordInp2, _this2$confirmPasswor, _this2$confirmPasswor2;

            var newPwd = (_this2$newPasswordInp = (_this2$newPasswordInp2 = _this2.newPasswordInput) == null ? void 0 : _this2$newPasswordInp2.string.trim()) != null ? _this2$newPasswordInp : '';
            var confirmPwd = (_this2$confirmPasswor = (_this2$confirmPasswor2 = _this2.confirmPasswordInput) == null ? void 0 : _this2$confirmPasswor2.string.trim()) != null ? _this2$confirmPasswor : '';

            if (newPwd.length < MIN_PASSWORD_LENGTH) {
              _this2._setResetError("\u5BC6\u78BC\u9577\u5EA6\u81F3\u5C11 " + MIN_PASSWORD_LENGTH + " \u4F4D");

              return;
            }

            if (newPwd === INITIAL_PASSWORD) {
              _this2._setResetError('新密碼不可與初始密碼相同');

              return;
            }

            if (newPwd !== confirmPwd) {
              _this2._setResetError('兩次輸入的密碼不一致');

              return;
            }

            _this2._setResetError('');

            _this2._setLoading(true);

            try {
              yield (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
                error: Error()
              }), DataManager) : DataManager).updatePassword(newPwd);
              console.log('[LoginController] 密碼更新成功，完成登入流程');

              if (_this2._pendingLoginData) {
                _this2._persistSession(_this2._pendingLoginData.user_id, _this2._pendingLoginData.token);

                _this2._initPlayer(_this2._pendingLoginData);
              }

              _this2._enterMainScene();
            } catch (err) {
              var msg = err instanceof Error ? err.message : '更新密碼時發生未知錯誤';
              console.error('[LoginController] 改密失敗', err);

              _this2._setResetError(msg);

              _this2._setLoading(false);
            }
          })();
        } // ── 私有輔助方法 ──────────────────────────────────────────────────────────

        /** 顯示登入面板，隱藏其他面板 */


        _showLoginPanel() {
          if (this.loginPanel) this.loginPanel.active = true;
          if (this.resetPasswordPanel) this.resetPasswordPanel.active = false;
          if (this.loadingOverlay) this.loadingOverlay.active = false;
        }
        /** 切換至改密面板 */


        _showResetPanel() {
          if (this.loginPanel) this.loginPanel.active = false;
          if (this.resetPasswordPanel) this.resetPasswordPanel.active = true;
          if (this.loadingOverlay) this.loadingOverlay.active = false;
        }
        /** 顯示 / 隱藏載入遮罩，並鎖定 / 解鎖登入按鈕 */


        _setLoading(loading) {
          if (this.loadingOverlay) this.loadingOverlay.active = loading;
          if (this.loginBtn) this.loginBtn.interactable = !loading;
          if (this.confirmResetBtn) this.confirmResetBtn.interactable = !loading;
        }
        /** 更新登入介面錯誤訊息 */


        _setLoginError(msg) {
          if (this.loginErrorLabel) this.loginErrorLabel.string = msg;
        }
        /** 更新改密介面錯誤訊息 */


        _setResetError(msg) {
          if (this.resetErrorLabel) this.resetErrorLabel.string = msg;
        }
        /** 將 user_id 與 token 寫入 sys.localStorage */


        _persistSession(userId, token) {
          sys.localStorage.setItem(STORAGE_KEY_UID, userId);
          sys.localStorage.setItem(STORAGE_KEY_TOKEN, token);
          console.log("[LoginController] Session \u5DF2\u6301\u4E45\u5316 user_id=" + userId);
        }
        /** 用登入資料初始化 DataManager 的 PlayerData */


        _initPlayer(data) {
          (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).initPlayer({
            oc_name: data.oc_name,
            faction: data.faction,
            coins: data.coins,
            hp: data.hp,
            max_hp: data.max_hp,
            current_landmark_id: data.current_landmark_id
          });
        }
        /** 以淡入動畫轉場至主遊戲場景 */


        _enterMainScene() {
          console.log("[LoginController] \u8F49\u5834\u81F3\u4E3B\u5834\u666F\uFF1A" + MAIN_SCENE_NAME); // 淡出場景根節點後再載入（遵循規範：只 tween 單一屬性）

          var root = this.node;
          tween(root).to(0.3, {
            opacity: 0
          }).call(() => {
            director.loadScene(MAIN_SCENE_NAME);
          }).start();
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "loginPanel", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "resetPasswordPanel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "loadingOverlay", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "ocNameInput", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "passwordInput", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "loginBtn", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "loginErrorLabel", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "newPasswordInput", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "confirmPasswordInput", [_dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "confirmResetBtn", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "resetErrorLabel", [_dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "turbidMaterial", [_dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "pureMaterial", [_dec14], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=49e7cf378fb2371bd1f446b5a7ff29264171fa98.js.map