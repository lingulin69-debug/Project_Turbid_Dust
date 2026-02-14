import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { UserData } from './ReportSystemLogic';
import { Scan, ShieldAlert, CheckCircle, Search, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiquidatorSystemProps {
  currentUser: UserData;
  currentChapter: string;
  onUpdateUser: (updates: Partial<UserData>) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

export const LiquidatorLensIcon: React.FC<{ 
  onClick: () => void, 
  isAvailable: boolean, 
  isDevMode?: boolean,
  dragProps?: any 
}> = ({ onClick, isAvailable, isDevMode, dragProps }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`relative w-10 h-10 flex items-center justify-center group ${isDevMode ? 'cursor-move' : ''}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      {...dragProps}
    >
      {/* Background Ring */}
      <div className="absolute inset-0 border-2 border-red-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
      <div className="absolute inset-0 border border-red-500/50 rounded-full scale-75"></div>
      
      {/* Icon */}
      <Scan className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors" />

      {/* Dev Mode Indicator */}
      {isDevMode && <div className="absolute inset-0 border border-cyan-500/30 border-dashed rounded-lg -m-1 pointer-events-none"></div>}

      {/* Tooltip */}
      {!isDevMode && (
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-48 text-right opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <p className="text-xs text-red-200 font-serif tracking-widest bg-black/90 p-2 rounded border border-red-900/50 backdrop-blur-sm">
            『透視鏡』<br/>
            <span className="text-[10px] text-gray-400">異常信號掃描...</span>
          </p>
        </div>
      )}
    </motion.button>
  );
};

export const LiquidatorSystem: React.FC<LiquidatorSystemProps> = ({ currentUser, currentChapter, onUpdateUser, menuOpen, setMenuOpen }) => {
  const [targetUid, setTargetUid] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'result'>('idle');
  const [scanResult, setScanResult] = useState<'positive' | 'negative' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionUsed, setActionUsed] = useState(false);

  // Check if used in this chapter
  useEffect(() => {
    if (!currentUser) return;
    const usedKey = `liquidator_used_${currentChapter}_${currentUser.oc_name}`;
    const used = localStorage.getItem(usedKey);
    if (used === 'true') {
      setActionUsed(true);
    }
  }, [currentUser, currentChapter]);

  const handleScan = async () => {
    if (!targetUid.trim()) return;
    if (actionUsed) return;

    setScanStatus('scanning');
    setErrorMsg('');

    try {
      // 1. Simulate Scan Delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Query via API
      const result = await apiClient.liquidator.scan(targetUid, currentUser.faction);
      
      // 3. Update Result
      setScanResult(result.result);
      setScanStatus('result');

      // 4. Mark as Used Locally
      setActionUsed(true);
      localStorage.setItem(`liquidator_used_${currentChapter}_${currentUser.oc_name}`, 'true');

    } catch (err: any) {
      console.error('Scan failed:', err);
      setErrorMsg('掃描儀故障：' + err.message);
      setScanStatus('idle');
    }
  };

  const reset = () => {
    setMenuOpen(false);
    setTimeout(() => {
      setScanStatus('idle');
      setScanResult(null);
      setTargetUid('');
      setErrorMsg('');
    }, 300);
  };

  if (!menuOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={reset}
      >
        <div 
          className="w-[500px] bg-[#0f0505] border border-red-900/50 p-8 shadow-[0_0_50px_rgba(220,38,38,0.1)] relative overflow-hidden" 
          onClick={e => e.stopPropagation()}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>
          <Scan className="absolute -right-10 -bottom-10 w-40 h-40 text-red-900/10" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-red-900/20 rounded border border-red-900/50">
              <Scan className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-serif text-red-500 tracking-widest">THE LENS</h3>
              <p className="text-[10px] text-gray-500 font-mono uppercase">Internal Security Protocol</p>
            </div>
          </div>

          {/* Content */}
          <div className="relative min-h-[200px] flex flex-col">
            
            {actionUsed && scanStatus === 'idle' ? (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                 <ShieldAlert className="w-12 h-12 mb-4 opacity-30" />
                 <p className="text-sm font-serif">透視鏡正在冷卻中...</p>
                 <p className="text-[10px] mt-2 font-mono">NEXT CHARGE: NEXT CHAPTER</p>
               </div>
            ) : scanStatus === 'idle' ? (
              <div className="space-y-6">
                <p className="text-sm text-gray-400 font-serif leading-relaxed border-l-2 border-red-900/30 pl-4">
                  『凝視同伴的靈魂，尋找那道不該存在的裂痕。』
                </p>
                
                <div className="space-y-2">
                  <label className="text-[10px] text-red-400/70 uppercase tracking-widest">Target Identity (OC Name)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input 
                      type="text" 
                      value={targetUid}
                      onChange={e => setTargetUid(e.target.value)}
                      placeholder="輸入目標代號..."
                      className="w-full bg-black border border-red-900/30 p-3 pl-10 text-gray-300 focus:outline-none focus:border-red-500 transition-colors text-sm font-mono"
                    />
                  </div>
                </div>

                {errorMsg && <p className="text-xs text-red-500 animate-pulse">{errorMsg}</p>}

                <button
                  onClick={handleScan}
                  className="w-full py-3 bg-red-900/10 border border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-200 transition-all uppercase text-xs tracking-[0.2em]"
                >
                  啟動掃描 (ACTIVATE)
                </button>
              </div>
            ) : scanStatus === 'scanning' ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-t-2 border-red-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-r-2 border-red-900 rounded-full animate-spin reverse duration-1000"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-red-500 font-mono text-xs animate-pulse">
                    ANALYZING
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-mono">Decripting soul signature...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
                {scanResult === 'positive' ? (
                  <>
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse">
                      <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-2xl text-red-500 font-bold tracking-widest mb-2">HETEROGENEOUS</h4>
                      <p className="text-sm text-red-300">檢測到異質反應 (Positive)</p>
                    </div>
                    <p className="text-xs text-gray-500 font-mono border-t border-red-900/30 pt-4 w-full text-center">
                      TARGET IS AN APOSTATE.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-900/50">
                      <CheckCircle className="w-10 h-10 text-green-700" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-2xl text-green-700 font-bold tracking-widest mb-2">STABLE</h4>
                      <p className="text-sm text-green-600">反應穩定 (Negative)</p>
                    </div>
                    <p className="text-xs text-gray-500 font-mono border-t border-green-900/10 pt-4 w-full text-center">
                      TARGET IS A CITIZEN.
                    </p>
                  </>
                )}
                
                <button 
                  onClick={reset}
                  className="mt-4 text-xs text-gray-500 underline hover:text-gray-300"
                >
                  Close Interface
                </button>
              </div>
            )}

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
