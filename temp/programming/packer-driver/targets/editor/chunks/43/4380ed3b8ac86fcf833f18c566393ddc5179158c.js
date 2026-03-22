System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Label, Node, Sprite, tween, Vec3, SoundManager, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _crd, ccclass, property, ItemDetailModal;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfItemData(extras) {
    _reporterNs.report("ItemData", "./PTD_DataManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfSoundManager(extras) {
    _reporterNs.report("SoundManager", "./SoundManager", _context.meta, extras);
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
      Label = _cc.Label;
      Node = _cc.Node;
      Sprite = _cc.Sprite;
      tween = _cc.tween;
      Vec3 = _cc.Vec3;
    }, function (_unresolved_2) {
      SoundManager = _unresolved_2.SoundManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "ee244mIsG1PZY4idPLc59Ey", "ItemDetailModal", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Label', 'Node', 'Sprite', 'tween', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator); // ── 組件 ─────────────────────────────────────────────────────────────────────

      _export("ItemDetailModal", ItemDetailModal = (_dec = ccclass('ItemDetailModal'), _dec2 = property(Label), _dec3 = property(Label), _dec4 = property(Label), _dec5 = property(Label), _dec6 = property(Sprite), _dec7 = property(Node), _dec8 = property(Node), _dec9 = property(Node), _dec(_class = (_class2 = class ItemDetailModal extends Component {
        constructor(...args) {
          super(...args);

          // ── Inspector 插座：顯示區 ────────────────────────────────────────────────
          _initializerDefineProperty(this, "nameLabel", _descriptor, this);

          _initializerDefineProperty(this, "typeLabel", _descriptor2, this);

          _initializerDefineProperty(this, "descLabel", _descriptor3, this);

          _initializerDefineProperty(this, "quantityLabel", _descriptor4, this);

          _initializerDefineProperty(this, "iconSprite", _descriptor5, this);

          // ── Inspector 插座：互動區 ────────────────────────────────────────────────

          /** 使用 / 裝備道具按鈕（數量 <= 0 時自動隱藏）*/
          _initializerDefineProperty(this, "useButtonNode", _descriptor6, this);

          /** 關閉按鈕 */
          _initializerDefineProperty(this, "closeButtonNode", _descriptor7, this);

          // ── Inspector 插座：遮罩層 ────────────────────────────────────────────────

          /**
           * 半透明黑底遮罩節點。
           * ⚠️ 設計師注意：此節點 Color 請設為 (0, 0, 0, 180)。
           *    絕對禁止使用背景模糊（backdrop-filter）— Cocos 無原生支援且極耗效能。
           *    尺寸必須撐滿整個 Canvas，層級置於 Modal 內容節點下方（先渲染）。
           */
          _initializerDefineProperty(this, "backdropNode", _descriptor8, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._data = null;
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._registerEvents();
        } // ── 公開 API ──────────────────────────────────────────────────────────────

        /**
         * 由主場景在收到 'show-item-detail' 後呼叫。
         * @param data 被點擊的道具資料
         */


        init(data) {
          this._data = data;
          if (this.nameLabel) this.nameLabel.string = data.name;
          if (this.typeLabel) this.typeLabel.string = data.type;
          if (this.descLabel) this.descLabel.string = data.description;
          if (this.quantityLabel) this.quantityLabel.string = `x${data.quantity}`; // TODO：依 data.id 從 resources 動態載入圖示 SpriteFrame
          // resources.load(`items/${data.id}`, SpriteFrame, (err, sf) => {
          //     if (!err && this.iconSprite) this.iconSprite.spriteFrame = sf;
          // });
          // 數量 <= 0 時隱藏使用按鈕

          if (this.useButtonNode) {
            this.useButtonNode.active = data.quantity > 0;
          }

          this.node.active = true;
        } // ── 事件註冊 ──────────────────────────────────────────────────────────────


        _registerEvents() {
          if (this.closeButtonNode) {
            this.closeButtonNode.targetOff(this);
            this.closeButtonNode.on(Node.EventType.TOUCH_END, this._onClose, this);
          }

          if (this.backdropNode) {
            this.backdropNode.targetOff(this);
            this.backdropNode.on(Node.EventType.TOUCH_END, this._onClose, this);
          }

          if (this.useButtonNode) {
            this.useButtonNode.targetOff(this);
            this.useButtonNode.on(Node.EventType.TOUCH_END, this._onUse, this);
          }
        } // ── 按鈕回呼 ──────────────────────────────────────────────────────────────


        _onClose() {
          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).panelOpen();
          this.node.emit('close-modal');
          this.node.active = false;
        }

        _onUse() {
          if (!this._data || !this.useButtonNode) return;
          tween(this.useButtonNode).to(0.05, {
            scale: new Vec3(0.88, 0.88, 1)
          }).to(0.08, {
            scale: Vec3.ONE
          }).call(() => {
            (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
              error: Error()
            }), SoundManager) : SoundManager).panelOpen();
            this.node.emit('use-item', this._data);
          }).start();
        } // ── 生命週期清理 ──────────────────────────────────────────────────────────


        onDestroy() {
          var _this$closeButtonNode, _this$backdropNode, _this$useButtonNode;

          (_this$closeButtonNode = this.closeButtonNode) == null || _this$closeButtonNode.targetOff(this);
          (_this$backdropNode = this.backdropNode) == null || _this$backdropNode.targetOff(this);
          (_this$useButtonNode = this.useButtonNode) == null || _this$useButtonNode.targetOff(this);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "nameLabel", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "typeLabel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "descLabel", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "quantityLabel", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "iconSprite", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "useButtonNode", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "closeButtonNode", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "backdropNode", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=4380ed3b8ac86fcf833f18c566393ddc5179158c.js.map