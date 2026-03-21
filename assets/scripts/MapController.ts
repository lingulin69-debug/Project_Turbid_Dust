import {
    _decorator,
    Component,
    Node,
    Prefab,
    instantiate,
    JsonAsset,
    resources,
} from 'cc';
import { MapLandmark, LandmarkData } from './MapLandmark';
import { DataManager } from './PTD_DataManager';

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

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
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
        if (!this.mapRoot || !this.landmarkPrefab) {
            console.warn('[MapController] mapRoot 或 landmarkPrefab 未設定');
            return;
        }

        for (const data of dataList) {
            const node = instantiate(this.landmarkPrefab);
            node.setPosition(data.x, data.y, 0);
            this.mapRoot.addChild(node);

            const lm = node.getComponent(MapLandmark);
            if (!lm) {
                console.warn(`[MapController] Prefab 缺少 MapLandmark 元件（id: ${data.id}）`);
                continue;
            }

            lm.init(data);
            node.on('landmark-clicked', this._onLandmarkClicked, this);
            this._landmarks.set(data.id, lm);
        }
    }

    // ── 據點清理 ──────────────────────────────────────────────────────────────

    private _clearLandmarks(): void {
        for (const lm of this._landmarks.values()) {
            lm.node.off('landmark-clicked', this._onLandmarkClicked, this);
            lm.node.destroy();
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
            [...this._landmarks.values()].map(l => (l as any)['_data'] as LandmarkData).filter(Boolean),
        );
    }

    /** 所有已載入的據點 id 清單。 */
    get landmarkIds(): string[] {
        return [...this._landmarks.keys()];
    }

    // ── 生命週期清理 ──────────────────────────────────────────────────────────

    onDestroy(): void {
        this._clearLandmarks();
    }
}
