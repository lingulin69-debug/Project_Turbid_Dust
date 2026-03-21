import React from 'react';

interface MapContainerProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * MapContainer — Mystery-punk 質感的地圖容器
 * 
 * 功能：
 * - 相對定位容器，用於容納地標、NPC、縮放控制等內容
 * - Glassmorphism 視覺效果（玻璃擬態）
 * - 底部漸層遮罩，營造大地陰影
 * - 響應式設計：桌機啟用毛玻璃，手機保持透明以節省資源
 * - 完全溢出隱藏，內容不超出圓角邊界
 */
export const MapContainer: React.FC<MapContainerProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`relative w-full aspect-[16/9] md:min-h-[650px] 
        rounded-[6px] 
        border border-white/10 
        bg-black/40 
        md:backdrop-blur-md 
        overflow-hidden 
        ${className}`}
    >
      {/* 內容插槽：用於放置地標、NPC 圖標、縮放控制等 */}
      <div className="relative w-full h-full">
        {children}
      </div>

      {/* 底部漸層遮罩：大地陰影，營造深度感 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%)',
        }}
      />
    </div>
  );
};
