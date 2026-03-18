import React, { useMemo } from 'react';

export type LandmarkType = 'town' | 'hospital' | 'church' | 'school' | 'default';

export interface LandmarkData {
  id: string;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  faction: 'Turbid' | 'Pure' | 'Common';
  status: 'open' | 'closed';
  type?: LandmarkType;
  occupants?: number;
  capacity?: number;
}

interface MapLandmarkProps {
  landmark: LandmarkData;
  isDevMode: boolean;
  isVisible?: boolean;
  onClick?: () => void;
  scale?: number;
}

// 性能优化：缓存图标映射
const ICON_MAP: Record<LandmarkType, string | null> = {
  town: '🏰',
  hospital: '🏥',
  church: '⛪',
  school: '🏫',
  default: null
};

const MapLandmarkComponent: React.FC<MapLandmarkProps> = ({
  landmark,
  isDevMode,
  isVisible = true,
  onClick,
  scale = 1
}) => {
  // 性能优化：使用useMemo缓存计算结果
  const icon = useMemo(() => ICON_MAP[landmark.type || 'default'], [landmark.type]);
  const isInteractable = useMemo(
    () => isDevMode || (isVisible && landmark.status === 'open'),
    [isDevMode, isVisible, landmark.status]
  );

  // 性能优化：缓存样式对象
  const containerStyle = useMemo(() => ({
    left: `${landmark.x}%`,
    top: `${landmark.y}%`,
    transform: 'translate(-50%, -50%)',
    zIndex: isDevMode ? 50 : 20
  }), [landmark.x, landmark.y, isDevMode]);

  return (
    <div className="absolute" style={containerStyle}>
      {/* 1. Base Dot */}
      <div
        onClick={isInteractable ? onClick : undefined}
        className={`w-3 h-3 rounded-full shadow-md transition-all duration-300 relative group
          ${landmark.faction === 'Turbid' ? 'bg-gray-800 border border-gray-600' : 'bg-green-500 border border-green-300'}
          ${isInteractable ? 'cursor-pointer hover:scale-125' : 'opacity-50 grayscale'}
        `}
      >
        {/* Pulse effect - 仅在open且visible时渲染 */}
        {landmark.status === 'open' && isVisible && (
          <div className={`absolute -inset-1 rounded-full animate-ping opacity-75
            ${landmark.faction === 'Turbid' ? 'bg-gray-500' : 'bg-green-400'}`}
          />
        )}
      </div>

      {/* 2. Floating Icon - 性能优化：移除framer-motion */}
      {icon && isVisible && (
        <div
          className="absolute left-1/2 -translate-x-1/2 text-2xl pointer-events-none filter drop-shadow-lg"
          style={{ top: '-25px' }}
        >
          {icon}
        </div>
      )}

      {/* 3. Label / Tooltip */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-black/80 text-white text-xs backdrop-blur-sm transition-opacity duration-200 pointer-events-none
        ${isDevMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
      `}>
        <div className="font-bold">{landmark.name}</div>
        {/* 人數需求：有 capacity 才顯示 */}
        {isVisible && landmark.capacity != null && (
          <div className={`text-[10px] mt-0.5 font-mono text-center
            ${(landmark.occupants ?? 0) >= landmark.capacity ? 'text-red-400' : 'text-emerald-400'}`}>
            {landmark.occupants ?? 0}/{landmark.capacity}
            {(landmark.occupants ?? 0) >= landmark.capacity ? ' 已滿' : ''}
          </div>
        )}
        {isDevMode && <div className="text-[10px] text-cyan-400">({landmark.x.toFixed(1)}%, {landmark.y.toFixed(1)}%)</div>}
      </div>
    </div>
  );
};

// 性能优化：使用React.memo防止不必要的重渲染
export const MapLandmark = React.memo(MapLandmarkComponent, (prevProps, nextProps) => {
  return (
    prevProps.landmark.id === nextProps.landmark.id &&
    prevProps.landmark.x === nextProps.landmark.x &&
    prevProps.landmark.y === nextProps.landmark.y &&
    prevProps.landmark.status === nextProps.landmark.status &&
    prevProps.landmark.occupants === nextProps.landmark.occupants &&
    prevProps.isDevMode === nextProps.isDevMode &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.scale === nextProps.scale
  );
});
