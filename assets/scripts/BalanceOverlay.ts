import {
    _decorator,
    Color,
    Component,
    Label,
    Sprite,
    tween,
} from 'cc';
import {
    DataEventBus,
    DATA_EVENTS,
    DataManager,
    BalanceResult,
} from './PTD_DataManager';
import { PTD_UI_THEME, FactionType } from './PTD_UI_Theme';

const { ccclass, property } = _decorator;

// ── 常數 ──────────────────────────────────────────────────────────────────────

const TWEEN_DURATION  = 0.6;  // 進度條動畫時長（秒）
const COLOR_DRAW      = new Color(180, 170, 155, 255);  // 均勢：米灰色

// ── 組件 ─────────────────────────────────────────────────────────────────────

@ccclass('BalanceOverlay')
export class BalanceOverlay extends Component {

    // ── Inspector 插座 ────────────────────────────────────────────────────────

    /**
     * 濁息勢力進度條 Sprite。
     * ⚠️ 編輯器中此 Sprite 的 Type 必須設為「Filled」，
     *    Fill Dir 設為水平方向，才能用 fillRange 驅動動畫。
     */
    @property(Sprite)
    turbidBar: Sprite = null;

    /**
     * 淨塵勢力進度條 Sprite。
     * ⚠️ 同上，Type 設為「Filled」。
     */
    @property(Sprite)
    pureBar: Sprite = null;

    /** 顯示具體天平數值（如 -45 或 +20）*/
    @property(Label)
    balanceLabel: Label = null;

    /** 顯示當前佔優陣營名稱（濁息者 / 淨塵者 / 均勢）*/
    @property(Label)
    dominantFactionLabel: Label = null;

    // ── 生命週期 ──────────────────────────────────────────────────────────────

    onLoad(): void {
        DataEventBus.on(DATA_EVENTS.BALANCE_UPDATED, this._onBalanceUpdated, this);

        // 場景載入後立即渲染當前快照
        const initial = DataManager.calculateBalance();
        this._render(initial);
    }

    onDestroy(): void {
        DataEventBus.off(DATA_EVENTS.BALANCE_UPDATED, this._onBalanceUpdated, this);
    }

    // ── 事件接收 ──────────────────────────────────────────────────────────────

    private _onBalanceUpdated(result: BalanceResult): void {
        this._render(result);
    }

    // ── 視覺渲染 ──────────────────────────────────────────────────────────────

    private _render(result: BalanceResult): void {
        this._updateBars(result.balance_value);
        this._updateLabels(result);
    }

    /**
     * 以 fillRange 動畫更新兩條勢力進度條。
     *
     * 計算公式（balance_value 範圍 -100 ~ +100）：
     *   turbidBar.fillRange = (100 − balance_value) / 200
     *   pureBar.fillRange   = (100 + balance_value) / 200
     *
     * 範例：balance_value = -60（Turbid 優勢）
     *   → turbidBar = 0.8，pureBar = 0.2
     */
    private _updateBars(balanceValue: number): void {
        const turbidFill = (100 - balanceValue) / 200;
        const pureFill   = (100 + balanceValue) / 200;

        if (this.turbidBar) {
            tween(this.turbidBar)
                .to(TWEEN_DURATION, { fillRange: turbidFill })
                .start();
        }

        if (this.pureBar) {
            tween(this.pureBar)
                .to(TWEEN_DURATION, { fillRange: pureFill })
                .start();
        }
    }

    private _updateLabels(result: BalanceResult): void {
        // 天平數值：正數加 + 前綴讓讀取更直觀
        if (this.balanceLabel) {
            const sign  = result.balance_value > 0 ? '+' : '';
            this.balanceLabel.string = `${sign}${Math.round(result.balance_value)}`;
        }

        // 優勢陣營名稱與顏色
        if (this.dominantFactionLabel) {
            const { text, color } = this._getDominantDisplay(result.dominant);
            this.dominantFactionLabel.string = text;
            this.dominantFactionLabel.color  = color;
        }
    }

    private _getDominantDisplay(
        dominant: FactionType | 'Draw',
    ): { text: string; color: Color } {
        switch (dominant) {
            case 'Turbid':
                return {
                    text:  '濁息者',
                    color: PTD_UI_THEME.Turbid.textPrimary,
                };
            case 'Pure':
                return {
                    text:  '淨塵者',
                    color: PTD_UI_THEME.Pure.textPrimary,
                };
            default:
                return {
                    text:  '均勢',
                    color: COLOR_DRAW,
                };
        }
    }
}
