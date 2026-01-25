
import React from 'react';
import { EntityStats } from '../types';

interface CombatUIProps {
  player: EntityStats;
  enemy: EntityStats;
  enemyName: string;
  playerTitle: string;
}

const HeartContainer = ({ hp, maxHp }: { hp: number, maxHp: number }) => {
  const totalHearts = 10;
  const currentHearts = (hp / maxHp) * totalHearts;
  
  return (
    <div className="flex gap-1">
      {[...Array(totalHearts)].map((_, i) => {
        const isFull = i < Math.floor(currentHearts);
        const isHalf = !isFull && i < Math.ceil(currentHearts);
        return (
          <div key={i} className="relative w-8 h-8">
            {/* Background Empty Heart */}
            <div className="absolute inset-0 bg-black opacity-20" style={{ clipPath: 'polygon(50% 10%, 90% 10%, 90% 50%, 50% 90%, 10% 50%, 10% 10%)' }} />
            {/* Filled Heart */}
            {(isFull || isHalf) && (
              <div 
                className="absolute inset-0 bg-red-600 border-2 border-red-900" 
                style={{ 
                  clipPath: 'polygon(50% 10%, 90% 10%, 90% 50%, 50% 90%, 10% 50%, 10% 10%)',
                  width: isHalf ? '50%' : '100%' 
                }} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const CombatUI: React.FC<CombatUIProps> = ({ player, enemy, enemyName }) => {
  const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;
  const playerPosturePercent = (player.posture / player.maxPosture) * 100;
  const enemyPosturePercent = (enemy.posture / enemy.maxPosture) * 100;

  return (
    <div className="w-full h-full absolute top-0 left-0 pointer-events-none z-10 p-6 flex flex-col justify-between">
      {/* Top: Boss Bar (Wither/Ender Dragon style) */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        <h2 className="text-white text-3xl font-black mb-2 uppercase drop-shadow-[2px_2px_#000]">{enemyName}</h2>
        <div className="w-full h-6 bg-black border-4 border-[#373737] p-1">
           <div 
             className="h-full bg-[#aa00aa] transition-all duration-300" 
             style={{ width: `${enemyHpPercent}%` }} 
           />
        </div>
        {/* Enemy Posture */}
        <div className="w-full h-2 mt-1 bg-black/40">
           <div className="h-full bg-yellow-500" style={{ width: `${enemyPosturePercent}%` }} />
        </div>
      </div>

      {/* Bottom: Player HUD */}
      <div className="w-full flex flex-col items-center gap-4 mb-36">
        {/* Heart Bar */}
        <HeartContainer hp={player.hp} maxHp={player.maxHp} />
        
        {/* Posture Bar (Experience Bar Style) */}
        <div className="w-full max-w-lg h-4 bg-black border-2 border-[#1e1e1e] p-[2px] relative">
          <div 
            className="h-full bg-[#55ff55] transition-all duration-300" 
            style={{ width: `${100 - playerPosturePercent}%` }} 
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest">
            Posture
          </div>
        </div>
      </div>
    </div>
  );
};
