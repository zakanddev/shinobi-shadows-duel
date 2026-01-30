
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CombatUI } from './components/CombatUI';
import { GameScene } from './components/GameScene';
import { Controls } from './components/Controls';
import { getCombatAdvice, getBossTaunt } from './services/geminiService';
import { 
  CombatState, 
  EntityStats, 
  AttackType, 
  PlayerAction, 
  AppMode,
  Theme
} from './types';
import { GAME_CONFIG, THEME_DATA } from './constants';

const initialPlayer: EntityStats = {
  hp: GAME_CONFIG.PLAYER_MAX_HP,
  maxHp: GAME_CONFIG.PLAYER_MAX_HP,
  posture: 0,
  maxPosture: GAME_CONFIG.PLAYER_MAX_POSTURE,
  state: 'IDLE'
};

const initialEnemy: EntityStats = {
  hp: GAME_CONFIG.ENEMY_MAX_HP,
  maxHp: GAME_CONFIG.ENEMY_MAX_HP,
  posture: 0,
  maxPosture: GAME_CONFIG.ENEMY_MAX_POSTURE,
  state: 'IDLE'
};

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(AppMode.MENU);
  const [selectedTheme] = useState<Theme>(Theme.SAMURAI);
  const [highScore, setHighScore] = useState<number>(0);

  const [player, setPlayer] = useState<EntityStats>(initialPlayer);
  const [enemy, setEnemy] = useState<EntityStats>(initialEnemy);
  const [combatState, setCombatState] = useState<CombatState>(CombatState.IDLE);
  const [currentAttackType, setCurrentAttackType] = useState<AttackType>(AttackType.NORMAL);
  
  const [playerActionEffect, setPlayerActionEffect] = useState<string | null>(null);
  const [isPlayerHit, setIsPlayerHit] = useState(false);
  const [showDeathScreen, setShowDeathScreen] = useState(false);
  const [bossIndex, setBossIndex] = useState(0);
  const [bossName, setBossName] = useState("");
  const [advice, setAdvice] = useState<string>("");
  const [isFrozen, setIsFrozen] = useState(false);

  const playerRef = useRef(player);
  const enemyRef = useRef(enemy);
  const stateRef = useRef(combatState);
  const blockStartRef = useRef<number>(0);
  const isBlockingRef = useRef(false);
  const isProcessingComboRef = useRef(false);
  const appModeRef = useRef(appMode);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { enemyRef.current = enemy; }, [enemy]);
  useEffect(() => { stateRef.current = combatState; }, [combatState]);
  useEffect(() => { appModeRef.current = appMode; }, [appMode]);

  useEffect(() => {
    const stored = localStorage.getItem('spirit_highscore');
    if (stored) setHighScore(parseInt(stored));
  }, []);

  const saveHighScore = (score: number) => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('spirit_highscore', score.toString());
    }
  };

  const triggerHitStop = (ms: number = 60) => {
    setIsFrozen(true);
    setTimeout(() => setIsFrozen(false), ms);
  };

  const startGame = () => {
    setAppMode(AppMode.GAME);
    setBossIndex(0);
    resetMatch(0);
  };

  const resetMatch = async (idx: number) => {
    setPlayer(initialPlayer);
    setEnemy({...initialEnemy, maxHp: GAME_CONFIG.ENEMY_MAX_HP + (idx * 50), hp: GAME_CONFIG.ENEMY_MAX_HP + (idx * 50)});
    setCombatState(CombatState.IDLE);
    setShowDeathScreen(false);
    setAdvice('');
    isProcessingComboRef.current = false;
    
    const themeConfig = THEME_DATA[selectedTheme];
    const name = themeConfig.bossNames[idx % themeConfig.bossNames.length] || "The Iron Guardian";
    setBossName(name);

    const taunt = await getBossTaunt(name);
    console.log(`${name}: "${taunt}"`);
  };

  const nextBoss = () => {
    const nextIdx = bossIndex + 1;
    setBossIndex(nextIdx);
    resetMatch(nextIdx);
  };

  const handlePlayerDeath = async (reason: string) => {
    setCombatState(CombatState.DEFEAT);
    setPlayer(p => ({ ...p, state: 'DEAD' }));
    setShowDeathScreen(true);
    saveHighScore(bossIndex);
    const adviceText = await getCombatAdvice(0, 50, 1, reason);
    setAdvice(adviceText);
  };

  const handleVictory = () => {
    triggerHitStop(400); // Massive stop for deathblow
    setCombatState(CombatState.VICTORY);
    setEnemy(e => ({ ...e, state: 'DEAD' }));
  };

  useEffect(() => {
    const loop = setInterval(() => {
      if (appModeRef.current !== AppMode.GAME || isFrozen) return;
      if (stateRef.current === CombatState.VICTORY || stateRef.current === CombatState.DEFEAT) return;

      const baseRate = GAME_CONFIG.POSTURE_RECOVERY_RATE;
      setPlayer(p => ({ ...p, posture: Math.max(0, p.posture - baseRate) }));
      setEnemy(e => ({ ...e, posture: Math.max(0, e.posture - baseRate) }));
    }, 1000 / 60);
    return () => clearInterval(loop);
  }, [isFrozen]);

  const resolveHit = (type: AttackType) => {
    if (stateRef.current !== CombatState.ENEMY_ATTACKING) return;
    const blockDuration = Date.now() - blockStartRef.current;
    const isBlocking = isBlockingRef.current;
    const isJumping = playerRef.current.state === 'JUMPING';
    
    let hit = false;
    if (type === AttackType.PERILOUS_SWEEP) {
      if (isJumping) {
        setEnemy(e => ({ ...e, posture: Math.min(e.maxPosture, e.posture + 45) }));
        triggerHitStop(180);
      } else hit = true;
    } else {
      if (isBlocking) {
        if (blockDuration < 300) { // Tighter window for "Detailed" feel
          setEnemy(e => ({ ...e, posture: Math.min(e.maxPosture, e.posture + 35), state: 'HIT' }));
          setPlayer(p => ({ ...p, state: 'DEFLECT' }));
          setPlayerActionEffect('PARRY');
          triggerHitStop(120);
          setTimeout(() => setPlayerActionEffect(null), 150);
        } else {
          setPlayer(p => ({ ...p, posture: Math.min(p.maxPosture, p.posture + 15), state: 'DEFLECT' }));
          triggerHitStop(40);
        }
      } else hit = true;
    }

    if (hit) {
      setIsPlayerHit(true);
      setTimeout(() => setIsPlayerHit(false), 300);
      triggerHitStop(200);
      setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - 30), state: 'HIT' }));
      setTimeout(() => setPlayer(p => ({...p, state: 'IDLE'})), 500);
    }
    
    if (enemyRef.current.posture >= enemyRef.current.maxPosture) {
      setCombatState(CombatState.DEATHBLOW_WINDOW);
    }
    if (playerRef.current.hp <= 0) handlePlayerDeath("Swordmanship was lacking");
  };

  const executeAttackStep = (type: AttackType): Promise<void> => {
    return new Promise((resolve) => {
      setCurrentAttackType(type);
      setCombatState(CombatState.ENEMY_WINDUP);
      setTimeout(() => {
        if (stateRef.current === CombatState.DEFEAT) return resolve();
        setCombatState(CombatState.ENEMY_ATTACKING);
        setEnemy(e => ({ ...e, state: 'ATTACK' })); 
        setTimeout(() => {
          resolveHit(type);
          setTimeout(() => {
            setEnemy(e => ({ ...e, state: 'IDLE' }));
            resolve();
          }, 100);
        }, 350);
      }, 800);
    });
  };

  const handleAction = useCallback((action: PlayerAction) => {
    if (appModeRef.current !== AppMode.GAME || stateRef.current === CombatState.DEFEAT || isFrozen) return;
    
    if (action === PlayerAction.BLOCK) {
      isBlockingRef.current = true;
      blockStartRef.current = Date.now();
      setPlayer(p => ({ ...p, state: 'DEFLECT' }));
    }
    
    if (action === PlayerAction.JUMP && playerRef.current.state !== 'JUMPING') {
      setPlayer(p => ({ ...p, state: 'JUMPING' }));
      setTimeout(() => setPlayer(p => ({ ...p, state: 'IDLE' })), 700);
    }
    
    if (action === PlayerAction.ATTACK) {
      if (combatState === CombatState.DEATHBLOW_WINDOW) { handleVictory(); return; }
      
      setPlayer(p => ({ ...p, state: 'ATTACK' }));
      
      if (Math.random() > 0.3) {
        setEnemy(e => ({ ...e, hp: Math.max(0, e.hp - 15), state: 'HIT' }));
        triggerHitStop(80);
      } else {
        setEnemy(e => ({ ...e, posture: Math.min(e.maxPosture, e.posture + 10), state: 'DEFLECT' }));
        triggerHitStop(50);
      }

      setTimeout(() => {
        setPlayer(p => ({ ...p, state: 'IDLE' }));
        setEnemy(e => ({ ...e, state: 'IDLE' }));
      }, 250);

      if (enemyRef.current.hp <= 0 || enemyRef.current.posture >= enemyRef.current.maxPosture) {
        setCombatState(CombatState.DEATHBLOW_WINDOW);
      }
    }
  }, [combatState, isFrozen]);

  const handleRelease = useCallback((action: PlayerAction) => {
    if (action === PlayerAction.BLOCK) {
      isBlockingRef.current = false;
      setPlayer(p => ({ ...p, state: 'IDLE' }));
    }
  }, []);

  useEffect(() => {
    if (appMode !== AppMode.GAME || combatState !== CombatState.IDLE) return;
    const interval = setInterval(() => {
      if (!isProcessingComboRef.current) {
        isProcessingComboRef.current = true;
        executeAttackStep(Math.random() > 0.85 ? AttackType.PERILOUS_SWEEP : AttackType.NORMAL)
          .then(() => { 
            if (stateRef.current !== CombatState.VICTORY && stateRef.current !== CombatState.DEFEAT) {
              setCombatState(CombatState.IDLE);
            }
            isProcessingComboRef.current = false; 
          });
      }
    }, 1400);
    return () => clearInterval(interval);
  }, [appMode, combatState]);

  if (appMode === AppMode.MENU) {
    return (
      <div className="w-full h-screen bg-[#0d1117] flex flex-col items-center justify-center p-10 text-white overflow-hidden relative">
        <div className="absolute top-20 w-80 h-80 bg-red-900/20 blur-[120px] rounded-full" />
        <h1 className="text-7xl sm:text-9xl font-black mb-4 text-center tracking-tighter uppercase font-cinzel text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
          SPIRIT <span className="text-red-600">DUEL</span>
        </h1>
        <p className="text-lg mb-16 tracking-[0.8em] opacity-40 uppercase font-light">The Way of the Ronin</p>
        
        <div className="mb-16 text-center glass-ui p-8 rounded-2xl w-80">
          <div className="text-[10px] tracking-widest uppercase opacity-40 mb-2 font-bold">Legendary Wins</div>
          <div className="text-6xl font-black font-cinzel text-red-500">{highScore}</div>
        </div>

        <button onClick={startGame} className="action-button w-80 h-24 text-2xl font-black rounded-xl">Draw Blade</button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none touch-none">
      <GameScene combatState={combatState} attackType={currentAttackType} player={player} enemy={enemy} playerActionEffect={playerActionEffect} isPlayerHit={isPlayerHit} theme={selectedTheme} />
      <CombatUI player={player} enemy={enemy} enemyName={bossName} playerTitle="Wolf" />
      <Controls onAction={handleAction} onRelease={handleRelease} combatState={combatState} />

      {showDeathScreen && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-10 animate-in fade-in duration-1000 backdrop-blur-md">
          <div className="w-40 h-40 border-8 border-red-900 rounded-full flex items-center justify-center mb-8 rotate-45 shadow-[0_0_50px_rgba(153,27,27,0.5)]">
            <span className="text-red-600 text-9xl font-black -rotate-45 font-cinzel">死</span>
          </div>
          <h1 className="text-5xl font-black text-red-700 mb-6 tracking-widest uppercase font-cinzel">Defeat</h1>
          <p className="text-xl text-slate-400 mb-20 text-center max-w-lg font-light italic">"{advice}"</p>
          <button onClick={() => resetMatch(bossIndex)} className="action-button w-80 h-24 text-2xl font-black rounded-xl">Rise Again</button>
          <button onClick={() => setAppMode(AppMode.MENU)} className="mt-10 text-white/20 text-xs tracking-widest uppercase hover:text-white/60 transition-colors">Return to Menu</button>
        </div>
      )}

      {combatState === CombatState.VICTORY && (
        <div className="absolute inset-0 z-50 bg-white/5 flex flex-col items-center justify-center animate-in zoom-in duration-500 backdrop-blur-sm">
          <div className="w-full py-20 bg-black/80 border-y-4 border-red-800 flex flex-col items-center">
             <h1 className="text-8xl font-black text-white mb-4 tracking-[0.4em] uppercase font-cinzel">Shinobi Execution</h1>
             <p className="text-red-500 tracking-[1em] uppercase text-sm mb-12">Victory Achieved</p>
             <button onClick={nextBoss} className="action-button w-80 h-24 text-2xl font-black rounded-xl">Next Opponent</button>
          </div>
        </div>
      )}

      {combatState === CombatState.DEATHBLOW_WINDOW && (
        <div className="absolute z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[ping_1s_infinite]" onClick={() => handleAction(PlayerAction.ATTACK)}>
          <div className="w-32 h-32 flex items-center justify-center">
             <span className="text-red-600 text-[12rem] font-black font-cinzel drop-shadow-[0_0_40px_rgba(255,0,0,1)]">死</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
