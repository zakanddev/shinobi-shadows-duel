
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
import { GAME_CONFIG, BOSS_PATTERNS, AttackPattern, THEME_DATA } from './constants';

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
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [showDeathScreen, setShowDeathScreen] = useState(false);
  const [bossIndex, setBossIndex] = useState(0);
  const [bossName, setBossName] = useState("");
  const [advice, setAdvice] = useState<string>("");
  const [deathCount, setDeathCount] = useState(0);

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

  const playSound = (type: 'CLASH' | 'HIT' | 'DEATHBLOW' | 'PERILOUS') => {
    if (type === 'HIT') {
      document.body.classList.add('flash-red');
      setTimeout(() => document.body.classList.remove('flash-red'), 500);
    }
    if (navigator.vibrate) {
      if (type === 'CLASH') navigator.vibrate(40);
      if (type === 'PERILOUS') navigator.vibrate([100, 50, 100]);
      if (type === 'HIT') navigator.vibrate(150);
    }
  };

  const addLog = (msg: string, type: GameLog['type'] = 'info') => {
    setLogs(prev => [{ message: msg, type, timestamp: Date.now() }, ...prev].slice(3));
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
    setLogs([]);
    isProcessingComboRef.current = false;
    
    const themeConfig = THEME_DATA[selectedTheme];
    const name = themeConfig.bossNames[idx % themeConfig.bossNames.length] || "Unknown Warlord";
    setBossName(name);

    const taunt = await getBossTaunt(name);
    addLog(`${name}: "${taunt}"`, 'system');
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
    setDeathCount(p => p + 1);
    saveHighScore(bossIndex);

    const adviceText = await getCombatAdvice(0, Math.round((enemyRef.current.hp / enemyRef.current.maxHp) * 100), deathCount + 1, reason);
    setAdvice(adviceText);
  };

  const handleVictory = () => {
    setCombatState(CombatState.VICTORY);
    setEnemy(e => ({ ...e, state: 'DEAD' }));
    playSound('DEATHBLOW');
  };

  // --- Game Loop (Quadratic Posture Recovery) ---
  useEffect(() => {
    const loop = setInterval(() => {
      if (appModeRef.current !== AppMode.GAME) return;
      if (stateRef.current === CombatState.VICTORY || stateRef.current === CombatState.DEFEAT) return;

      // Formula: Recovery = Base * (CurrentHP/MaxHP)^2
      const pRatio = playerRef.current.hp / playerRef.current.maxHp;
      const eRatio = enemyRef.current.hp / enemyRef.current.maxHp;
      
      const pRecMult = Math.pow(pRatio, 2);
      const eRecMult = Math.pow(eRatio, 2);

      const baseRate = GAME_CONFIG.POSTURE_RECOVERY_RATE;
      const playerRecovery = (isBlockingRef.current ? baseRate * 2.5 : baseRate) * pRecMult;
      const enemyRecovery = baseRate * eRecMult;

      setPlayer(p => ({ ...p, posture: Math.max(0, p.posture - playerRecovery) }));
      setEnemy(e => ({ ...e, posture: Math.max(0, e.posture - enemyRecovery) }));
    }, 1000 / 60);
    return () => clearInterval(loop);
  }, []);

  const resolveHit = (type: AttackType) => {
    if (stateRef.current !== CombatState.ENEMY_ATTACKING) return;

    const now = Date.now();
    const blockDuration = now - blockStartRef.current;
    const isBlocking = isBlockingRef.current;
    const isJumping = playerRef.current.state === 'JUMPING';
    
    let damage = 0;
    let hit = false;
    let msg = "";

    if (type === AttackType.PERILOUS_SWEEP) {
      if (isJumping) {
        setEnemy(e => ({ ...e, posture: e.posture + GAME_CONFIG.POSTURE_DAMAGE.JUMP_COUNTER }));
        addLog("Jump Counter!", 'success');
        playSound('CLASH');
      } else {
        hit = true;
        damage = GAME_CONFIG.DAMAGE.HEAVY_ATTACK;
        msg = "Swept!";
      }
    } 
    else if (type === AttackType.NORMAL) {
      if (isBlocking) {
        if (blockDuration < GAME_CONFIG.PARRY_WINDOW_MS) {
          setEnemy(e => ({ 
            ...e, 
            posture: e.posture + GAME_CONFIG.POSTURE_DAMAGE.PERFECT_PARRY,
            state: 'HIT' 
          }));
          setPlayer(p => ({ ...p, state: 'DEFLECT' }));
          setTimeout(() => setPlayer(p => ({...p, state: 'IDLE'})), 300);
          setPlayerActionEffect('PARRY');
          playSound('CLASH');
          addLog("Perfect Deflect!", 'success');
        } else {
          setPlayer(p => ({ 
            ...p, 
            posture: p.posture + GAME_CONFIG.POSTURE_DAMAGE.ATTACK_ON_BLOCK,
            state: 'DEFLECT'
          }));
          setTimeout(() => setPlayer(p => ({...p, state: 'IDLE'})), 300);
          setPlayerActionEffect('BLOCK');
          addLog("Blocked", 'info');
        }
      } else {
        hit = true;
        damage = GAME_CONFIG.DAMAGE.LIGHT_ATTACK;
        msg = "Hit!";
      }
    }

    if (hit) {
      setIsPlayerHit(true);
      setTimeout(() => setIsPlayerHit(false), 300);
      playSound('HIT');
      setPlayer(p => ({ 
        ...p, 
        hp: Math.max(0, p.hp - damage), 
        posture: p.posture + GAME_CONFIG.POSTURE_DAMAGE.HIT,
        state: 'HIT'
      }));
      addLog(msg, 'danger');
      setTimeout(() => setPlayer(p => ({...p, state: 'IDLE'})), 500);
    }
    
    if (enemyRef.current.posture >= enemyRef.current.maxPosture) {
      setCombatState(CombatState.DEATHBLOW_WINDOW);
      setEnemy(e => ({...e, posture: e.maxPosture}));
      playSound('PERILOUS');
    }

    if (playerRef.current.hp <= 0 || playerRef.current.posture >= playerRef.current.maxPosture) {
      handlePlayerDeath(hit ? "Fell in battle" : "Posture shattered");
    }
  };

  const startEnemyCombo = async () => {
    isProcessingComboRef.current = true;
    const level = Math.min(bossIndex, 4);
    const patterns = BOSS_PATTERNS[level] || BOSS_PATTERNS[0];
    const pattern: AttackPattern = patterns[Math.floor(Math.random() * patterns.length)];

    for (const move of pattern) {
      if (stateRef.current === CombatState.VICTORY || stateRef.current === CombatState.DEFEAT) break;

      if (move === 'DELAY') {
        await new Promise(r => setTimeout(r, GAME_CONFIG.TIMING.COMBO_DELAY));
        continue;
      }

      await executeAttackStep(move === 'SWEEP' ? AttackType.PERILOUS_SWEEP : AttackType.NORMAL);
      await new Promise(r => setTimeout(r, 200));
    }

    if (stateRef.current !== CombatState.DEFEAT && stateRef.current !== CombatState.VICTORY) {
      setCombatState(CombatState.IDLE);
      setEnemy(e => ({ ...e, state: 'IDLE' }));
    }
    isProcessingComboRef.current = false;
  };

  const executeAttackStep = (type: AttackType): Promise<void> => {
    return new Promise((resolve) => {
      setCurrentAttackType(type);
      setCombatState(CombatState.ENEMY_WINDUP);
      if (type !== AttackType.NORMAL) playSound('PERILOUS');

      const speedMod = Math.min(bossIndex * 40, 400); 
      const windupTime = Math.max(GAME_CONFIG.TIMING.WINDUP_FAST, GAME_CONFIG.TIMING.WINDUP_BASE - speedMod);

      setTimeout(() => {
        if (stateRef.current === CombatState.DEFEAT || stateRef.current === CombatState.DEATHBLOW_WINDOW) return resolve();
        setCombatState(CombatState.ENEMY_ATTACKING);
        setEnemy(e => ({ ...e, state: 'ATTACK' })); 
        
        setTimeout(() => {
          resolveHit(type);
          setTimeout(() => resolve(), 300); 
        }, GAME_CONFIG.TIMING.ATTACK_DURATION);
      }, windupTime);
    });
  };

  const handleAction = useCallback((action: PlayerAction) => {
    if (appModeRef.current !== AppMode.GAME || stateRef.current === CombatState.DEFEAT || stateRef.current === CombatState.VICTORY) return;

    if (action === PlayerAction.BLOCK) {
      isBlockingRef.current = true;
      blockStartRef.current = Date.now();
      setPlayer(p => ({ ...p, state: 'DEFLECT' }));
    }

    if (action === PlayerAction.JUMP && playerRef.current.state !== 'JUMPING') {
      setPlayer(p => ({ ...p, state: 'JUMPING' }));
      setTimeout(() => setPlayer(p => ({ ...p, state: 'IDLE' })), GAME_CONFIG.TIMING.JUMP_DURATION);
    }

    if (action === PlayerAction.ATTACK) {
      setPlayer(p => ({ ...p, state: 'ATTACK' }));
      setPlayerActionEffect('ATTACK'); 
      setTimeout(() => setPlayerActionEffect(null), 150);
      setTimeout(() => setPlayer(p => ({ ...p, state: 'IDLE' })), 200);

      if (combatState === CombatState.DEATHBLOW_WINDOW) {
        handleVictory();
        return;
      }

      const willBlock = Math.random() < GAME_CONFIG.ENEMY_DEFLECT_CHANCE;
      if (willBlock && combatState === CombatState.IDLE) {
        setEnemy(e => ({ ...e, posture: e.posture + GAME_CONFIG.POSTURE_DAMAGE.ENEMY_BLOCK, state: 'DEFLECT' }));
        setTimeout(() => setEnemy(e => ({...e, state: 'IDLE'})), 200);
        playSound('CLASH');
      } else {
        setEnemy(e => ({ 
          ...e, 
          hp: Math.max(0, e.hp - GAME_CONFIG.DAMAGE.LIGHT_ATTACK), 
          posture: e.posture + GAME_CONFIG.POSTURE_DAMAGE.ENEMY_HIT, 
          state: 'HIT' 
        }));
        setTimeout(() => setEnemy(e => ({ ...e, state: 'IDLE' })), 200);
        playSound('HIT');
      }
      
      if (enemyRef.current.hp <= 0 || enemyRef.current.posture >= enemyRef.current.maxPosture) {
        setCombatState(CombatState.DEATHBLOW_WINDOW);
        setEnemy(e => ({...e, posture: e.maxPosture}));
      }
    }
  }, [combatState, appMode]);

  const handleRelease = useCallback((action: PlayerAction) => {
    if (action === PlayerAction.BLOCK) {
      isBlockingRef.current = false;
      setPlayer(p => ({ ...p, state: 'IDLE' }));
    }
  }, []);

  useEffect(() => {
    if (appMode !== AppMode.GAME || combatState !== CombatState.IDLE) return;
    const interval = setInterval(() => {
      if (!isProcessingComboRef.current && Math.random() > 0.45) startEnemyCombo();
    }, 1000);
    return () => clearInterval(interval);
  }, [appMode, combatState, bossIndex]);

  if (appMode === AppMode.MENU) {
    const themeInfo = THEME_DATA[selectedTheme];
    return (
      <div className={`w-full h-screen ${themeInfo.colors.bg} flex flex-col items-center justify-center p-6 text-white overflow-hidden transition-colors duration-700`}>
        <h1 className="text-5xl font-black mb-2 text-center tracking-widest uppercase font-serif drop-shadow-2xl">{themeInfo.title}</h1>
        <p className="text-gray-400 mb-12 font-serif italic text-sm tracking-widest">HESITATION IS DEFEAT</p>
        
        <div className="mb-10 text-center bg-black/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-2xl">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Hall of Fame</div>
          <div className="text-4xl font-bold text-yellow-500 drop-shadow-md">{highScore} <span className="text-sm text-yellow-500/50">WINS</span></div>
        </div>

        <div className="w-full max-w-sm mb-12">
          <div className="flex justify-between items-center mb-6">
            <button className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors" onClick={() => {
              const themes = Object.values(Theme);
              const idx = themes.indexOf(selectedTheme);
              setSelectedTheme(themes[idx === 0 ? themes.length - 1 : idx - 1]);
            }}>◀</button>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Aura</div>
              <div className="text-2xl font-black text-teal-400 font-serif">{selectedTheme}</div>
            </div>
            <button className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors" onClick={() => {
              const themes = Object.values(Theme);
              const idx = themes.indexOf(selectedTheme);
              setSelectedTheme(themes[(idx + 1) % themes.length]);
            }}>▶</button>
          </div>
        </div>

        <button onClick={startGame} className="group relative w-72 h-20 bg-red-900 overflow-hidden rounded-xl border-b-8 border-red-950 active:border-b-0 active:translate-y-2 transition-all shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
          <span className="text-2xl font-black tracking-[0.3em] font-serif">ENTER DUEL</span>
        </button>

        <button className="mt-8 text-gray-600 hover:text-gray-400 text-xs uppercase tracking-[0.4em] transition-colors" onClick={() => window.close()}>QUIT GAME</button>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-screen bg-black text-white overflow-hidden select-none touch-none`}>
      <GameScene combatState={combatState} attackType={currentAttackType} player={player} enemy={enemy} playerActionEffect={playerActionEffect} isPlayerHit={isPlayerHit} theme={selectedTheme} />
      <CombatUI player={player} enemy={enemy} enemyName={bossName} playerTitle={THEME_DATA[selectedTheme].playerTitle} />
      <Controls onAction={handleAction} onRelease={handleRelease} combatState={combatState} />

      {showDeathScreen && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-8 animate-[fade-in_1s_ease-out]">
          <h1 className="text-8xl font-black text-red-700 mb-4 tracking-tighter drop-shadow-[0_0_30px_rgba(185,28,28,0.5)] font-serif">死</h1>
          <p className="text-2xl text-gray-500 mb-12 tracking-[0.5em] font-serif">DEFEAT</p>
          <div className="mb-12 max-w-md text-center">
            <p className="text-amber-500/90 italic font-serif text-xl leading-relaxed">"{advice || 'Hesitation is defeat.'}"</p>
          </div>
          <div className="flex flex-col gap-4 w-64">
            <button onClick={() => resetMatch(bossIndex)} className="w-full py-4 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-serif tracking-[0.2em] uppercase rounded-lg">Rise Again</button>
            <button onClick={() => setAppMode(AppMode.MENU)} className="w-full py-4 text-red-800/60 hover:text-red-500 transition-colors font-serif tracking-[0.2em] uppercase">Surrender</button>
          </div>
        </div>
      )}

      {combatState === CombatState.VICTORY && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm animate-[fade-in_0.5s_ease-out]">
          <h1 className="text-6xl font-black text-yellow-500 mb-2 tracking-[0.3em] drop-shadow-lg font-serif">勝利</h1>
          <p className="text-gray-400 mb-12 tracking-widest font-serif">SHINOBI EXECUTION</p>
          <div className="flex gap-6">
            <button onClick={nextBoss} className="px-12 py-4 bg-red-900 text-white font-bold rounded-lg shadow-2xl hover:bg-red-800 transition-colors tracking-widest font-serif">NEXT DUEL</button>
            <button onClick={() => setAppMode(AppMode.MENU)} className="px-10 py-4 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors font-serif tracking-widest">REST</button>
          </div>
        </div>
      )}

      {combatState === CombatState.DEATHBLOW_WINDOW && (
        <div className="absolute z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[pulse_0.5s_infinite]" onClick={() => handleAction(PlayerAction.ATTACK)}>
          <div className="w-28 h-28 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,1)] border-8 border-white">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
