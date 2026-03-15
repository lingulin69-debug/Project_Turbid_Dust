import React from 'react';
import { LocationPoint, LocationPointData, Faction } from './LocationPoint';

export type MapCanvasProps = {
  backgroundSrc: string;
  points: LocationPointData[];
  currentFaction?: Faction;
  currentRoles?: string[];
  className?: string;
};

export const MapCanvas: React.FC<MapCanvasProps> = ({
  backgroundSrc,
  points,
  currentFaction = 'Common',
  currentRoles = [],
  className,
}) => {
  return (
    <div className={`relative w-full max-w-[1024px] aspect-square mx-auto ${className || ''}`}>
      <div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
      >
        <img
          src={backgroundSrc}
          alt="map"
          className="w-full h-full object-cover"
          draggable={false}
          decoding="async"
        />
      </div>

      <div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
      >
        {points.map(p => (
          <LocationPoint
            key={p.id}
            {...p}
            currentFaction={currentFaction}
            currentRoles={currentRoles}
          />
        ))}
      </div>
    </div>
  );
};

export default MapCanvas;
