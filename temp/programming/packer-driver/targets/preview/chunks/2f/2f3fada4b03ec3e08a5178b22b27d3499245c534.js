System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, UITransform, WhiteCrowCard, _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2, _crd, ccclass, property, CharacterCard;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfWhiteCrowCard(extras) {
    _reporterNs.report("WhiteCrowCard", "./WhiteCrowCard", _context.meta, extras);
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
      UITransform = _cc.UITransform;
    }, function (_unresolved_2) {
      WhiteCrowCard = _unresolved_2.WhiteCrowCard;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "7cbd0lOdjpD+JPpr4meSpV3", "CharacterCard", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'UITransform']);

      ({
        ccclass,
        property
      } = _decorator); // ── 組件 ─────────────────────────────────────────────────────────────────────

      /**
       * CharacterCard
       *
       * 負責角色卡片的頁面切換與比例約束。
       * 本組件掛載於與 WhiteCrowCard 相同的節點，
       * 透過監聽 'tab-changed' 事件驅動內容頁切換。
       */

      _export("CharacterCard", CharacterCard = (_dec = ccclass('CharacterCard'), _dec2 = property([Node]), _dec3 = property(Node), _dec(_class = (_class2 = class CharacterCard extends Component {
        constructor() {
          super(...arguments);

          // ── 暴露給 Inspector 的屬性 ───────────────────────────────────────────────

          /** 四個內容頁面節點，順序對應 Tab 索引 0, 1, 2, 3 */
          _initializerDefineProperty(this, "tabPages", _descriptor, this);

          /** 卡片主要內容區塊，用於強制維持 1:2 寬高比 */
          _initializerDefineProperty(this, "contentNode", _descriptor2, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._whiteCrowCard = null;
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._whiteCrowCard = this.getComponent(_crd && WhiteCrowCard === void 0 ? (_reportPossibleCrUseOfWhiteCrowCard({
            error: Error()
          }), WhiteCrowCard) : WhiteCrowCard);

          if (!this._whiteCrowCard) {
            console.warn('[CharacterCard] 找不到同節點的 WhiteCrowCard 組件。');
            return;
          }

          this.node.on('tab-changed', this._onTabChanged, this); // 初始化：顯示第 0 頁，隱藏其餘

          this._showPage(0);
        }

        start() {
          this._enforceAspectRatio();
        }

        onDestroy() {
          this.node.off('tab-changed', this._onTabChanged, this);
        } // ── Tab 切換處理 ──────────────────────────────────────────────────────────


        _onTabChanged(index) {
          this._showPage(index);
        }

        _showPage(index) {
          this.tabPages.forEach((page, i) => {
            if (page) page.active = i === index;
          });
        } // ── 1:2 比例約束 ──────────────────────────────────────────────────────────


        _enforceAspectRatio() {
          if (!this.contentNode) return;
          var transform = this.contentNode.getComponent(UITransform);
          if (!transform) return;
          var width = transform.width;
          transform.height = width * 2;
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "tabPages", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contentNode", [_dec3], {
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
//# sourceMappingURL=2f3fada4b03ec3e08a5178b22b27d3499245c534.js.map