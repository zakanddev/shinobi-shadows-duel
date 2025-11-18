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
import { GAME_CONFIG, BOSS_NAMES } from './constants';

// Initial states
const initialPlayer: EntityStats = {
  hp: GAME_CONFIG.PLAYER_MAX_HP,
  maxHp: GAME_CONFIG.PLAYER_MAX_HP,
  posture: 0,
  maxPosture: GAME_CONFIG.PLAYER_MAX_POSTURE,
};

const initialEnemy: EntityStats = {
  hp: GAME_CONFIG.ENEMY_MAX_HP,
  maxHp: GAME_CONFIG.ENEMY_MAX_HP,
  posture: 0,
  maxPosture: GAME_CONFIG.ENEMY_MAX_POSTURE,
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
  const [bossName, setBossName] = useState(BOSS_NAMES[0]);
  const [advice, setAdvice] = useState<string>("");
  const [deathCount, setDeathCount] = useState(0);
  const [lastDeathReason, setLastDeathReason] = useState("Hesitation");

  // --- Refs for Logic (Avoid closure staleness) ---
  const playerRef = useRef(player);
  const enemyRef = useRef(enemy);
  const stateRef = useRef(combatState);
  const attackStartRef = useRef<number>(0);
  const blockStartRef = useRef<number>(0);
  const isBlockingRef = useRef(false);

  // Sync refs
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { enemyRef.current = enemy; }, [enemy]);
  useEffect(() => { stateRef.current = combatState; }, [combatState]);

  // --- Audio (Simulated) ---
  const playSound = (type: 'CLASH' | 'HIT' | 'DEATHBLOW' | 'PERILOUS') => {
    // In a real app, use AudioContext. For this, we just log or rely on visual cues.
    // Adding visual shake based on sound type
    if (type === 'HIT') {
        document.body.classList.add('flash-red');
        setTimeout(() => document.body.classList.remove('flash-red'), 500);
    }
    if (type === 'CLASH') {
        // Vibration for mobile
        if (navigator.vibrate) navigator.vibrate(50);
    }
    if (type === 'PERILOUS') {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  // --- Game Logic Helpers ---

  const addLog = (msg: string, type: GameLog['type'] = 'info') => {
    setLogs(prev => [{ message: msg, type, timestamp: Date.now() }, ...prev].slice(0, 3));
  };

  const resetGame = async () => {
    const randomBoss = BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)];
    setBossName(randomBoss);
    
    // Reset stats
    setPlayer(initialPlayer);
    setEnemy(initialEnemy);
    setCombatState(CombatState.IDLE);
    setShowDeathScreen(false);
    setOverlayMessage('');
    setSubMessage('');
    setAdvice('');
    
    const taunt = await getBossTaunt(randomBoss);
    addLog(`${randomBoss}: "${taunt}"`, 'system');
  };

  const handlePlayerDeath = async (reason: string) => {
    setCombatState(CombatState.DEFEAT);
    setShowDeathScreen(true);
    setDeathCount(p => p + 1);
    setLastDeathReason(reason);
    
    // Fetch Gemini advice
    const adviceText = await getCombatAdvice(0, Math.round((enemyRef.current.hp / enemyRef.current.maxHp) * 100), deathCount + 1, reason);
    setAdvice(adviceText);
  };

  const handleVictory = () => {
    setCombatState(CombatState.VICTORY);
    setOverlayMessage('SHINOBI EXECUTION');
    setSubMessage('Immortality Severed');
  };

  // --- Combat Loop ---

  // AI Decision Loop
  useEffect(() => {
    if (combatState !== CombatState.IDLE) return;

    const timeout = setTimeout(() => {
        // Enemy decides to attack
        const roll = Math.random();
        let type = AttackType.NORMAL;
        let windupTime = GAME_CONFIG.TIMING.WINDUP_NORMAL;

        if (roll > 0.7) {
            type = roll > 0.85 ? AttackType.PERILOUS_SWEEP : AttackType.PERILOUS_THRUST;
            windupTime = GAME_CONFIG.TIMING.WINDUP_PERILOUS;
            playSound('PERILOUS');
        }

        setCurrentAttackType(type);
        setCombatState(CombatState.ENEMY_WINDUP);
        attackStartRef.current = Date.now() + windupTime;

        // Schedule the actual hit
        setTimeout(() => {
            if (stateRef.current === CombatState.ENEMY_WINDUP) {
                executeEnemyAttack(type);
            }
        }, windupTime);

    }, 1000 + Math.random() * 2000); // Random delay 1-3s

    return () => clearTimeout(timeout);
  }, [combatState]);

  // Posture Recovery Tick
  useEffect(() => {
    const interval = setInterval(() => {
        if (combatState === CombatState.VICTORY || combatState === CombatState.DEFEAT) return;

        setPlayer(p => ({
            ...p,
            posture: Math.max(0, p.posture - (isBlockingRef.current ? GAME_CONFIG.POSTURE_RECOVERY_RATE * 2 : GAME_CONFIG.POSTURE_RECOVERY_RATE))
        }));
        setEnemy(e => ({
            ...e,
            posture: Math.max(0, e.posture - GAME_CONFIG.POSTURE_RECOVERY_RATE)
        }));
    }, 100);
    return () => clearInterval(interval);
  }, [combatState]);

  // --- Action Resolvers ---

  const executeEnemyAttack = (type: AttackType) => {
    setCombatState(CombatState.ENEMY_ATTACKING);
    
    // Determine hit result instantly based on current inputs
    // We allow a small window after this function fires for "late" parries via the input handler,
    // but for simplicity, we check state immediately after a short frame delay.
    
    setTimeout(() => {
       if (stateRef.current !== CombatState.ENEMY_ATTACKING) return; // Already interrupted

       // Check player defense
       const now = Date.now();
       const blockDuration = now - blockStartRef.current;
       const isBlocking = isBlockingRef.current;
       
       // Logic
       let damage = 0;
       let postureDmg = 0;
       let hit = false;
       let msg = "";

       if (type === AttackType.NORMAL) {
           if (isBlocking) {
               if (blockDuration < GAME_CONFIG.PARRY_WINDOW_MS) {
                   // PERFECT PARRY
                   setEnemy(e => {
                       const newPosture = e.posture + GAME_CONFIG.POSTURE_DAMAGE.PERFECT_PARRY;
                       if (newPosture >= e.maxPosture) {
                           // Stagger enemy logic could go here
                       }
                       return { ...e, posture: newPosture };
                   });
                   setPlayerActionEffect('PARRY');
                   playSound('CLASH');
                   addLog("Perfect Deflect!", 'success');
               } else {
                   // REGULAR BLOCK
                   setPlayer(p => ({ ...p, posture: p.posture + GAME_CONFIG.POSTURE_DAMAGE.ATTACK_ON_BLOCK }));
                   setPlayerActionEffect('BLOCK');
                   addLog("Blocked", 'info');
               }
           } else {
               // HIT
               damage = GAME_CONFIG.DAMAGE.LIGHT_ATTACK;
               hit = true;
               msg = "Hit!";
           }
       } else if (type === AttackType.PERILOUS_SWEEP || type === AttackType.PERILOUS_THRUST) {
           // Cannot block perilous
           damage = GAME_CONFIG.DAMAGE.HEAVY_ATTACK;
           hit = true;
           msg = "Perilous Hit!";
       }

       if (hit) {
           setIsPlayerHit(true);
           setTimeout(() => setIsPlayerHit(false), 300);
           playSound('HIT');
           setPlayer(p => ({ ...p, hp: p.hp - damage, posture: p.posture + GAME_CONFIG.POSTURE_DAMAGE.HIT }));
           addLog(msg, 'danger');
       }

       // Check Death
       if (playerRef.current.hp <= 0 || playerRef.current.posture >= playerRef.current.maxPosture) {
           handlePlayerDeath(hit ? "Slain in battle" : "Posture broken");
       } else {
           // Return to Neutral
           setCombatState(CombatState.ENEMY_RECOVERING);
           setTimeout(() => setCombatState(CombatState.IDLE), GAME_CONFIG.TIMING.RECOVERY_HIT);
       }

    }, GAME_CONFIG.TIMING.ATTACK_DURATION);
  };

  // --- Input Handlers ---

  const handleAction = useCallback((action: PlayerAction) => {
    if (combatState === CombatState.DEFEAT || combatState === CombatState.VICTORY) return;

    if (action === PlayerAction.BLOCK) {
        isBlockingRef.current = true;
        blockStartRef.current = Date.now();
        
        // Defensive check specifically for active frames
        if (combatState === CombatState.ENEMY_ATTACKING) {
            // Trigger immediate parry check if timed right
             // (Logic handled in executeEnemyAttack mostly, but we can interrupt here for feel)
        }
    }

    if (action === PlayerAction.ATTACK) {
        // Only attack if enemy is IDLE or RECOVERING
        if (combatState === CombatState.IDLE || combatState === CombatState.ENEMY_RECOVERING) {
            setEnemy(e => ({ ...e, hp: e.hp - GAME_CONFIG.DAMAGE.LIGHT_ATTACK, posture: e.posture + 5 }));
            addLog("Slash!", 'info');
            
            // Check Victory
            if (enemyRef.current.hp <= 0) {
                // Enable Deathblow
                setCombatState(CombatState.DEATHBLOW_WINDOW);
            }
        } else if (combatState === CombatState.DEATHBLOW_WINDOW) {
            handleVictory();
        } else {
            // Attacking during enemy windup is risky -> chip damage
             setEnemy(e => ({ ...e, hp: e.hp - 2 }));
        }
    }

    if (action === PlayerAction.DODGE) {
        if (combatState === CombatState.ENEMY_ATTACKING || combatState === CombatState.ENEMY_WINDUP) {
            if (currentAttackType !== AttackType.NORMAL) {
                // Successful dodge of perilous
                addLog("Mikiri Counter!", 'success');
                setEnemy(e => ({ ...e, posture: e.posture + 40 })); // Huge posture dmg
                setCombatState(CombatState.ENEMY_RECOVERING);
                setTimeout(() => setCombatState(CombatState.IDLE), 1000);
            } else {
                // Dodged normal attack
                addLog("Dodged", 'info');
            }
        }
    }
  }, [combatState, currentAttackType]);

  const handleRelease = useCallback((action: PlayerAction) => {
      if (action === PlayerAction.BLOCK) {
          isBlockingRef.current = false;
      }
  }, []);


  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden select-none">
      
      {/* Game World */}
      <GameScene 
        combatState={combatState} 
        attackType={currentAttackType}
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
            <p className="text-xl text-gray-400 mb-8 font-serif">DEATH</p>
            
            <div className="mb-8 max-w-xs text-center">
                <p className="text-amber-500/80 italic font-serif text-lg">"{advice || '...'}"</p>
                <p className="text-xs text-gray-600 mt-2">- The Sculptor</p>
            </div>

            <button 
                onClick={resetGame}
                className="px-8 py-3 border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-serif tracking-widest uppercase"
            >
                Resurrect
            </button>
        </div>
      )}

      {/* Victory Screen */}
      {combatState === CombatState.VICTORY && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
            <div className="w-64 h-64 rounded-full bg-gradient-to-t from-red-900/50 to-transparent absolute animate-ping"></div>
            <h1 className="text-5xl text-center font-black text-yellow-500 mb-2 tracking-widest drop-shadow-lg scale-150 transition-transform duration-1000 font-serif">
                {overlayMessage}
            </h1>
            <p className="text-xl text-gray-300 tracking-[0.5em] uppercase mt-4 animate-pulse">
                {subMessage}
            </p>
            <button 
                onClick={resetGame}
                className="mt-12 px-8 py-3 bg-red-900/50 hover:bg-red-800 text-white border border-red-700 rounded transition-colors font-serif tracking-widest"
            >
                NEXT CHALLENGE
            </button>
        </div>
      )}

      {/* Deathblow Prompt */}
      {combatState === CombatState.DEATHBLOW_WINDOW && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
             <div className="w-24 h-24 bg-red-600 rounded-full animate-ping opacity-75"></div>
             <div className="absolute top-0 left-0 w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.8)]">
                 <div className="w-4 h-4 bg-white rounded-full"></div>
             </div>
        </div>
      )}
      
      {/* Action Logs (Small) */}
      <div className="absolute top-20 left-4 z-10 flex flex-col gap-1 opacity-70">
          {logs.map((log, i) => (
              <div key={log.timestamp} className={`text-xs font-bold ${
                  log.type === 'success' ? 'text-yellow-400' : 
                  log.type === 'danger' ? 'text-red-400' : 'text-gray-400'
              }`}>
                  {log.message}
              </div>
          ))}
      </div>

    </div>
  );
};

export default App;