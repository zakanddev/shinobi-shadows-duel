import React, { useEffect, useState } from 'react';
import { AttackType, CombatState, EntityStats } from '../types';

interface GameSceneProps {
  combatState: CombatState;
  attackType: AttackType;
  player: EntityStats;
  enemy: EntityStats;
  playerActionEffect: string | null;
  isPlayerHit: boolean;
}

// Spark Component
const Spark: React.FC<{ x: string, y: string, color: 'yellow' | 'red' }> = ({ x, y, color }) => {
    return (
        <div 
            className={`absolute w-32 h-32 rounded-full mix-blend-screen filter blur-sm clash-spark z-50 pointer-events-none
                ${color === 'yellow' ? 'bg-yellow-100' : 'bg-red-500'}
            `}
            style={{ 
                left: x, 
                top: y, 
                transform: 'translate(-50%, -50%)'
            }}
        >
            <div className={`absolute inset-0 rotate-45 border-4 scale-50 ${color === 'yellow' ? 'border-orange-500' : 'border-red-200'}`}></div>
            <div className={`absolute inset-0 rotate-12 border-2 scale-75 ${color === 'yellow' ? 'border-white' : 'border-red-100'}`}></div>
        </div>
    );
};

// Player Sprite (The Wanderer)
const PlayerSprite = ({ state, actionEffect }: { state: string; actionEffect?: string | null }) => {
  const isDead = state === 'DEAD';
  const isAttacking = state === 'ATTACK';
  const isDeflecting = state === 'DEFLECT';
  const isHit = state === 'HIT';
  const isJumping = state === 'JUMPING';

  // Arm Rotation
  let armRotation = 'rotate-0';
  if (isAttacking) armRotation = 'rotate-[120deg]';
  else if (isDeflecting) armRotation = '-rotate-[60deg]';

  return (
    <div className={`relative w-24 h-40 transition-transform duration-200
         ${isDead ? 'opacity-50 grayscale rotate-90 translate-y-20' : ''}
         ${isJumping ? 'animate-[jump-arc_0.6s_ease-in-out]' : ''}
    `}>
        
        {/* Scarf (Wind effect) */}
        <div className="absolute top-4 left-4 w-20 h-8 bg-blue-900 origin-left animate-[flow_2s_infinite_ease-in-out] opacity-90 z-0 rounded-r-full blur-[1px]"></div>
        <div className="absolute top-6 left-4 w-16 h-6 bg-blue-800 origin-left animate-[flow_2.5s_infinite_ease-in-out] opacity-80 z-0 rounded-r-full"></div>

        {/* Body Group */}
        <div className={`w-full h-full flex flex-col items-center relative z-10 transition-all duration-100
            ${isHit ? 'translate-x-[-10px] brightness-150' : ''}
        `}>
            
            {/* Head */}
            <div className="w-10 h-10 bg-slate-800 rounded-full z-20 relative shadow-lg border-2 border-slate-900">
                {/* Straw Hat Hint / Messy Hair */}
                <div className="absolute -top-2 left-[-5px] w-12 h-4 bg-slate-900 rounded-t-xl"></div>
                {/* Eye Mask / Blindfold */}
                <div className="absolute top-4 left-0 w-full h-2 bg-slate-950"></div>
            </div>

            {/* Torso */}
            <div className="w-12 h-16 mt-[-4px] bg-slate-700 z-10 rounded-sm relative shadow-md flex flex-col items-center">
                 {/* Kimono Fold */}
                 <div className="w-full h-full border-l-8 border-slate-800/50 skew-x-6"></div>
                 {/* Belt */}
                 <div className="absolute bottom-2 w-14 h-3 bg-blue-900 shadow-sm"></div>
            </div>

            {/* Legs (Hakama) */}
            <div className="w-14 h-16 mt-[-2px] bg-slate-800 flex justify-center gap-1 clip-path-hakama relative">
                <div className={`w-6 h-full bg-slate-800 border-r border-slate-900 ${isJumping ? 'skew-x-12' : ''}`}></div>
                <div className={`w-6 h-full bg-slate-800 border-l border-slate-900 ${isJumping ? '-skew-x-12' : ''}`}></div>
            </div>

            {/* Arms & Weapon */}
            <div className={`absolute top-8 right-2 w-20 h-20 pointer-events-none origin-top-left transition-transform duration-75 ${armRotation}`}>
                {/* Arm */}
                <div className="w-12 h-3 absolute top-0 left-0 origin-left rounded-full bg-slate-600"></div>
                {/* Sword */}
                <div className="absolute left-10 top-[-20px] w-2 h-40 bg-gray-200 border border-gray-400 origin-bottom transform rotate-[15deg] shadow-lg">
                    <div className="absolute bottom-0 left-[-3px] w-5 h-8 bg-black border border-yellow-900"></div>
                </div>
            </div>
        </div>
    </div>
  );
};

// Enemy Sprite (The Warlord)
const EnemySprite = ({ state }: { state: string }) => {
    const isDead = state === 'DEAD';
    const isAttacking = state === 'ATTACK';
    const isHit = state === 'HIT';

    let armRotation = 'rotate-0';
    if (isAttacking) armRotation = 'rotate-[100deg]';

    return (
      <div className={`relative w-32 h-48 transition-transform duration-200
           ${isDead ? 'opacity-50 grayscale rotate-90 translate-y-20' : ''}
      `}>
          <div className={`w-full h-full flex flex-col items-center relative z-10 transition-all duration-100
              ${isHit ? 'translate-x-[10px] brightness-150' : ''}
          `}>
              
              {/* Helmet (Kabuto) */}
              <div className="w-12 h-12 bg-red-900 rounded-lg z-30 relative shadow-lg border-2 border-red-950 flex justify-center">
                  {/* Horns */}
                  <div className="absolute -top-6 w-16 h-8 border-b-8 border-yellow-500 rounded-full"></div>
                  {/* Faceplate */}
                  <div className="absolute bottom-0 w-8 h-8 bg-black clip-path-mask"></div>
              </div>
  
              {/* Armor (Do) */}
              <div className="w-20 h-20 mt-[-6px] bg-red-800 z-20 rounded-lg relative shadow-xl flex flex-col items-center border-4 border-red-950">
                   {/* Chest Lacing */}
                   <div className="w-full h-1 bg-black/30 mt-3"></div>
                   <div className="w-full h-1 bg-black/30 mt-3"></div>
                   <div className="w-full h-1 bg-black/30 mt-3"></div>
              </div>
  
              {/* Legs (Suneate) */}
              <div className="w-16 h-16 mt-[-4px] flex justify-between px-2">
                  <div className="w-5 h-full bg-gray-900 rounded-b-lg border-2 border-gray-700"></div>
                  <div className="w-5 h-full bg-gray-900 rounded-b-lg border-2 border-gray-700"></div>
              </div>
  
              {/* Giant Spear/Naginata */}
              <div className={`absolute top-10 left-4 w-24 h-24 pointer-events-none origin-top-right transition-transform duration-100 scale-x-[-1] ${armRotation}`}>
                  {/* Arm */}
                  <div className="w-14 h-5 absolute top-0 right-0 origin-right rounded-full bg-red-900 border border-black"></div>
                  {/* Weapon Shaft */}
                  <div className="absolute right-12 top-[-40px] w-3 h-56 bg-orange-900 border border-black origin-bottom transform rotate-[25deg]">
                      {/* Blade */}
                      <div className="absolute top-[-40px] left-[-2px] w-5 h-16 bg-gray-200 clip-path-blade border border-gray-400"></div>
                  </div>
              </div>
          </div>
      </div>
    );
};

export const GameScene: React.FC<GameSceneProps> = ({ 
  combatState, 
  attackType, 
  player,
  enemy,
  playerActionEffect,
  isPlayerHit
}) => {
  const [sparks, setSparks] = useState<Array<{id: number, x: string, y: string, color: 'red' | 'yellow'}>>([]);

  // Spark Logic
  useEffect(() => {
    // Player Deflects
    if (playerActionEffect === 'PARRY') {
        const id = Date.now();
        setSparks(p => [...p, { id, x: '50%', y: '60%', color: 'yellow' }]);
        setTimeout(() => setSparks(p => p.filter(s => s.id !== id)), 300);
    }
    // Player Attacks (Hit confirm) or Enemy Hits Player
    if (playerActionEffect === 'ATTACK' || isPlayerHit) {
        const id = Date.now();
        // Offset red sparks slightly based on who got hit
        const xPos = isPlayerHit ? '45%' : '55%'; 
        setSparks(p => [...p, { id, x: xPos, y: '50%', color: 'red' }]);
        setTimeout(() => setSparks(p => p.filter(s => s.id !== id)), 300);
    }
  }, [playerActionEffect, isPlayerHit]);

  const isPerilous = attackType !== AttackType.NORMAL && 
                     (combatState === CombatState.ENEMY_WINDUP || combatState === CombatState.ENEMY_ATTACKING);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden transition-colors duration-100 ${isPlayerHit ? 'bg-red-900/30' : 'bg-gray-900'}`}>
      
      {/* --- Environment --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-gray-950" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-red-600 blur-3xl opacity-20" /> {/* Ambient Sun/Moon */}
      
      <div className="absolute bottom-40 left-0 right-0 h-32 bg-black opacity-40 blur-xl" /> {/* Shadow Plane */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-black to-slate-900/0 border-t border-slate-800/50" />
      
      {/* Falling Leaves/Embers (Simple CSS Particles) */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-orange-500 rounded-full animate-ping delay-700"></div>
      </div>

      {/* --- Characters Container (Centered) --- */}
      <div className="absolute inset-0 flex items-end justify-center pb-24 gap-4 sm:gap-16">
        
        {/* Player */}
        <div className="relative z-20">
             <PlayerSprite state={player.state} actionEffect={playerActionEffect} />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-black/50 blur-md rounded-full scale-y-50"></div>
        </div>

        {/* Enemy */}
        <div className="relative z-20 scale-x-[-1]">
             <EnemySprite state={enemy.state} />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black/50 blur-md rounded-full scale-y-50"></div>
             
             {/* Perilous Kanji (Not flipped, so apply scale-x-[-1] again) */}
             {isPerilous && (
                <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 scale-x-[-1] animate-bounce z-50">
                    <span className="text-red-600 text-7xl font-black drop-shadow-[0_0_15px_rgba(255,0,0,1)]">危</span>
                </div>
            )}
        </div>

      </div>

      {/* Sparks Overlay */}
      {sparks.map(s => (
          <Spark key={s.id} x={s.x} y={s.y} color={s.color} />
      ))}

    </div>
  );
};