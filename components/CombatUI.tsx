
import React from 'react';
import { EntityStats } from '../types';

interface CombatUIProps {
  player: EntityStats;
  enemy: EntityStats;
  enemyName: string;
  playerTitle: string;
}

export const CombatUI: React.FC<CombatUIProps> = ({ player, enemy, enemyName }) => {
  const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;
  const playerHpPercent = (player.hp / player.maxHp) * 100;
  const playerPosturePercent = (player.posture / player.maxPosture) * 100;
  const enemyPosturePercent = (enemy.posture / enemy.maxPosture) * 100;

  return (
    <div className="w-full h-full absolute top-0 left-0 pointer-events-none z-10 p-10 flex flex-col justify-between">
      {/* Top: High Quality Boss HUD */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="flex items-center gap-4 mb-2">
           <div className="w-8 h-8 border-2 border-red-800 rotate-45 flex items-center justify-center">
             <div className="w-4 h-4 bg-red-600 -rotate-45" />
           </div>
           <h2 className="text-white text-3xl font-black tracking-widest uppercase font-cinzel drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
             {enemyName}
           </h2>
        </div>
        
        {/* Boss HP Bar - Multi-layered for detail */}
        <div className="w-full h-4 bg-black/60 border border-white/10 rounded-sm relative overflow-hidden shadow-2xl">
           <div 
             className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-900 transition-all duration-700 ease-out" 
             style={{ width: `${enemyHpPercent}%` }} 
           >
              <div className="absolute inset-0 bg-white/10 opacity-30 animate-pulse" />
           </div>
        </div>

        {/* Enemy Posture (Subtle clear bar) */}
        <div className="w-1/2 h-1.5 mt-2 bg-black/40 rounded-full border border-white/5">
           <div 
             className="h-full bg-amber-400 transition-all duration-300 shadow-[0_0_10px_rgba(251,191,36,0.4)]" 
             style={{ width: `${enemyPosturePercent}%` }} 
           />
        </div>
      </div>

      {/* Bottom: Player HUD */}
      <div className="w-full max-w-xl mx-auto mb-36 flex flex-col gap-6 items-center">
        
        {/* Posture Bar (Experience Style) */}
        <div className="w-full flex flex-col items-center">
           <div className="w-full h-2 bg-black/60 border border-white/20 rounded-full overflow-hidden mb-1">
              <div 
                className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]" 
                style={{ width: `${100 - playerPosturePercent}%` }} 
              />
           </div>
           <div className="text-[10px] text-cyan-200/60 font-black tracking-[0.5em] uppercase">Concentration</div>
        </div>

        {/* Player Vitality */}
        <div className="w-3/4 flex items-center gap-4">
           <div className="w-10 h-10 glass-ui rounded-full flex items-center justify-center border-white/20">
              <div className="w-4 h-4 bg-red-500 rounded-sm rotate-45" />
           </div>
           <div className="flex-1 h-3 bg-black/60 border border-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
                style={{ width: `${playerHpPercent}%` }} 
              />
           </div>
        </div>
      </div>
    </div>
  );
};
