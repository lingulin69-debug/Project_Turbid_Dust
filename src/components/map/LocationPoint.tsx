import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type Faction = 'Turbid' | 'Pure' | 'Common';

export type LocationPointData = {
  id: string;
  xPct: number;
  yPct: number;
  label: string;
  faction?: Faction;
  rolesAllowed?: string[];
};

type Props = LocationPointData & {
  currentFaction?: Faction;
  currentRoles?: string[];
};

export const LocationPoint: React.FC<Props> = ({
  id,
  xPct,
  yPct,
  label,
  faction = 'Common',
  rolesAllowed,
  currentFaction = 'Common',
  currentRoles = [],
}) => {
  const [open, setOpen] = useState(false);

  const factionOk =
    faction === 'Common' || faction === currentFaction;
  const roleOk =
    !rolesAllowed || rolesAllowed.length === 0 || rolesAllowed.some(r => currentRoles.includes(r));

  if (!factionOk || !roleOk) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 2,
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-4 h-4 rounded-full border transition-colors ${
          open ? 'bg-white border-white' : 'bg-black/60 border-white/70'
        }`}
        style={{ boxShadow: open ? '0 0 0 6px rgba(255,255,255,0.2)' : 'none' }}
        aria-label={label}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
            animate={{ opacity: 1, clipPath: 'circle(140% at 50% 50%)' }}
            exit={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 mt-3 w-64 max-w-[70vw] z-10"
          >
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-black/85 mix-blend-multiply" />
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  background:
                    'radial-gradient(120px at 30% 20%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(160px at 70% 80%, rgba(255,255,255,0.06), transparent 70%)',
                  filter: 'blur(1px)',
                }}
              />
              <div className="relative border border-white/25 p-4 backdrop-blur-sm">
                <div className="text-xs tracking-widest text-white/60">NODE</div>
                <div className="text-lg leading-tight mt-1">{label}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/50 mt-2">
                  faction: {faction}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationPoint;
