
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
    <div className="absolute bottom-0 left-0 w-full p-6 z-30 flex justify-between items-end gap-4">
      {/* Left: Jump */}
      <button
        className="mc-button flex-1 h-20 text-2xl font-bold uppercase"
        onTouchStart={() => onAction(PlayerAction.JUMP)}
        onMouseDown={() => onAction(PlayerAction.JUMP)} 
      >
        Jump
      </button>

      {/* Center: Deflect */}
      <button
        className="mc-button flex-[1.5] h-24 text-3xl font-black uppercase"
        onTouchStart={() => onAction(PlayerAction.BLOCK)}
        onTouchEnd={() => onRelease(PlayerAction.BLOCK)}
        onMouseDown={() => onAction(PlayerAction.BLOCK)}
        onMouseUp={() => onRelease(PlayerAction.BLOCK)}
        onMouseLeave={() => onRelease(PlayerAction.BLOCK)}
      >
        Deflect
      </button>

      {/* Right: Attack */}
      <button
        className="mc-button flex-1 h-20 text-2xl font-bold uppercase"
        onTouchStart={() => onAction(PlayerAction.ATTACK)}
        onMouseDown={() => onAction(PlayerAction.ATTACK)}
      >
        Attack
      </button>
    </div>
  );
};
