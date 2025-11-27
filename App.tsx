
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
  GameLog 
} from './types';
import { GAME_CONFIG, BOSS_NAMES, BOSS_PATTERNS, AttackPattern } from './constants';

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
  // --- State ---
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
  const [bossName, setBossName] = useState(BOSS_NAMES[0]);
  const [advice, setAdvice] = useState<string>("");
  const [deathCount, setDeathCount] = useState(0);

  // --- Refs for Logic ---
  const playerRef = useRef(player);
  const enemyRef = useRef(enemy);
  const stateRef = useRef(combatState);
  const blockStartRef = useRef<number>(0);
  const isBlockingRef = useRef(false);
  const isProcessingComboRef = useRef(false);

  // Sync refs
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { enemyRef.current = enemy; }, [enemy]);
  useEffect(() => { stateRef.current = combatState; }, [combatState]);

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

  const resetGame = async () => {
    setPlayer(initialPlayer);
    setEnemy(initialEnemy);
    setCombatState(CombatState.IDLE);
    setShowDeathScreen(false);
    setOverlayMessage('');
    setSubMessage('');
    setAdvice('');
    isProcessingComboRef.current = false;
    
    // Taunt
    const taunt = await getBossTaunt(bossName);
    addLog(`${bossName}: "${taunt}"`, 'system');
  };

  const nextBoss = () => {
    const nextIdx = (bossIndex + 1) % BOSS_NAMES.length;
    setBossIndex(nextIdx);
    setBossName(BOSS_NAMES[nextIdx]);
    
    // Increase enemy stats slightly
    initialEnemy.maxHp += 50;
    initialEnemy.maxPosture += 20;
    
    resetGame();
  };

  const handlePlayerDeath = async (reason: string) => {
    setCombatState(CombatState.DEFEAT);
    setPlayer(p => ({ ...p, state: 'DEAD' }));
    setShowDeathScreen(true);
    setDeathCount(p => p + 1);
    const adviceText = await getCombatAdvice(0, Math.round((enemyRef.current.hp / enemyRef.current.maxHp) * 100), deathCount + 1, reason);
    setAdvice(adviceText);
  };

  const handleVictory = () => {
    setCombatState(CombatState.VICTORY);
    setEnemy(e => ({ ...e, state: 'DEAD' }));
    setOverlayMessage('ENEMY DEFEATED');
    setSubMessage('Shinobi Execution');
  };

  // --- Game Loop (Posture & Recovery) ---
  useEffect(() => {
    const loop = setInterval(() => {
        if (combatState === CombatState.VICTORY || combatState === CombatState.DEFEAT) return;

        // Posture Recovery
        setPlayer(p => ({
            ...p,
            posture: Math.max(0, p.posture - (isBlockingRef.current ? GAME_CONFIG.POSTURE_RECOVERY_RATE * 2 : GAME_CONFIG.POSTURE_RECOVERY_RATE))
        }));
        setEnemy(e => ({
            ...e,
            posture: Math.max(0, e.posture - GAME_CONFIG.POSTURE_RECOVERY_RATE)
        }));

    }, 1000 / 60);
    return () => clearInterval(loop);
  }, [combatState]);

  // --- Enemy AI & Combo System ---
  useEffect(() => {
    if (combatState === CombatState.VICTORY || combatState === CombatState.DEFEAT) return;

    const checkAttack = setInterval(() => {
        if (combatState === CombatState.IDLE && !isProcessingComboRef.current) {
            // Chance to attack depending on how aggressive we want the AI
            if (Math.random() > 0.4) {
                startEnemyCombo();
            }
        }
    }, 1000);

    return () => clearInterval(checkAttack);
  }, [combatState, bossIndex]);


  const startEnemyCombo = async () => {
      isProcessingComboRef.current = true;
      
      // Select a pattern based on boss level
      // Clamp bossIndex to available patterns in case array out of bounds
      const level = Math.min(bossIndex, 4);
      const patterns = BOSS_PATTERNS[level] || BOSS_PATTERNS[0];
      const pattern: AttackPattern = patterns[Math.floor(Math.random() * patterns.length)];

      for (let i = 0; i < pattern.length; i++) {
          const move = pattern[i];

          // Check if game ended mid-combo
          if (stateRef.current === CombatState.VICTORY || stateRef.current === CombatState.DEFEAT) break;

          if (move === 'DELAY') {
              // Pause between hits
              await new Promise(r => setTimeout(r, GAME_CONFIG.TIMING.COMBO_DELAY));
              continue;
          }

          const isSweep = move === 'SWEEP';
          await executeAttackStep(isSweep ? AttackType.PERILOUS_SWEEP : AttackType.NORMAL);
          
          // Small breathing room between combo hits if not explicit delay
          await new Promise(r => setTimeout(r, 200));
      }

      setCombatState(CombatState.IDLE);
      setEnemy(e => ({ ...e, state: 'IDLE' }));
      isProcessingComboRef.current = false;
  };

  const executeAttackStep = (type: AttackType): Promise<void> => {
      return new Promise((resolve) => {
          // 1. TELEGRAPH (Windup)
          setCurrentAttackType(type);
          setCombatState(CombatState.ENEMY_WINDUP);
          setEnemy(e => ({ ...e, state: 'IDLE' })); // Visual state handled by CombatState.WINDUP in GameScene
          
          if (type === AttackType.PERILOUS_SWEEP) playSound('PERILOUS');

          // The windup duration depends on boss level (higher level = slightly faster windups)
          const speedMod = Math.min(bossIndex * 50, 300); 
          const windupTime = Math.max(GAME_CONFIG.TIMING.WINDUP_FAST, GAME_CONFIG.TIMING.WINDUP_BASE - speedMod);

          setTimeout(() => {
              if (stateRef.current === CombatState.DEFEAT) return resolve();
              // If enemy was posture broken during windup, stop.
              if (stateRef.current === CombatState.DEATHBLOW_WINDOW) return resolve();

              // 2. STRIKE (Active Frames)
              setCombatState(CombatState.ENEMY_ATTACKING);
              setEnemy(e => ({ ...e, state: 'ATTACK' })); // Triggers the swing animation

              setTimeout(() => {
                 resolveHit(type);
                 
                 // 3. RECOVERY
                 setTimeout(() => {
                    resolve();
                 }, GAME_CONFIG.TIMING.ATTACK_DURATION);
                 
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
               // Parry window is generous but requires button press relatively recently
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
       
       // Check for Deathblow trigger from posture break on Jump Counter/Parry
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
       playSound('PERILOUS'); // Re-using heavy sound for impact
  };

  // --- Input Handlers ---
  const handleAction = useCallback((action: PlayerAction) => {
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

        // --- ATTACK LOGIC ---
        // 1. Counter Hit (During Windup or Recovery) - Always Hits
        if (combatState === CombatState.ENEMY_WINDUP || combatState === CombatState.ENEMY_RECOVERING) {
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
        // 2. Neutral Game - Chance to Block
        else if (combatState === CombatState.IDLE) {
            // Random chance to block based on config
            const willBlock = Math.random() < GAME_CONFIG.ENEMY_DEFLECT_CHANCE;
            
            if (willBlock) {
                // Enemy Blocks
                setEnemy(e => ({
                    ...e,
                    posture: e.posture + GAME_CONFIG.POSTURE_DAMAGE.ENEMY_BLOCK,
                    state: 'DEFLECT'
                }));
                setTimeout(() => setEnemy(e => ({...e, state: 'IDLE'})), 200);
                addLog("Enemy Deflected", 'info');
                playSound('CLASH');
            } else {
                // Clean Hit
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
        } else {
            // Enemy Attacking (Trading or invulnerable frames)
             addLog("Clash!", 'info');
        }
        
        // Check Deathblow Condition (HP <= 0 OR Posture Break)
        if (enemyRef.current.hp <= 0 || enemyRef.current.posture >= enemyRef.current.maxPosture) {
            triggerDeathblowWindow();
        }
    }
  }, [combatState]);

  const handleRelease = useCallback((action: PlayerAction) => {
      if (action === PlayerAction.BLOCK) {
          isBlockingRef.current = false;
          setPlayer(p => ({ ...p, state: 'IDLE' }));
      }
  }, []);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden select-none touch-none">
      
      {/* 2D Game World */}
      <GameScene 
        combatState={combatState} 
        attackType={currentAttackType}
        player={player}
        enemy={enemy}
        playerActionEffect={playerActionEffect}
        isPlayerHit={isPlayerHit}
      />

      {/* UI Overlay */}
      <CombatUI player={player} enemy={enemy} enemyName={bossName} />

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
            <button onClick={resetGame} className="px-8 py-3 border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-serif tracking-widest uppercase">
                Rise Again
            </button>
        </div>
      )}

      {/* Victory Screen */}
      {combatState === CombatState.VICTORY && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
            <h1 className="text-5xl text-center font-black text-yellow-500 mb-2 tracking-widest drop-shadow-lg font-serif">{overlayMessage}</h1>
            <p className="text-gray-400 mb-8 font-serif">{subMessage}</p>
            <button onClick={nextBoss} className="mt-4 px-8 py-3 bg-red-900/50 hover:bg-red-800 text-white border border-red-700 rounded transition-colors font-serif tracking-widest">
                NEXT DUEL
            </button>
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
