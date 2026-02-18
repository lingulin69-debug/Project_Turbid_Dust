import React from 'react';

type DesignOverlayProps = {
  src: string;
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  enabled: boolean;
  className?: string;
};

export const DesignOverlay: React.FC<DesignOverlayProps> = ({
  src,
  opacity,
  scale,
  offsetX,
  offsetY,
  enabled,
  className
}) => {
  if (!enabled) return null;
  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className || ''}`}
      style={{ zIndex: 90, opacity }}
    >
      <img
        src={src}
        alt="ui overlay"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
        }}
        draggable={false}
        decoding="async"
      />
    </div>
  );
};

export default DesignOverlay;
