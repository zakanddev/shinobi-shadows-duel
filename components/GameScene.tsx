
import React, { useEffect, useState } from 'react';
import { AttackType, CombatState, EntityStats } from '../types';
import { GAME_CONFIG } from '../constants';

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

  // Arm Rotation Logic
  let armRotation = 'rotate-0';
  let armTransition = 'duration-300'; // Default slow movement

  if (isAttacking) {
      armRotation = 'rotate-[110deg]'; 
      armTransition = 'duration-150 ease-out'; // Fast swing for player
  } else if (isDeflecting) {
      armRotation = '-rotate-[45deg]';
      armTransition = 'duration-75 ease-out'; // Instant block
  }

  return (
    <div className={`relative w-24 h-40 transition-transform duration-200
         ${isDead ? 'opacity-50 grayscale rotate-90 translate-y-20' : ''}
         ${isJumping ? 'animate-[jump-arc_0.8s_ease-in-out]' : ''}
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
                <div className="absolute -top-2 left-[-5px] w-12 h-4 bg-slate-900 rounded-t-xl"></div>
                <div className="absolute top-4 left-0 w-full h-2 bg-slate-950"></div>
            </div>

            {/* Torso */}
            <div className="w-12 h-16 mt-[-4px] bg-slate-700 z-10 rounded-sm relative shadow-md flex flex-col items-center">
                 <div className="w-full h-full border-l-8 border-slate-800/50 skew-x-6"></div>
                 <div className="absolute bottom-2 w-14 h-3 bg-blue-900 shadow-sm"></div>
            </div>

            {/* Legs (Hakama) */}
            <div className="w-14 h-16 mt-[-2px] bg-slate-800 flex justify-center gap-1 clip-path-hakama relative">
                <div className={`w-6 h-full bg-slate-800 border-r border-slate-900 ${isJumping ? 'skew-x-12' : ''}`}></div>
                <div className={`w-6 h-full bg-slate-800 border-l border-slate-900 ${isJumping ? '-skew-x-12' : ''}`}></div>
            </div>

            {/* Arms & Weapon */}
            <div className={`absolute top-8 right-2 w-20 h-20 pointer-events-none origin-top-left transition-transform ${armTransition} ${armRotation}`}>
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
const EnemySprite = ({ state, combatState }: { state: string, combatState: CombatState }) => {
    const isDead = state === 'DEAD';
    const isAttacking = state === 'ATTACK'; // The active swing
    const isDeflecting = state === 'DEFLECT';
    const isWindup = combatState === CombatState.ENEMY_WINDUP; // The telegraph
    const isHit = state === 'HIT';

    // Arm Animation Logic
    let armRotation = 'rotate-[25deg]'; // Idle stance
    let armTransitionTime = '700ms'; 
    let armTimingFunction = 'ease-in-out';

    if (isWindup) {
        // Telegraph: Raise weapon HIGH and BACK slowly
        armRotation = 'rotate-[-80deg] translate-y-[-10px]'; 
        armTransitionTime = `${GAME_CONFIG.TIMING.WINDUP_BASE * 0.8}ms`; // Use most of the windup time to raise
        armTimingFunction = 'cubic-bezier(0.2, 0, 0.4, 1)';
    } else if (isAttacking) {
        // Attack: Swing DOWN to impact
        armRotation = 'rotate-[140deg] translate-x-[20px]';
        // The swing takes exactly ATTACK_DURATION to complete
        armTransitionTime = `${GAME_CONFIG.TIMING.ATTACK_DURATION}ms`; 
        armTimingFunction = 'cubic-bezier(0.1, 0, 0.2, 1)'; // Accelerate at start, impact at end
    } else if (isDeflecting) {
        // Deflect: Brace weapon
        armRotation = 'rotate-[-20deg] translate-x-4';
        armTransitionTime = '100ms';
        armTimingFunction = 'ease-out';
    }

    return (
      <div className={`relative w-32 h-48 transition-transform duration-200
           ${isDead ? 'opacity-50 grayscale rotate-90 translate-y-20' : ''}
      `}>
          <div className={`w-full h-full flex flex-col items-center relative z-10 transition-all duration-100
              ${isHit ? 'translate-x-[10px] brightness-150' : ''}
          `}>
              
              {/* Helmet (Kabuto) */}
              <div className="w-12 h-12 bg-red-900 rounded-lg z-30 relative shadow-lg border-2 border-red-950 flex justify-center">
                  <div className="absolute -top-6 w-16 h-8 border-b-8 border-yellow-500 rounded-full"></div>
                  <div className="absolute bottom-0 w-8 h-8 bg-black clip-path-mask"></div>
              </div>
  
              {/* Armor (Do) */}
              <div className="w-20 h-20 mt-[-6px] bg-red-800 z-20 rounded-lg relative shadow-xl flex flex-col items-center border-4 border-red-950">
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
              <div 
                className={`absolute top-10 left-4 w-24 h-24 pointer-events-none origin-top-right scale-x-[-1] ${armRotation}`}
                style={{ transition: `transform ${armTransitionTime} ${armTimingFunction}` }}
              >
                  {/* Arm */}
                  <div className="w-14 h-5 absolute top-0 right-0 origin-right rounded-full bg-red-900 border border-black"></div>
                  {/* Weapon Shaft */}
                  <div className="absolute right-12 top-[-40px] w-3 h-64 bg-orange-900 border border-black origin-bottom transform rotate-[25deg]">
                      {/* Blade */}
                      <div className="absolute top-[-40px] left-[-2px] w-6 h-32 bg-gray-200 clip-path-blade border border-gray-400"></div>
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
    if (playerActionEffect === 'PARRY') {
        const id = Date.now();
        setSparks(p => [...p, { id, x: '50%', y: '60%', color: 'yellow' }]);
        setTimeout(() => setSparks(p => p.filter(s => s.id !== id)), 300);
    }
    if (isPlayerHit) {
        const id = Date.now();
        setSparks(p => [...p, { id, x: '45%', y: '50%', color: 'red' }]);
        setTimeout(() => setSparks(p => p.filter(s => s.id !== id)), 300);
    }
  }, [playerActionEffect, isPlayerHit]);

  // Listen for enemy hit/block states
  useEffect(() => {
      if (enemy.state === 'HIT') {
          const id = Date.now() + Math.random();
          setSparks(p => [...p, { id, x: '55%', y: '45%', color: 'red' }]);
          setTimeout(() => setSparks(p => p.filter(s => s.id !== id)), 300);
      }
      if (enemy.state === 'DEFLECT') {
          const id = Date.now() + Math.random();
          setSparks(p => [...p, { id, x: '55%', y: '45%', color: 'yellow' }]);
          setTimeout(() => setSparks(p => p.filter(s => s.id !== id)), 300);
      }
  }, [enemy.state]);

  const isPerilous = attackType !== AttackType.NORMAL && 
                     (combatState === CombatState.ENEMY_WINDUP || combatState === CombatState.ENEMY_ATTACKING);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden transition-colors duration-100 ${isPlayerHit ? 'bg-red-900/30' : 'bg-gray-900'}`}>
      
      {/* Environment */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-gray-950" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-red-600 blur-3xl opacity-20" /> 
      
      <div className="absolute bottom-40 left-0 right-0 h-32 bg-black opacity-40 blur-xl" />
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-black to-slate-900/0 border-t border-slate-800/50" />
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-orange-500 rounded-full animate-ping delay-700"></div>
      </div>

      <div className="absolute inset-0 flex items-end justify-center pb-24 gap-4 sm:gap-16">
        
        {/* Player */}
        <div className="relative z-20">
             <PlayerSprite state={player.state} actionEffect={playerActionEffect} />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-black/50 blur-md rounded-full scale-y-50"></div>
        </div>

        {/* Enemy */}
        <div className="relative z-20 scale-x-[-1]">
             <EnemySprite state={enemy.state} combatState={combatState} />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black/50 blur-md rounded-full scale-y-50"></div>
             
             {/* Perilous Warning - Appears during windup */}
             {isPerilous && (
                <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 scale-x-[-1] animate-bounce z-50">
                    <span className="text-red-600 text-7xl font-black drop-shadow-[0_0_15px_rgba(255,0,0,1)]">危</span>
                </div>
            )}
        </div>

      </div>

      {sparks.map(s => (
          <Spark key={s.id} x={s.x} y={s.y} color={s.color} />
      ))}

    </div>
  );
};
