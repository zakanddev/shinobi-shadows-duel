import React, { useEffect, useState, useMemo } from 'react';
import { AttackType, CombatState, EntityStats, Theme } from '../types';
import { THEME_DATA } from '../constants';

interface GameSceneProps {
  combatState: CombatState;
  attackType: AttackType;
  player: EntityStats;
  enemy: EntityStats;
  playerActionEffect: string | null;
  isPlayerHit: boolean;
  theme: Theme;
}

const Block = ({ w, h, color, className = "", style = {} }: { w: number, h: number, color: string, className?: string, style?: React.CSSProperties }) => {
  const noise = useMemo(() => {
    return Array(4).fill(0).map(() => ({
      x: Math.random() * 80,
      y: Math.random() * 80,
      opacity: Math.random() * 0.15
    }));
  }, []);

  return (
    <div 
      className={`relative border border-black/30 ${className}`} 
      style={{ width: w, height: h, backgroundColor: color, ...style }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {noise.map((n, i) => (
          <div key={i} className="absolute bg-black" style={{ left: `${n.x}%`, top: `${n.y}%`, width: '20%', height: '20%', opacity: n.opacity }} />
        ))}
      </div>
      <div className="absolute inset-0 border-t border-white/20 border-l border-white/10" />
    </div>
  );
};

const SlashArc = ({ isPlayer, type }: { isPlayer: boolean, type: 'ATTACK' | 'PARRY' }) => (
  <div 
    className={`absolute top-1/2 ${isPlayer ? 'left-1/2' : 'right-1/2'} -translate-y-1/2 w-48 h-32 pointer-events-none z-50`}
    style={{ transform: isPlayer ? 'translate(0, -50%)' : 'translate(0, -50%) scaleX(-1)' }}
  >
    <svg viewBox="0 0 100 60" className="w-full h-full animate-[ping_0.15s_ease-out_forwards]">
      <path 
        d="M10,30 Q50,0 90,30" 
        fill="none" 
        stroke={type === 'PARRY' ? '#fff' : '#fff'} 
        strokeWidth="12" 
        strokeLinecap="square"
        strokeDasharray="100"
        className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
      />
    </svg>
  </div>
);

// Fix: Added optional key to props type to resolve TypeScript error on line 191
const Particle = ({ color, originX, originY }: { color: string, originX: string, originY: string, key?: React.Key }) => {
  const x = (Math.random() - 0.5) * 300;
  const y = (Math.random() - 0.5) * 300;
  return (
    <div 
      className="particle" 
      style={{ 
        left: originX, top: originY,
        backgroundColor: color, 
        '--tw-x': `${x}px`, 
        '--tw-y': `${y}px` 
      } as any} 
    />
  );
};

const MinecraftFighter = ({ isPlayer, state, theme, combatState, isClashing }: { isPlayer: boolean, state: string, theme: Theme, combatState?: CombatState, isClashing?: boolean }) => {
  const c = THEME_DATA[theme].colors;
  const isAttack = state === 'ATTACK';
  const isHit = state === 'HIT';
  const isDeflect = state === 'DEFLECT';
  const isWindup = combatState === CombatState.ENEMY_WINDUP;

  const mainColor = isPlayer ? c.playerMain.replace('bg-', '#') : c.enemyMain.replace('bg-', '#');
  const accentColor = isPlayer ? c.playerAccent.replace('bg-', '#') : c.enemyAccent.replace('bg-', '#');

  // Dynamic animation values
  let armRotation = 'rotate-0';
  let weaponExtend = 'translate-y-0';
  
  if (isClashing) {
    armRotation = isPlayer ? '-rotate-[70deg]' : 'rotate-[70deg]';
  } else if (isAttack) {
    armRotation = isPlayer ? '-rotate-[100deg]' : 'rotate-[100deg]';
    weaponExtend = 'translate-y-[-10px]';
  } else if (isWindup) {
    armRotation = isPlayer ? 'rotate-[45deg]' : '-rotate-[45deg]';
  } else if (isDeflect) {
    armRotation = isPlayer ? '-rotate-[45deg]' : 'rotate-[45deg]';
  }

  const recoilClass = isHit ? (isPlayer ? 'translate-x-8' : '-translate-x-8') : '';

  return (
    <div className={`relative flex flex-col items-center transition-all duration-100 ${recoilClass} ${state === 'DEAD' ? 'rotate-90 translate-y-20 opacity-50' : ''}`}>
      {/* Head */}
      <div className="relative z-30 mb-[-2px]">
        <Block w={44} h={44} color={isPlayer ? "#ffdbac" : accentColor} />
      </div>

      {/* Torso */}
      <div className="relative z-20">
        <Block w={44} h={60} color={mainColor} />
      </div>

      {/* Arm & Weapon */}
      <div 
        className={`absolute top-10 ${isPlayer ? 'left-[24px]' : 'right-[24px]'} w-12 h-40 origin-top transition-transform duration-75 ${armRotation}`}
      >
        <Block w={16} h={40} color={isPlayer ? "#ffdbac" : mainColor} />
        {/* The Weapon - now with more reach */}
        <div className={`absolute bottom-[-10px] left-1/2 -translate-x-1/2 transition-transform ${weaponExtend}`}>
           <Block w={6} h={80} color={isPlayer ? "#f3f4f6" : "#4b5563"} className="absolute bottom-4 left-1/2 -translate-x-1/2" />
           <Block w={20} h={6} color="#452a16" className="absolute bottom-4 left-1/2 -translate-x-1/2" />
        </div>
      </div>

      {/* Legs */}
      <div className="flex gap-1 mt-[-2px]">
        <Block w={20} h={44} color={isPlayer ? "#3c44aa" : "#1a1a1a"} />
        <Block w={20} h={44} color={isPlayer ? "#3c44aa" : "#1a1a1a"} />
      </div>
    </div>
  );
};

export const GameScene: React.FC<GameSceneProps> = ({ 
  combatState, player, enemy, playerActionEffect, isPlayerHit, theme, attackType 
}) => {
  const [particles, setParticles] = useState<{ id: number, color: string, x: string, y: string }[]>([]);
  const isPerilous = attackType !== AttackType.NORMAL && (combatState === CombatState.ENEMY_WINDUP || combatState === CombatState.ENEMY_ATTACKING);
  
  // A clash occurs if both are in a weapon-active state or a parry just happened
  const isClashing = playerActionEffect === 'PARRY' || enemy.state === 'DEFLECT';

  useEffect(() => {
    if (isPlayerHit || enemy.state === 'HIT' || isClashing) {
      const id = Date.now();
      const color = isPlayerHit ? '#8b0000' : (isClashing ? '#fbbf24' : '#ffffff');
      // Particle origin is the center-point between them
      setParticles(prev => [...prev, { id, color, x: '50%', y: '55%' }]);
      setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 500);
    }
  }, [isPlayerHit, enemy.state, isClashing]);

  return (
    <div className={`absolute inset-0 w-full h-full bg-[#87ceeb] overflow-hidden transition-all duration-75 ${isClashing ? 'brightness-125' : ''}`}>
      {/* Sky */}
      <div className="absolute top-12 left-[15%] w-24 h-12 bg-white/40 shadow-[4px_4px_0_rgba(0,0,0,0.1)]" />
      <div className="absolute top-8 right-[20%] w-32 h-16 bg-white/30 shadow-[4px_4px_0_rgba(0,0,0,0.1)]" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-200 shadow-[6px_6px_0_#d97706]" />

      {/* Ground */}
      <div className="absolute bottom-0 w-full h-40 flex flex-col">
        <div className="w-full h-12 grass-top" />
        <div className="w-full flex-1 dirt" />
      </div>

      {/* Combatant Layer - Brought characters closer for actual weapon overlap */}
      <div className="absolute inset-0 flex items-end justify-center pb-40 gap-4 sm:gap-12">
        
        <div className={`relative z-20 ${player.state === 'JUMPING' ? 'animate-[mc-jump_0.8s_ease-in-out]' : ''}`}>
          <MinecraftFighter isPlayer={true} state={player.state} theme={theme} isClashing={isClashing} />
          {player.state === 'ATTACK' && <SlashArc isPlayer={true} type="ATTACK" />}
        </div>
        
        <div className="relative z-20">
          <MinecraftFighter isPlayer={false} state={enemy.state} theme={theme} combatState={combatState} isClashing={isClashing} />
          {enemy.state === 'ATTACK' && <SlashArc isPlayer={false} type="ATTACK" />}
          
          {isPerilous && (
            <div className="absolute top-[-160px] left-1/2 -translate-x-1/2 bg-red-600 p-3 border-4 border-white shadow-xl animate-bounce">
              <span className="text-white text-5xl font-black">!</span>
            </div>
          )}
        </div>
      </div>

      {/* Impact Visuals */}
      {particles.map(p => (
        <React.Fragment key={p.id}>
           {[...Array(12)].map((_, i) => (
             <Particle key={i} color={p.color} originX={p.x} originY={p.y} />
           ))}
        </React.Fragment>
      ))}

      {/* Hit Flash */}
      {isClashing && <div className="absolute inset-0 bg-white/10 pointer-events-none z-[60]" />}
    </div>
  );
};
