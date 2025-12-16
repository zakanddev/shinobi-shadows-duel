
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

// Initial states
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
  // --- App State ---
  const [appMode, setAppMode] = useState<AppMode>(AppMode.MENU);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(Theme.SAMURAI);
  const [highScore, setHighScore] = useState<number>(0);

  // --- Game State ---
  const [player, setPlayer] = useState<EntityStats>(initialPlayer);
  const [enemy, setEnemy] = useState<EntityStats>(initialEnemy);
  const [combatState, setCombatState] = useState<CombatState>(CombatState.IDLE);
  const [currentAttackType, setCurrentAttackType] = useState<AttackType>(AttackType.NORMAL);
  
  // Visual feedback states
  const [playerActionEffect, setPlayerActionEffect] = useState<string | null>(null);
  const [isPlayerHit, setIsPlayerHit] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState<string>('');
  const [subMessage, setSubMessage] = useState<string>('');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [showDeathScreen, setShowDeathScreen] = useState(false);
  const [bossIndex, setBossIndex] = useState(0);
  const [bossName, setBossName] = useState("");
  const [advice, setAdvice] = useState<string>("");
  const [deathCount, setDeathCount] = useState(0);

  // --- Refs for Logic ---
  const playerRef = useRef(player);
  const enemyRef = useRef(enemy);
  const stateRef = useRef(combatState);
  const blockStartRef = useRef<number>(0);
  const isBlockingRef = useRef(false);
  const isProcessingComboRef = useRef(false);
  const appModeRef = useRef(appMode);

  // Sync refs
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { enemyRef.current = enemy; }, [enemy]);
  useEffect(() => { stateRef.current = combatState; }, [combatState]);
  useEffect(() => { appModeRef.current = appMode; }, [appMode]);

  // Load High Score
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

  // --- Audio / Haptics ---
  const playSound = (type: 'CLASH' | 'HIT' | 'DEATHBLOW' | 'PERILOUS') => {
    if (type === 'HIT') {
        document.body.classList.add('flash-red');
        setTimeout(() => document.body.classList.remove('flash-red'), 500);
    }
    if (type === 'CLASH') {
        if (navigator.vibrate) navigator.vibrate(50);
    }
    if (type === 'PERILOUS') {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
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

  const quitGame = () => {
      // Return to menu
      setAppMode(AppMode.MENU);
  };

  const resetMatch = async (idx: number) => {
    setPlayer(initialPlayer);
    setEnemy(initialEnemy);
    setCombatState(CombatState.IDLE);
    setShowDeathScreen(false);
    setOverlayMessage('');
    setSubMessage('');
    setAdvice('');
    setLogs([]);
    isProcessingComboRef.current = false;
    
    // Set Boss Name based on Theme
    const themeConfig = THEME_DATA[selectedTheme];
    const name = themeConfig.bossNames[idx % themeConfig.bossNames.length] || "Unknown Warlord";
    setBossName(name);

    // Taunt
    const taunt = await getBossTaunt(name);
    addLog(`${name}: "${taunt}"`, 'system');
  };

  const nextBoss = () => {
    const nextIdx = bossIndex + 1;
    setBossIndex(nextIdx);
    
    // Increase enemy stats slightly
    initialEnemy.maxHp = GAME_CONFIG.ENEMY_MAX_HP + (nextIdx * 50);
    initialEnemy.maxPosture = GAME_CONFIG.ENEMY_MAX_POSTURE + (nextIdx * 20);
    
    resetMatch(nextIdx);
  };

  const handlePlayerDeath = async (reason: string) => {
    setCombatState(CombatState.DEFEAT);
    setPlayer(p => ({ ...p, state: 'DEAD' }));
    setShowDeathScreen(true);
    setDeathCount(p => p + 1);
    
    // Save Highscore (Boss Index = Number of defeats)
    saveHighScore(bossIndex);

    const adviceText = await getCombatAdvice(0, Math.round((enemyRef.current.hp / enemyRef.current.maxHp) * 100), deathCount + 1, reason);
    setAdvice(adviceText);
  };

  const handleVictory = () => {
    setCombatState(CombatState.VICTORY);
    setEnemy(e => ({ ...e, state: 'DEAD' }));
    setOverlayMessage('VICTORY');
    setSubMessage('Execution Performed');
  };

  // --- Game Loop (Posture & Recovery) ---
  useEffect(() => {
    const loop = setInterval(() => {
        if (appModeRef.current !== AppMode.GAME) return;
        if (combatState === CombatState.VICTORY || combatState === CombatState.DEFEAT) return;

        // Posture Recovery Calculation
        // Recovery slows down quadratically as HP decreases.
        const playerHpRatio = playerRef.current.hp / playerRef.current.maxHp;
        const enemyHpRatio = enemyRef.current.hp / enemyRef.current.maxHp;

        // Ensure ratio is at least 0 to avoid NaNs, though HP shouldn't be negative in logic ideally.
        const safePlayerRatio = Math.max(0, playerHpRatio);
        const safeEnemyRatio = Math.max(0, enemyHpRatio);

        // Quadratic factor: (HP/Max)^2
        const playerRecoveryFactor = safePlayerRatio * safePlayerRatio;
        const enemyRecoveryFactor = safeEnemyRatio * safeEnemyRatio;

        const baseRate = GAME_CONFIG.POSTURE_RECOVERY_RATE;
        
        const playerRecovery = (isBlockingRef.current ? baseRate * 2 : baseRate) * playerRecoveryFactor;
        const enemyRecovery = baseRate * enemyRecoveryFactor;

        setPlayer(p => ({
            ...p,
            posture: Math.max(0, p.posture - playerRecovery)
        }));
        setEnemy(e => ({
            ...e,
            posture: Math.max(0, e.posture - enemyRecovery)
        }));

    }, 1000 / 60);
    return () => clearInterval(loop);
  }, [combatState, appMode]);

  // --- Enemy AI & Combo System ---
  useEffect(() => {
    if (appMode !== AppMode.GAME) return;
    if (combatState === CombatState.VICTORY || combatState === CombatState.DEFEAT) return;

    const checkAttack = setInterval(() => {
        if (combatState === CombatState.IDLE && !isProcessingComboRef.current) {
            if (Math.random() > 0.4) {
                startEnemyCombo();
            }
        }
    }, 1000);

    return () => clearInterval(checkAttack);
  }, [combatState, bossIndex, appMode]);


  const startEnemyCombo = async () => {
      isProcessingComboRef.current = true;
      
      const level = Math.min(bossIndex, 4);
      const patterns = BOSS_PATTERNS[level] || BOSS_PATTERNS[0];
      const pattern: AttackPattern = patterns[Math.floor(Math.random() * patterns.length)];

      for (let i = 0; i < pattern.length; i++) {
          const move = pattern[i];

          // Check interruption
          if (stateRef.current === CombatState.VICTORY || stateRef.current === CombatState.DEFEAT) break;

          if (move === 'DELAY') {
              await new Promise(r => setTimeout(r, GAME_CONFIG.TIMING.COMBO_DELAY));
              continue;
          }

          const isSweep = move === 'SWEEP';
          await executeAttackStep(isSweep ? AttackType.PERILOUS_SWEEP : AttackType.NORMAL);
          
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
          setEnemy(e => ({ ...e, state: 'IDLE' })); 
          
          if (type === AttackType.PERILOUS_SWEEP) playSound('PERILOUS');

          const speedMod = Math.min(bossIndex * 50, 300); 
          const windupTime = Math.max(GAME_CONFIG.TIMING.WINDUP_FAST, GAME_CONFIG.TIMING.WINDUP_BASE - speedMod);

          setTimeout(() => {
              if (stateRef.current === CombatState.DEFEAT) return resolve();
              if (stateRef.current === CombatState.DEATHBLOW_WINDOW) return resolve();

              setCombatState(CombatState.ENEMY_ATTACKING);
              setEnemy(e => ({ ...e, state: 'ATTACK' })); 
              
              setTimeout(() => {
                 resolveHit(type);
                 setTimeout(() => {
                    resolve();
                 }, 300); 
              }, GAME_CONFIG.TIMING.ATTACK_DURATION);

          }, windupTime);
      });
  };

  // --- Resolve Attack Impact ---
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
               setEnemy(e => ({ 
                   ...e, 
                   posture: e.posture + GAME_CONFIG.POSTURE_DAMAGE.JUMP_COUNTER 
               }));
               addLog("Jump Counter!", 'success');
           } else {
               hit = true;
               damage = GAME_CONFIG.DAMAGE.HEAVY_ATTACK;
               msg = "Swept!";
           }
       } 
       else if (type === AttackType.NORMAL) {
           if (isJumping) {
               hit = true;
               damage = GAME_CONFIG.DAMAGE.LIGHT_ATTACK;
               msg = "Air Hit!";
           }
           else if (isBlocking) {
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
               hp: p.hp - damage, 
               posture: p.posture + GAME_CONFIG.POSTURE_DAMAGE.HIT,
               state: 'HIT'
            }));
           addLog(msg, 'danger');
           setTimeout(() => setPlayer(p => ({...p, state: 'IDLE'})), 500);
       }
       
       if (enemyRef.current.posture >= enemyRef.current.maxPosture) {
           triggerDeathblowWindow();
       }

       if (playerRef.current.hp <= 0 || playerRef.current.posture >= playerRef.current.maxPosture) {
           handlePlayerDeath(hit ? "Cut down" : "Posture broken");
       }
  };
  
  const triggerDeathblowWindow = () => {
       setCombatState(CombatState.DEATHBLOW_WINDOW);
       setEnemy(e => ({...e, posture: e.maxPosture}));
       playSound('PERILOUS');
  };

  // --- Input Handlers ---
  const handleAction = useCallback((action: PlayerAction) => {
    if (appModeRef.current !== AppMode.GAME) return;
    if (combatState === CombatState.DEFEAT || combatState === CombatState.VICTORY) return;

    if (action === PlayerAction.BLOCK) {
        isBlockingRef.current = true;
        blockStartRef.current = Date.now();
        setPlayer(p => ({ ...p, state: 'DEFLECT' }));
    }

    if (action === PlayerAction.JUMP) {
        if (playerRef.current.state !== 'JUMPING') {
            setPlayer(p => ({ ...p, state: 'JUMPING' }));
            setTimeout(() => {
                setPlayer(p => ({ ...p, state: 'IDLE' }));
            }, GAME_CONFIG.TIMING.JUMP_DURATION);
        }
    }

    if (action === PlayerAction.ATTACK) {
        setPlayer(p => ({ ...p, state: 'ATTACK' }));
        setPlayerActionEffect('ATTACK'); 
        setTimeout(() => setPlayerActionEffect(null), 200);
        setTimeout(() => setPlayer(p => ({ ...p, state: 'IDLE' })), 200);

        if (combatState === CombatState.DEATHBLOW_WINDOW) {
             handleVictory();
             return;
        }

        if (combatState === CombatState.ENEMY_WINDUP) {
             setEnemy(e => ({ 
                ...e, 
                hp: e.hp - GAME_CONFIG.DAMAGE.LIGHT_ATTACK, 
                posture: e.posture + GAME_CONFIG.POSTURE_DAMAGE.ENEMY_HIT, 
                state: 'HIT' 
            }));
            setTimeout(() => setEnemy(e => ({ ...e, state: 'IDLE' })), 200);
            addLog("Counter Slash!", 'info');
            playSound('HIT');
        } 
        else if (combatState === CombatState.IDLE) {
            const willBlock = Math.random() < GAME_CONFIG.ENEMY_DEFLECT_CHANCE;
            
            if (willBlock) {
                setEnemy(e => ({
                    ...e,
                    posture: e.posture + GAME_CONFIG.POSTURE_DAMAGE.ENEMY_BLOCK,
                    state: 'DEFLECT'
                }));
                setTimeout(() => setEnemy(e => ({...e, state: 'IDLE'})), 200);
                addLog("Enemy Deflected", 'info');
                playSound('CLASH');
            } else {
                setEnemy(e => ({ 
                    ...e, 
                    hp: e.hp - GAME_CONFIG.DAMAGE.LIGHT_ATTACK, 
                    posture: e.posture + GAME_CONFIG.POSTURE_DAMAGE.ENEMY_HIT, 
                    state: 'HIT' 
                }));
                setTimeout(() => setEnemy(e => ({ ...e, state: 'IDLE' })), 200);
                addLog("Slash!", 'info');
                playSound('HIT');
            }
        } 
        
        if (enemyRef.current.hp <= 0 || enemyRef.current.posture >= enemyRef.current.maxPosture) {
            triggerDeathblowWindow();
        }
    }
  }, [combatState, appMode]);

  const handleRelease = useCallback((action: PlayerAction) => {
      if (action === PlayerAction.BLOCK) {
          isBlockingRef.current = false;
          setPlayer(p => ({ ...p, state: 'IDLE' }));
      }
  }, []);

  // --- Render ---

  // 1. MENU SCREEN
  if (appMode === AppMode.MENU) {
      const themeInfo = THEME_DATA[selectedTheme];
      return (
          <div className={`w-full h-screen ${themeInfo.colors.bg} flex flex-col items-center justify-center p-6 text-white overflow-hidden transition-colors duration-500`}>
              <h1 className="text-5xl font-black mb-2 text-center tracking-widest uppercase font-serif drop-shadow-lg">{themeInfo.title}</h1>
              <p className="text-gray-400 mb-12 font-serif italic text-sm">REACTION DUEL</p>
              
              {/* High Score */}
              <div className="mb-10 text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-widest">High Score</div>
                  <div className="text-3xl font-bold text-yellow-500">{highScore} Wins</div>
              </div>

              {/* Theme Selector */}
              <div className="w-full max-w-sm mb-12">
                  <div className="flex justify-between items-center mb-4">
                      <button 
                         className="p-4 text-gray-500 hover:text-white"
                         onClick={() => {
                             const themes = Object.values(Theme);
                             const idx = themes.indexOf(selectedTheme);
                             const prev = idx === 0 ? themes.length - 1 : idx - 1;
                             setSelectedTheme(themes[prev]);
                         }}
                      >◀</button>
                      <div className="text-center">
                          <div className="text-xs text-gray-400 uppercase">Selected Theme</div>
                          <div className="text-xl font-bold text-teal-400">{selectedTheme}</div>
                      </div>
                      <button 
                         className="p-4 text-gray-500 hover:text-white"
                         onClick={() => {
                            const themes = Object.values(Theme);
                            const idx = themes.indexOf(selectedTheme);
                            const next = (idx + 1) % themes.length;
                            setSelectedTheme(themes[next]);
                         }}
                      >▶</button>
                  </div>
                  {/* Preview box */}
                  <div className="h-32 bg-black/30 rounded-lg border border-white/10 flex items-center justify-center">
                       <p className="text-sm text-gray-400 italic">"{themeInfo.playerTitle} vs {themeInfo.enemyTitlePrefix}..."</p>
                  </div>
              </div>

              <button 
                onClick={startGame}
                className="w-64 py-4 bg-red-900 hover:bg-red-800 text-white font-bold tracking-[0.2em] border-b-4 border-red-950 active:border-b-0 active:translate-y-1 transition-all rounded shadow-xl"
              >
                  START DUEL
              </button>

              <button 
                  className="mt-6 text-gray-600 hover:text-gray-400 text-xs uppercase tracking-widest"
                  onClick={() => alert("To quit, close the browser tab.")}
              >
                  Exit Game
              </button>
          </div>
      );
  }

  // 2. GAME SCREEN
  return (
    <div className={`relative w-full h-screen bg-black text-white overflow-hidden select-none touch-none`}>
      
      {/* 2D Game World */}
      <GameScene 
        combatState={combatState} 
        attackType={currentAttackType}
        player={player}
        enemy={enemy}
        playerActionEffect={playerActionEffect}
        isPlayerHit={isPlayerHit}
        theme={selectedTheme}
      />

      {/* UI Overlay */}
      <CombatUI 
        player={player} 
        enemy={enemy} 
        enemyName={bossName} 
        playerTitle={THEME_DATA[selectedTheme].playerTitle} 
      />

      {/* Controls */}
      <Controls 
        onAction={handleAction} 
        onRelease={handleRelease} 
        combatState={combatState} 
      />

      {/* Death Screen */}
      {showDeathScreen && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 animate-fade-in">
            <h1 className="text-6xl font-black text-red-700 mb-4 tracking-widest font-serif">死</h1>
            <p className="text-xl text-gray-400 mb-8 font-serif">DEFEAT</p>
            <div className="mb-8 max-w-xs text-center">
                <p className="text-amber-500/80 italic font-serif text-lg">"{advice || '...'}"</p>
            </div>
            <div className="flex gap-4">
                <button onClick={() => resetMatch(bossIndex)} className="px-8 py-3 border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-serif tracking-widest uppercase">
                    Rise Again
                </button>
                <button onClick={quitGame} className="px-8 py-3 border border-red-900/30 text-red-800/60 hover:text-red-500 transition-colors font-serif tracking-widest uppercase">
                    Give Up
                </button>
            </div>
        </div>
      )}

      {/* Victory Screen */}
      {combatState === CombatState.VICTORY && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
            <h1 className="text-5xl text-center font-black text-yellow-500 mb-2 tracking-widest drop-shadow-lg font-serif">{overlayMessage}</h1>
            <p className="text-gray-400 mb-8 font-serif">{subMessage}</p>
            <div className="flex gap-4">
                <button onClick={nextBoss} className="px-8 py-3 bg-red-900/50 hover:bg-red-800 text-white border border-red-700 rounded transition-colors font-serif tracking-widest">
                    NEXT DUEL
                </button>
                 <button onClick={quitGame} className="px-6 py-3 border border-gray-700 text-gray-500 hover:text-gray-300 rounded transition-colors font-serif tracking-widest">
                    REST
                </button>
            </div>
        </div>
      )}

      {/* Deathblow Prompt */}
      {combatState === CombatState.DEATHBLOW_WINDOW && (
        <div 
            className="absolute z-40 animate-pulse cursor-pointer left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            onClick={() => handleAction(PlayerAction.ATTACK)}
        >
             <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,1)] border-4 border-white">
                 <div className="w-3 h-3 bg-white rounded-full"></div>
             </div>
        </div>
      )}
      
      {/* Action Logs */}
      <div className="absolute top-24 left-4 z-10 flex flex-col gap-1 opacity-70">
          {logs.map((log, i) => (
              <div key={log.timestamp} className={`text-xs font-bold ${log.type === 'success' ? 'text-yellow-400' : log.type === 'danger' ? 'text-red-400' : 'text-gray-400'}`}>
                  {log.message}
              </div>
          ))}
      </div>

    </div>
  );
};

export default App;
