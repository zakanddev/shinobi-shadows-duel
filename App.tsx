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
  const [bossName, setBossName] = useState(BOSS_NAMES[0]);
  const [advice, setAdvice] = useState<string>("");
  const [deathCount, setDeathCount] = useState(0);

  // --- Refs for Logic ---
  const playerRef = useRef(player);
  const enemyRef = useRef(enemy);
  const stateRef = useRef(combatState);
  const blockStartRef = useRef<number>(0);
  const isBlockingRef = useRef(false);

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
    setLogs(prev => [{ message: msg, type, timestamp: Date.now() }, ...prev].slice(0, 3));
  };

  const resetGame = async () => {
    const randomBoss = BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)];
    setBossName(randomBoss);
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
    setSubMessage('Spirit Released');
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

    }, 1000 / 60); // 60 FPS update
    return () => clearInterval(loop);
  }, [combatState]);

  // --- Enemy AI Attack Loop ---
  useEffect(() => {
    if (combatState === CombatState.VICTORY || combatState === CombatState.DEFEAT) return;

    const checkAttack = setInterval(() => {
        if (combatState === CombatState.IDLE) {
            // Chance to attack depending on how aggressive we want the AI
            if (Math.random() > 0.4) {
                initiateEnemyAttack();
            }
        }
    }, 1000);

    return () => clearInterval(checkAttack);
  }, [combatState]);


  const initiateEnemyAttack = () => {
        const roll = Math.random();
        let type = AttackType.NORMAL;
        let windupTime = GAME_CONFIG.TIMING.WINDUP_NORMAL;

        if (roll > 0.7) {
            // Perilous Attack
            // 50/50 split between Sweep and Thrust for variety if implemented later, 
            // but focused on Sweep for Jump mechanic now.
            type = AttackType.PERILOUS_SWEEP; 
            windupTime = GAME_CONFIG.TIMING.WINDUP_PERILOUS;
            playSound('PERILOUS');
        }

        setCurrentAttackType(type);
        setCombatState(CombatState.ENEMY_WINDUP);
        // Maybe a windup pose
        setEnemy(e => ({ ...e, state: 'IDLE' })); 

        setTimeout(() => {
            // If still winding up (game didn't end/pause), execute
            if (stateRef.current === CombatState.ENEMY_WINDUP) {
                executeEnemyAttack(type);
            }
        }, windupTime);
  };

  // --- Resolve Attack Impact ---
  const executeEnemyAttack = (type: AttackType) => {
    setCombatState(CombatState.ENEMY_ATTACKING);
    setEnemy(e => ({ ...e, state: 'ATTACK' }));
    
    setTimeout(() => {
       if (stateRef.current !== CombatState.ENEMY_ATTACKING) return;

       const now = Date.now();
       const blockDuration = now - blockStartRef.current;
       const isBlocking = isBlockingRef.current;
       const isJumping = playerRef.current.state === 'JUMPING';
       
       let damage = 0;
       let hit = false;
       let msg = "";

       // LOGIC TREE
       
       if (type === AttackType.PERILOUS_SWEEP) {
           if (isJumping) {
               // SUCCESSFUL JUMP COUNTER
               setEnemy(e => ({ 
                   ...e, 
                   posture: e.posture + GAME_CONFIG.POSTURE_DAMAGE.JUMP_COUNTER 
               }));
               addLog("Jump Counter!", 'success');
               // Player lands a hit automatically or just avoids damage? Let's just avoid damage + posture dmg
           } else {
               // Failed to jump
               hit = true;
               damage = GAME_CONFIG.DAMAGE.HEAVY_ATTACK;
               msg = "Swept!";
           }
       } 
       else if (type === AttackType.NORMAL) {
           if (isJumping) {
               // Can't jump normal attacks, you get hit in air
               hit = true;
               damage = GAME_CONFIG.DAMAGE.LIGHT_ATTACK;
               msg = "Air Hit!";
           }
           else if (isBlocking) {
               if (blockDuration < GAME_CONFIG.PARRY_WINDOW_MS) {
                   // PERFECT PARRY
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
                   // BLOCK
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

       // Check Death
       if (playerRef.current.hp <= 0 || playerRef.current.posture >= playerRef.current.maxPosture) {
           handlePlayerDeath(hit ? "Cut down" : "Posture broken");
       } else {
           setCombatState(CombatState.ENEMY_RECOVERING);
           setTimeout(() => {
               setCombatState(CombatState.IDLE);
               setEnemy(e => ({...e, state: 'IDLE'}));
           }, GAME_CONFIG.TIMING.RECOVERY_HIT);
       }

    }, GAME_CONFIG.TIMING.ATTACK_DURATION);
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
        setPlayerActionEffect('ATTACK'); // Visual effect
        setTimeout(() => setPlayerActionEffect(null), 200);
        setTimeout(() => setPlayer(p => ({ ...p, state: 'IDLE' })), 200);

        // Deathblow Check
        if (combatState === CombatState.DEATHBLOW_WINDOW) {
             handleVictory();
             return;
        }

        // Normal Attack Logic
        // Can only hit if enemy is IDLE, RECOVERING, or WINDUP
        // Attacking into an ATTACK trades or gets stuffed usually, simplified here:
        if (combatState === CombatState.IDLE || combatState === CombatState.ENEMY_RECOVERING || combatState === CombatState.ENEMY_WINDUP) {
            setEnemy(e => ({ 
                ...e, 
                hp: e.hp - GAME_CONFIG.DAMAGE.LIGHT_ATTACK, 
                posture: e.posture + 5, 
                state: 'HIT' 
            }));
            setTimeout(() => setEnemy(e => ({ ...e, state: 'IDLE' })), 200);
            addLog("Slash!", 'info');
            
            if (enemyRef.current.hp <= 0) {
                setCombatState(CombatState.DEATHBLOW_WINDOW);
                setEnemy(e => ({...e, posture: e.maxPosture}));
            }
        } else {
            // Enemy Blocking/Hyperarmor during attack
            setEnemy(e => ({ ...e, hp: e.hp - 2 })); // Chip damage
            addLog("Enemy Guarding", 'info');
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
            <button onClick={resetGame} className="mt-12 px-8 py-3 bg-red-900/50 hover:bg-red-800 text-white border border-red-700 rounded transition-colors font-serif tracking-widest">
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