System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Prefab, instantiate, JsonAsset, resources, MapLandmark, DataManager, _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2, _crd, ccclass, property, MapController;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfMapLandmark(extras) {
    _reporterNs.report("MapLandmark", "./MapLandmark", _context.meta, extras);
  }

  function _reportPossibleCrUseOfLandmarkData(extras) {
    _reporterNs.report("LandmarkData", "./MapLandmark", _context.meta, extras);
  }

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
      Prefab = _cc.Prefab;
      instantiate = _cc.instantiate;
      JsonAsset = _cc.JsonAsset;
      resources = _cc.resources;
    }, function (_unresolved_2) {
      MapLandmark = _unresolved_2.MapLandmark;
    }, function (_unresolved_3) {
      DataManager = _unresolved_3.DataManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c7191CbWJtA5pZDJr/RZOa/", "MapController", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Prefab', 'instantiate', 'JsonAsset', 'resources']);

      ({
        ccclass,
        property
      } = _decorator); // ── 組件 ─────────────────────────────────────────────────────────────────────

      _export("MapController", MapController = (_dec = ccclass('MapController'), _dec2 = property(Node), _dec3 = property(Prefab), _dec(_class = (_class2 = class MapController extends Component {
        constructor(...args) {
          super(...args);

          // ── Inspector 屬性 ────────────────────────────────────────────────────────

          /** 地圖根節點，所有據點節點掛在此下方 */
          _initializerDefineProperty(this, "mapRoot", _descriptor, this);

          /** 據點 Prefab（含 MapLandmark 元件） */
          _initializerDefineProperty(this, "landmarkPrefab", _descriptor2, this);

          // ── 私有狀態 ──────────────────────────────────────────────────────────────

          /** id → MapLandmark 元件 */
          this._landmarks = new Map();
        }

        // ── 生命週期 ──────────────────────────────────────────────────────────────
        onLoad() {
          this._loadLandmarkData();
        } // ── 資料載入 ──────────────────────────────────────────────────────────────

        /**
         * 從 resources/data/landmark-chapters.json 讀取第一章據點資料並初始化。
         * 若需動態切換章節，外部呼叫 loadChapter(chapterIndex) 即可。
         */


        _loadLandmarkData() {
          resources.load('data/landmark-chapters', JsonAsset, (err, asset) => {
            var _chapters;

            if (err) {
              console.warn('[MapController] 無法載入 landmark-chapters.json', err);
              return;
            }

            const chapters = (_chapters = asset.json.chapters) != null ? _chapters : [];

            if (chapters.length > 0) {
              this.loadChapter(chapters, 0);
            }
          });
        }
        /**
         * 載入指定章節的所有據點。
         * @param chapters 從 JSON 解析的章節陣列
         * @param index    章節索引（0-based）
         */


        loadChapter(chapters, index) {
          const chapter = chapters[index];

          if (!chapter) {
            console.warn(`[MapController] 章節 ${index} 不存在`);
            return;
          }

          this._clearLandmarks();

          this._spawnLandmarks(chapter.landmarks);

          (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).syncLandmarks(chapter.landmarks);
        } // ── 據點生成 ──────────────────────────────────────────────────────────────


        _spawnLandmarks(dataList) {
          if (!this.mapRoot || !this.landmarkPrefab) {
            console.warn('[MapController] mapRoot 或 landmarkPrefab 未設定');
            return;
          }

          for (const data of dataList) {
            const node = instantiate(this.landmarkPrefab);
            node.setPosition(data.x, data.y, 0);
            this.mapRoot.addChild(node);
            const lm = node.getComponent(_crd && MapLandmark === void 0 ? (_reportPossibleCrUseOfMapLandmark({
              error: Error()
            }), MapLandmark) : MapLandmark);

            if (!lm) {
              console.warn(`[MapController] Prefab 缺少 MapLandmark 元件（id: ${data.id}）`);
              continue;
            }

            lm.init(data);
            node.on('landmark-clicked', this._onLandmarkClicked, this);

            this._landmarks.set(data.id, lm);
          }
        } // ── 據點清理 ──────────────────────────────────────────────────────────────


        _clearLandmarks() {
          for (const lm of this._landmarks.values()) {
            lm.node.off('landmark-clicked', this._onLandmarkClicked, this);
            lm.node.destroy();
          }

          this._landmarks.clear();
        } // ── 事件處理 ──────────────────────────────────────────────────────────────


        _onLandmarkClicked(landmarkId) {
          // 向上冒泡給主場景（MapTestView）處理劇情 Modal
          this.node.emit('landmark-selected', landmarkId);
        } // ── 公開 API ──────────────────────────────────────────────────────────────

        /** 取得單一據點元件（供 NPC 移動等功能查詢座標用）。 */


        getLandmark(id) {
          return this._landmarks.get(id);
        }
        /** 取得據點節點的世界座標（NPC 跟隨定位用）。 */


        getLandmarkWorldPos(id) {
          const lm = this._landmarks.get(id);

          if (!lm) return null;
          const wp = lm.node.getWorldPosition();
          return {
            x: wp.x,
            y: wp.y
          };
        }
        /**
         * 從外部更新單一據點資料（Supabase Realtime 推送後呼叫）。
         * 重新呼叫 lm.init() 以刷新視覺狀態。
         */


        updateLandmark(data) {
          const lm = this._landmarks.get(data.id);

          if (!lm) return;
          lm.init(data); // 同步更新 DataManager 快照

          (_crd && DataManager === void 0 ? (_reportPossibleCrUseOfDataManager({
            error: Error()
          }), DataManager) : DataManager).syncLandmarks([...this._landmarks.values()].map(l => l['_data']).filter(Boolean));
        }
        /** 所有已載入的據點 id 清單。 */


        get landmarkIds() {
          return [...this._landmarks.keys()];
        } // ── 生命週期清理 ──────────────────────────────────────────────────────────


        onDestroy() {
          this._clearLandmarks();
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "mapRoot", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "landmarkPrefab", [_dec3], {
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
//# sourceMappingURL=dbdfd6d5861d6e39ec960e46bdd003ade99464ea.js.map