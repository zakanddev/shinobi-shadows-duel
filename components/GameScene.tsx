
import React, { useEffect, useState } from 'react';
import { AttackType, CombatState, EntityStats, Theme } from '../types';
import { GAME_CONFIG, THEME_DATA } from '../constants';

interface GameSceneProps {
  combatState: CombatState;
  attackType: AttackType;
  player: EntityStats;
  enemy: EntityStats;
  playerActionEffect: string | null;
  isPlayerHit: boolean;
  theme: Theme;
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

// Player Sprite
const PlayerSprite = ({ state, actionEffect, theme }: { state: string; actionEffect?: string | null, theme: Theme }) => {
  const isDead = state === 'DEAD';
  const isAttacking = state === 'ATTACK';
  const isDeflecting = state === 'DEFLECT';
  const isHit = state === 'HIT';
  const isJumping = state === 'JUMPING';
  const colors = THEME_DATA[theme].colors;

  // Arm Rotation Logic
  let armRotation = 'rotate-0';
  let armTransition = 'duration-300';

  if (isAttacking) {
      armRotation = 'rotate-[110deg]'; 
      armTransition = 'duration-150 ease-out';
  } else if (isDeflecting) {
      armRotation = '-rotate-[45deg]';
      armTransition = 'duration-75 ease-out';
  }

  // Theme Helpers
  const hasScarf = theme === Theme.SAMURAI;
  const hasCape = theme === Theme.MEDIEVAL;
  const hasTurban = theme === Theme.INDIAN;
  const hasFeathers = theme === Theme.AZTEC;
  const hasShield = theme === Theme.AFRICAN;

  return (
    <div className={`relative w-24 h-40 transition-transform duration-200
         ${isDead ? 'opacity-50 grayscale rotate-90 translate-y-20' : ''}
         ${isJumping ? 'animate-[jump-arc_0.8s_ease-in-out]' : ''}
    `}>
        
        {/* Scarf (Samurai) */}
        {hasScarf && (
            <>
            <div className={`absolute top-4 left-4 w-20 h-8 ${colors.playerAccent} origin-left animate-[flow_2s_infinite_ease-in-out] opacity-90 z-0 rounded-r-full blur-[1px]`}></div>
            <div className={`absolute top-6 left-4 w-16 h-6 ${colors.playerAccent} origin-left animate-[flow_2.5s_infinite_ease-in-out] opacity-80 z-0 rounded-r-full`}></div>
            </>
        )}

        {/* Cape (Medieval) */}
        {hasCape && (
            <div className={`absolute top-4 left-2 w-14 h-28 ${colors.playerAccent} origin-top z-0 rounded-b-lg opacity-90`}></div>
        )}

        {/* Body Group */}
        <div className={`w-full h-full flex flex-col items-center relative z-10 transition-all duration-100
            ${isHit ? 'translate-x-[-10px] brightness-150' : ''}
        `}>
            
            {/* Head */}
            <div className={`w-10 h-10 ${hasTurban ? 'bg-orange-200' : 'bg-slate-800'} rounded-full z-20 relative shadow-lg border-2 border-slate-900`}>
                {hasScarf && <div className="absolute -top-2 left-[-5px] w-12 h-4 bg-slate-900 rounded-t-xl"></div>}
                {hasTurban && <div className={`absolute -top-3 left-[-2px] w-12 h-8 ${colors.playerAccent} rounded-full border border-black`}></div>}
                {hasFeathers && (
                    <div className="absolute -top-6 left-1 w-8 h-8 flex justify-center">
                        <div className="w-2 h-8 bg-teal-500 rotate-[-15deg]"></div>
                        <div className="w-2 h-8 bg-yellow-500 rotate-[0deg] -mt-2"></div>
                        <div className="w-2 h-8 bg-teal-500 rotate-[15deg]"></div>
                    </div>
                )}
                {hasCape && <div className="absolute top-1 left-1 w-8 h-8 bg-slate-400 rounded-full opacity-50"></div>} {/* Visor */}
            </div>

            {/* Torso */}
            <div className={`w-12 h-16 mt-[-4px] ${colors.playerMain} z-10 rounded-sm relative shadow-md flex flex-col items-center overflow-visible`}>
                 <div className="w-full h-full border-l-8 border-black/20 skew-x-6"></div>
                 {/* Sash / Belt */}
                 <div className={`absolute bottom-2 w-14 h-3 ${colors.playerAccent} shadow-sm`}></div>
            </div>

            {/* Legs */}
            <div className={`w-14 h-16 mt-[-2px] bg-slate-900 flex justify-center gap-1 clip-path-hakama relative`}>
                <div className={`w-6 h-full ${theme === Theme.AFRICAN ? 'bg-stone-800' : 'bg-slate-900'} border-r border-slate-950 ${isJumping ? 'skew-x-12' : ''}`}></div>
                <div className={`w-6 h-full ${theme === Theme.AFRICAN ? 'bg-stone-800' : 'bg-slate-900'} border-l border-slate-950 ${isJumping ? '-skew-x-12' : ''}`}></div>
            </div>

            {/* Arms & Weapon */}
            <div className={`absolute top-8 right-2 w-20 h-20 pointer-events-none origin-top-left transition-transform ${armTransition} ${armRotation}`}>
                {/* Arm */}
                <div className="w-12 h-3 absolute top-0 left-0 origin-left rounded-full bg-slate-600 z-20"></div>
                
                {/* Shield (African) */}
                {hasShield && (
                    <div className="absolute top-[-10px] left-[-10px] w-12 h-16 bg-white border-4 border-black rounded-[50%] z-30">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full"></div>
                    </div>
                )}

                {/* Detailed Weapon (Attached to end of arm) */}
                <div className={`absolute left-10 top-[0px] w-0 h-0 origin-bottom transform rotate-[15deg]`}>
                     {/* Hilt */}
                     <div className="absolute bottom-0 left-[-3px] w-3 h-10 bg-black border border-gray-600 rounded-sm z-20">
                         {/* Hilt pattern */}
                         <div className="w-full h-1 bg-gray-500 mt-2 opacity-30"></div>
                         <div className="w-full h-1 bg-gray-500 mt-2 opacity-30"></div>
                         <div className="w-full h-1 bg-gray-500 mt-2 opacity-30"></div>
                     </div>
                     
                     {/* Guard (Tsuba) */}
                     <div className="absolute bottom-10 left-[-6px] w-5 h-1 bg-yellow-900 rounded-sm z-30 shadow-sm border border-black"></div>
                     
                     {/* Blade */}
                     <div className={`absolute bottom-10 left-[-2px] w-3 h-40 ${colors.weapon} rounded-t-[100%] rounded-br-sm border-l border-white/50 border-r border-gray-400 z-10 shadow-sm overflow-hidden`}>
                         <div className="w-[1px] h-full bg-white absolute left-0 opacity-80"></div>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// Enemy Sprite
const EnemySprite = ({ state, combatState, theme }: { state: string, combatState: CombatState, theme: Theme }) => {
    const isAttacking = state === 'ATTACK';
    const isDeflecting = state === 'DEFLECT';
    const isWindup = combatState === CombatState.ENEMY_WINDUP;
    const isHit = state === 'HIT';
    const colors = THEME_DATA[theme].colors;

    // Arm Animation Logic
    let armRotation = 'rotate-[25deg]';
    let armTransitionTime = '700ms'; 
    let armTimingFunction = 'ease-in-out';

    if (isWindup) {
        armRotation = 'rotate-[-80deg] translate-y-[-10px]'; 
        armTransitionTime = `${GAME_CONFIG.TIMING.WINDUP_BASE * 0.8}ms`;
        armTimingFunction = 'cubic-bezier(0.2, 0, 0.4, 1)';
    } else if (isAttacking) {
        armRotation = 'rotate-[140deg] translate-x-[20px]';
        armTransitionTime = `${GAME_CONFIG.TIMING.ATTACK_DURATION}ms`; 
        armTimingFunction = 'cubic-bezier(0.1, 0, 0.2, 1)';
    } else if (isDeflecting) {
        armRotation = 'rotate-[-20deg] translate-x-4';
        armTransitionTime = '100ms';
        armTimingFunction = 'ease-out';
    }

    return (
      <div className={`relative w-32 h-48 transition-transform duration-200`}>
          <div className={`w-full h-full flex flex-col items-center relative z-10 transition-all duration-100
              ${isHit ? 'translate-x-[10px] brightness-150' : ''}
          `}>
              
              {/* Head / Helmet */}
              <div className={`w-12 h-12 ${colors.enemyAccent} rounded-lg z-30 relative shadow-lg border-2 border-black flex justify-center`}>
                  {theme === Theme.SAMURAI && <div className="absolute -top-6 w-16 h-8 border-b-8 border-yellow-500 rounded-full"></div>}
                  {theme === Theme.AZTEC && (
                      <div className="absolute -top-8 w-24 h-12 flex justify-center">
                          <div className="w-4 h-12 bg-green-600 rotate-[-45deg] origin-bottom"></div>
                          <div className="w-4 h-12 bg-red-600 rotate-[0deg] origin-bottom"></div>
                          <div className="w-4 h-12 bg-green-600 rotate-[45deg] origin-bottom"></div>
                      </div>
                  )}
                  {theme === Theme.INDIAN && <div className="absolute -top-6 w-12 h-8 bg-yellow-600 rounded-t-full"></div>}
                  {/* Face Mask */}
                  <div className="absolute bottom-0 w-8 h-8 bg-black clip-path-mask"></div>
              </div>
  
              {/* Body / Armor */}
              <div className={`w-20 h-20 mt-[-6px] ${colors.enemyMain} z-20 rounded-lg relative shadow-xl flex flex-col items-center border-4 border-black/30`}>
                   <div className="w-full h-1 bg-black/30 mt-3"></div>
                   <div className="w-full h-1 bg-black/30 mt-3"></div>
                   <div className="w-full h-1 bg-black/30 mt-3"></div>
              </div>
  
              {/* Legs */}
              <div className="w-16 h-16 mt-[-4px] flex justify-between px-2">
                  <div className="w-5 h-full bg-black rounded-b-lg border-2 border-gray-700"></div>
                  <div className="w-5 h-full bg-black rounded-b-lg border-2 border-gray-700"></div>
              </div>
  
              {/* Weapon Container (Arm + Weapon) */}
              <div 
                className={`absolute top-10 left-4 w-24 h-24 pointer-events-none origin-top-right scale-x-[-1] ${armRotation}`}
                style={{ transition: `transform ${armTransitionTime} ${armTimingFunction}` }}
              >
                  {/* Arm */}
                  <div className={`w-14 h-5 absolute top-0 right-0 origin-right rounded-full ${colors.enemyAccent} border border-black z-20`}></div>
                  
                  {/* Detailed Polearm / Greatsword */}
                  {/* The weapon is held by the hand which is at 'right-0' of the arm. 
                      Since the arm is 14 units long, we position the weapon relative to that.
                  */}
                  <div className="absolute right-12 top-[-60px] w-0 h-0 origin-bottom transform rotate-[25deg]">
                       {/* Shaft (Long) */}
                       <div className="absolute bottom-[-40px] left-[-3px] w-2 h-72 bg-orange-900 border-x border-black z-10"></div>
                       
                       {/* Pommel */}
                       <div className="absolute bottom-[-45px] left-[-5px] w-6 h-6 bg-yellow-700 rounded-full border border-black z-20"></div>

                       {/* Blade Head */}
                       <div className={`absolute top-[-40px] left-[-8px] w-12 h-40 ${colors.weapon} z-20 clip-path-blade border border-gray-500 shadow-md`}>
                            {/* Decorative engraving */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-32 bg-black/10"></div>
                       </div>

                       {/* Hand Cover (Simulating grip) */}
                       <div className="absolute bottom-[20px] left-[-6px] w-8 h-8 bg-black rounded-full z-30 opacity-40 blur-sm"></div>

                       {theme === Theme.AZTEC && <div className="absolute top-0 left-[-5px] w-4 h-20 bg-black z-30"></div>} {/* Obsidian edge */}
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
  isPlayerHit,
  theme
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
  
  const themeColors = THEME_DATA[theme].colors;

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden transition-colors duration-100 ${isPlayerHit ? 'bg-red-900/30' : themeColors.bg}`}>
      
      {/* Environment */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-red-600 blur-3xl opacity-20" /> 
      
      <div className="absolute bottom-40 left-0 right-0 h-32 bg-black opacity-40 blur-xl" />
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-black to-transparent border-t border-white/5" />
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full animate-ping delay-700"></div>
      </div>

      <div className="absolute inset-0 flex items-end justify-center pb-24 gap-4 sm:gap-16">
        
        {/* Player */}
        <div className="relative z-20">
             <PlayerSprite state={player.state} actionEffect={playerActionEffect} theme={theme} />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-black/50 blur-md rounded-full scale-y-50"></div>
        </div>

        {/* Enemy */}
        <div className="relative z-20 scale-x-[-1]">
             <EnemySprite state={enemy.state} combatState={combatState} theme={theme} />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black/50 blur-md rounded-full scale-y-50"></div>
             
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
