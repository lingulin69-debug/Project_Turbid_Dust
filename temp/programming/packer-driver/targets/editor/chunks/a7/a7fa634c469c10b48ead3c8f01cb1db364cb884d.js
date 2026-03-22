System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3", "__unresolved_4", "__unresolved_5", "__unresolved_6", "__unresolved_7", "__unresolved_8", "__unresolved_9", "__unresolved_10", "__unresolved_11", "__unresolved_12", "__unresolved_13", "__unresolved_14"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Vec3, MapController, HUDController, DataManager, InventoryPanel, ItemDetailModal, NPCModal, SoundManager, DiceResultOverlay, RelicPoemModal, WhiteCrowCard, ChapterStoryModal, DonationTracker, EventCalendar, MusicDiscController, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _crd, ccclass, property, MainGameController;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfMapController(extras) {
    _reporterNs.report("MapController", "./MapController", _context.meta, extras);
  }

  function _reportPossibleCrUseOfHUDController(extras) {
    _reporterNs.report("HUDController", "./HUDController", _context.meta, extras);
  }

  function _reportPossibleCrUseOfHUDPanelId(extras) {
    _reporterNs.report("HUDPanelId", "./HUDController", _context.meta, extras);
  }

  function _reportPossibleCrUseOfDataManager(extras) {
    _reporterNs.report("DataManager", "./PTD_DataManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfItemData(extras) {
    _reporterNs.report("ItemData", "./PTD_DataManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfInventoryPanel(extras) {
    _reporterNs.report("InventoryPanel", "./InventoryPanel", _context.meta, extras);
  }

  function _reportPossibleCrUseOfItemDetailModal(extras) {
    _reporterNs.report("ItemDetailModal", "./ItemDetailModal", _context.meta, extras);
  }

  function _reportPossibleCrUseOfNPCModal(extras) {
    _reporterNs.report("NPCModal", "./NPCModal", _context.meta, extras);
  }

  function _reportPossibleCrUseOfNpcId(extras) {
    _reporterNs.report("NpcId", "./NPCModal", _context.meta, extras);
  }

  function _reportPossibleCrUseOfSoundManager(extras) {
    _reporterNs.report("SoundManager", "./SoundManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfDiceResultOverlay(extras) {
    _reporterNs.report("DiceResultOverlay", "./DiceResultOverlay", _context.meta, extras);
  }

  function _reportPossibleCrUseOfDiceResult(extras) {
    _reporterNs.report("DiceResult", "./DiceResultOverlay", _context.meta, extras);
  }

  function _reportPossibleCrUseOfRelicPoemModal(extras) {
    _reporterNs.report("RelicPoemModal", "./RelicPoemModal", _context.meta, extras);
  }

  function _reportPossibleCrUseOfWhiteCrowCard(extras) {
    _reporterNs.report("WhiteCrowCard", "./WhiteCrowCard", _context.meta, extras);
  }

  function _reportPossibleCrUseOfChapterStoryModal(extras) {
    _reporterNs.report("ChapterStoryModal", "./ChapterStoryModal", _context.meta, extras);
  }

  function _reportPossibleCrUseOfDonationTracker(extras) {
    _reporterNs.report("DonationTracker", "./DonationTracker", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEventCalendar(extras) {
    _reporterNs.report("EventCalendar", "./EventCalendar", _context.meta, extras);
  }

  function _reportPossibleCrUseOfMusicDiscController(extras) {
    _reporterNs.report("MusicDiscController", "./MusicDiscController", _context.meta, extras);
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
      Vec3 = _cc.Vec3;
    }, function (_unresolved_2) {
      MapController = _unresolved_2.MapController;
    }, function (_unresolved_3) {
      HUDController = _unresolved_3.HUDController;
    }, function (_unresolved_4) {
      DataManager = _unresolved_4.DataManager;
    }, function (_unresolved_5) {
      InventoryPanel = _unresolved_5.InventoryPanel;
    }, function (_unresolved_6) {
      ItemDetailModal = _unresolved_6.ItemDetailModal;
    }, function (_unresolved_7) {
      NPCModal = _unresolved_7.NPCModal;
    }, function (_unresolved_8) {
      SoundManager = _unresolved_8.SoundManager;
    }, function (_unresolved_9) {
      DiceResultOverlay = _unresolved_9.DiceResultOverlay;
    }, function (_unresolved_10) {
      RelicPoemModal = _unresolved_10.RelicPoemModal;
    }, function (_unresolved_11) {
      WhiteCrowCard = _unresolved_11.WhiteCrowCard;
    }, function (_unresolved_12) {
      ChapterStoryModal = _unresolved_12.ChapterStoryModal;
    }, function (_unresolved_13) {
      DonationTracker = _unresolved_13.DonationTracker;
    }, function (_unresolved_14) {
      EventCalendar = _unresolved_14.EventCalendar;
    }, function (_unresolved_15) {
      MusicDiscController = _unresolved_15.MusicDiscController;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "eb486tMMmpF35bD/VzV2ss8", "MainGameController", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator); // ── 組件 ─────────────────────────────────────────────────────────────────────

      _export("MainGameController", MainGameController = (_dec = ccclass('MainGameController'), _dec2 = property(_crd && MapController === void 0 ? (_reportPossibleCrUseOfMapController({
        error: Error()
      }), MapController) : MapController), _dec3 = property(_crd && HUDController === void 0 ? (_reportPossibleCrUseOfHUDController({
        error: Error()
      }), HUDController) : HUDController), _dec4 = property([Node]), _dec5 = property(Node), _dec6 = property(_crd && InventoryPanel === void 0 ? (_reportPossibleCrUseOfInventoryPanel({
        error: Error()
      }), InventoryPanel) : InventoryPanel), _dec7 = property(_crd && ItemDetailModal === void 0 ? (_reportPossibleCrUseOfItemDetailModal({
        error: Error()
      }), ItemDetailModal) : ItemDetailModal), _dec8 = property(_crd && NPCModal === void 0 ? (_reportPossibleCrUseOfNPCModal({
        error: Error()
      }), NPCModal) : NPCModal), _dec9 = property(_crd && DiceResultOverlay === void 0 ? (_reportPossibleCrUseOfDiceResultOverlay({
        error: Error()
      }), DiceResultOverlay) : DiceResultOverlay), _dec10 = property(_crd && RelicPoemModal === void 0 ? (_reportPossibleCrUseOfRelicPoemModal({
        error: Error()
      }), RelicPoemModal) : RelicPoemModal), _dec11 = property(_crd && WhiteCrowCard === void 0 ? (_reportPossibleCrUseOfWhiteCrowCard({
        error: Error()
      }), WhiteCrowCard) : WhiteCrowCard), _dec12 = property(_crd && ChapterStoryModal === void 0 ? (_reportPossibleCrUseOfChapterStoryModal({
        error: Error()
      }), ChapterStoryModal) : ChapterStoryModal), _dec13 = property(_crd && DonationTracker === void 0 ? (_reportPossibleCrUseOfDonationTracker({
        error: Error()
      }), DonationTracker) : DonationTracker), _dec14 = property(_crd && EventCalendar === void 0 ? (_reportPossibleCrUseOfEventCalendar({
        error: Error()
      }), EventCalendar) : EventCalendar), _dec15 = property(_crd && MusicDiscController === void 0 ? (_reportPossibleCrUseOfMusicDiscController({
        error: Error()
      }), MusicDiscController) : MusicDiscController), _dec(_class = (_class2 = class MainGameController extends Component {
        constructor(...args) {
          super(...args);

          // ── Inspector 插座 ────────────────────────────────────────────────────────

          /** 地圖總管 */
          _initializerDefineProperty(this, "mapController", _descriptor, this);

          /** HUD 總管 */
          _initializerDefineProperty(this, "hudController", _descriptor2, this);

          /** 固定 NPC 節點（黑心商人 / 旅店老闆 / 寵物商人 / 道具商人）
           *  ⚠️ 節點名稱必須與 npc_role 欄位值完全一致，如 'inn_owner', 'black_merchant'
           */
          _initializerDefineProperty(this, "fixedNpcNodes", _descriptor3, this);

          /** 移動 NPC：人販子（節點名稱需設為 'trafficker'）*/
          _initializerDefineProperty(this, "traffickerNode", _descriptor4, this);

          /** 背包面板 */
          _initializerDefineProperty(this, "inventoryPanel", _descriptor5, this);

          /** 道具詳情 Modal */
          _initializerDefineProperty(this, "itemDetailModal", _descriptor6, this);

          /** NPC 互動 Modal */
          _initializerDefineProperty(this, "npcModal", _descriptor7, this);

          /** D20 擲骰結果覆蓋層 */
          _initializerDefineProperty(this, "diceOverlay", _descriptor8, this);

          /** 遺物詩歌彈窗 */
          _initializerDefineProperty(this, "relicPoemModal", _descriptor9, this);

          /**
           * 白鴉卡片組件節點（用於監聽 'show-relic-poem' 彩蛋事件）。
           * ⚠️ 請將場景中掛有 WhiteCrowCard 組件的節點拖入此插座。
           */
          _initializerDefineProperty(this, "whiteCrowCard", _descriptor10, this);

          /** 章節劇情彈窗 */
          _initializerDefineProperty(this, "chapterStoryModal", _descriptor11, this);

          /** 捐獻追蹤器 */
          _initializerDefineProperty(this, "donationTracker", _descriptor12, this);

          /** 企劃日曆 */
          _initializerDefineProperty(this, "eventCalendar", _descriptor13, this);

          /** 音樂磁片控制器 */
          _initializerDefineProperty(this, "musicDiscController", _descriptor14, this);

          // ── 私有狀態 (章節與遊戲階段) ─────────────────────────────────────────────
          this._gamePhase = 'battle';
          this._currentChapter = 1;
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._registerEvents();

          this._registerNpcEvents();

          this._registerRelicEvents();

          this.initNPCs();
        }

        async start() {
          // 🛡️ 登入守衛：防止玩家繞過登入畫面
          if (!(_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).getPlayer()) {
            console.warn('[MainGameController] 尚未登入，重新導向登入場景');
            director.loadScene('LoginScene'); // ⚠️ 確認你的登入場景名稱

            return;
          }

          await this._loadInventory();
          await this._initGameState(); // <-- 新增：啟動時取得伺服器最新章節狀態

          this._startRealtimeListener(); // <-- 新增：開始 60 秒輪詢
          // 👇 新增這兩行：喚醒新組件 👇


          if (this.donationTracker) this.donationTracker.initForChapter(this._currentChapter);
          if (this.eventCalendar) this.eventCalendar.refresh(); // 👆 ──────────────────── 👆
        }

        onDestroy() {
          var _this$mapController, _this$hudController, _this$inventoryPanel, _this$itemDetailModal, _this$npcModal, _this$npcModal2, _this$whiteCrowCard;

          (_this$mapController = this.mapController) == null || _this$mapController.node.off('landmark-selected', this._onLandmarkSelected, this);
          (_this$hudController = this.hudController) == null || _this$hudController.node.off('panel-open', this._onPanelOpen, this);
          (_this$inventoryPanel = this.inventoryPanel) == null || _this$inventoryPanel.node.off('show-item-detail', this._onShowItemDetail, this);
          (_this$itemDetailModal = this.itemDetailModal) == null || _this$itemDetailModal.node.off('use-item', this._onUseItem, this);
          (_this$npcModal = this.npcModal) == null || _this$npcModal.node.off('npc-action', this._onNpcAction, this);
          (_this$npcModal2 = this.npcModal) == null || _this$npcModal2.node.off('buy-item', this._onBuyItem, this);
          (_this$whiteCrowCard = this.whiteCrowCard) == null || _this$whiteCrowCard.node.off('show-relic-poem', this._onShowRelicPoem, this);

          this._unregisterNpcEvents();

          this._stopRealtimeListener(); // <-- 新增：記得關閉輪詢

        } // ── 事件串接：地圖與 HUD ──────────────────────────────────────────────────


        _registerEvents() {
          if (!this.mapController) {
            console.warn('[MainGameController] mapController 未綁定');
            return;
          }

          if (!this.hudController) {
            console.warn('[MainGameController] hudController 未綁定');
            return;
          }

          this.mapController.node.on('landmark-selected', this._onLandmarkSelected, this);
          this.hudController.node.on('panel-open', this._onPanelOpen, this);
        }

        _onLandmarkSelected(landmarkId) {
          console.log(`[MainGameController] 準備開啟據點 ${landmarkId} 劇情`); // TODO：呼叫劇情 Modal，傳入 landmarkId
        }

        _onPanelOpen(panelId) {
          console.log(`[MainGameController] 準備開啟 ${panelId} 面板`); // TODO：顯示對應面板節點
        } // ── 事件串接：NPC 點擊 ────────────────────────────────────────────────────

        /**
         * 為所有 NPC 節點綁定點擊事件。
         * 節點名稱（node.name）即為 npcId，須與 CLAUDE.md npc_role 欄位值一致。
         */


        _registerNpcEvents() {
          const npcNodes = [...this.fixedNpcNodes.filter(n => !!n)];
          if (this.traffickerNode) npcNodes.push(this.traffickerNode);

          for (const npcNode of npcNodes) {
            npcNode.targetOff(this);
            npcNode.on(Node.EventType.TOUCH_END, () => this._onNpcNodeTap(npcNode), this);
          } // NPC 行動事件（由 NPCModal 廣播，主場景處理業務邏輯）


          if (this.npcModal) {
            this.npcModal.node.targetOff(this);
            this.npcModal.node.on('npc-action', this._onNpcAction, this);
            this.npcModal.node.on('buy-item', this._onBuyItem, this);
          }
        }

        _unregisterNpcEvents() {
          const npcNodes = [...this.fixedNpcNodes.filter(n => !!n)];
          if (this.traffickerNode) npcNodes.push(this.traffickerNode);

          for (const npcNode of npcNodes) npcNode.targetOff(this);
        }

        _onNpcNodeTap(npcNode) {
          if (!this.npcModal) {
            console.warn('[MainGameController] npcModal 未綁定');
            return;
          }

          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).panelOpen(); // node.name 即為 npcId（美術設定節點名稱時需遵守此命名規則）

          this.npcModal.init(npcNode.name);
        } // ── NPC 行動業務邏輯 ──────────────────────────────────────────────────────


        _onNpcAction(npcId) {
          switch (npcId) {
            case 'inn_owner':
              this._handleInnHeal();

              break;

            default:
              console.log(`[MainGameController] npc-action 未處理的 npcId：${npcId}`);
              break;
          }
        }

        _onBuyItem(item) {
          const result = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).purchaseItem(item);

          if (!result.success) {
            console.log(`[MainGameController] 金幣不足：${item.name}`);
            return;
          }

          (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
            error: Error()
          }), SoundManager) : SoundManager).coin();
          console.log(`[MainGameController] ${result.message}`); // TODO：呼叫 POST /api/inventory/buy，傳入 item.id，後端寫入資料庫
          // 即時刷新背包顯示

          if (this.inventoryPanel) {
            this.inventoryPanel.init([...(_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
              error: Error()
            }), DataManager) : DataManager).getInventory()]);
          }
        } // ── 遺物詩歌彩蛋 ──────────────────────────────────────────────────────────


        _registerRelicEvents() {
          if (!this.whiteCrowCard) return;
          this.whiteCrowCard.node.on('show-relic-poem', this._onShowRelicPoem, this);
        }

        _onShowRelicPoem() {
          if (!this.relicPoemModal) {
            console.warn('[MainGameController] relicPoemModal 未綁定');
            return;
          } // 「昔日的餘溫」全收集解鎖詩篇
          // 詩歌文字在此定義，保持 RelicPoemModal 可複用


          const poem = '灰燼尚存一息暖，\n' + '記憶比塵更難散。\n' + '白鴉銜著舊時光，\n' + '落在無人問津的岸。';
          const author = '── 無名者手稿，殘頁';
          this.relicPoemModal.init(poem, author);
        }

        _handleInnHeal() {
          const player = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).getPlayer();
          const HEAL_COST = 2;
          const HEAL_AMOUNT = 10;
          const DICE_TARGET = 10;

          if (!player || player.coins < HEAL_COST) {
            console.log('[MainGameController] 金幣不足，無法休息');
            return;
          }

          if (!this.diceOverlay) {
            console.warn('[MainGameController] diceOverlay 未綁定');
            return;
          }

          (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).updateCoins(-HEAL_COST); // 單次監聽，避免重複觸發

          this.diceOverlay.node.once('dice-finished', result => {
            if (result.success) {
              (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
                error: Error()
              }), DataManager) : DataManager).updateHP(HEAL_AMOUNT); // TODO：換用 SoundManager.heal() 當音效建立後

              (_crd && SoundManager === void 0 ? (_reportPossibleCrUseOfSoundManager({
                error: Error()
              }), SoundManager) : SoundManager).panelOpen();
              console.log(`[MainGameController] 擲出 ${result.rollResult}，治療成功，恢復 ${HEAL_AMOUNT} HP`);
            } else {
              console.log(`[MainGameController] 擲出 ${result.rollResult}，治療失敗`);
            }
          });
          this.diceOverlay.rollDice(DICE_TARGET);
        } // ── 背包 ──────────────────────────────────────────────────────────────────


        async _loadInventory() {
          if (!this.inventoryPanel) return;
          const items = await (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).fetchInventory();
          this.inventoryPanel.init(items);

          if (this.inventoryPanel) {
            this.inventoryPanel.node.targetOff(this);
            this.inventoryPanel.node.on('show-item-detail', this._onShowItemDetail, this);
          }

          if (this.itemDetailModal) {
            this.itemDetailModal.node.targetOff(this);
            this.itemDetailModal.node.on('use-item', this._onUseItem, this);
          }
        }

        _onShowItemDetail(data) {
          if (!this.itemDetailModal) return;
          this.itemDetailModal.init(data);
        }

        async _onUseItem(data) {
          console.log(`[MainGameController] 呼叫 API：消耗道具 ${data.name}`); // TODO：呼叫 POST /api/inventory/use，傳入 data.id
          // 使用後刷新背包

          await this._loadInventory();
        } // ── NPC 佈署 ──────────────────────────────────────────────────────────────

        /**
         * 初始化所有 NPC 的顯示狀態與位置。
         * 固定 NPC 座標由美術於編輯器設定，此處只確保啟用。
         * 移動 NPC（人販子）依玩家當前據點動態定位。
         */


        initNPCs() {
          this._initFixedNpcs();

          this._initTrafficker();
        }

        _initFixedNpcs() {
          for (const npcNode of this.fixedNpcNodes) {
            if (npcNode) npcNode.active = true;
          }
        }

        _initTrafficker() {
          if (!this.traffickerNode) return;
          const player = (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).getPlayer();
          const landmarkId = player == null ? void 0 : player.current_landmark_id;

          if (!landmarkId || !this.mapController) {
            this.traffickerNode.active = false;
            return;
          }

          const worldPos = this.mapController.getLandmarkWorldPos(landmarkId);

          if (!worldPos) {
            this.traffickerNode.active = false;
            return;
          } // 微調偏移：x+3, y-4（避免與據點圖標完全重疊）


          this.traffickerNode.setWorldPosition(new Vec3(worldPos.x + 3, worldPos.y - 4, 0));
          this.traffickerNode.active = true;
        } // ── 章節與遊戲狀態管理 (新增區塊) ───────────────────────────────────────────


        async _initGameState() {
          const state = await (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).fetchGameState();

          if (state) {
            this._currentChapter = state.current_chapter;
            this._gamePhase = state.phase;

            this._handlePhaseChange(this._gamePhase);
          }
        }

        _startRealtimeListener() {
          // 每 60 秒輪詢一次，節省效能與 API 額度
          this.schedule(this._pollGameState, 60.0);
        }

        _stopRealtimeListener() {
          this.unschedule(this._pollGameState);
        }

        async _pollGameState() {
          const state = await (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).fetchGameState();

          if (state) {
            if (state.phase !== this._gamePhase) {
              this._gamePhase = state.phase;
              this._currentChapter = state.current_chapter;

              this._handlePhaseChange(state.phase);
            }
          }
        }

        _handlePhaseChange(phase) {
          switch (phase) {
            case 'battle':
              this._loadNewChapter(this._currentChapter);

              this._hideStoryButton(); // 新章節開始時，重置本週捐獻次數


              if (this.donationTracker) this.donationTracker.resetForNewChapter(this._currentChapter);
              break;

            case 'story':
              this._showStoryButton(this._currentChapter);

              this._lockLandmarks();

              break;

            case 'transition':
              this._showWaitingScreen();

              break;
          }
        } // (這裡接續你原本的 private _showStoryButton ...)


        _showStoryButton(chapterNumber) {
          if (!this.hudController) return;
          this.hudController.showChapterStoryButton(chapterNumber); // 綁定 HUD 發出的點擊事件

          this.hudController.node.once('chapter-story-click', () => {
            this._playChapterStory(chapterNumber);
          });
        }

        _hideStoryButton() {
          if (this.hudController) {
            this.hudController.hideChapterStoryButton();
          }
        }

        async _playChapterStory(chapterNumber) {
          const story = await (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).fetchChapterStory(chapterNumber);

          if (!story) {
            console.warn('[MainGameController] 找不到章節劇情');
            return;
          }

          if (this.chapterStoryModal) {
            this.chapterStoryModal.init({
              chapter: chapterNumber,
              title: story.title,
              content: story.content,
              bgImageUrl: story.bg_image_url,
              bgMusicUrl: story.bg_music_url,
              winnerFaction: story.winner_faction
            });
            this.chapterStoryModal.node.active = true;
          }

          this._markStoryWatched(chapterNumber);
        }

        async _loadNewChapter(chapterNumber) {
          console.log(`[MainGameController] 準備載入第 ${chapterNumber} 章地圖 (待實作 DataManager 串接)`); // TODO: 呼叫 DataManager 取得新章節據點並傳給 mapController
        }

        _lockLandmarks() {
          if (!this.mapController) return;
          const landmarkIds = this.mapController.landmarkIds;

          for (const id of landmarkIds) {
            const landmark = this.mapController.getLandmark(id);

            if (landmark) {
              const oldData = landmark['_data'];

              if (oldData) {
                // 讓據點變成灰色關閉狀態，而不是直接消失
                landmark.init({ ...oldData,
                  status: 'closed'
                });
              }
            }
          }
        }

        _showWaitingScreen() {
          console.log('[MainGameController] 等待新章節開始'); // TODO: 實作等待畫面 UI
        }

        _markStoryWatched(chapterNumber) {
          console.log(`[MainGameController] 玩家已觀看第 ${chapterNumber} 章劇情`);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "mapController", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "hudController", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "fixedNpcNodes", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "traffickerNode", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "inventoryPanel", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "itemDetailModal", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "npcModal", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "diceOverlay", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "relicPoemModal", [_dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "whiteCrowCard", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "chapterStoryModal", [_dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "donationTracker", [_dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "eventCalendar", [_dec14], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "musicDiscController", [_dec15], {
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
//# sourceMappingURL=a7fa634c469c10b48ead3c8f01cb1db364cb884d.js.map