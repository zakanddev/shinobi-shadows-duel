
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

// Fixed: Explicitly typed Spark as React.FC to allow passing the 'key' prop during map rendering.
const Spark: React.FC<{ x: string; y: string; color: 'yellow' | 'red' }> = ({ x, y, color }) => (
  <div 
    className={`absolute w-40 h-40 rounded-full mix-blend-screen filter blur-md clash-spark z-50 pointer-events-none ${color === 'yellow' ? 'bg-orange-400' : 'bg-red-600'}`}
    style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
  />
);

const WeaponSprite = ({ theme, isPlayer, isAttacking, isDeflecting }: { theme: Theme, isPlayer: boolean, isAttacking: boolean, isDeflecting: boolean }) => {
  const colors = THEME_DATA[theme].colors;
  
  if (isPlayer) {
    // Katana with Hamon detail
    return (
      <div className="absolute left-10 top-0 w-0 h-0 origin-bottom transform rotate-[15deg]">
        <div className="absolute bottom-0 left-[-3px] w-4 h-12 bg-zinc-900 border border-zinc-700 rounded-sm z-20 overflow-hidden shadow-lg">
          <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,#333,#333_2px,#000_2px,#000_4px)]"></div>
        </div>
        <div className="absolute bottom-11 left-[-8px] w-7 h-2 bg-yellow-900 border border-black rounded-sm z-30 shadow-md"></div>
        <div className={`absolute bottom-11 left-[-2px] w-4 h-44 ${colors.weapon} rounded-t-[100%] border-l-2 border-white/60 z-10 shadow-xl overflow-hidden`}>
           <div className="w-full h-full bg-[linear-gradient(90deg,transparent_60%,rgba(0,0,0,0.1)_60%,rgba(0,0,0,0.1)_100%)]"></div>
           <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_left,rgba(255,255,255,0.4)_0%,transparent_70%)] opacity-50"></div>
        </div>
      </div>
    );
  }

  // Enemy Weapons vary by theme
  const renderEnemyWeapon = () => {
    switch(theme) {
      case Theme.MEDIEVAL: // Greatsword with fuller
        return (
          <div className="absolute right-12 top-[-70px] w-0 h-0 origin-bottom transform rotate-[25deg]">
            <div className="absolute bottom-[-30px] left-[-3px] w-4 h-24 bg-stone-900 border border-black z-20"></div>
            <div className="absolute bottom-[-5px] left-[-15px] w-30 h-3 bg-stone-700 border border-black z-30"></div>
            <div className={`absolute top-[-50px] left-[-6px] w-12 h-60 ${colors.weapon} z-20 border-x-2 border-stone-400 shadow-2xl`}>
               <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-black/20 shadow-inner"></div>
            </div>
          </div>
        );
      case Theme.AZTEC: // Macuahuitl
        return (
          <div className="absolute right-12 top-[-50px] w-0 h-0 origin-bottom transform rotate-[25deg]">
            <div className="absolute bottom-[-20px] left-[-4px] w-6 h-100 bg-amber-900 border-2 border-black z-20 rounded-sm">
               {[...Array(8)].map((_, i) => (
                 <div key={i} className="absolute w-5 h-8 bg-zinc-950 border border-zinc-700 rotate-45" style={{ top: i * 12 + 10, left: i % 2 ? -8 : 8 }}></div>
               ))}
            </div>
          </div>
        );
      case Theme.AFRICAN: // Heavy Spear
        return (
          <div className="absolute right-12 top-[-100px] w-0 h-0 origin-bottom transform rotate-[25deg]">
            <div className="absolute bottom-[-80px] left-[-2px] w-2 h-180 bg-orange-950 border-x border-black z-10"></div>
            <div className={`absolute top-[-40px] left-[-10px] w-18 h-40 ${colors.weapon} z-20 clip-path-leaf border-2 border-stone-500`}>
              <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-black/20"></div>
            </div>
          </div>
        );
      default: // Samurai Naginata
        return (
          <div className="absolute right-12 top-[-80px] w-0 h-0 origin-bottom transform rotate-[25deg]">
            <div className="absolute bottom-[-60px] left-[-2px] w-2 h-140 bg-red-950 border-x border-black z-10"></div>
            <div className={`absolute top-[-50px] left-[-6px] w-12 h-50 ${colors.weapon} z-20 rounded-t-full border-2 border-stone-400 shadow-xl overflow-hidden`}>
              <div className="w-2 h-full bg-white/40 absolute left-1"></div>
            </div>
          </div>
        );
    }
  };

  return renderEnemyWeapon();
};

const PlayerSprite = ({ state, theme }: { state: string; theme: Theme }) => {
  const isDead = state === 'DEAD';
  const isAttacking = state === 'ATTACK';
  const isDeflecting = state === 'DEFLECT';
  const isHit = state === 'HIT';
  const colors = THEME_DATA[theme].colors;

  let armRot = isAttacking ? 'rotate-[110deg]' : isDeflecting ? '-rotate-[45deg]' : 'rotate-0';
  let armTrans = isDeflecting ? 'duration-75' : 'duration-300';

  return (
    <div className={`relative w-24 h-40 transition-all ${isDead ? 'opacity-40 grayscale rotate-90 translate-y-20' : ''} ${state === 'JUMPING' ? 'animate-[jump-arc_0.8s_ease-in-out]' : ''}`}>
      <div className={`w-full h-full flex flex-col items-center relative z-10 transition-transform ${isHit ? '-translate-x-4 scale-105' : ''}`}>
        <div className={`w-12 h-12 bg-stone-800 rounded-full z-20 relative shadow-2xl border-4 border-black/40`}>
           {theme === Theme.SAMURAI && <div className="absolute -top-3 left-0 w-12 h-6 bg-slate-900 rounded-t-full border-b-4 border-white/10"></div>}
           {theme === Theme.INDIAN && <div className={`absolute -top-4 left-0 w-14 h-8 ${colors.playerAccent} rounded-full border-b-2 border-black`}></div>}
        </div>
        <div className={`w-14 h-20 -mt-1 ${colors.playerMain} z-10 rounded-lg relative border-x-4 border-black/20 shadow-[inset_0_10px_15px_rgba(0,0,0,0.3)]`}>
          <div className={`absolute bottom-4 w-16 h-4 ${colors.playerAccent} -left-1 shadow-md border-y border-black/20`}></div>
        </div>
        <div className="w-16 h-16 -mt-1 flex gap-1 px-1">
          <div className="w-1/2 h-full bg-black rounded-b-xl border-t border-white/5"></div>
          <div className="w-1/2 h-full bg-black rounded-b-xl border-t border-white/5"></div>
        </div>
        <div className={`absolute top-10 right-2 w-20 h-20 origin-top-left transition-transform ${armTrans} ${armRot}`}>
          <div className="w-14 h-4 absolute top-0 left-0 origin-left rounded-full bg-stone-700 z-20 border border-black/20 shadow-inner"></div>
          <WeaponSprite theme={theme} isPlayer={true} isAttacking={isAttacking} isDeflecting={isDeflecting} />
        </div>
      </div>
    </div>
  );
};

const EnemySprite = ({ state, combatState, theme }: { state: string, combatState: CombatState, theme: Theme }) => {
  const isAttacking = state === 'ATTACK';
  const isDeflecting = state === 'DEFLECT';
  const isWindup = combatState === CombatState.ENEMY_WINDUP;
  const colors = THEME_DATA[theme].colors;

  let armRot = isWindup ? 'rotate-[-85deg]' : isAttacking ? 'rotate-[145deg]' : 'rotate-[25deg]';
  let armSpeed = isWindup ? `${GAME_CONFIG.TIMING.WINDUP_BASE}ms` : `${GAME_CONFIG.TIMING.ATTACK_DURATION}ms`;

  return (
    <div className={`relative w-32 h-48 transition-all`}>
      <div className={`w-full h-full flex flex-col items-center relative z-10 ${state === 'HIT' ? 'translate-x-4 brightness-150' : ''}`}>
        <div className={`w-14 h-14 ${colors.enemyAccent} rounded-xl z-30 relative shadow-2xl border-4 border-black/50`}>
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent)]"></div>
        </div>
        <div className={`w-24 h-24 -mt-2 ${colors.enemyMain} z-20 rounded-xl relative border-4 border-black/40 shadow-inner overflow-hidden`}>
           <div className="w-full h-1/3 bg-black/20 mb-2"></div>
           <div className="w-full h-1/3 bg-black/20"></div>
        </div>
        <div className="w-20 h-20 -mt-1 flex gap-2">
          <div className="w-1/2 h-full bg-black border-2 border-stone-800 rounded-b-2xl"></div>
          <div className="w-1/2 h-full bg-black border-2 border-stone-800 rounded-b-2xl"></div>
        </div>
        <div className={`absolute top-12 left-4 w-24 h-24 origin-top-right scale-x-[-1] transition-transform ${armRot}`} style={{ transitionDuration: armSpeed }}>
          <div className={`w-16 h-6 absolute top-0 right-0 origin-right rounded-full ${colors.enemyAccent} border-2 border-black/30 z-20`}></div>
          <WeaponSprite theme={theme} isPlayer={false} isAttacking={isAttacking} isDeflecting={isDeflecting} />
        </div>
      </div>
    </div>
  );
};

export const GameScene: React.FC<GameSceneProps> = ({ combatState, attackType, player, enemy, playerActionEffect, isPlayerHit, theme }) => {
  const [sparks, setSparks] = useState<Array<{id: number, x: string, y: string, color: 'red' | 'yellow'}>>([]);
  const themeColors = THEME_DATA[theme].colors;

  useEffect(() => {
    if (playerActionEffect === 'PARRY' || enemy.state === 'DEFLECT') {
      const id = Date.now();
      setSparks(p => [...p, { id, x: '50%', y: '50%', color: 'yellow' }]);
      setTimeout(() => setSparks(p => p.filter(s => s.id !== id)), 250);
    }
    if (isPlayerHit || enemy.state === 'HIT') {
      const id = Date.now();
      setSparks(p => [...p, { id, x: isPlayerHit ? '45%' : '55%', y: '45%', color: 'red' }]);
      setTimeout(() => setSparks(p => p.filter(s => s.id !== id)), 250);
    }
  }, [playerActionEffect, enemy.state, isPlayerHit]);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden transition-colors duration-500 ${isPlayerHit ? 'bg-red-950/40' : themeColors.bg}`}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_100%)] opacity-30"></div>
      <div className="absolute bottom-24 left-0 w-full h-96 opacity-10 pointer-events-none">
         <div className="absolute bottom-0 left-0 w-1/2 h-full bg-black clip-path-mountains"></div>
         <div className="absolute bottom-0 right-0 w-1/2 h-full bg-black clip-path-mountains scale-x-[-1] translate-x-10"></div>
      </div>
      <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-black to-transparent"></div>
      
      <div className="absolute inset-0 flex items-end justify-center pb-24 gap-12 sm:gap-24">
        <div className="relative z-20">
          <PlayerSprite state={player.state} theme={theme} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/60 blur-lg rounded-full"></div>
        </div>
        <div className="relative z-20 scale-x-[-1]">
          <EnemySprite state={enemy.state} combatState={combatState} theme={theme} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/60 blur-lg rounded-full"></div>
          {attackType !== AttackType.NORMAL && (combatState === CombatState.ENEMY_WINDUP || combatState === CombatState.ENEMY_ATTACKING) && (
            <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 scale-x-[-1] animate-bounce z-50">
              <span className="text-red-600 text-8xl font-black drop-shadow-[0_0_20px_rgba(255,0,0,0.8)] font-serif">危</span>
            </div>
          )}
        </div>
      </div>
      {sparks.map(s => <Spark key={s.id} x={s.x} y={s.y} color={s.color} />)}
    </div>
  );
};
