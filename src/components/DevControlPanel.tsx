import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Save } from 'lucide-react';

interface EditableItem {
  id: string;
  name: string;
  x: number | string;
  y: number | string;
  type: 'landmark' | 'ui' | 'icon';
}

interface DevControlPanelProps {
  items: EditableItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, x: number | string, y: number | string) => void;
  onClose: () => void;
}

export const DevControlPanel: React.FC<DevControlPanelProps> = ({
  items,
  selectedId,
  onSelect,
  onUpdate,
  onClose
}) => {
  const selectedItem = items.find(i => i.id === selectedId);
  const [localX, setLocalX] = useState<string>('');
  const [localY, setLocalY] = useState<string>('');

  // Sync local state when selection changes
  useEffect(() => {
    if (selectedItem) {
      setLocalX(String(selectedItem.x));
      setLocalY(String(selectedItem.y));
    }
  }, [selectedId, selectedItem]);

  const handleManualUpdate = () => {
    if (!selectedId) return;
    
    // Parse values to preserve % if present, or number if not
    const finalX = localX.includes('%') ? localX : Number(localX);
    const finalY = localY.includes('%') ? localY : Number(localY);
    
    onUpdate(selectedId, finalX, finalY);
  };

  const handleNudge = (dx: number, dy: number) => {
    if (!selectedItem) return;

    let newX = selectedItem.x;
    let newY = selectedItem.y;

    // Handle Percentage
    if (typeof newX === 'string' && newX.includes('%')) {
      const currentVal = parseFloat(newX);
      newX = `${(currentVal + dx * 0.1).toFixed(1)}%`; // 0.1% increments
    } else {
      // Handle Pixels
      newX = Number(newX) + dx * 1; // 1px increments
    }

    if (typeof newY === 'string' && newY.includes('%')) {
      const currentVal = parseFloat(newY);
      newY = `${(currentVal + dy * 0.1).toFixed(1)}%`;
    } else {
      newY = Number(newY) + dy * 1;
    }

    onUpdate(selectedItem.id, newX, newY);
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed right-0 top-0 bottom-0 w-80 bg-black/90 border-l border-cyan-500/30 backdrop-blur-md z-[200] flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-cyan-950/20">
        <h3 className="text-sm font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
          Inspector Mode
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 1. Selector */}
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 uppercase tracking-widest">Select Element</label>
          <select 
            value={selectedId || ''} 
            onChange={(e) => onSelect(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 p-2 text-xs text-gray-300 rounded focus:border-cyan-500 outline-none"
          >
            <option value="">-- Choose Object --</option>
            <optgroup label="Landmarks (Percent)">
              {items.filter(i => i.type === 'landmark').map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </optgroup>
            <optgroup label="UI Elements (Pixels)">
              {items.filter(i => i.type === 'ui').map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </optgroup>
            <optgroup label="Special Icons">
               {items.filter(i => i.type === 'icon').map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* 2. Editor */}
        {selectedItem ? (
          <div className="space-y-4 border border-gray-800 bg-gray-900/50 p-4 rounded-lg">
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{selectedItem.name}</span>
                <span className="text-[10px] text-cyan-500 font-mono bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900">
                  ID: {selectedItem.id}
                </span>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] text-gray-500 uppercase">X Axis ({typeof selectedItem.x === 'string' ? '%' : 'px'})</label>
                   <input 
                     type="text" 
                     value={localX}
                     onChange={(e) => setLocalX(e.target.value)}
                     onBlur={handleManualUpdate}
                     onKeyDown={(e) => e.key === 'Enter' && handleManualUpdate()}
                     className="w-full bg-black border border-gray-700 p-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none rounded"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] text-gray-500 uppercase">Y Axis ({typeof selectedItem.y === 'string' ? '%' : 'px'})</label>
                   <input 
                     type="text" 
                     value={localY}
                     onChange={(e) => setLocalY(e.target.value)}
                     onBlur={handleManualUpdate}
                     onKeyDown={(e) => e.key === 'Enter' && handleManualUpdate()}
                     className="w-full bg-black border border-gray-700 p-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none rounded"
                   />
                </div>
             </div>

             {/* Nudge Controls */}
             <div className="pt-2 border-t border-gray-800">
                <label className="text-[9px] text-gray-500 uppercase mb-2 block text-center">Fine Tune (Nudge)</label>
                <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
                   <div></div>
                   <button onClick={() => handleNudge(0, -1)} className="p-1 bg-gray-800 hover:bg-cyan-900 rounded flex justify-center border border-gray-700 hover:border-cyan-500 transition-colors">
                     <ArrowUp className="w-3 h-3 text-gray-400 hover:text-cyan-300" />
                   </button>
                   <div></div>
                   <button onClick={() => handleNudge(-1, 0)} className="p-1 bg-gray-800 hover:bg-cyan-900 rounded flex justify-center border border-gray-700 hover:border-cyan-500 transition-colors">
                     <ArrowLeft className="w-3 h-3 text-gray-400 hover:text-cyan-300" />
                   </button>
                   <button onClick={handleManualUpdate} className="p-1 bg-cyan-900/50 rounded flex justify-center border border-cyan-800" title="Save/Sync">
                     <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1"></div>
                   </button>
                   <button onClick={() => handleNudge(1, 0)} className="p-1 bg-gray-800 hover:bg-cyan-900 rounded flex justify-center border border-gray-700 hover:border-cyan-500 transition-colors">
                     <ArrowRight className="w-3 h-3 text-gray-400 hover:text-cyan-300" />
                   </button>
                   <div></div>
                   <button onClick={() => handleNudge(0, 1)} className="p-1 bg-gray-800 hover:bg-cyan-900 rounded flex justify-center border border-gray-700 hover:border-cyan-500 transition-colors">
                     <ArrowDown className="w-3 h-3 text-gray-400 hover:text-cyan-300" />
                   </button>
                   <div></div>
                </div>
             </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-600 text-xs italic border border-dashed border-gray-800 rounded">
            Select an element to inspect coordinates
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-blue-900/10 border border-blue-900/30 rounded text-[10px] text-blue-300/80 leading-relaxed">
           <strong>TIP:</strong><br/>
           • Use Nudge controls for precise alignment.<br/>
           • Landmarks use % (Relative to Map).<br/>
           • UI Buttons use px (Relative to Screen).
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-black">
        <button 
          onClick={() => {
            const data = JSON.stringify(items.map(i => ({ id: i.id, x: i.x, y: i.y })), null, 2);
            navigator.clipboard.writeText(data);
            alert('Coordinates copied to clipboard!');
          }}
          className="w-full py-2 bg-cyan-900 hover:bg-cyan-800 text-cyan-100 text-xs font-bold tracking-widest uppercase rounded transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-3 h-3" />
          Copy All Coords
        </button>
      </div>
    </motion.div>
  );
};
