import React from 'react';
import { MapCanvas } from './MapCanvas';
import { LocationPointData } from './LocationPoint';

const demoPoints: LocationPointData[] = [
  { id: 'a', xPct: 20, yPct: 25, label: 'Hill Gate', faction: 'Common' },
  { id: 'b', xPct: 55, yPct: 40, label: 'Grey Harbor', faction: 'Pure' },
  { id: 'c', xPct: 78, yPct: 72, label: 'Mire Nexus', faction: 'Turbid' },
];

export const DemoMap: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const faction = (params.get('faction') as 'Turbid' | 'Pure' | 'Common') || 'Common';

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <MapCanvas
        backgroundSrc="/assets/map/bg_1024.jpg"
        points={demoPoints}
        currentFaction={faction}
        className="shadow-2xl"
      />
    </div>
  );
};

export default DemoMap;
