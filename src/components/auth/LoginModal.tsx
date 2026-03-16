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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <div className="w-[400px] p-8 relative overflow-hidden shadow-2xl"
            style={{ backgroundColor: '#D9D7C5', border: '1px solid #737065' }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#BFBAA8] to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#BFBAA8] to-transparent" />

            <h3 className="text-2xl font-light text-center tracking-[0.4em] mb-4 font-serif" style={{ color: '#403E34' }}>
              IDENTITY VERIFICATION
            </h3>
            <p className="text-xs text-center mb-8 font-mono leading-relaxed px-4" style={{ color: '#737065' }}>
              初次連結者，請署名你的代號。<br/>
              那串銘刻於靈魂的密鑰，將是你回歸的唯一憑證。
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest" style={{ color: '#737065' }}>OC Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  placeholder="Enter OC Name..."
                  className="w-full p-3 focus:outline-none transition-colors text-sm font-mono"
                  style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest" style={{ color: '#737065' }}>Passcode</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 focus:outline-none transition-colors text-sm font-mono"
                  style={{ backgroundColor: '#BFBAA8', border: '1px solid #737065', color: '#403E34' }}
                />
              </div>

              <button
                onClick={() => onSubmit(username, password)}
                className="w-full py-3 mt-4 text-sm font-bold tracking-widest uppercase transition-colors"
                style={{ backgroundColor: '#403E34', color: '#D9D7C5' }}
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
