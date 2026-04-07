import {
    _decorator,
    Component,
    Node,
    Layers,
    Prefab,
    UITransform,
    Sprite,
    Label,
    Color,
    instantiate,
    JsonAsset,
    resources,
} from 'cc';
import { MapLandmark, LandmarkData } from './MapLandmark';
import { DataManager } from './PTD_DataManager';
import { getWhiteSpriteFrame } from './PTD_SpriteHelper';

const { ccclass, property } = _decorator;

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('MapController')
export class MapController extends Component {

    // ── Inspector 屬性 ────────────────────────────────────────────────────────

    /** 地圖根節點，所有據點節點掛在此下方 */
    @property(Node)
    mapRoot: Node = null;

    /** 據點 Prefab（含 MapLandmark 元件） */
    @property(Prefab)
    landmarkPrefab: Prefab = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    /** id → MapLandmark 元件 */
    private _landmarks: Map<string, MapLandmark> = new Map();
    private _uiLayer = Layers.Enum.UI_2D;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        // 若 Inspector 未綁定 mapRoot，自動指向自身節點（MapArea）
        if (!this.mapRoot) {
            this.mapRoot = this.node;
        }
        this._loadLandmarkData();
    }

    // ── 資料載入 ──────────────────────────────────────────────────────────────

    /**
     * 從 resources/data/landmark-chapters.json 讀取第一章據點資料並初始化。
     * 若需動態切換章節，外部呼叫 loadChapter(chapterIndex) 即可。
     */
    private _loadLandmarkData(): void {
        resources.load('data/landmark-chapters', JsonAsset, (err, asset) => {
            if (err) {
                console.warn('[MapController] 無法載入 landmark-chapters.json', err);
                return;
            }
            const chapters: { landmarks: LandmarkData[] }[] =
                (asset.json as any).chapters ?? [];
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
    loadChapter(
        chapters: { landmarks: LandmarkData[] }[],
        index: number,
    ): void {
        const chapter = chapters[index];
        if (!chapter) {
            console.warn(`[MapController] 章節 ${index} 不存在`);
            return;
        }
        this._clearLandmarks();
        this._spawnLandmarks(chapter.landmarks);
        DataManager.syncLandmarks(chapter.landmarks);
    }

    // ── 據點生成 ──────────────────────────────────────────────────────────────

    private _spawnLandmarks(dataList: LandmarkData[]): void {
        if (!this.mapRoot) {
            console.warn('[MapController] mapRoot 未設定');
            return;
        }

        const COLS = 4;               // 每列最多 4 個
        const SPACING_X = 200;
        const SPACING_Y = 160;
        const START_X = -300;
        const START_Y = 200;

        for (let i = 0; i < dataList.length; i++) {
            const data = dataList[i];
            let node: Node;

            if (this.landmarkPrefab) {
                node = instantiate(this.landmarkPrefab);
                this._setUILayerRecursive(node);
            } else {
                // 無 Prefab 時建立色塊佔位
                node = this._createPlaceholderLandmark(data);
            }

            // 若 JSON 沒有 x/y，自動排列成網格
            const px = data.x ?? (START_X + (i % COLS) * SPACING_X);
            const py = data.y ?? (START_Y - Math.floor(i / COLS) * SPACING_Y);
            node.setPosition(px, py, 0);
            this.mapRoot.addChild(node);

            let lm = node.getComponent(MapLandmark);
            if (!lm) {
                lm = node.addComponent(MapLandmark);
            }

            // 色塊模式下綁定 baseSprite / nameLabel 讓 _applyVisual 正常運作
            if (!this.landmarkPrefab) {
                lm.baseSprite = node.getComponent(Sprite);
                const labelChild = node.getChildByName('Label');
                if (labelChild) lm.nameLabel = labelChild.getComponent(Label);
            }

            lm.init(data);
            node.on('landmark-clicked', this._onLandmarkClicked, this);
            this._landmarks.set(data.id, lm);
        }
    }

    /**
     * 無 Prefab 時，用程式碼建立色塊佔位據點。
     */
    private _createPlaceholderLandmark(data: LandmarkData): Node {
        const node = new Node(`Landmark_${data.id}`);
        node.layer = this._uiLayer;

        // 色塊底板
        const ut = node.addComponent(UITransform);
        ut.setContentSize(60, 60);

        const sp = node.addComponent(Sprite);
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        sp.spriteFrame = getWhiteSpriteFrame();
        // open=藍, closed=灰
        sp.color = data.status === 'closed'
            ? new Color(120, 120, 120, 180)
            : new Color(70, 130, 230, 220);

        // 據點名稱標籤
        const labelNode = new Node('Label');
        labelNode.layer = this._uiLayer;
        const labelUt = labelNode.addComponent(UITransform);
        labelUt.setContentSize(80, 24);
        const lb = labelNode.addComponent(Label);
        lb.string = data.name ?? data.id;
        lb.fontSize = 14;
        lb.color = new Color(255, 255, 255, 255);
        lb.overflow = Label.Overflow.SHRINK;
        labelNode.setPosition(0, -42, 0);
        node.addChild(labelNode);

        return node;
    }

    private _setUILayerRecursive(node: Node): void {
        node.layer = this._uiLayer;
        for (const child of node.children) {
            this._setUILayerRecursive(child);
        }
    }

    // ── 據點清理 ──────────────────────────────────────────────────────────────

    private _clearLandmarks(): void {
        for (const lm of this._landmarks.values()) {
            if (lm.node?.isValid) {
                lm.node.off('landmark-clicked', this._onLandmarkClicked, this);
                lm.node.destroy();
            }
        }
        this._landmarks.clear();
    }

    // ── 事件處理 ──────────────────────────────────────────────────────────────

    private _onLandmarkClicked(landmarkId: string): void {
        // 向上冒泡給主場景（MapTestView）處理劇情 Modal
        this.node.emit('landmark-selected', landmarkId);
    }

    // ── 公開 API ──────────────────────────────────────────────────────────────

    /** 取得單一據點元件（供 NPC 移動等功能查詢座標用）。 */
    getLandmark(id: string): MapLandmark | undefined {
        return this._landmarks.get(id);
    }

    /** 取得據點節點的世界座標（NPC 跟隨定位用）。 */
    getLandmarkWorldPos(id: string): { x: number; y: number } | null {
        const lm = this._landmarks.get(id);
        if (!lm) return null;
        const wp = lm.node.getWorldPosition();
        return { x: wp.x, y: wp.y };
    }

    /**
     * 從外部更新單一據點資料（Supabase Realtime 推送後呼叫）。
     * 重新呼叫 lm.init() 以刷新視覺狀態。
     */
    updateLandmark(data: LandmarkData): void {
        const lm = this._landmarks.get(data.id);
        if (!lm) return;
        lm.init(data);
        // 同步更新 DataManager 快照
        DataManager.syncLandmarks(
            [...this._landmarks.values()].map(l => l.landmarkData).filter((d): d is LandmarkData => d !== null),
        );
    }

    /** 所有已載入的據點 id 清單。 */
    get landmarkIds(): string[] {
        return [...this._landmarks.keys()];
    }

    // ── 生命週期清理 ──────────────────────────────────────────────────────────

    onDestroy(): void {
        // 只解除事件，不手動 destroy（場景銷毀時會自動清理子節點）
        for (const lm of this._landmarks.values()) {
            if (lm.node?.isValid) {
                lm.node.off('landmark-clicked', this._onLandmarkClicked, this);
            }
        }
        this._landmarks.clear();
    }
}
