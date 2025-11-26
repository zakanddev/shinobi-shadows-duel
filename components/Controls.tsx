import React from 'react';
import { PlayerAction, CombatState } from '../types';

interface ControlsProps {
  onAction: (action: PlayerAction) => void;
  onRelease: (action: PlayerAction) => void;
  combatState: CombatState;
}

export const Controls: React.FC<ControlsProps> = ({ onAction, onRelease, combatState }) => {
  
  const isDead = combatState === CombatState.DEFEAT;
  const isVictory = combatState === CombatState.VICTORY;

  if (isDead || isVictory) return null;

  return (
    <div className="absolute bottom-0 left-0 w-full pb-8 pt-4 px-4 bg-gradient-to-t from-black via-black/90 to-transparent z-30 flex justify-between items-end gap-4">
      
      {/* Jump Button */}
      <button
        className="flex-1 h-20 bg-slate-800 rounded-xl border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center group shadow-lg"
        onTouchStart={() => onAction(PlayerAction.JUMP)}
        onMouseDown={() => onAction(PlayerAction.JUMP)} 
      >
        <span className="text-2xl font-bold text-slate-300 tracking-widest group-active:text-white">JUMP</span>
        <span className="text-xs text-slate-500">Counter Sweep</span>
      </button>

      {/* Block/Parry Button (Central, Largest) */}
      <button
        className="flex-[1.5] h-24 bg-orange-900 rounded-xl border-b-4 border-orange-950 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center group shadow-xl shadow-orange-900/20"
        onTouchStart={() => onAction(PlayerAction.BLOCK)}
        onTouchEnd={() => onRelease(PlayerAction.BLOCK)}
        onMouseDown={() => onAction(PlayerAction.BLOCK)}
        onMouseUp={() => onRelease(PlayerAction.BLOCK)}
        onMouseLeave={() => onRelease(PlayerAction.BLOCK)}
      >
        <span className="text-3xl font-black text-orange-100 tracking-widest group-active:scale-110 transition-transform">DEFLECT</span>
        <span className="text-xs text-orange-300/70 mt-1">Hold to Guard</span>
      </button>

      {/* Attack Button */}
      <button
        className="flex-1 h-20 bg-red-900 rounded-xl border-b-4 border-red-950 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center group shadow-lg"
        onTouchStart={() => onAction(PlayerAction.ATTACK)}
        onMouseDown={() => onAction(PlayerAction.ATTACK)}
      >
        <span className="text-2xl font-bold text-red-200 tracking-widest group-active:text-white">ATTACK</span>
        <span className="text-xs text-red-400">Slash</span>
      </button>
    </div>
  );
};