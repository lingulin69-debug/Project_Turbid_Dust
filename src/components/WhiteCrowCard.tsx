import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Faction Themes
// 替換素材時只需改 cardBg 為 url(/assets/ui/xxx.png)
// ─────────────────────────────────────────────────────────────────────────────

interface WCTheme {
  // 背景（未來換成 url(...)）
  cardBg: string;
  totemLayer: string;
  // 邊框與陰影
  border: string;
  shadow: string;
  // 顏色
  primary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  bodyBg: string;
  // 關閉按鈕
  closeBg: string;
  closeBorder: string;
  closeIcon: string;
  // 捲軸
  scrollTrack: string;
  scrollThumb: string;
  // 按鈕
  btnBg: string;
  btnBorder: string;
  btnColor: string;
  // Tab
  tabBorder: string;
  tabActive: string;
  tabInactive: string;
  // Input
  inputBg: string;
  inputBorder: string;
  inputColor: string;
  inputFocusBg: string;
  // 其他
  itemBg: string;
  itemHoverBg: string;
  authMark: string;
}

export const FACTION_THEMES: Record<'Turbid' | 'Pure', WCTheme> = {
  Pure: {
    // ── 聖潔・金白 ──────────────────────────────────────────────
    // cardBg: 'url(/assets/ui/pure_window_bg.png) center/cover no-repeat',
    cardBg: 'linear-gradient(160deg, #f5f2ed 0%, #ede8de 50%, #f0ebe5 100%)',
    totemLayer: 'radial-gradient(ellipse 70% 40% at 50% 28%, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
    border: 'rgba(184, 159, 134, 0.35)',
    shadow: '0 24px 64px rgba(100, 90, 75, 0.18), inset 0 1px 0 rgba(255,255,255,0.6)',
    primary: '#b89f86',
    textPrimary: '#5a4e44',
    textSecondary: '#8b7355',
    textMuted: 'rgba(139, 115, 85, 0.65)',
    bodyBg: 'transparent',
    closeBg: 'rgba(255,255,255,0.5)',
    closeBorder: 'rgba(184, 159, 134, 0.3)',
    closeIcon: '#8b7355',
    scrollTrack: 'rgba(184, 159, 134, 0.1)',
    scrollThumb: 'rgba(184, 159, 134, 0.3)',
    btnBg: 'rgba(255,255,255,0.5)',
    btnBorder: '#b89f86',
    btnColor: '#b89f86',
    tabBorder: 'rgba(184, 159, 134, 0.25)',
    tabActive: '#5a4e44',
    tabInactive: '#b89f86',
    inputBg: 'rgba(255,255,255,0.4)',
    inputBorder: 'rgba(184, 159, 134, 0.3)',
    inputColor: '#5a4e44',
    inputFocusBg: 'rgba(255,255,255,0.65)',
    itemBg: 'rgba(191, 186, 168, 0.2)',
    itemHoverBg: 'rgba(255,255,255,0.45)',
    authMark: 'rgba(120, 110, 95, 0.18)',
  },

  Turbid: {
    // ── 混沌・紫黑 ──────────────────────────────────────────────
    // cardBg: 'url(/assets/ui/turbid_window_bg.png) center/cover no-repeat',
    cardBg: 'linear-gradient(160deg, #130826 0%, #1f0d40 45%, #110622 100%)',
    totemLayer: [
      'radial-gradient(ellipse 70% 40% at 50% 28%, rgba(138, 43, 226, 0.14) 0%, transparent 70%)',
      'repeating-linear-gradient(60deg, transparent, transparent 28px, rgba(124,58,237,0.03) 28px, rgba(124,58,237,0.03) 29px)',
    ].join(', '),
    border: 'rgba(124, 58, 237, 0.4)',
    shadow: '0 24px 64px rgba(30, 0, 80, 0.55), inset 0 1px 0 rgba(155,89,182,0.2)',
    primary: '#9b59b6',
    textPrimary: '#e4d5f5',
    textSecondary: '#c5a8e0',
    textMuted: 'rgba(155, 89, 182, 0.7)',
    bodyBg: 'rgba(15, 6, 32, 0.68)',
    closeBg: 'rgba(155, 89, 182, 0.12)',
    closeBorder: 'rgba(155, 89, 182, 0.35)',
    closeIcon: '#c5a8e0',
    scrollTrack: 'rgba(155, 89, 182, 0.08)',
    scrollThumb: 'rgba(155, 89, 182, 0.3)',
    btnBg: 'rgba(155, 89, 182, 0.15)',
    btnBorder: '#9b59b6',
    btnColor: '#c5a8e0',
    tabBorder: 'rgba(155, 89, 182, 0.25)',
    tabActive: '#e4d5f5',
    tabInactive: '#9b59b6',
    inputBg: 'rgba(155, 89, 182, 0.1)',
    inputBorder: 'rgba(155, 89, 182, 0.3)',
    inputColor: '#e4d5f5',
    inputFocusBg: 'rgba(155, 89, 182, 0.2)',
    itemBg: 'rgba(124, 58, 237, 0.1)',
    itemHoverBg: 'rgba(124, 58, 237, 0.2)',
    authMark: 'rgba(155, 89, 182, 0.2)',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WhiteCrowCard
// ─────────────────────────────────────────────────────────────────────────────

interface WhiteCrowCardProps {
  title: string;
  code: string;
  onClose: () => void;
  children: React.ReactNode;
  hasNavigation?: boolean;
  currentIndex?: number;
  totalPages?: number;
  onNavigate?: (index: number) => void;
  className?: string;
  faction?: 'Turbid' | 'Pure';
}

export const WhiteCrowCard: React.FC<WhiteCrowCardProps> = ({
  title,
  code,
  onClose,
  children,
  hasNavigation = false,
  currentIndex = 0,
  totalPages = 1,
  onNavigate,
  className = '',
  faction,
}) => {
  const theme = faction ? FACTION_THEMES[faction] : FACTION_THEMES.Pure;

  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (touchStart.current === null || touchEnd.current === null || !onNavigate) return;
    const distance = touchStart.current - touchEnd.current;
    if (Math.abs(distance) > 50) {
      if (distance > 0 && currentIndex < totalPages - 1) onNavigate(currentIndex + 1);
      else if (distance < 0 && currentIndex > 0) onNavigate(currentIndex - 1);
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      className={`wc-card-wrapper ${className}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        // ── CSS 變數：所有子組件透過繼承使用 ──
        '--wc-primary':       theme.primary,
        '--wc-text-primary':  theme.textPrimary,
        '--wc-text-secondary':theme.textSecondary,
        '--wc-text-muted':    theme.textMuted,
        '--wc-body-bg':       theme.bodyBg,
        '--wc-close-bg':      theme.closeBg,
        '--wc-close-border':  theme.closeBorder,
        '--wc-close-icon':    theme.closeIcon,
        '--wc-scroll-track':  theme.scrollTrack,
        '--wc-scroll-thumb':  theme.scrollThumb,
        '--wc-btn-bg':        theme.btnBg,
        '--wc-btn-border':    theme.btnBorder,
        '--wc-btn-color':     theme.btnColor,
        '--wc-tab-border':    theme.tabBorder,
        '--wc-tab-active':    theme.tabActive,
        '--wc-tab-inactive':  theme.tabInactive,
        '--wc-input-bg':      theme.inputBg,
        '--wc-input-border':  theme.inputBorder,
        '--wc-input-color':   theme.inputColor,
        '--wc-input-focus-bg':theme.inputFocusBg,
        '--wc-item-bg':       theme.itemBg,
        '--wc-item-hover-bg': theme.itemHoverBg,
        '--wc-auth-mark':     theme.authMark,
        // ── 直接樣式 ──
        background:   theme.cardBg,
        border:       `1px solid ${theme.border}`,
        borderRadius: '8px',
        boxShadow:    theme.shadow,
        width:        'min(450px, calc(100vw - 32px))',
        maxHeight:    'calc(100vh - 160px)',
        fontFamily:   "'Noto Serif TC', serif",
        position:     'relative',
        display:      'flex',
        flexDirection:'column',
        overflow:     'hidden',
      } as React.CSSProperties}
    >
      {/* ── 圖騰佔位層（等素材後換 bg image）── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: theme.totemLayer, zIndex: 0 }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500;600&family=Noto+Sans+TC:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap');

        /* ── Card Wrapper ── */
        .wc-card-wrapper {
          width: min(450px, calc(100vw - 32px));
          min-height: 480px;
          max-height: calc(100vh - 80px);
          border-radius: 8px;
          font-family: 'Noto Serif TC', serif;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .wc-card-content {
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        /* ── Header ── */
        .wc-header {
          padding-bottom: 16px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--wc-tab-border);
          flex-shrink: 0;
        }
        .wc-ornament-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--wc-primary), transparent);
          opacity: 0.35;
          margin-bottom: 8px;
        }
        .wc-code-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: var(--wc-text-muted);
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .wc-diamond-group {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .wc-diamond {
          width: 6px;
          height: 6px;
          border: 1px solid var(--wc-primary);
          transform: rotate(45deg);
          flex-shrink: 0;
        }
        .wc-title {
          font-family: 'Noto Serif TC', serif;
          font-size: 20px;
          font-weight: 500;
          color: var(--wc-text-primary);
          letter-spacing: 0.2em;
          text-align: center;
          flex: 1;
        }

        /* ── Close Button ── */
        .wc-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          border: 1px solid var(--wc-close-border);
          background: var(--wc-close-bg);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }
        .wc-close-btn:hover { opacity: 0.75; }
        .wc-close-btn svg { width: 14px; height: 14px; color: var(--wc-close-icon); }

        /* ── Body ── */
        .wc-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 8px;
          background: var(--wc-body-bg);
          border-radius: 4px;
        }
        .wc-body::-webkit-scrollbar { width: 6px; }
        .wc-body::-webkit-scrollbar-track { background: var(--wc-scroll-track); border-radius: 3px; }
        .wc-body::-webkit-scrollbar-thumb { background: var(--wc-scroll-thumb); border-radius: 3px; }
        .wc-body::-webkit-scrollbar-thumb:hover { opacity: 0.8; }

        /* ── Auth Mark ── */
        .wc-auth-mark { margin-top: auto; padding-top: 24px; text-align: center; flex-shrink: 0; }
        .wc-auth-mark span {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: var(--wc-auth-mark);
          text-transform: uppercase;
          font-style: italic;
        }

        /* ── Navigation Dots ── */
        .wc-navigation { display: flex; justify-content: center; gap: 16px; padding-top: 24px; flex-shrink: 0; }
        .wc-nav-dot {
          width: 10px;
          height: 10px;
          border: 1px solid var(--wc-primary);
          transform: rotate(45deg);
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0.2;
        }
        .wc-nav-dot.active { background: var(--wc-primary); opacity: 1; transform: rotate(45deg) scale(1.25); }
        .wc-nav-dot:hover { opacity: 0.6; }

        /* ── Slide In Animation ── */
        .wc-slide-in { animation: wcSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes wcSlideIn {
          from { opacity: 0; transform: translateX(30px); filter: blur(4px); }
          to   { opacity: 1; transform: translateX(0);    filter: blur(0); }
        }

        /* ── WCTabBar ── */
        .wc-tab-container { display: flex; border-bottom: 1px solid var(--wc-tab-border); margin-bottom: 24px; }
        .wc-tab-button {
          flex: 1;
          padding: 16px 0;
          font-family: 'Noto Sans TC', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--wc-tab-inactive);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .wc-tab-button:hover { opacity: 0.8; }
        .wc-tab-button.active { color: var(--wc-tab-active); border-bottom-color: var(--wc-primary); }
        .wc-tab-button.active::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 4px; height: 4px;
          background: var(--wc-primary);
          border-radius: 50%;
        }

        /* ── WCButton ── */
        .wc-button {
          font-family: 'Noto Sans TC', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          border: 1px solid;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .wc-button:disabled { opacity: 0.4; cursor: not-allowed; }
        .wc-button.wc-btn-sm { padding: 8px 16px; }
        .wc-button.wc-btn-md { padding: 12px 24px; }
        .wc-button.wc-btn-lg { padding: 16px 32px; }
        .wc-button.wc-full-width { width: 100%; }
        .wc-btn-primary {
          background: var(--wc-btn-bg);
          border-color: var(--wc-btn-border);
          color: var(--wc-btn-color);
        }
        .wc-btn-primary:hover:not(:disabled) { opacity: 0.82; }
        .wc-btn-primary:active:not(:disabled) { transform: scale(0.95); }
        .wc-btn-secondary {
          background: transparent;
          border-color: var(--wc-tab-border);
          color: var(--wc-text-secondary);
        }
        .wc-btn-secondary:hover:not(:disabled) { border-color: var(--wc-primary); }
        .wc-btn-ghost { background: transparent; border-color: transparent; color: var(--wc-primary); }
        .wc-btn-ghost:hover:not(:disabled) { background: var(--wc-item-bg); }

        /* ── WCInput ── */
        .wc-input-wrapper { margin-bottom: 16px; }
        .wc-input-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: var(--wc-text-muted);
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
        }
        .wc-input-field {
          width: 100%;
          padding: 12px 16px;
          font-family: 'Noto Sans TC', sans-serif;
          font-size: 13px;
          color: var(--wc-input-color);
          background: var(--wc-input-bg);
          border: 1px solid var(--wc-input-border);
          border-radius: 6px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .wc-input-field:focus { outline: none; border-color: var(--wc-primary); background: var(--wc-input-focus-bg); }
        .wc-input-field::placeholder { color: var(--wc-text-muted); font-style: italic; }

        /* ── WCListContent ── */
        .wc-list-item { border-bottom: 1px dashed var(--wc-tab-border); padding-bottom: 16px; margin-bottom: 16px; }
        .wc-list-item:last-child { border-bottom: none; margin-bottom: 0; }
        .wc-list-title { display: flex; justify-content: space-between; align-items: end; margin-bottom: 12px; }
        .wc-list-title h4 { font-size: 16px; font-weight: 500; color: var(--wc-text-primary); letter-spacing: 0.12em; }
        .wc-list-date { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--wc-primary); letter-spacing: 0.1em; }
        .wc-list-content {
          font-size: 13px;
          line-height: 1.8;
          color: var(--wc-text-secondary);
          font-weight: 300;
          letter-spacing: 0.05em;
          padding-left: 12px;
          border-left: 2px solid var(--wc-tab-border);
        }

        /* ── WCGridContent ── */
        .wc-grid-item {
          aspect-ratio: 1;
          border: 1px solid var(--wc-tab-border);
          border-radius: 4px;
          background: var(--wc-item-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .wc-grid-item:not(.wc-grid-empty):hover { background: var(--wc-item-hover-bg); border-color: var(--wc-primary); }
        .wc-grid-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--wc-primary); letter-spacing: 0.1em; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .wc-card-wrapper { min-height: 0; max-height: calc(100vh - 80px); }
          .wc-card-content { padding: 24px 16px; }
          .wc-title { font-size: 18px; }
          .wc-tab-button { font-size: 10px; padding: 12px 0; }
          .wc-close-btn { top: 12px; right: 12px; width: 32px; height: 32px; }
        }
        @media (max-width: 400px) {
          .wc-card-content { padding: 20px 12px; }
          .wc-title { font-size: 16px; }
          .wc-header { margin-bottom: 16px; }
        }
      `}</style>

      <div
        className="wc-card-content"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 關閉按鈕 */}
        <button onClick={onClose} className="wc-close-btn">
          <X />
        </button>

        {/* 頂部標題區 */}
        <div className="wc-header">
          <div className="wc-ornament-line" />
          <div className="wc-code-label">{code}</div>
          <div className="wc-diamond-group">
            <div className="wc-diamond" />
            <h2 className="wc-title">{title}</h2>
            <div className="wc-diamond" />
          </div>
          <div className="wc-ornament-line" />
        </div>

        {/* 內容區域 */}
        <div className="wc-body wc-slide-in">
          {children}
          <div className="wc-auth-mark">
            <span>Node_Authorization_Granted</span>
          </div>
        </div>

        {/* 底部導航圓點 */}
        {hasNavigation && onNavigate && (
          <div className="wc-navigation">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                onClick={() => onNavigate(i)}
                className={`wc-nav-dot ${i === currentIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components（樣式繼承自 WhiteCrowCard 的 CSS 變數）
// ─────────────────────────────────────────────────────────────────────────────

export const WCListContent: React.FC<{
  items: Array<{ title: string; content: string; date: string }>;
}> = ({ items }) => (
  <div className="space-y-8">
    {items.map((item, i) => (
      <div key={i} className="wc-list-item">
        <div className="wc-list-title">
          <h4>{item.title}</h4>
          <span className="wc-list-date">{item.date}</span>
        </div>
        <p className="wc-list-content">{item.content}</p>
      </div>
    ))}
  </div>
);

export const WCTabBar: React.FC<{
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (id: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => (
  <div className="wc-tab-container">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`wc-tab-button ${activeTab === tab.id ? 'active' : ''}`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export const WCButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, onClick, variant = 'primary', disabled = false, fullWidth = false, size = 'md' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`wc-button wc-btn-${variant} wc-btn-${size} ${fullWidth ? 'wc-full-width' : ''}`}
  >
    {children}
  </button>
);

export const WCInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  type?: string;
}> = ({ value, onChange, placeholder, label, type = 'text' }) => (
  <div className="wc-input-wrapper">
    {label && <label className="wc-input-label">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="wc-input-field"
    />
  </div>
);

export const WCGridContent: React.FC<{
  items: Array<{ id: string; label?: string; icon?: React.ReactNode; isEmpty?: boolean }>;
  columns?: number;
}> = ({ items, columns = 4 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '12px' }}>
    {items.map((item) => (
      <div key={item.id} className={`wc-grid-item ${item.isEmpty ? 'wc-grid-empty' : ''}`}>
        {item.icon}
        {item.label && <span className="wc-grid-label">{item.label}</span>}
      </div>
    ))}
  </div>
);

export const WCTextContent: React.FC<{ text: string }> = ({ text }) => (
  <p style={{
    fontSize: '13px',
    lineHeight: '1.8',
    color: 'var(--wc-text-secondary)',
    fontWeight: 300,
    letterSpacing: '0.5px',
  }}>
    {text}
  </p>
);
