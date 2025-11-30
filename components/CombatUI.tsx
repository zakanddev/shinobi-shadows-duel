
import React from 'react';
import { EntityStats } from '../types';

interface CombatUIProps {
  player: EntityStats;
  enemy: EntityStats;
  enemyName: string;
  playerTitle: string;
}

const Bar = ({ 
  current, 
  max, 
  colorClass, 
  label, 
  isPosture = false, 
  alignRight = false 
}: { 
  current: number; 
  max: number; 
  colorClass: string; 
  label?: string; 
  isPosture?: boolean;
  alignRight?: boolean;
}) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  return (
    <div className={`w-full flex flex-col ${alignRight ? 'items-end' : 'items-start'} mb-1`}>
      {label && <span className="text-xs text-gray-300 font-serif mb-1 tracking-wider uppercase">{label}</span>}
      <div className={`relative w-full ${isPosture ? 'h-3' : 'h-4'} bg-gray-800 border border-gray-700 overflow-hidden`}>
        <div 
          className={`absolute top-0 ${alignRight ? 'right-0' : 'left-0'} h-full ${colorClass} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const CombatUI: React.FC<CombatUIProps> = ({ player, enemy, enemyName, playerTitle }) => {
  return (
    <div className="w-full px-4 py-4 pointer-events-none z-10 flex flex-col justify-between h-full absolute top-0 left-0">
      {/* Top: Enemy Stats */}
      <div className="w-full max-w-md mx-auto mt-2">
        <div className="flex justify-between items-end mb-1">
            <h2 className="text-lg font-bold text-red-50 tracking-widest font-serif">{enemyName}</h2>
            <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-600 shadow-lg shadow-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-600"></div>
            </div>
        </div>
        <Bar current={enemy.hp} max={enemy.maxHp} colorClass="bg-red-700" />
        <Bar current={enemy.posture} max={enemy.maxPosture} colorClass="bg-yellow-600" isPosture />
      </div>

      {/* Center: Posture Warning (if high) */}
      <div className="flex-1 flex items-center justify-center">
         {player.posture > player.maxPosture * 0.8 && (
             <div className="text-yellow-500/30 font-black text-6xl animate-pulse select-none">
                 危
             </div>
         )}
      </div>

      {/* Bottom: Player Stats (Above controls) */}
      <div className="w-full max-w-md mx-auto mb-32">
        <div className="flex justify-between">
            <Bar current={player.hp} max={player.maxHp} colorClass="bg-teal-700" alignRight />
        </div>
        <div className="mt-1">
            <Bar current={player.posture} max={player.maxPosture} colorClass="bg-yellow-600" isPosture alignRight />
        </div>
        <div className="text-right text-xs text-gray-400 font-serif mt-1">{playerTitle}</div>
      </div>
    </div>
  );
};
