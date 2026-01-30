
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
    <div className="absolute bottom-0 left-0 w-full p-10 z-30 flex justify-between items-end gap-6 pb-12">
      {/* Left: Jump/Evade */}
      <button
        className="action-button w-24 h-24 rounded-2xl flex flex-col items-center justify-center"
        onTouchStart={() => onAction(PlayerAction.JUMP)}
        onMouseDown={() => onAction(PlayerAction.JUMP)} 
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 mb-1">
          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[10px] font-black">Rise</span>
      </button>

      {/* Center: Parry (Primary) */}
      <button
        className="action-button w-36 h-36 rounded-full border-2 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        onTouchStart={() => onAction(PlayerAction.BLOCK)}
        onTouchEnd={() => onRelease(PlayerAction.BLOCK)}
        onMouseDown={() => onAction(PlayerAction.BLOCK)}
        onMouseUp={() => onRelease(PlayerAction.BLOCK)}
        onMouseLeave={() => onRelease(PlayerAction.BLOCK)}
      >
        <div className="absolute inset-0 rounded-full border border-white/5 animate-ping opacity-10 pointer-events-none" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 mb-1">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs font-black">Warding</span>
      </button>

      {/* Right: Attack */}
      <button
        className="action-button w-24 h-24 rounded-2xl flex flex-col items-center justify-center"
        onTouchStart={() => onAction(PlayerAction.ATTACK)}
        onMouseDown={() => onAction(PlayerAction.ATTACK)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 mb-1">
          <path d="M14.5 17.5L3 6M10 13l3.5 3.5M13 10l7.5-7.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[10px] font-black">Strike</span>
      </button>
    </div>
  );
};
