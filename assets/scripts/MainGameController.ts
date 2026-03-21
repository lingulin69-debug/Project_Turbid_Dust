import {
    _decorator,
    Component,
    Node,
    Vec3,
} from 'cc';
import { MapController } from './MapController';
import { HUDController, HUDPanelId } from './HUDController';
import { DataManager } from './PTD_DataManager';

const { ccclass, property } = _decorator;

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('MainGameController')
export class MainGameController extends Component {

    // ── Inspector 屬性 ────────────────────────────────────────────────────────

    /** 地圖總管 */
    @property(MapController)
    mapController: MapController = null;

    /** HUD 總管 */
    @property(HUDController)
    hudController: HUDController = null;

    /** 固定 NPC 節點（黑心商人 / 旅店老闆 / 寵物商人 / 道具商人）*/
    @property([Node])
    fixedNpcNodes: Node[] = [];

    /** 移動 NPC：人販子 */
    @property(Node)
    traffickerNode: Node = null;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        this._registerEvents();
        this.initNPCs();
    }

    onDestroy(): void {
        this.mapController?.node.off('landmark-selected', this._onLandmarkSelected, this);
        this.hudController?.node.off('panel-open', this._onPanelOpen, this);
    }

    // ── 事件串接 ──────────────────────────────────────────────────────────────

    private _registerEvents(): void {
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

    private _onLandmarkSelected(landmarkId: string): void {
        console.log(`[MainGameController] 準備開啟據點 ${landmarkId} 劇情`);
        // TODO：呼叫劇情 Modal，傳入 landmarkId
    }

    private _onPanelOpen(panelId: HUDPanelId): void {
        console.log(`[MainGameController] 準備開啟 ${panelId} 面板`);
        // TODO：顯示對應面板節點
    }

    // ── NPC 佈署 ──────────────────────────────────────────────────────────────

    /**
     * 初始化所有 NPC 的顯示狀態與位置。
     * 固定 NPC 座標由美術於編輯器設定，此處只確保啟用。
     * 移動 NPC（人販子）依玩家當前據點動態定位。
     */
    initNPCs(): void {
        this._initFixedNpcs();
        this._initTrafficker();
    }

    private _initFixedNpcs(): void {
        for (const npcNode of this.fixedNpcNodes) {
            if (npcNode) npcNode.active = true;
        }
    }

    private _initTrafficker(): void {
        if (!this.traffickerNode) return;

        // PlayerData 介面目前未宣告 current_landmark_id，以型別斷言讀取
        const player = DataManager.getPlayer() as (ReturnType<typeof DataManager.getPlayer> & { current_landmark_id?: string });
        const landmarkId = player?.current_landmark_id;

        if (!landmarkId || !this.mapController) {
            this.traffickerNode.active = false;
            return;
        }

        const worldPos = this.mapController.getLandmarkWorldPos(landmarkId);
        if (!worldPos) {
            this.traffickerNode.active = false;
            return;
        }

        // 微調偏移：x+3, y-4（避免與據點圖標完全重疊）
        this.traffickerNode.setWorldPosition(
            new Vec3(worldPos.x + 3, worldPos.y - 4, 0),
        );
        this.traffickerNode.active = true;
    }
}
