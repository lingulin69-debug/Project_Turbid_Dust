import React from 'react';

/**
 * PTD-UI 風格主題系統
 *
 * 用途:將 PTD-OLD 的所有介面元素套用白鴉之繭風格
 * 保持:所有功能、按鈕位置、框架不變
 * 改變:僅視覺樣式 (配色、字體、裝飾)
 */

// ═══════════════════════════════════════════════════════════════════════════
// Pure 淺色主題 (米黃金 · 聖潔)
// ═══════════════════════════════════════════════════════════════════════════

export const PTD_UI_THEME = {
  primary: '#b89f86',
  secondary: '#8b7355',
  factionGold: '#d4af37',

  bgBase: '#D9D7C5',
  bgGradient: 'linear-gradient(135deg, #f0ebe5 0%, #e2ddd5 100%)',
  cardBg: 'linear-gradient(180deg, #f5f2ed 0%, #ebe6dd 100%)',
  panelBg: 'rgba(217, 215, 197, 0.95)',

  border: 'rgba(184, 159, 134, 0.3)',
  borderSolid: '#b89f86',
  divider: 'rgba(184, 159, 134, 0.2)',

  borderRadius: '6px',
  borderRadiusSm: '6px',
  borderRadiusLg: '6px',

  textPrimary: '#5a4e44',
  textSecondary: '#8b7355',
  textMuted: 'rgba(139, 115, 85, 0.6)',

  buttonBg: 'rgba(255, 255, 255, 0.5)',
  buttonBorder: '#b89f86',
  buttonHover: 'rgba(255, 255, 255, 0.8)',

  inputBg: 'rgba(255, 255, 255, 0.4)',
  inputBorder: 'rgba(184, 159, 134, 0.3)',
  inputFocus: '#b89f86',

  tagBg: 'rgba(184, 159, 134, 0.2)',
  tagBorder: '#b89f86',
  tagText: '#5a4e44',

  success: '#7c9f7c',
  warning: '#d4af37',
  error: '#c0392b',
  disabled: 'rgba(139, 115, 85, 0.3)',
};

// ═══════════════════════════════════════════════════════════════════════════
// Turbid 深色主題 (暗紫黑 · 混沌)
// ═══════════════════════════════════════════════════════════════════════════

export const PTD_UI_TURBID_THEME = {
  primary: '#9b59b6',
  secondary: '#c5a8e0',
  factionGold: '#d4af37',

  bgBase: '#130826',
  bgGradient: 'linear-gradient(135deg, #1f0d40 0%, #0f0620 100%)',
  cardBg: 'linear-gradient(160deg, #130826 0%, #1f0d40 45%, #110622 100%)',
  panelBg: 'rgba(19, 8, 38, 0.95)',

  border: 'rgba(124, 58, 237, 0.4)',
  borderSolid: '#7c3aed',
  divider: 'rgba(124, 58, 237, 0.2)',

  borderRadius: '6px',
  borderRadiusSm: '6px',
  borderRadiusLg: '6px',

  textPrimary: '#e4d5f5',
  textSecondary: '#c5a8e0',
  textMuted: 'rgba(155, 89, 182, 0.7)',

  buttonBg: 'rgba(155, 89, 182, 0.15)',
  buttonBorder: '#9b59b6',
  buttonHover: 'rgba(155, 89, 182, 0.28)',

  inputBg: 'rgba(155, 89, 182, 0.1)',
  inputBorder: 'rgba(155, 89, 182, 0.3)',
  inputFocus: '#9b59b6',

  tagBg: 'rgba(124, 58, 237, 0.12)',
  tagBorder: '#7c3aed',
  tagText: '#c5a8e0',

  success: '#7c9f7c',
  warning: '#d4af37',
  error: '#c0392b',
  disabled: 'rgba(155, 89, 182, 0.3)',
};

// ═══════════════════════════════════════════════════════════════════════════
// 依陣營取得頁面主題
// ═══════════════════════════════════════════════════════════════════════════

export const getPageTheme = (faction: string) =>
  faction === 'Turbid' ? PTD_UI_TURBID_THEME : PTD_UI_THEME;

// ═══════════════════════════════════════════════════════════════════════════
// 字體系統
// ═══════════════════════════════════════════════════════════════════════════

export const PTD_UI_FONTS = {
  serif: "'Noto Serif TC', serif",
  sans: "'Noto Sans TC', sans-serif",
  mono: "'JetBrains Mono', monospace",
  importUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500;600&family=Noto+Sans+TC:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap',
};

// ═══════════════════════════════════════════════════════════════════════════
// 裝飾元素
// ═══════════════════════════════════════════════════════════════════════════

export const DiamondIcon = () => (
  <div style={{
    width: '6px',
    height: '6px',
    border: `1px solid ${PTD_UI_THEME.primary}`,
    transform: 'rotate(45deg)',
    display: 'inline-block',
  }} />
);

export const OrnamentLine = ({ style = {} }: { style?: React.CSSProperties }) => (
  <div style={{
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${PTD_UI_THEME.border}, transparent)`,
    ...style,
  }} />
);

export const DiamondDivider = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '16px 0',
  }}>
    <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${PTD_UI_THEME.border}, transparent)` }} />
    <DiamondIcon />
    <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${PTD_UI_THEME.border}, transparent)` }} />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// CSS 類別生成器（含 Turbid 深色覆蓋）
// ═══════════════════════════════════════════════════════════════════════════

export const generatePTDUIStyles = () => `
  @import url('${PTD_UI_FONTS.importUrl}');

  /* ── 基礎字體 ─────────────────────────────────────────── */
  .ptd-ui-base {
    font-family: ${PTD_UI_FONTS.serif};
  }

  /* ── Pure 淺色：導航按鈕 ──────────────────────────────── */
  .ptd-ui-nav-button {
    background: rgba(217, 215, 197, 0.85) !important;
    border: 1px solid ${PTD_UI_THEME.border} !important;
    color: ${PTD_UI_THEME.textSecondary} !important;
    backdrop-filter: blur(4px);
    transition: all 0.2s ease;
  }
  .ptd-ui-nav-button:hover {
    border-color: ${PTD_UI_THEME.borderSolid} !important;
    color: ${PTD_UI_THEME.textPrimary} !important;
  }
  .ptd-ui-nav-button.active {
    background: rgba(191, 186, 168, 0.9) !important;
    border-color: ${PTD_UI_THEME.borderSolid} !important;
    color: ${PTD_UI_THEME.textPrimary} !important;
  }

  /* ── Turbid 深色：導航按鈕覆蓋 ───────────────────────── */
  [data-faction="Turbid"] .ptd-ui-nav-button {
    background: rgba(19, 8, 38, 0.85) !important;
    border-color: ${PTD_UI_TURBID_THEME.border} !important;
    color: ${PTD_UI_TURBID_THEME.textSecondary} !important;
  }
  [data-faction="Turbid"] .ptd-ui-nav-button:hover {
    border-color: ${PTD_UI_TURBID_THEME.borderSolid} !important;
    color: ${PTD_UI_TURBID_THEME.textPrimary} !important;
  }
  [data-faction="Turbid"] .ptd-ui-nav-button.active {
    background: rgba(50, 10, 80, 0.9) !important;
    border-color: ${PTD_UI_TURBID_THEME.borderSolid} !important;
    color: ${PTD_UI_TURBID_THEME.textPrimary} !important;
  }

  /* ── Pure 淺色：按鈕 ─────────────────────────────────── */
  .ptd-ui-button {
    background: ${PTD_UI_THEME.buttonBg} !important;
    border: 1px solid ${PTD_UI_THEME.buttonBorder} !important;
    color: ${PTD_UI_THEME.primary} !important;
    font-family: ${PTD_UI_FONTS.sans};
    font-weight: 500;
    letter-spacing: 0.1em;
    transition: all 0.2s ease;
    border-radius: 6px !important;
  }
  .ptd-ui-button:hover:not(:disabled) {
    background: ${PTD_UI_THEME.buttonHover} !important;
    border-color: ${PTD_UI_THEME.secondary} !important;
  }
  .ptd-ui-button:active:not(:disabled) { transform: scale(0.98); }
  .ptd-ui-button:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Turbid 深色：按鈕覆蓋 ───────────────────────────── */
  [data-faction="Turbid"] .ptd-ui-button {
    background: ${PTD_UI_TURBID_THEME.buttonBg} !important;
    border-color: ${PTD_UI_TURBID_THEME.buttonBorder} !important;
    color: ${PTD_UI_TURBID_THEME.secondary} !important;
  }
  [data-faction="Turbid"] .ptd-ui-button:hover:not(:disabled) {
    background: ${PTD_UI_TURBID_THEME.buttonHover} !important;
    border-color: ${PTD_UI_TURBID_THEME.primary} !important;
  }

  /* ── Pure 淺色：面板/卡片 ────────────────────────────── */
  .ptd-ui-panel, .ptd-ui-card {
    background: ${PTD_UI_THEME.cardBg} !important;
    border: 1px solid ${PTD_UI_THEME.borderSolid} !important;
    border-radius: 6px !important;
    box-shadow: 0 24px 64px rgba(100, 90, 75, 0.18), inset 0 1px 0 rgba(255,255,255,0.5);
    font-family: ${PTD_UI_FONTS.serif};
  }

  /* ── Turbid 深色：面板/卡片覆蓋 ─────────────────────── */
  [data-faction="Turbid"] .ptd-ui-panel,
  [data-faction="Turbid"] .ptd-ui-card {
    background: ${PTD_UI_TURBID_THEME.cardBg} !important;
    border-color: ${PTD_UI_TURBID_THEME.borderSolid} !important;
    border-radius: 6px !important;
    box-shadow: 0 24px 64px rgba(30, 0, 80, 0.55), inset 0 1px 0 rgba(155,89,182,0.2) !important;
  }

  /* ── Pure 淺色：輸入框 ───────────────────────────────── */
  .ptd-ui-input {
    background: ${PTD_UI_THEME.inputBg} !important;
    border: 1px solid ${PTD_UI_THEME.inputBorder} !important;
    color: ${PTD_UI_THEME.textPrimary} !important;
    font-family: ${PTD_UI_FONTS.sans};
    padding: 8px 12px;
    border-radius: 6px !important;
    transition: all 0.2s ease;
  }
  .ptd-ui-input:focus {
    outline: none;
    border-color: ${PTD_UI_THEME.inputFocus} !important;
    background: rgba(255, 255, 255, 0.6) !important;
  }
  .ptd-ui-input::placeholder { color: ${PTD_UI_THEME.textMuted}; font-style: italic; }

  /* ── Turbid 深色：輸入框覆蓋 ─────────────────────────── */
  [data-faction="Turbid"] .ptd-ui-input {
    background: ${PTD_UI_TURBID_THEME.inputBg} !important;
    border-color: ${PTD_UI_TURBID_THEME.inputBorder} !important;
    color: ${PTD_UI_TURBID_THEME.textPrimary} !important;
  }
  [data-faction="Turbid"] .ptd-ui-input:focus {
    border-color: ${PTD_UI_TURBID_THEME.inputFocus} !important;
    background: rgba(155, 89, 182, 0.2) !important;
  }
  [data-faction="Turbid"] .ptd-ui-input::placeholder { color: ${PTD_UI_TURBID_THEME.textMuted}; }

  /* ── 標籤 ────────────────────────────────────────────── */
  .ptd-ui-tag {
    background: ${PTD_UI_THEME.tagBg} !important;
    border: 1px solid ${PTD_UI_THEME.tagBorder} !important;
    color: ${PTD_UI_THEME.tagText} !important;
    font-family: ${PTD_UI_FONTS.mono};
    font-size: 10px;
    padding: 4px 8px;
    border-radius: 6px !important;
    letter-spacing: 0.05em;
  }
  [data-faction="Turbid"] .ptd-ui-tag {
    background: ${PTD_UI_TURBID_THEME.tagBg} !important;
    border-color: ${PTD_UI_TURBID_THEME.tagBorder} !important;
    color: ${PTD_UI_TURBID_THEME.tagText} !important;
  }

  /* ── 文字樣式 ────────────────────────────────────────── */
  .ptd-ui-text-primary  { color: ${PTD_UI_THEME.textPrimary} !important; font-family: ${PTD_UI_FONTS.serif}; }
  .ptd-ui-text-secondary{ color: ${PTD_UI_THEME.textSecondary} !important; font-family: ${PTD_UI_FONTS.serif}; }
  .ptd-ui-text-muted    {
    color: ${PTD_UI_THEME.textMuted} !important;
    font-family: ${PTD_UI_FONTS.mono};
    font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  }
  .ptd-ui-text-mono { font-family: ${PTD_UI_FONTS.mono} !important; letter-spacing: 0.05em; }

  [data-faction="Turbid"] .ptd-ui-text-primary   { color: ${PTD_UI_TURBID_THEME.textPrimary} !important; }
  [data-faction="Turbid"] .ptd-ui-text-secondary  { color: ${PTD_UI_TURBID_THEME.textSecondary} !important; }
  [data-faction="Turbid"] .ptd-ui-text-muted      { color: ${PTD_UI_TURBID_THEME.textMuted} !important; }

  /* ── 標題樣式 ────────────────────────────────────────── */
  .ptd-ui-title    { font-family: ${PTD_UI_FONTS.serif}; color: ${PTD_UI_THEME.textPrimary}; font-weight: 500; letter-spacing: 0.15em; }
  .ptd-ui-title-xl { font-size: 24px; letter-spacing: 0.2em; }
  .ptd-ui-title-lg { font-size: 20px; letter-spacing: 0.15em; }
  .ptd-ui-title-md { font-size: 16px; letter-spacing: 0.1em; }
  [data-faction="Turbid"] .ptd-ui-title { color: ${PTD_UI_TURBID_THEME.textPrimary}; }

  /* ── 分隔線 ──────────────────────────────────────────── */
  .ptd-ui-divider { border: none; border-top: 1px solid ${PTD_UI_THEME.divider}; margin: 16px 0; }
  [data-faction="Turbid"] .ptd-ui-divider { border-color: ${PTD_UI_TURBID_THEME.divider}; }

  /* ── Modal 背景遮罩 ──────────────────────────────────── */
  .ptd-ui-modal-backdrop { background: rgba(0, 0, 0, 0.4) !important; }
  [data-faction="Turbid"] .ptd-ui-modal-backdrop { background: rgba(0, 0, 0, 0.65) !important; }

  /* ── Glassmorphism（套用在導覽/彈窗本體，不套遮罩）────── */
  .ptd-ui-glass {
    background: rgba(217, 215, 197, 0.72) !important;
    border: 1px solid ${PTD_UI_THEME.border} !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  [data-faction="Turbid"] .ptd-ui-glass {
    background: rgba(19, 8, 38, 0.68) !important;
    border-color: ${PTD_UI_TURBID_THEME.border} !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.22);
  }

  /* ── 滾動條 ──────────────────────────────────────────── */
  .ptd-ui-scrollbar::-webkit-scrollbar { width: 6px; }
  .ptd-ui-scrollbar::-webkit-scrollbar-track { background: rgba(184,159,134,0.1); border-radius: 3px; }
  .ptd-ui-scrollbar::-webkit-scrollbar-thumb { background: rgba(184,159,134,0.3); border-radius: 3px; }
  .ptd-ui-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(184,159,134,0.5); }
  [data-faction="Turbid"] .ptd-ui-scrollbar::-webkit-scrollbar-track { background: rgba(124,58,237,0.08); }
  [data-faction="Turbid"] .ptd-ui-scrollbar::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); }
  [data-faction="Turbid"] .ptd-ui-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(124,58,237,0.5); }

  /* ── 圓角 ────────────────────────────────────────────── */
  .ptd-ui-rounded-sm { border-radius: 4px; }
  .ptd-ui-rounded    { border-radius: 6px; }
  .ptd-ui-rounded-lg { border-radius: 6px; }

  /* ── 陰影 ────────────────────────────────────────────── */
  .ptd-ui-shadow-sm { box-shadow: 0 2px 8px rgba(100,90,75,0.1), inset 0 1px 0 rgba(255,255,255,0.4); }
  .ptd-ui-shadow-md { box-shadow: 0 8px 24px rgba(100,90,75,0.15), inset 0 1px 0 rgba(255,255,255,0.45); }
  .ptd-ui-shadow-lg { box-shadow: 0 24px 64px rgba(100,90,75,0.18), inset 0 1px 0 rgba(255,255,255,0.5); }
  .ptd-ui-shadow-btn { box-shadow: 0 4px 12px rgba(100,90,75,0.12); }
  [data-faction="Turbid"] .ptd-ui-shadow-sm { box-shadow: 0 2px 8px rgba(30,0,80,0.25), inset 0 1px 0 rgba(155,89,182,0.15); }
  [data-faction="Turbid"] .ptd-ui-shadow-md { box-shadow: 0 8px 24px rgba(30,0,80,0.35), inset 0 1px 0 rgba(155,89,182,0.18); }
  [data-faction="Turbid"] .ptd-ui-shadow-lg { box-shadow: 0 24px 64px rgba(30,0,80,0.55), inset 0 1px 0 rgba(155,89,182,0.2); }
  [data-faction="Turbid"] .ptd-ui-shadow-btn { box-shadow: 0 4px 12px rgba(124,58,237,0.25); }

  /* ── 列表 ────────────────────────────────────────────── */
  .ptd-ui-list-item {
    padding: 10px 16px;
    border-bottom: 1px dashed ${PTD_UI_THEME.divider};
    color: ${PTD_UI_THEME.textSecondary};
    font-size: 13px;
    display: flex; align-items: center; gap: 12px;
    transition: background 0.2s ease;
  }
  .ptd-ui-list-item:hover { background: rgba(191,186,168,0.1); }
  .ptd-ui-list-bullet {
    width: 6px; height: 6px;
    border: 1px solid ${PTD_UI_THEME.primary};
    transform: rotate(45deg); flex-shrink: 0;
  }
  [data-faction="Turbid"] .ptd-ui-list-item {
    border-color: ${PTD_UI_TURBID_THEME.divider};
    color: ${PTD_UI_TURBID_THEME.textSecondary};
  }
  [data-faction="Turbid"] .ptd-ui-list-item:hover { background: rgba(124,58,237,0.08); }
  [data-faction="Turbid"] .ptd-ui-list-bullet { border-color: ${PTD_UI_TURBID_THEME.primary}; }

  /* ── 動畫 ────────────────────────────────────────────── */
  @keyframes ptd-ui-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ptd-ui-fade-in { animation: ptd-ui-fade-in 0.3s ease-out; }

  /* ── 頁面過渡動畫（陣營切換時）──────────────────────── */
  .ptd-ui-base {
    transition: background-color 0.6s ease, color 0.4s ease;
  }

  /* ── 手機響應式斷點 (max-width: 640px) ──────────────── */
  @media (max-width: 640px) {
    .ptd-ui-nav-button {
      padding: 6px 8px !important;
      font-size: 11px !important;
    }
    .ptd-ui-list-item {
      padding: 8px 12px;
      font-size: 12px;
    }
    .ptd-ui-tag {
      font-size: 11px;
      padding: 3px 6px;
    }
    .ptd-ui-title-xl { font-size: 20px; letter-spacing: 0.15em; }
    .ptd-ui-title-lg { font-size: 17px; letter-spacing: 0.12em; }
    .ptd-ui-title-md { font-size: 14px; }
    .ptd-ui-text-muted { font-size: 9px; }
    .ptd-ui-panel, .ptd-ui-card {
      border-radius: 6px !important;
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// 樣式注入 Hook
// ═══════════════════════════════════════════════════════════════════════════

export const usePTDUIStyles = () => {
  React.useEffect(() => {
    if (document.getElementById('ptd-ui-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'ptd-ui-styles';
    styleEl.textContent = generatePTDUIStyles();
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);
};

export default {
  THEME: PTD_UI_THEME,
  TURBID_THEME: PTD_UI_TURBID_THEME,
  FONTS: PTD_UI_FONTS,
  getPageTheme,
  DiamondIcon,
  OrnamentLine,
  DiamondDivider,
  generateStyles: generatePTDUIStyles,
  useStyles: usePTDUIStyles,
};
