
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

const DetailedFighter = ({ isPlayer, state, combatState, isClashing }: { isPlayer: boolean, state: string, combatState?: CombatState, isClashing?: boolean }) => {
  const isAttack = state === 'ATTACK';
  const isHit = state === 'HIT';
  const isDeflect = state === 'DEFLECT';
  const isWindup = combatState === CombatState.ENEMY_WINDUP;

  // Refined animation transforms
  let bodyTranslate = isPlayer ? 'translate-x-0' : 'translate-x-0';
  let weaponRotate = isPlayer ? 'rotate-[15deg]' : 'rotate-[-15deg]';
  let bodySkew = 'skew-x-0';

  if (isClashing) {
    weaponRotate = isPlayer ? 'rotate-[-50deg]' : 'rotate-[50deg]';
    bodyTranslate = isPlayer ? 'translate-x-4' : '-translate-x-4';
  } else if (isAttack) {
    weaponRotate = isPlayer ? 'rotate-[-100deg]' : 'rotate-[100deg]';
    bodySkew = isPlayer ? '-skew-x-6' : 'skew-x-6';
  } else if (isWindup) {
    weaponRotate = isPlayer ? 'rotate-[40deg]' : 'rotate-[-40deg]';
  } else if (isHit) {
    bodyTranslate = isPlayer ? '-translate-x-12' : 'translate-x-12';
    bodySkew = isPlayer ? 'skew-x-12' : '-skew-x-12';
  }

  return (
    <div className={`relative flex flex-col items-center transition-all duration-150 ${bodyTranslate} ${bodySkew} ${state === 'DEAD' ? 'opacity-30 grayscale blur-[1px]' : ''}`}>
      {/* High Detail Character Asset (Vector Illustration style) */}
      <svg width="120" height="240" viewBox="0 0 120 240" className="drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]">
        {/* Shadow on ground */}
        <ellipse cx="60" cy="235" rx="40" ry="10" fill="rgba(0,0,0,0.4)" />
        
        {/* Legs / Hakama */}
        <path d="M40,160 L20,230 L55,230 L60,180 L65,230 L100,230 L80,160 Z" fill={isPlayer ? "#2d3748" : "#4a1c1c"} />
        <path d="M40,160 L50,225 M80,160 L70,225" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        
        {/* Torso / Kimono */}
        <path d="M30,80 L90,80 L100,165 L20,165 Z" fill={isPlayer ? "#4a5568" : "#2d0a0a"} />
        <path d="M60,80 L40,165 M60,80 L80,165" stroke="rgba(255,255,255,0.05)" strokeWidth="4" /> {/* Folds */}
        <path d="M30,120 Q60,125 90,120" fill="none" stroke={isPlayer ? "#f6ad55" : "#e53e3e"} strokeWidth="6" /> {/* Obi/Belt */}
        
        {/* Head / Helmet */}
        <circle cx="60" cy="50" r="22" fill={isPlayer ? "#1a202c" : "#1a1a1a"} />
        <path d="M38,50 Q60,30 82,50" fill="none" stroke={isPlayer ? "#718096" : "#c53030"} strokeWidth="4" /> {/* Helmet Rim */}
        <rect x="52" y="45" width="4" height="6" rx="2" fill={isPlayer ? "#63b3ed" : "#f56565"} /> {/* Eyes */}
        <rect x="64" y="45" width="4" height="6" rx="2" fill={isPlayer ? "#63b3ed" : "#f56565"} />
        
        {/* Arms (Behind for player, forward for enemy) */}
        <path d="M30,85 L10,130" stroke={isPlayer ? "#2d3748" : "#4a1c1c"} strokeWidth="12" strokeLinecap="round" />
      </svg>

      {/* Katana - Sharp and detailed */}
      <div 
        className={`absolute top-[90px] ${isPlayer ? 'right-[-30px]' : 'left-[-30px]'} w-12 h-80 origin-top transition-transform duration-100 ${weaponRotate}`}
      >
        <svg width="40" height="240" viewBox="0 0 40 240">
           {/* Handle (Tsuka) */}
           <rect x="15" y="0" width="10" height="40" fill="#2d0a0a" rx="2" />
           <path d="M15,5 L25,15 M15,15 L25,25 M15,25 L25,35" stroke="#d4af37" strokeWidth="1" /> {/* Wrapping */}
           {/* Guard (Tsuba) */}
           <rect x="10" y="40" width="20" height="6" fill="#d4af37" rx="1" />
           {/* Blade (Sharp High-Light) */}
           <path d="M18,46 L22,46 L24,220 Q20,240 16,220 Z" fill="linear-gradient(to right, #e2e8f0, #fff, #cbd5e0)" />
           <path d="M18,46 L20,225" stroke="#fff" strokeWidth="0.5" opacity="0.8" />
           <path d="M22,46 L21,225" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        </svg>
      </div>
    </div>
  );
};

// Fix for error in file components/GameScene.tsx on line 182: Added key to the props type for Spark to satisfy TS JSX requirements
const Spark: React.FC<{ color: string, x: string, y: string, key?: React.Key }> = ({ color, x, y }) => {
  const tx = (Math.random() - 0.5) * 400;
  const ty = (Math.random() - 0.5) * 400;
  return (
    <div 
      className="spark" 
      style={{ 
        left: x, top: y,
        background: color,
        '--tw-x': `${tx}px`, 
        '--tw-y': `${ty}px` 
      } as any} 
    />
  );
};

export const GameScene: React.FC<GameSceneProps> = ({ 
  combatState, player, enemy, playerActionEffect, isPlayerHit, theme, attackType 
}) => {
  const [impacts, setImpacts] = useState<{ id: number, x: string, y: string, color: string }[]>([]);
  const isClashing = playerActionEffect === 'PARRY' || enemy.state === 'DEFLECT';

  // Cherry Blossom generation
  const petals = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      delay: Math.random() * 8,
      left: Math.random() * 100,
      fallX: (Math.random() - 0.5) * 200,
      scale: 0.5 + Math.random() * 0.8
    }));
  }, []);

  useEffect(() => {
    if (isPlayerHit || enemy.state === 'HIT' || isClashing) {
      const id = Date.now();
      const color = isClashing ? '#d4af37' : (isPlayerHit ? '#ff0000' : '#ffffff');
      setImpacts(prev => [...prev, { id, x: '50%', y: '50%', color }]);
      setTimeout(() => setImpacts(prev => prev.filter(p => p.id !== id)), 500);
    }
  }, [isPlayerHit, enemy.state, isClashing]);

  return (
    <div className={`absolute inset-0 w-full h-full bg-[#0d1117] overflow-hidden transition-all duration-300 ${isClashing ? 'brightness-125' : ''}`}>
      {/* High Detailed Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Night Sky with distinct moon */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white rounded-full blur-[1px] shadow-[0_0_80px_rgba(255,255,255,0.4)]" />
        
        {/* Parallax Mountains (Sharp Vectors) */}
        <svg className="absolute bottom-40 w-full h-96 opacity-30" viewBox="0 0 1000 400" preserveAspectRatio="none">
           <path d="M0,400 L200,100 L400,300 L600,50 L850,250 L1000,150 L1000,400 Z" fill="#1a202c" />
           <path d="M100,400 L300,150 L550,350 L750,100 L1000,300 L1000,400 Z" fill="#2d3748" />
        </svg>

        {/* Japanese Pagoda Silhouette (Clear) */}
        <div className="absolute bottom-40 right-10 w-48 h-96 opacity-40 bg-no-repeat bg-bottom" style={{ 
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"><path d="M10,200 L90,200 L85,180 L15,180 Z M20,180 L80,180 L75,140 L25,140 Z M30,140 L70,140 L65,100 L35,100 Z M40,100 L60,100 L55,60 L45,60 Z" fill="%23000"/></svg>')`
        }} />
      </div>

      {/* Cherry Blossom Petals */}
      {petals.map(p => (
        <div key={p.id} className="petal" style={{ 
          left: `${p.left}%`, 
          animationDelay: `${p.delay}s`,
          transform: `scale(${p.scale})`,
          '--fall-x': `${p.fallX}px`
        } as any} />
      ))}

      {/* Ground (Detailed tatami-like or stone surface) */}
      <div className="absolute bottom-0 w-full h-40 bg-[#171923] border-t-2 border-[#2d3748] shadow-[inset_0_20px_60px_rgba(0,0,0,0.9)]">
        <div className="w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Combatant Layer */}
      <div className="absolute inset-0 flex items-end justify-center pb-40 gap-16 sm:gap-40">
        <div className={`${player.state === 'JUMPING' ? 'translate-y-[-180px]' : ''} transition-transform duration-500 cubic-bezier(0.25, 0.46, 0.45, 0.94)`}>
          <DetailedFighter isPlayer={true} state={player.state} isClashing={isClashing} />
        </div>
        
        <div className="relative">
          <DetailedFighter isPlayer={false} state={enemy.state} combatState={combatState} isClashing={isClashing} />
          {attackType !== AttackType.NORMAL && (combatState === CombatState.ENEMY_WINDUP || combatState === CombatState.ENEMY_ATTACKING) && (
            <div className="absolute top-[-220px] left-1/2 -translate-x-1/2 animate-bounce">
               <span className="text-red-500 text-9xl font-black drop-shadow-[0_0_20px_rgba(255,0,0,0.6)]" style={{ fontFamily: 'Cinzel' }}>!</span>
            </div>
          )}
        </div>
      </div>

      {/* Impact Sparks */}
      {impacts.map(imp => (
        <React.Fragment key={imp.id}>
           {Array.from({ length: 15 }).map((_, i) => (
             <Spark key={i} color={imp.color} x={imp.x} y={imp.y} />
           ))}
        </React.Fragment>
      ))}

      {/* Flash effect on perfect parry */}
      {isClashing && <div className="absolute inset-0 bg-white/5 pointer-events-none z-[60]" />}
    </div>
  );
};
