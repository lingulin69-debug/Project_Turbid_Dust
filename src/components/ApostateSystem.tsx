import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserData } from './ReportSystemLogic';
import { Triangle, Hexagon, Circle, Box, Eye, Activity, Zap } from 'lucide-react';

import quizConfig from './apostate_quiz_config.json';

// --- Types ---

interface ApostateSystemProps {
  currentUser: UserData | null;
  currentChapter: string;
  onUpdateUser: (updates: Partial<UserData>) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

// --- Questions Pool (Loaded from Config) ---
const QUESTION_POOL = quizConfig.questions.map(q => ({
  id: q.id.toString(),
  text: q.q,
  options: [
    { text: q.a, affinity: 0 }, // Option A is usually conformity/survival (low affinity)
    { text: q.b, affinity: 2 }, // Option B is usually rebellion/truth (high affinity)
  ]
}));

// --- Components ---

export const ApostateGeometryIcon: React.FC<{ onClick: () => void, isAvailable: boolean }> = ({ onClick, isAvailable }) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative w-10 h-10 flex items-center justify-center group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-cyan-900/20 blur-md rounded-full animate-pulse"></div>
      
      {/* Rotating Geometry (Tetrahedron representation) */}
      <motion.div
        animate={{ rotate: 360, rotateX: 360, rotateY: 180 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-full h-full flex items-center justify-center text-cyan-500/80"
      >
        <Box className="w-6 h-6 stroke-[1px]" />
      </motion.div>

      {/* Stroboscopic Light */}
      <motion.div
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 1] }} // Flash
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-1 h-1 bg-cyan-200 rounded-full shadow-[0_0_10px_#22d3ee]"></div>
      </motion.div>

      {/* Tooltip */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-48 text-right opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <p className="text-xs text-cyan-200 font-serif tracking-widest bg-black/90 p-2 rounded border border-cyan-900/50 backdrop-blur-sm">
          『幾何體』<br/>
          <span className="text-[10px] text-gray-400">維度的震顫...</span>
        </p>
      </div>
    </motion.button>
  );
};

export const ApostateSystem: React.FC<ApostateSystemProps> = ({ currentUser, currentChapter, onUpdateUser, menuOpen, setMenuOpen }) => {
  const [showScreening, setShowScreening] = useState(false);
  // menuOpen is controlled by parent
  
  // Screening State
  const [questions, setQuestions] = useState<typeof QUESTION_POOL>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [totalAffinity, setTotalAffinity] = useState(0);
  
  // Ability State
  const [assignedAction, setAssignedAction] = useState<'A' | 'B' | 'C' | null>(null);
  const [actionUsed, setActionUsed] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Effects ---

  // 1. Check for Screening Trigger (Chapter 1)
  useEffect(() => {
    if (!currentUser) return;
    
    // If user hasn't done the lottery pool questionnaire yet, and it's Chapter 1
    // (In real logic, check `is_in_lottery_pool` from DB. Here we use local mock or prop)
    // We assume `is_in_lottery_pool` is on currentUser (need to update type definition in ReportSystemLogic)
    const isInPool = (currentUser as any).is_in_lottery_pool;
    
    if (!isInPool && !showScreening && !localStorage.getItem('apostate_screening_done')) {
      // Pick 3 random questions
      const shuffled = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
      setQuestions(shuffled.slice(0, 3));
      setShowScreening(true);
    }
  }, [currentUser, currentChapter]);

  // 2. Fetch Assigned Action (Mock)
  useEffect(() => {
    if (currentUser && (currentUser as any).identity_role === 'apostate') {
      // Mock fetching from apostate_actions
      // In real app: supabase.from('apostate_actions').select(...)
      const mockAction = localStorage.getItem(`apostate_action_${currentChapter}_${currentUser.oc_name}`);
      const mockUsed = localStorage.getItem(`apostate_used_${currentChapter}_${currentUser.oc_name}`);
      
      if (mockAction) {
        setAssignedAction(mockAction as any);
      } else {
        // Assign random action if not exists
        const actions = ['A', 'B', 'C'] as const;
        const newAction = actions[Math.floor(Math.random() * actions.length)];
        localStorage.setItem(`apostate_action_${currentChapter}_${currentUser.oc_name}`, newAction);
        setAssignedAction(newAction);
      }
      
      setActionUsed(mockUsed === 'true');
    }
  }, [currentUser, currentChapter]);

  // --- Handlers ---

  const handleScreeningAnswer = (affinity: number) => {
    const newTotal = totalAffinity + affinity;
    setTotalAffinity(newTotal);

    if (currentQIndex < 2) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // Finished
      finishScreening(newTotal + affinity); // Include current answer
    }
  };

  const finishScreening = (score: number) => {
    // 3 questions, max score 6 (2 * 3).
    // Logic: if target answers >= 2 (score >= 4), set high affinity.
    const isHighAffinity = score >= 4; 
    
    // Update User (Mock)
    onUpdateUser({
      ...currentUser!,
      // @ts-ignore
      is_in_lottery_pool: true,
      is_high_affinity_candidate: isHighAffinity
    });
    
    localStorage.setItem('apostate_screening_done', 'true');
    setShowScreening(false);
    
    if (isHighAffinity) {
      alert('『幾何體已在您的視網膜上凝結。您不再僅僅是您自己，您是這場棋局中的一道裂痕。』\n(已標記為高適性候選者)');
    } else {
      alert('『您眨了眨眼，幻覺消失了。世界依然穩固。』\n(已完成適性檢測)');
    }
  };

  const handleExecuteAction = () => {
    if (!assignedAction) return;
    
    setLoading(true);
    
    setTimeout(() => {
      // Execute Logic
      switch (assignedAction) {
        case 'A': // Map Info
          alert('『我在教會的聖所牆縫裡，看見了被他們隱藏的荒原座標。』\n(已標記敵方據點位置 1 小時)');
          break;
        case 'B': // Balance Info
          const enemyTilt = Math.floor(Math.random() * 50); // Mock
          alert(`『眾議會的帳本上，記錄著他們對天平犯下的下一樁罪行。』\n(敵方當前偏移值: ${enemyTilt})`);
          break;
        case 'C': // Resource Siphon
          alert('『並非每一粒沙都會回歸原處。』\n(已發起「物資劫掠」連結，等待 10 位同伴響應)');
          break;
      }
      
      // Mark as used
      setActionUsed(true);
      localStorage.setItem(`apostate_used_${currentChapter}_${currentUser?.oc_name}`, 'true');
      setLoading(false);
      setMenuOpen(false);
      
    }, 1500);
  };

  // Only render system if user is logged in
  if (!currentUser) return null;

  return (
    <>
      {/* 1. Screening Modal */}
      <AnimatePresence>
        {showScreening && questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          >
            <div className="w-[500px] p-10 border border-gray-800 bg-black relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-900 to-transparent"></div>
              
              <h3 className="text-xl font-light text-center text-cyan-500/50 tracking-[0.4em] mb-8 font-serif animate-pulse">
                GEOMETRIC INQUIRY {currentQIndex + 1}/{questions.length}
              </h3>
              
              <p className="text-lg text-gray-300 font-serif leading-loose mb-10 text-center">
                {questions[currentQIndex].text}
              </p>
              
              <div className="space-y-4">
                {questions[currentQIndex].options.sort(() => Math.random() - 0.5).map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleScreeningAnswer(opt.affinity)}
                    className="w-full py-4 px-6 border border-gray-800 text-gray-500 hover:text-cyan-200 hover:border-cyan-800 hover:bg-cyan-900/10 transition-all duration-500 tracking-widest text-sm uppercase text-left leading-relaxed font-serif"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Ability Menu Modal */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          >
            <div className="w-[600px] h-[400px] bg-black border border-cyan-900/30 relative flex overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.1)]" onClick={e => e.stopPropagation()}>
              
              {/* Left: Geometric Visual */}
              <div className="w-1/3 bg-[#050a0a] border-r border-cyan-900/20 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="text-cyan-800/40"
                >
                  <Hexagon className="w-32 h-32 stroke-[0.5px]" />
                </motion.div>
                <div className="absolute bottom-6 text-[10px] text-cyan-900 font-mono tracking-widest text-center">
                  APOSTATE<br/>PROTOCOL
                </div>
              </div>

              {/* Right: Interface */}
              <div className="w-2/3 p-8 flex flex-col relative">
                <h3 className="text-xl font-serif text-cyan-500/80 tracking-widest mb-2">幾何通訊儀</h3>
                <p className="text-[10px] text-gray-500 font-mono mb-8 border-b border-cyan-900/20 pb-4">
                  『這不是聲音，這是維度的震顫。』
                </p>

                {actionUsed ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                    <Activity className="w-8 h-8 mb-4 opacity-50" />
                    <p className="text-sm font-serif italic">通訊冷卻中...</p>
                    <p className="text-[10px] mt-2 font-mono">NEXT WINDOW: NEXT CHAPTER</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="p-4 bg-cyan-900/10 border border-cyan-900/30 rounded">
                      <div className="flex items-center gap-3 mb-2">
                        {assignedAction === 'A' && <Eye className="w-4 h-4 text-cyan-400" />}
                        {assignedAction === 'B' && <Zap className="w-4 h-4 text-cyan-400" />}
                        {assignedAction === 'C' && <Activity className="w-4 h-4 text-cyan-400" />}
                        <span className="text-sm text-cyan-200 font-bold tracking-widest">
                          {assignedAction === 'A' && '霧後的真相 (地圖情報)'}
                          {assignedAction === 'B' && '權力的裂縫 (天平情報)'}
                          {assignedAction === 'C' && '物資的截流 (實際獎勵)'}
                        </span>
                      </div>
                      <p className="text-xs text-cyan-500/70 font-serif leading-relaxed pl-7">
                        {assignedAction === 'A' && '隨機標記敵方已解鎖但己方未知的據點座標。'}
                        {assignedAction === 'B' && '讀取敵方當前天平總偏移值。'}
                        {assignedAction === 'C' && '發起連點任務，從敵方總池竊取 1 枚碎錢。'}
                      </p>
                    </div>

                    <button
                      onClick={handleExecuteAction}
                      disabled={loading}
                      className="w-full py-3 border border-cyan-700 text-cyan-400 hover:bg-cyan-900/20 hover:text-cyan-200 transition-all uppercase text-xs tracking-[0.2em] relative overflow-hidden group"
                    >
                      <span className="relative z-10">{loading ? 'TRANSMITTING...' : '執行通訊 (Execute)'}</span>
                      <div className="absolute inset-0 bg-cyan-900/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Geometry Icon Control (Controlled by Parent, but logic here) */}
      {/* Note: The parent component should render the icon inside the toolbar, calling setShowMenu(true) */}
    </>
  );
};
