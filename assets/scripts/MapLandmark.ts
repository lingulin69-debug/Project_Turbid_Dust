import {
    _decorator,
    Color,
    Component,
    EventMouse,
    Label,
    Material,
    Node,
    Sprite,
} from 'cc';
import { applyFactionMaterial, FactionType } from './PTD_UI_Theme';

const { ccclass, property } = _decorator;

// ── 資料介面 ────────────────────────────────────────────────────────────────

export type LandmarkType = 'town' | 'hospital' | 'church' | 'school' | 'default';

export interface LandmarkData {
    id: string;
    name: string;
    x: number;          // 地圖節點本地座標
    y: number;
    faction: FactionType | 'Common';
    status: 'open' | 'closed';
    type?: LandmarkType;
    occupants?: number;
    capacity?: number;
}

// ── 顏色常數 ─────────────────────────────────────────────────────────────────

const COLOR_FULL    = new Color(255, 80,  80,  255);  // 已滿 → 紅
const COLOR_VACANT  = new Color(80,  220, 120, 255);  // 未滿 → 綠
const COLOR_CLOSED  = new Color(180, 180, 180, 100);  // closed → 半透明灰

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('MapLandmark')
export class MapLandmark extends Component {

    // ── 暴露給 Inspector 的 UI 節點 ──────────────────────────────────────────

    @property(Node)
    tooltipNode: Node = null;

    @property(Label)
    occupantsLabel: Label = null;

    @property(Label)
    nameLabel: Label = null;

    @property(Sprite)
    baseSprite: Sprite = null;

    // ── Shader / Material 預留接口 ────────────────────────────────────────────

    @property(Material)
    turbidMaterial: Material = null;

    @property(Material)
    pureMaterial: Material = null;

    // ── 私有狀態 ──────────────────────────────────────────────────────────────

    private _data: LandmarkData | null = null;

    // ── 公開初始化 ────────────────────────────────────────────────────────────

    init(data: LandmarkData): void {
        this._data = data;
        this._applyVisual();
        this._registerEvents();
    }

    // ── 視覺初始化 ────────────────────────────────────────────────────────────

    private _applyVisual(): void {
        const data = this._data;
        if (!data) return;

        // 名稱
        if (this.nameLabel) {
            this.nameLabel.string = data.name ?? '';
        }

        // closed 狀態 → 整體灰化
        if (this.baseSprite) {
            this.baseSprite.color = data.status === 'closed' ? COLOR_CLOSED : Color.WHITE;
        }

        // tooltip 預設隱藏
        if (this.tooltipNode) {
            this.tooltipNode.active = false;
        }

        // Shader / Material 切換（只在明確陣營時套用）
        if (data.faction !== 'Common' && this.baseSprite) {
            applyFactionMaterial(
                this.baseSprite,
                data.faction as FactionType,
                this.turbidMaterial,
                this.pureMaterial,
            );
        }
    }

// ── 事件註冊 ──────────────────────────────────────────────────────────────

    private _registerEvents(): void {
        // [新增這行] 確保重複 init 時，不會綁定兩層一樣的事件
        this.node.targetOff(this); 
        
        this.node.on(Node.EventType.MOUSE_ENTER, this._onHoverEnter, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this._onHoverLeave, this);
        this.node.on(Node.EventType.TOUCH_END,   this._onTouchEnd,   this);
    }
    
    // ── Hover 邏輯 ────────────────────────────────────────────────────────────

    private _onHoverEnter(_e: EventMouse): void {
        const data = this._data;
        if (!data || !this.tooltipNode) return;

        this.tooltipNode.active = true;

        // 人數文字 & 顏色
        if (this.occupantsLabel && data.capacity != null) {
            const occ = data.occupants ?? 0;
            const isFull = occ >= data.capacity;
            this.occupantsLabel.string = isFull
                ? `${occ}/${data.capacity} 已滿`
                : `${occ}/${data.capacity}`;
            this.occupantsLabel.color = isFull ? COLOR_FULL : COLOR_VACANT;
        } else if (this.occupantsLabel) {
            this.occupantsLabel.string = '';
        }
    }

    private _onHoverLeave(_e: EventMouse): void {
        if (this.tooltipNode) {
            this.tooltipNode.active = false;
        }
    }

    // ── 點擊事件 ──────────────────────────────────────────────────────────────

    private _onTouchEnd(): void {
        const data = this._data;
        if (!data || data.status !== 'open') return;

        // 透過 emit 向上冒泡，主場景用 node.on('landmark-clicked', ...) 接收
        this.node.emit('landmark-clicked', data.id);
    }

    // ── 生命週期清理 ──────────────────────────────────────────────────────────

    onDestroy(): void {
        this.node.off(Node.EventType.MOUSE_ENTER, this._onHoverEnter, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this._onHoverLeave, this);
        this.node.off(Node.EventType.TOUCH_END,   this._onTouchEnd,   this);
    }
}
