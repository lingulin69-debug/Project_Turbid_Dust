System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Color, Component, Label, Material, Node, Sprite, applyFactionMaterial, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _crd, ccclass, property, COLOR_FULL, COLOR_VACANT, COLOR_CLOSED, MapLandmark;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfapplyFactionMaterial(extras) {
    _reporterNs.report("applyFactionMaterial", "./PTD_UI_Theme", _context.meta, extras);
  }

  function _reportPossibleCrUseOfFactionType(extras) {
    _reporterNs.report("FactionType", "./PTD_UI_Theme", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Color = _cc.Color;
      Component = _cc.Component;
      Label = _cc.Label;
      Material = _cc.Material;
      Node = _cc.Node;
      Sprite = _cc.Sprite;
    }, function (_unresolved_2) {
      applyFactionMaterial = _unresolved_2.applyFactionMaterial;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "78f2cuISvdH9bIP/OT86qRS", "MapLandmark", undefined);

      __checkObsolete__(['_decorator', 'Color', 'Component', 'EventMouse', 'Label', 'Material', 'Node', 'Sprite']);

      ({
        ccclass,
        property
      } = _decorator); // ── 資料介面 ────────────────────────────────────────────────────────────────

      // ── 顏色常數 ─────────────────────────────────────────────────────────────────
      COLOR_FULL = new Color(255, 80, 80, 255); // 已滿 → 紅

      COLOR_VACANT = new Color(80, 220, 120, 255); // 未滿 → 綠

      COLOR_CLOSED = new Color(180, 180, 180, 100); // closed → 半透明灰
      // ── 組件 ─────────────────────────────────────────────────────────────────────

      _export("MapLandmark", MapLandmark = (_dec = ccclass('MapLandmark'), _dec2 = property(Node), _dec3 = property(Label), _dec4 = property(Label), _dec5 = property(Sprite), _dec6 = property(Material), _dec7 = property(Material), _dec(_class = (_class2 = class MapLandmark extends Component {
        constructor() {
          super(...arguments);

          // ── 暴露給 Inspector 的 UI 節點 ──────────────────────────────────────────
          _initializerDefineProperty(this, "tooltipNode", _descriptor, this);

          _initializerDefineProperty(this, "occupantsLabel", _descriptor2, this);

          _initializerDefineProperty(this, "nameLabel", _descriptor3, this);

          _initializerDefineProperty(this, "baseSprite", _descriptor4, this);

          // ── Shader / Material 預留接口 ────────────────────────────────────────────
          _initializerDefineProperty(this, "turbidMaterial", _descriptor5, this);

          _initializerDefineProperty(this, "pureMaterial", _descriptor6, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._data = null;
        }

        // ── 公開初始化 ────────────────────────────────────────────────────────────
        init(data) {
          this._data = data;

          this._applyVisual();

          this._registerEvents();
        } // ── 視覺初始化 ────────────────────────────────────────────────────────────


        _applyVisual() {
          var data = this._data;
          if (!data) return; // 名稱

          if (this.nameLabel) {
            var _data$name;

            this.nameLabel.string = (_data$name = data.name) != null ? _data$name : '';
          } // closed 狀態 → 整體灰化


          if (this.baseSprite) {
            this.baseSprite.color = data.status === 'closed' ? COLOR_CLOSED : Color.WHITE;
          } // tooltip 預設隱藏


          if (this.tooltipNode) {
            this.tooltipNode.active = false;
          } // Shader / Material 切換（只在明確陣營時套用）


          if (data.faction !== 'Common' && this.baseSprite) {
            (_crd && applyFactionMaterial === void 0 ? (_reportPossibleCrUseOfapplyFactionMaterial({
              error: Error()
            }), applyFactionMaterial) : applyFactionMaterial)(this.baseSprite, data.faction, this.turbidMaterial, this.pureMaterial);
          }
        } // ── 事件註冊 ──────────────────────────────────────────────────────────────


        _registerEvents() {
          // [新增這行] 確保重複 init 時，不會綁定兩層一樣的事件
          this.node.targetOff(this);
          this.node.on(Node.EventType.MOUSE_ENTER, this._onHoverEnter, this);
          this.node.on(Node.EventType.MOUSE_LEAVE, this._onHoverLeave, this);
          this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        } // ── Hover 邏輯 ────────────────────────────────────────────────────────────


        _onHoverEnter(_e) {
          var data = this._data;
          if (!data || !this.tooltipNode) return;
          this.tooltipNode.active = true; // 人數文字 & 顏色

          if (this.occupantsLabel && data.capacity != null) {
            var _data$occupants;

            var occ = (_data$occupants = data.occupants) != null ? _data$occupants : 0;
            var isFull = occ >= data.capacity;
            this.occupantsLabel.string = isFull ? occ + "/" + data.capacity + " \u5DF2\u6EFF" : occ + "/" + data.capacity;
            this.occupantsLabel.color = isFull ? COLOR_FULL : COLOR_VACANT;
          } else if (this.occupantsLabel) {
            this.occupantsLabel.string = '';
          }
        }

        _onHoverLeave(_e) {
          if (this.tooltipNode) {
            this.tooltipNode.active = false;
          }
        } // ── 點擊事件 ──────────────────────────────────────────────────────────────


        _onTouchEnd() {
          var data = this._data;
          if (!data || data.status !== 'open') return; // 透過 emit 向上冒泡，主場景用 node.on('landmark-clicked', ...) 接收

          this.node.emit('landmark-clicked', data.id);
        } // ── 生命週期清理 ──────────────────────────────────────────────────────────


        onDestroy() {
          this.node.off(Node.EventType.MOUSE_ENTER, this._onHoverEnter, this);
          this.node.off(Node.EventType.MOUSE_LEAVE, this._onHoverLeave, this);
          this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "tooltipNode", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "occupantsLabel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "nameLabel", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "baseSprite", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "turbidMaterial", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "pureMaterial", [_dec7], {
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
//# sourceMappingURL=08e3dcf4472c7ff7c30e1713339a97de5638d34c.js.map