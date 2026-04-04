import { Texture2D, SpriteFrame, ImageAsset, math } from 'cc';

let _cachedSF: SpriteFrame | null = null;

/**
 * 取得一個純白 SpriteFrame（全域快取）。
 * 使用 HTML Canvas 產生白色圖片，再透過 ImageAsset → Texture2D → SpriteFrame 鏈路建立。
 * Cocos 程式化建立的 Sprite 若不設 spriteFrame 會完全不顯示，
 * 用此函式搭配 Sprite.color 即可顯示純色色塊。
 */
export function getWhiteSpriteFrame(): SpriteFrame {
    if (_cachedSF) return _cachedSF;

    // 用 HTML Canvas 產生一張 4×4 純白圖片
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, 4);

    const tex = new Texture2D();
    const imgAsset = new ImageAsset(canvas as any);
    tex.image = imgAsset;

    const sf = new SpriteFrame();
    sf.texture = tex;
    sf.rect = new math.Rect(0, 0, 4, 4);
    _cachedSF = sf;
    return sf;
}
