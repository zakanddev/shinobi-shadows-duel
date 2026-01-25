
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
  GameLog,
  AppMode,
  Theme
} from './types';
import { GAME_CONFIG, BOSS_PATTERNS, THEME_DATA } from './constants';

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
  const [selectedTheme, setSelectedTheme] = useState<Theme>(Theme.SAMURAI);
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
    const stored = localStorage.getItem('ronin_highscore');
    if (stored) setHighScore(parseInt(stored));
  }, []);

  const saveHighScore = (score: number) => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('ronin_highscore', score.toString());
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
    const name = themeConfig.bossNames[idx % themeConfig.bossNames.length] || "Unknown Warlord";
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
    triggerHitStop(250);
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
        setEnemy(e => ({ ...e, posture: Math.min(e.maxPosture, e.posture + 35) }));
        triggerHitStop(150);
      } else hit = true;
    } else {
      if (isBlocking) {
        if (blockDuration < 400) { // Perfect parry window
          setEnemy(e => ({ ...e, posture: Math.min(e.maxPosture, e.posture + 25), state: 'HIT' }));
          setPlayer(p => ({ ...p, state: 'DEFLECT' }));
          setPlayerActionEffect('PARRY');
          triggerHitStop(100);
          setTimeout(() => setPlayerActionEffect(null), 150);
        } else {
          setPlayer(p => ({ ...p, posture: Math.min(p.maxPosture, p.posture + 15), state: 'DEFLECT' }));
          triggerHitStop(50);
        }
      } else hit = true;
    }

    if (hit) {
      setIsPlayerHit(true);
      setTimeout(() => setIsPlayerHit(false), 300);
      triggerHitStop(180);
      setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - 20), state: 'HIT' }));
      setTimeout(() => setPlayer(p => ({...p, state: 'IDLE'})), 500);
    }
    
    if (enemyRef.current.posture >= enemyRef.current.maxPosture) {
      setCombatState(CombatState.DEATHBLOW_WINDOW);
    }
    if (playerRef.current.hp <= 0) handlePlayerDeath("Cut Down");
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
        }, 300);
      }, 700);
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
      setTimeout(() => setPlayer(p => ({ ...p, state: 'IDLE' })), 800);
    }
    
    if (action === PlayerAction.ATTACK) {
      if (combatState === CombatState.DEATHBLOW_WINDOW) { handleVictory(); return; }
      
      setPlayer(p => ({ ...p, state: 'ATTACK' }));
      
      // Determine if enemy blocks or gets hit
      if (Math.random() > 0.3) {
        setEnemy(e => ({ ...e, hp: Math.max(0, e.hp - 10), state: 'HIT' }));
        triggerHitStop(80);
      } else {
        setEnemy(e => ({ ...e, posture: Math.min(e.maxPosture, e.posture + 10), state: 'DEFLECT' }));
        triggerHitStop(60);
      }

      setTimeout(() => {
        setPlayer(p => ({ ...p, state: 'IDLE' }));
        setEnemy(e => ({ ...e, state: 'IDLE' }));
      }, 200);

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
        executeAttackStep(Math.random() > 0.8 ? AttackType.PERILOUS_SWEEP : AttackType.NORMAL)
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
      <div className="w-full h-screen bg-[#3a6327] flex flex-col items-center justify-center p-6 text-white overflow-hidden">
        <h1 className="text-7xl font-black mb-2 text-center drop-shadow-[4px_4px_#000] uppercase">RONIN BLOCKS</h1>
        <p className="text-xl mb-12 drop-shadow-[2px_2px_#000]">CRAFT YOUR LEGEND</p>
        
        <div className="mb-10 text-center mc-button p-6 w-72">
          <div className="text-xs uppercase opacity-60">High Score</div>
          <div className="text-4xl font-bold">{highScore} Wins</div>
        </div>

        <button onClick={startGame} className="mc-button w-72 h-20 text-3xl font-bold uppercase">Start Duel</button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none touch-none">
      <GameScene combatState={combatState} attackType={currentAttackType} player={player} enemy={enemy} playerActionEffect={playerActionEffect} isPlayerHit={isPlayerHit} theme={selectedTheme} />
      <CombatUI player={player} enemy={enemy} enemyName={bossName} playerTitle="Player" />
      <Controls onAction={handleAction} onRelease={handleRelease} combatState={combatState} />

      {showDeathScreen && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8">
          <h1 className="text-8xl font-black text-red-600 mb-4 drop-shadow-[4px_4px_#000] uppercase">You Died!</h1>
          <p className="text-xl text-white mb-12 text-center max-w-md">"{advice}"</p>
          <button onClick={() => resetMatch(bossIndex)} className="mc-button w-64 h-20 text-2xl">Respawn</button>
          <button onClick={() => setAppMode(AppMode.MENU)} className="mt-4 text-white uppercase opacity-60">Main Menu</button>
        </div>
      )}

      {combatState === CombatState.VICTORY && (
        <div className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center">
          <h1 className="text-7xl font-black text-yellow-400 mb-8 drop-shadow-[4px_4px_#000] uppercase">Boss Defeated!</h1>
          <button onClick={nextBoss} className="mc-button w-64 h-20 text-2xl">Next Boss</button>
        </div>
      )}

      {combatState === CombatState.DEATHBLOW_WINDOW && (
        <div className="absolute z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" onClick={() => handleAction(PlayerAction.ATTACK)}>
          <div className="w-32 h-32 bg-red-600 border-8 border-white rounded-none flex items-center justify-center shadow-[0_0_30px_#ef4444]">
            <span className="text-white text-6xl font-black">X</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
