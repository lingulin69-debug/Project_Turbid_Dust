import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CentralBalanceScaleProps {
  // 0-100, where 50 is balanced. < 50 tilts left (Turbid?), > 50 tilts right (Pure?)
  // Or vice-versa. Let's assume Left = Turbid (Dark), Right = Pure (Light) for now.
  balance: number; 
}

export const CentralBalanceScale: React.FC<CentralBalanceScaleProps> = ({ balance }) => {
  // Simple oscillation for "breathing" effect
  const [breathing, setBreathing] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathing(prev => (prev === 0 ? 5 : 0));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Calculate rotation based on balance (0-100)
  // 0 -> -15deg (Left heavy)
  // 50 -> 0deg (Balanced)
  // 100 -> 15deg (Right heavy)
  const rotation = (balance - 50) * 0.3; // max +/- 15 degrees

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none">
      <div className="relative w-64 h-24 flex items-center justify-center">
        
        {/* Main Beam (Animated Rotation) */}
        <motion.div 
          className="w-full h-2 bg-gradient-to-r from-gray-800 via-yellow-600 to-gray-200 rounded-full shadow-lg relative"
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 60, damping: 10 }}
        >
          {/* Pivot Point (Fulcrum) */}
          <div className="absolute top-1/2 left-1/2 w-6 h-6 -mt-3 -ml-3 bg-yellow-500 rounded-full border-2 border-yellow-700 shadow-inner z-10" />

          {/* Left Pan (Turbid) */}
          <div className="absolute left-0 top-1/2 w-16 h-16 -ml-8 mt-4 flex flex-col items-center">
            <div className="w-1 h-8 bg-gray-500/50" /> {/* Chain */}
            <div className="w-12 h-4 bg-gray-800 rounded-b-full border-t-0 border border-gray-600 shadow-lg relative overflow-hidden">
               {/* Content in Pan */}
               <div className="absolute bottom-0 w-full h-full bg-purple-900/30 animate-pulse" />
            </div>
            <span className="text-[10px] text-gray-400 mt-1 font-mono tracking-widest uppercase drop-shadow-md">Turbid</span>
          </div>

          {/* Right Pan (Pure) */}
          <div className="absolute right-0 top-1/2 w-16 h-16 -mr-8 mt-4 flex flex-col items-center">
             <div className="w-1 h-8 bg-gray-300/50" /> {/* Chain */}
             <div className="w-12 h-4 bg-gray-100 rounded-b-full border-t-0 border border-gray-300 shadow-lg relative overflow-hidden">
                {/* Content in Pan */}
                <div className="absolute bottom-0 w-full h-full bg-yellow-200/30 animate-pulse" />
             </div>
             <span className="text-[10px] text-yellow-100 mt-1 font-mono tracking-widest uppercase drop-shadow-md">Pure</span>
          </div>
        </motion.div>

        {/* Base / Stand (Static) */}
        <div className="absolute top-12 left-1/2 -ml-1 w-2 h-12 bg-gray-700/80 -z-10" />
        <div className="absolute top-24 left-1/2 -ml-8 w-16 h-2 bg-gray-800 rounded-full -z-10 blur-[2px]" />

        {/* HUD Text Display */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
          <div className="text-[10px] text-white/50 tracking-[0.2em] font-light">BALANCE</div>
          <div className={`text-sm font-bold font-mono transition-colors duration-500
            ${balance < 45 ? 'text-purple-400' : (balance > 55 ? 'text-yellow-400' : 'text-gray-200')}
          `}>
            {balance.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};
