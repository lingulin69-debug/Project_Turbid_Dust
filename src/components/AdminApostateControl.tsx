import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { UserData } from './ReportSystemLogic';
import { Shield, Users, RefreshCw, AlertTriangle, Dice5, FileText, X, ChevronDown, ChevronUp, Activity, List, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminApostateControlProps {
  currentUser: UserData;
  onUpdate: () => void; // Trigger parent refresh
}

interface Dossier {
  username: string;
  faction: string;
  deviation: string;
  anomaly?: string; // For candidates
  identity_role?: string; // For registry
}

type ViewMode = 'dashboard' | 'candidates' | 'registry';

export const AdminApostateControl: React.FC<AdminApostateControlProps> = ({ currentUser, onUpdate }) => {
  const [candidatesCount, setCandidatesCount] = useState<{ turbid: number, pure: number } | null>(null);
  const [apostatesCh1Count, setApostatesCh1Count] = useState<{ turbid: number, pure: number } | null>(null);
  const [apostatesCh3Count, setApostatesCh3Count] = useState<{ turbid: number, pure: number } | null>(null);
  const [liquidatorsCount, setLiquidatorsCount] = useState<{ turbid: number, pure: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dossierList, setDossierList] = useState<Dossier[]>([]);
  const [showDossier, setShowDossier] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [listData, setListData] = useState<Dossier[]>([]);

  // Only render for admin
  if (currentUser.oc_name !== 'vonn') return null;

  const fetchStats = async () => {
    try {
      const stats = await apiClient.admin.getStats();
      setCandidatesCount(stats.candidates);
      setApostatesCh1Count(stats.apostatesCh1);
      setApostatesCh3Count(stats.apostatesCh3);
      setLiquidatorsCount(stats.liquidators);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const data = await apiClient.admin.getCandidates();
      setListData(data);
      setViewMode('candidates');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistry = async () => {
    setLoading(true);
    try {
      const data = await apiClient.admin.getRegistry();
      setListData(data);
      setViewMode('registry');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const runLottery = async (countPerFaction: number, chapter: string) => {
    if (!confirm(`確定要為 ${chapter} 執行背道者抽選嗎？\n每陣營將新增 ${countPerFaction} 名背道者。`)) return;

    setLoading(true);
    setMessage('Processing Lottery...');
    setDossierList([]);

    try {
      const result = await apiClient.admin.runLottery(countPerFaction, chapter);
      setDossierList(result.selected);
      setShowDossier(true);
      setMessage(`Success! ${result.selected.length} chosen.`);
      fetchStats(); 
      onUpdate(); 

    } catch (err: any) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runLiquidatorSelection = async (countPerFaction: number, chapter: string) => {
    if (!confirm(`確定要為 ${chapter} 選拔清算人嗎？\n每陣營將隨機晉升 ${countPerFaction} 名公民。`)) return;

    setLoading(true);
    setMessage('Processing Liquidator Selection...');
    setDossierList([]);

    try {
      const result = await apiClient.admin.runLiquidatorSelect(countPerFaction, chapter);
      setDossierList(result.selected);
      setShowDossier(true);
      setMessage(`Liquidators Assigned: ${result.selected.length} chosen.`);
      fetchStats();
      onUpdate();

    } catch (err: any) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div 
        initial={false}
        animate={{ 
          width: isExpanded ? '20rem' : '3.5rem', 
          height: isExpanded ? 'auto' : '3.5rem'
        }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 30
        }}
        layout="size" 
        className={`fixed bottom-4 left-4 z-[100] bg-black/90 border border-red-900 rounded-lg shadow-2xl font-sans tracking-wide text-xs overflow-hidden origin-bottom-left`}
        style={{ minWidth: isExpanded ? '20rem' : '3.5rem' }} 
      >
        <motion.div 
          layout="preserve-aspect" 
          className={`flex items-center gap-2 text-red-500 cursor-pointer ${isExpanded ? 'p-4 pb-2 mb-0 border-b border-red-900 justify-between' : 'p-3 justify-center h-full gap-3'}`}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ width: '100%' }} 
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            {isExpanded ? <Shield className="w-4 h-4" /> : <Activity className="w-4 h-4 animate-pulse" />}
            {isExpanded && <span className="font-bold tracking-widest uppercase">背道者監控終端</span>}
          </div>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }} 
              className="space-y-4 p-4 pt-2"
            >
              {/* Navigation Tabs */}
              <div className="flex gap-2 border-b border-gray-800 pb-2">
                 <button 
                   onClick={() => setViewMode('dashboard')}
                   className={`flex-1 py-1 text-center transition-colors ${viewMode === 'dashboard' ? 'text-red-500 bg-red-900/20' : 'text-gray-600 hover:text-gray-400'}`}
                 >
                   <Activity className="w-3 h-3 mx-auto mb-1" />
                   監控
                 </button>
                 <button 
                   onClick={fetchCandidates}
                   className={`flex-1 py-1 text-center transition-colors ${viewMode === 'candidates' ? 'text-red-500 bg-red-900/20' : 'text-gray-600 hover:text-gray-400'}`}
                 >
                   <List className="w-3 h-3 mx-auto mb-1" />
                   候選
                 </button>
                 <button 
                   onClick={fetchRegistry}
                   className={`flex-1 py-1 text-center transition-colors ${viewMode === 'registry' ? 'text-red-500 bg-red-900/20' : 'text-gray-600 hover:text-gray-400'}`}
                 >
                   <Globe className="w-3 h-3 mx-auto mb-1" />
                   名冊
                 </button>
              </div>

              {/* View Content */}
              {viewMode === 'dashboard' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* 雙翼視圖 (Dual-wing View) */}
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] text-gray-500 border-b border-gray-800 pb-1">
                      <span>[ 濁氣陣營 Turbid ]</span>
                      <span>vs</span>
                      <span>[ 清塵陣營 Pure ]</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="text-[10px]">第一章覺醒者</span>
                        <div className="flex gap-4 font-mono">
                          <span className={apostatesCh1Count?.turbid === 3 ? "text-cyan-500" : "text-gray-600"}>
                            [ {apostatesCh1Count?.turbid ?? 0} / 3 ]
                          </span>
                          <span className="text-gray-800">|</span>
                          <span className={apostatesCh1Count?.pure === 3 ? "text-cyan-500" : "text-gray-600"}>
                            [ {apostatesCh1Count?.pure ?? 0} / 3 ]
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-gray-400">
                        <span className="text-[10px]">第三章覺醒者</span>
                        <div className="flex gap-4 font-mono">
                          <span className={apostatesCh3Count?.turbid === 1 ? "text-purple-500" : "text-gray-600"}>
                            [ {apostatesCh3Count?.turbid ?? 0} / 1 ]
                          </span>
                          <span className="text-gray-800">|</span>
                          <span className={apostatesCh3Count?.pure === 1 ? "text-purple-500" : "text-gray-600"}>
                            [ {apostatesCh3Count?.pure ?? 0} / 1 ]
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-800">
                      <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                        <span>高偏移候選人</span>
                        <span>Turbid: {candidatesCount?.turbid ?? 0} | Pure: {candidatesCount?.pure ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-gray-800 mt-2">
                    <button
                      onClick={() => runLottery(3, 'Chapter 1')}
                      disabled={loading || (apostatesCh1Count?.turbid === 3 && apostatesCh1Count?.pure === 3)}
                      className={`w-full py-2 border flex items-center justify-center gap-2 transition-all ${
                        (apostatesCh1Count?.turbid === 3 && apostatesCh1Count?.pure === 3)
                          ? "bg-gray-900/20 border-gray-800 text-gray-600 cursor-not-allowed"
                          : "bg-cyan-900/20 border-cyan-800 text-cyan-400 hover:bg-cyan-900/40 hover:text-white"
                      }`}
                    >
                      <Dice5 className="w-3 h-3" />
                      {(apostatesCh1Count?.turbid === 3 && apostatesCh1Count?.pure === 3) ? "已鎖定 (Locked)" : "[章節一] 執行宿命抽選"}
                    </button>
                    
                    <button
                      onClick={() => runLottery(1, 'Chapter 3')}
                      disabled={loading || (apostatesCh3Count?.turbid === 1 && apostatesCh3Count?.pure === 1)}
                      className={`w-full py-2 border flex items-center justify-center gap-2 transition-all ${
                        (apostatesCh3Count?.turbid === 1 && apostatesCh3Count?.pure === 1)
                          ? "bg-gray-900/20 border-gray-800 text-gray-600 cursor-not-allowed"
                          : "bg-purple-900/20 border-purple-800 text-purple-400 hover:bg-purple-900/40 hover:text-white"
                      }`}
                    >
                      <Activity className="w-3 h-3" />
                      {(apostatesCh3Count?.turbid === 1 && apostatesCh3Count?.pure === 1) ? "已鎖定 (Locked)" : "[章節三] 終極覺醒"}
                    </button>

                    <button
                      onClick={() => runLiquidatorSelection(1, 'Chapter 2')}
                      disabled={loading}
                      className="w-full py-2 bg-red-900/20 border border-red-800 text-red-400 hover:bg-red-900/40 hover:text-white transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      <Shield className="w-3 h-3" />
                      [章節二] 授權維度清算
                    </button>

                    <div className="col-span-2 mt-2 pt-2 border-t border-gray-800">
                       <p className="uppercase text-[10px] text-gray-600">部署中清算人</p>
                       <div className="flex justify-between px-4 text-red-500/60 font-mono">
                         <span>T: {liquidatorsCount?.turbid ?? 0}</span>
                         <span>P: {liquidatorsCount?.pure ?? 0}</span>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {(viewMode === 'candidates' || viewMode === 'registry') && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="relative overflow-hidden border border-gray-800 rounded bg-black/50"
                >
                  {/* Narrative Header */}
                  <div className={`text-[10px] uppercase tracking-widest p-2 font-bold border-b ${viewMode === 'candidates' ? 'text-red-500 border-red-900/30 bg-red-950/20' : 'text-emerald-500 border-emerald-900/30 bg-emerald-950/20'}`}>
                    {viewMode === 'candidates' ? '/// TARGET: HIGH_AFFINITY_POOL' : '/// TARGET: GLOBAL_CITIZEN_REGISTRY'}
                  </div>

                  {/* Scanline Overlay for Registry */}
                  {viewMode === 'registry' && (
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,255,100,0.03)_50%,transparent_50%)] bg-[length:100%_4px] z-10" />
                  )}

                  {/* Column Headers */}
                  <div className={`grid grid-cols-[1fr_60px_70px] gap-2 p-2 text-[9px] uppercase tracking-wider font-mono opacity-70 ${viewMode === 'candidates' ? 'text-red-400' : 'text-emerald-400'}`}>
                    <div>Subject_ID</div>
                    <div>Align</div>
                    <div className="text-right">{viewMode === 'candidates' ? 'Anomaly' : 'Status'}</div>
                  </div>

                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar font-mono text-[10px] relative z-0">
                    {loading ? (
                      <div className="text-center text-gray-500 py-8"><RefreshCw className="w-4 h-4 animate-spin mx-auto"/></div>
                    ) : listData.length === 0 ? (
                      <div className="text-center text-gray-600 py-8 tracking-widest uppercase">No Signal Detected</div>
                    ) : (
                      listData.map((item, i) => (
                        <div 
                          key={i} 
                          className={`grid grid-cols-[1fr_60px_70px] gap-2 p-2 border-b border-gray-800/30 transition-colors ${
                            viewMode === 'candidates' 
                              ? 'hover:bg-red-900/10 text-gray-300' 
                              : 'hover:bg-emerald-900/10 text-gray-400'
                          }`}
                        >
                          <span className={`truncate ${viewMode === 'candidates' ? 'text-red-200' : 'text-emerald-200/80'}`}>
                            {item.username}
                          </span>
                          
                          <span className={item.faction === 'Turbid' ? 'text-purple-400' : 'text-amber-400'}>
                            {item.faction.substring(0, 3).toUpperCase()}
                          </span>
                          
                          <div className="text-right">
                            {viewMode === 'candidates' && (
                              <span className="text-red-500 font-bold">{item.anomaly}</span>
                            )}
                            {viewMode === 'registry' && (
                              <span className={`uppercase ${item.identity_role === 'citizen' ? 'text-gray-600' : 'text-white font-bold'}`}>
                                {item.identity_role === 'citizen' ? 'CTZN' : item.identity_role?.substring(0, 4).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Footer Stats */}
                  <div className={`p-1 text-[9px] text-right border-t border-gray-800/50 ${viewMode === 'candidates' ? 'text-red-500/50' : 'text-emerald-500/50'}`}>
                    COUNT: {listData.length.toString().padStart(3, '0')} // SYNC_OK
                  </div>
                </motion.div>
              )}

              {/* Status Message */}
              {message && (
                <div className="p-2 bg-gray-900 border border-gray-700 text-gray-300 break-words mt-2">
                  {loading && <RefreshCw className="w-3 h-3 animate-spin inline mr-2" />}
                  {message}
                </div>
              )}

              <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-2">
                <AlertTriangle className="w-3 h-3" />
                <span>警告：因果律已鎖定，操作不可逆轉</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>


      {/* The Chosen Dossier Modal */}
      <AnimatePresence>
        {showDossier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-black border-2 border-red-800 rounded-lg w-full max-w-md shadow-[0_0_30px_rgba(220,38,38,0.3)] relative overflow-hidden"
            >
              {/* Header */}
              <div className="bg-red-900/20 p-4 border-b border-red-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-red-500">
                  <FileText className="w-5 h-5" />
                  <h2 className="font-bold tracking-[0.2em] text-lg uppercase">The Chosen Dossier</h2>
                </div>
                <button 
                  onClick={() => setShowDossier(false)}
                  className="text-red-500 hover:text-red-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scan Line Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] z-10" />

              {/* Content */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto font-mono">
                {dossierList.map((dossier, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="border border-gray-800 bg-gray-900/50 p-4 rounded relative group hover:border-red-500/50 transition-colors"
                  >
                    <div className="absolute top-0 right-0 p-1">
                      {/* One-Shot Blink Animation */}
                      <div className="w-2 h-2 bg-red-500 rounded-full blink-once shadow-[0_0_8px_red]" />
                    </div>
                    
                    <div className="grid grid-cols-[80px_1fr] gap-4">
                       <div className="text-gray-500 text-xs uppercase tracking-wider text-right space-y-1">
                         <div>Subject</div>
                         <div>Faction</div>
                         <div>Dev.Freq</div>
                       </div>
                       <div className="text-gray-200 text-sm font-bold tracking-wide space-y-1">
                         {/* CSS-Driven Typer Effect */}
                         <div className="typewriter-text-wrapper">
                           <div 
                             className="typewriter-text text-white group-hover:text-red-400 transition-colors"
                             style={{ '--type-delay': `${index * 0.2 + 0.3}s` } as React.CSSProperties}
                           >
                             {dossier.username}
                           </div>
                         </div>
                         <div className={dossier.faction === 'Turbid' ? 'text-purple-400' : 'text-amber-400'}>
                           {dossier.faction}
                         </div>
                         <div className="text-red-500 font-mono">
                           {dossier.deviation}
                         </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-red-900/50 text-center">
                <p className="text-[10px] text-red-500/60 uppercase tracking-widest animate-pulse">
                  System: Records Updated. Synchronization Complete.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
