import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type LoginModalProps = {
  visible: boolean;
  username: string;
  password: string;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (username: string, password: string) => void;
};

export const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        >
          <div className="w-[400px] p-8 border border-gray-800 bg-black relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
            
            <h3 className="text-2xl font-light text-center text-gray-200 tracking-[0.4em] mb-4 font-serif">IDENTITY VERIFICATION</h3>
            <p className="text-xs text-center text-gray-500 mb-8 font-mono leading-relaxed px-4">
              初次連結者，請署名你的代號。<br/>
              那串銘刻於靈魂的密鑰，將是你回歸的唯一憑證。
            </p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-widest">OC Name</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  placeholder="Enter OC Name..." 
                  className="w-full bg-gray-900 border border-gray-700 p-3 text-gray-300 focus:outline-none focus:border-white transition-colors text-sm font-mono" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-widest">Passcode</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-gray-900 border border-gray-700 p-3 text-gray-300 focus:outline-none focus:border-white transition-colors text-sm font-mono" 
                />
              </div>
              
              <button 
                onClick={() => onSubmit(username, password)} 
                className="w-full py-3 mt-4 bg-gray-200 text-black text-sm font-bold tracking-widest hover:bg-white transition-colors uppercase"
              >
                Connect to Terminal
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
