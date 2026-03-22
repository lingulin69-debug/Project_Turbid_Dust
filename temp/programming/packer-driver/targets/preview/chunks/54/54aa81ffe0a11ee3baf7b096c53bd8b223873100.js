System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Label, Node, Prefab, instantiate, tween, Vec3, ItemData, ItemSlot, SoundManager, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _crd, ccclass, property, MOCK_SHOP_ITEMS, NPCModal;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfItemData(extras) {
    _reporterNs.report("ItemData", "./PTD_DataManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfItemSlot(extras) {
    _reporterNs.report("ItemSlot", "./ItemSlot", _context.meta, extras);
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
      Prefab = _cc.Prefab;
      instantiate = _cc.instantiate;
      tween = _cc.tween;
      Vec3 = _cc.Vec3;
    }, function (_unresolved_2) {
      ItemData = _unresolved_2.ItemData;
    }, function (_unresolved_3) {
      ItemSlot = _unresolved_3.ItemSlot;
    }, function (_unresolved_4) {
      SoundManager = _unresolved_4.SoundManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c5da3rg3TtCf52c5Dfib4dl", "NPCModal", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Label', 'Node', 'Prefab', 'instantiate', 'tween', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator); // ── Mock 商店商品（正式版替換為 DataManager.getShopItems(npcId)）────────────

      MOCK_SHOP_ITEMS = {
        black_merchant: [{
          id: 'shop_b01',
          name: '禁忌藥劑',
          description: '效果不明，風險自負。',
          quantity: 1,
          type: 'consumable',
          price: 8,
          rarity: 3
        }, {
          id: 'shop_b02',
          name: '黑市情報',
          description: '某個據點的秘密弱點。',
          quantity: 1,
          type: 'key',
          price: 12,
          rarity: 3
        }, {
          id: 'shop_b03',
          name: '遮面頭巾',
          description: '讓人難以辨認你的臉。',
          quantity: 1,
          type: 'equipment',
          price: 6,
          rarity: 2
        }],
        item_merchant: [{
          id: 'shop_i01',
          name: '急救包',
          description: '立即恢復 10 HP。',
          quantity: 1,
          type: 'consumable',
          price: 3,
          rarity: 1
        }, {
          id: 'shop_i02',
          name: '火把',
          description: '照亮黑暗的角落。',
          quantity: 1,
          type: 'material',
          price: 1,
          rarity: 1
        }, {
          id: 'shop_i03',
          name: '繩索',
          description: '多用途，看你怎麼用。',
          quantity: 1,
          type: 'material',
          price: 2,
          rarity: 1
        }, {
          id: 'shop_i04',
          name: '解毒草藥',
          description: '中和輕度毒素。',
          quantity: 1,
          type: 'consumable',
          price: 4,
          rarity: 2
        }]
      }; // ── NPC ID 型別（對應 CLAUDE.md npc_role 欄位值）────────────────────────────

      // ── 組件 ─────────────────────────────────────────────────────────────────────
      _export("NPCModal", NPCModal = (_dec = ccclass('NPCModal'), _dec2 = property(Label), _dec3 = property(Label), _dec4 = property(Node), _dec5 = property(Prefab), _dec6 = property(Node), _dec7 = property(Label), _dec8 = property(Node), _dec9 = property(Node), _dec(_class = (_class2 = class NPCModal extends Component {
        constructor() {
          super(...arguments);

          // ── Inspector 插座 ────────────────────────────────────────────────────────
          _initializerDefineProperty(this, "npcNameLabel", _descriptor, this);

          _initializerDefineProperty(this, "dialogueLabel", _descriptor2, this);

          /**
           * 商品列表容器，掛載 GridLayout 元件。
           * ⚠️ 排版（欄數、間距）全權由編輯器 GridLayout 設定，腳本不計算任何座標。
           */
          _initializerDefineProperty(this, "shopContainer", _descriptor3, this);

          /** 商品格 Prefab，重用 ItemSlot 組件 */
          _initializerDefineProperty(this, "itemSlotPrefab", _descriptor4, this);

          /** 旅店補血等特殊行動按鈕 */
          _initializerDefineProperty(this, "actionButtonNode", _descriptor5, this);

          /** 行動按鈕文字標籤（掛在 actionButtonNode 子節點上）*/
          _initializerDefineProperty(this, "actionButtonLabel", _descriptor6, this);

          /** 關閉按鈕 */
          _initializerDefineProperty(this, "closeButtonNode", _descriptor7, this);

          /**
           * 半透明黑底遮罩節點。
           * ⚠️ 設計師注意：Color 請設為 (0, 0, 0, 180)。
           *    嚴禁使用背景模糊（backdrop-filter）— Cocos 無原生支援且極耗效能。
           *    尺寸需撐滿整個 Canvas，層級置於 Modal 內容節點下方。
           */
          _initializerDefineProperty(this, "backdropNode", _descriptor8, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────
          this._npcId = null;
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._registerEvents();
        } // ── 公開 API ──────────────────────────────────────────────────────────────

        /**
         * 由主場景在點擊地圖 NPC 圖標後呼叫。
         * 依 npcId 切換面板狀態、對話文字與可用按鈕。
         *
         * @param npcId     對應 CLAUDE.md 中 npc_role 欄位值
         * @param customData 預留擴充（例如旅店傳入費用、商人傳入商品列表等）
         */


        init(npcId, customData) {
          this._npcId = npcId;

          this._applyState(npcId, customData);

          this.node.active = true;
        } // ── 狀態切換 ──────────────────────────────────────────────────────────────


        _applyState(npcId, customData) {
          switch (npcId) {
            case 'black_merchant':
            case 'item_merchant':
              {
                this._setNpcName(npcId === 'black_merchant' ? '黑心商人' : '道具商人');

                this._setDialogue('需要些什麼？能讓你滿意的東西，我都有。');

                this._showShop(true);

                this._showAction(false);

                this._populateShop(MOCK_SHOP_ITEMS[npcId]);

                break;
              }

            case 'pet_merchant':
              {
                this._setNpcName('寵物商人');

                this._setDialogue('這些生物都是我親手養大的，保證健康。');

                this._showShop(true);

                this._showAction(false); // TODO：呼叫 DataManager 取得寵物列表並生成格子


                break;
              }

            case 'inn_owner':
              {
                this._setNpcName('旅店老闆');

                this._setDialogue('要休息嗎？先付錢。');

                this._showShop(false);

                this._showAction(true);

                if (this.actionButtonLabel) {
                  this.actionButtonLabel.string = '治療 (需 2 金幣)';
                }

                break;
              }

            case 'trafficker':
              {
                this._setNpcName('人販子');

                this._setDialogue('（此人在暗處注視著你，一言不發）');

                this._showShop(false);

                this._showAction(false);

                break;
              }

            default:
              {
                console.warn("[NPCModal] \u672A\u77E5\u7684 npcId\uFF1A" + npcId);
                break;
              }
          }
        } // ── 商品生成 ──────────────────────────────────────────────────────────────


        _populateShop(items) {
          if (!this.shopContainer || !this.itemSlotPrefab) return;
          this.shopContainer.removeAllChildren();

          for (var item of items) {
            var _slotNode$getComponen;

            var slotNode = instantiate(this.itemSlotPrefab);
            (_slotNode$getComponen = slotNode.getComponent(_crd && ItemSlot === void 0 ? (_reportPossibleCrUseOfItemSlot({
              error: Error()
            }), ItemSlot) : ItemSlot)) == null || _slotNode$getComponen.init(item);
            this.shopContainer.addChild(slotNode); // 收到格子點擊 → 向外廣播 buy-item，決策權交給 Controller

            slotNode.on('item-clicked', data => {
              this.node.emit('buy-item', data);
            }, this);
          }
        } // ── 輔助方法 ──────────────────────────────────────────────────────────────


        _setNpcName(name) {
          if (this.npcNameLabel) this.npcNameLabel.string = name;
        }

        _setDialogue(text) {
          if (this.dialogueLabel) this.dialogueLabel.string = text;
        }

        _showShop(visible) {
          if (this.shopContainer) this.shopContainer.active = visible;
        }

        _showAction(visible) {
          if (this.actionButtonNode) this.actionButtonNode.active = visible;
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

          if (this.actionButtonNode) {
            this.actionButtonNode.targetOff(this);
            this.actionButtonNode.on(Node.EventType.TOUCH_END, this._onAction, this);
          }
        } // ── 按鈕回呼 ──────────────────────────────────────────────────────────────


        _onClose() {
          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).panelOpen();
          this.node.emit('close-modal');
          this.node.active = false;
        }

        _onAction() {
          if (!this._npcId || !this.actionButtonNode) return;
          tween(this.actionButtonNode).to(0.05, {
            scale: new Vec3(0.88, 0.88, 1)
          }).to(0.08, {
            scale: Vec3.ONE
          }).call(() => {
            (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
              error: Error()
            }), SoundManager) : SoundManager).panelOpen();
            this.node.emit('npc-action', this._npcId);
          }).start();
        } // ── 生命週期清理 ──────────────────────────────────────────────────────────


        onDestroy() {
          var _this$shopContainer, _this$closeButtonNode, _this$backdropNode, _this$actionButtonNod;

          (_this$shopContainer = this.shopContainer) == null || _this$shopContainer.removeAllChildren();
          (_this$closeButtonNode = this.closeButtonNode) == null || _this$closeButtonNode.targetOff(this);
          (_this$backdropNode = this.backdropNode) == null || _this$backdropNode.targetOff(this);
          (_this$actionButtonNod = this.actionButtonNode) == null || _this$actionButtonNod.targetOff(this);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "npcNameLabel", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "dialogueLabel", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "shopContainer", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "itemSlotPrefab", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "actionButtonNode", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "actionButtonLabel", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "closeButtonNode", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "backdropNode", [_dec9], {
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
//# sourceMappingURL=54aa81ffe0a11ee3baf7b096c53bd8b223873100.js.map