System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Prefab, instantiate, ItemSlot, _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2, _crd, ccclass, property, InventoryPanel;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfItemData(extras) {
    _reporterNs.report("ItemData", "./PTD_DataManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfItemSlot(extras) {
    _reporterNs.report("ItemSlot", "./ItemSlot", _context.meta, extras);
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
      Prefab = _cc.Prefab;
      instantiate = _cc.instantiate;
    }, function (_unresolved_2) {
      ItemSlot = _unresolved_2.ItemSlot;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "747eeNbA4dI47/O20YcKxMm", "InventoryPanel", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Prefab', 'instantiate']);

      ({
        ccclass,
        property
      } = _decorator); // ── 組件 ─────────────────────────────────────────────────────────────────────

      _export("InventoryPanel", InventoryPanel = (_dec = ccclass('InventoryPanel'), _dec2 = property(Node), _dec3 = property(Prefab), _dec(_class = (_class2 = class InventoryPanel extends Component {
        constructor() {
          super(...arguments);

          // ── Inspector 插座 ────────────────────────────────────────────────────────

          /**
           * 掛載 GridLayout 元件的容器節點。
           * ⚠️ 排版（欄數、間距、對齊）全權由編輯器 GridLayout 元件設定，
           *    腳本嚴禁出現任何 X/Y 座標計算。
           */
          _initializerDefineProperty(this, "gridContainer", _descriptor, this);

          /** 單一物品格 Prefab（須掛載 ItemSlot 元件）*/
          _initializerDefineProperty(this, "itemSlotPrefab", _descriptor2, this);
        }

        // ── 公開 API ──────────────────────────────────────────────────────────────

        /**
         * 由 MainGameController 呼叫，傳入道具列表後重新渲染所有格子。
         * @param items 道具資料陣列（來自 DataManager.fetchInventory()）
         */
        init(items) {
          if (!this.gridContainer) {
            console.warn('[InventoryPanel] gridContainer 未綁定');
            return;
          }

          if (!this.itemSlotPrefab) {
            console.warn('[InventoryPanel] itemSlotPrefab 未綁定');
            return;
          } // 清空舊有格子（自動解除舊有監聽器）


          this.gridContainer.removeAllChildren();

          for (var item of items) {
            var _slotNode$getComponen;

            var slotNode = instantiate(this.itemSlotPrefab); // 資料灌入：在 addChild 前完成，確保 init 時節點已具備正確狀態

            (_slotNode$getComponen = slotNode.getComponent(_crd && ItemSlot === void 0 ? (_reportPossibleCrUseOfItemSlot({
              error: Error()
            }), ItemSlot) : ItemSlot)) == null || _slotNode$getComponen.init(item); // 排版由 GridLayout 自動處理，此處只負責掛入容器

            this.gridContainer.addChild(slotNode); // 監聽每個格子的點擊事件，向上中繼給主場景
            // 注意：Cocos 的 node.emit() 不會自動冒泡，
            //       因此必須在 init() 逐格綁定，而非監聽 gridContainer

            slotNode.on('item-clicked', this._onItemClicked, this);
          }
        } // ── 事件處理 ──────────────────────────────────────────────────────────────

        /**
         * 收到格子點擊後，向上廣播 'show-item-detail'，
         * 由主場景（MainGameController）負責開啟 ItemDetailModal。
         */


        _onItemClicked(data) {
          this.node.emit('show-item-detail', data);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "gridContainer", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "itemSlotPrefab", [_dec3], {
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
//# sourceMappingURL=22681bd60e97b5e3a1bd385d38f81a050095a787.js.map