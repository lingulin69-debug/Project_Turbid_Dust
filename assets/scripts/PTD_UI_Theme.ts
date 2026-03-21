import { Color, Material, Sprite } from 'cc';

export const PTD_UI_THEME = {
    Pure: {
        bgBase: new Color(217, 215, 197),
        textPrimary: new Color(90, 78, 68),
        textSecondary: new Color(139, 115, 85),
        primary: new Color(184, 159, 134),
        border: new Color(184, 159, 134, 77),    // rgba(184,159,134,0.3)
        shadowLg: new Color(100, 90, 75, 46),    // rgba(100,90,75,0.18)
        shadowMd: new Color(100, 90, 75, 38),    // rgba(100,90,75,0.15)
    },
    Turbid: {
        bgBase: new Color(19, 8, 38),
        textPrimary: new Color(228, 213, 245),
        textSecondary: new Color(197, 168, 224),
        primary: new Color(155, 89, 182),
        border: new Color(124, 58, 237, 102),    // rgba(124,58,237,0.4)
        shadowLg: new Color(30, 0, 80, 140),     // rgba(30,0,80,0.55)
        shadowMd: new Color(30, 0, 80, 89),      // rgba(30,0,80,0.35)
    },
} as const;

export type FactionType = 'Pure' | 'Turbid';
export type ThemeType = typeof PTD_UI_THEME[FactionType];

export function getPageTheme(faction: FactionType): ThemeType {
    return PTD_UI_THEME[faction];
}

/** 預留 Shader / Material 切換接口（後續美術資源到位後填入） */
export function applyFactionMaterial(
    sprite: Sprite,
    faction: FactionType,
    turbidMaterial: Material | null,
    pureMaterial: Material | null,
): void {
    const mat = faction === 'Turbid' ? turbidMaterial : pureMaterial;
    if (mat) {
        sprite.customMaterial = mat;
        // Shader Uniform 預留點（後續填入）
        // mat.setProperty('u_crackIntensity', 0.0);
        // mat.setProperty('u_fogDensity', 0.0);
    }
}
