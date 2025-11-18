import React, { useEffect, useState } from 'react';
import { AttackType, CombatState } from '../types';

interface GameSceneProps {
  combatState: CombatState;
  attackType: AttackType;
  playerActionEffect: string | null; // 'SPARK', 'BLOCK', 'HIT'
  isPlayerHit: boolean;
}

export const GameScene: React.FC<GameSceneProps> = ({ 
  combatState, 
  attackType, 
  playerActionEffect,
  isPlayerHit
}) => {
  const [sparkCoords, setSparkCoords] = useState<{x: number, y: number} | null>(null);

  // Handle spark effect positioning
  useEffect(() => {
    if (playerActionEffect === 'PARRY' || playerActionEffect === 'BLOCK') {
      // Randomize slight spark position for effect
      setSparkCoords({
        x: 50 + (Math.random() * 10 - 5),
        y: 50 + (Math.random() * 10 - 5)
      });
      const t = setTimeout(() => setSparkCoords(null), 200);
      return () => clearTimeout(t);
    }
  }, [playerActionEffect]);

  const isPerilous = attackType !== AttackType.NORMAL && 
                     (combatState === CombatState.ENEMY_WINDUP || combatState === CombatState.ENEMY_ATTACKING);

  return (
    <div className={`absolute inset-0 w-full h-full bg-gray-900 overflow-hidden flex items-center justify-center transition-colors duration-100 ${isPlayerHit ? 'bg-red-900/30' : ''}`}>
      {/* Background Atmosphere */}
      <div className="absolute inset-0 opacity-30 bg-[url('https://picsum.photos/800/1200?grayscale')] bg-cover bg-center pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* Enemy Container */}
      <div className={`relative w-64 h-64 transition-transform duration-100 
        ${combatState === CombatState.ENEMY_ATTACKING ? 'scale-125 translate-y-10' : 'scale-100'}
        ${combatState === CombatState.ENEMY_RECOVERING ? 'translate-x-2 rotate-2' : ''}
      `}>
        
        {/* Enemy Sprite (Abstract Samurai) */}
        <div className={`w-full h-full flex items-center justify-center transition-all duration-300
            ${combatState === CombatState.IDLE ? 'animate-pulse' : ''}
        `}>
            {/* Silhouette */}
            <div className="w-40 h-56 bg-slate-800 rounded-t-3xl rounded-b-lg shadow-2xl relative overflow-visible flex flex-col items-center">
                {/* Head */}
                <div className="w-16 h-16 -mt-8 bg-slate-700 rounded-full border-4 border-slate-900 relative z-10">
                    {/* Helmet Horns */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[40px] border-b-yellow-600/80"></div>
                </div>
                
                {/* Body Armor Details */}
                <div className="mt-4 w-24 h-32 bg-slate-900/50 rounded border-t-2 border-slate-600"></div>

                {/* Weapon */}
                <div className={`absolute top-1/2 left-full w-48 h-4 bg-gray-200 origin-left transition-all duration-100 shadow-[0_0_15px_rgba(255,255,255,0.5)]
                    ${combatState === CombatState.IDLE ? 'rotate-[120deg] translate-y-10' : ''}
                    ${combatState === CombatState.ENEMY_WINDUP ? '-rotate-[45deg] -translate-y-10' : ''}
                    ${combatState === CombatState.ENEMY_ATTACKING ? 'rotate-[10deg] translate-y-10' : ''}
                    ${combatState === CombatState.ENEMY_RECOVERING ? 'rotate-[150deg]' : ''}
                `}></div>
            </div>
        </div>

        {/* Perilous Indicator (Kanji) */}
        {isPerilous && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-20 z-50">
                 <span className="text-red-600 text-8xl font-black animate-ping absolute opacity-75">危</span>
                 <span className="text-red-600 text-8xl font-black relative">危</span>
            </div>
        )}

        {/* Clash Spark Effect */}
        {sparkCoords && (
          <div 
            className="absolute w-32 h-32 bg-orange-400 rounded-full mix-blend-screen filter blur-md clash-spark z-50"
            style={{ 
                left: `${sparkCoords.x}%`, 
                top: `${sparkCoords.y}%`,
                transform: 'translate(-50%, -50%)'
            }}
          />
        )}
      </div>
    </div>
  );
};