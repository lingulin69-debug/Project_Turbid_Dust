System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Label, Node, Sprite, SoundManager, _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3, _crd, ccclass, property, ItemSlot;

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
    }, function (_unresolved_2) {
      SoundManager = _unresolved_2.SoundManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "b3c39Et4kdOa7K7FoE+2v8n", "ItemSlot", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Label', 'Node', 'Sprite']);

      ({
        ccclass,
        property
      } = _decorator); // ── 組件 ─────────────────────────────────────────────────────────────────────

      _export("ItemSlot", ItemSlot = (_dec = ccclass('ItemSlot'), _dec2 = property(Sprite), _dec3 = property(Label), _dec4 = property(Sprite), _dec(_class = (_class2 = class ItemSlot extends Component {
        constructor(...args) {
          super(...args);

          // ── Inspector 插座 ────────────────────────────────────────────────────────

          /** 道具圖示 */
          _initializerDefineProperty(this, "iconSprite", _descriptor, this);

          /** 數量標籤（數量為 1 時清空文字保持畫面乾淨）*/
          _initializerDefineProperty(this, "quantityLabel", _descriptor2, this);

          /** 背景 / 稀有度底色 Sprite */
          _initializerDefineProperty(this, "bgSprite", _descriptor3, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._data = null;
        }

        // ── 公開 API ──────────────────────────────────────────────────────────────

        /**
         * 由 InventoryPanel 在 instantiate 後立即呼叫，將資料灌入格子。
         * @param data 單一道具資料
         */
        init(data) {
          this._data = data; // 數量顯示：數量為 1 時清空標籤以保持畫面乾淨

          if (this.quantityLabel) {
            this.quantityLabel.string = data.quantity > 1 ? `${data.quantity}` : '';
          } // TODO：依 data.id 或 data.type 從 resources 動態載入圖示 SpriteFrame
          // resources.load(`items/${data.id}`, SpriteFrame, (err, sf) => {
          //     if (!err && this.iconSprite) this.iconSprite.spriteFrame = sf;
          // });


          this._registerTouchEvent();
        } // ── 互動事件 ──────────────────────────────────────────────────────────────


        _registerTouchEvent() {
          // 先移除舊綁定，防止 init 被重複呼叫時累積監聽器
          this.node.targetOff(this);
          this.node.on(Node.EventType.TOUCH_END, this._onTap, this);
        }

        _onTap() {
          if (!this._data) return;
          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).panelOpen();
          this.node.emit('item-clicked', this._data);
        } // ── 生命週期清理 ──────────────────────────────────────────────────────────


        onDestroy() {
          this.node.targetOff(this);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "iconSprite", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "quantityLabel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "bgSprite", [_dec4], {
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
//# sourceMappingURL=302fdc91c5aa50df08083f269e3730defdcc24ba.js.map