
export const GAME_CONFIG = {
  PLAYER_MAX_HP: 100,
  PLAYER_MAX_POSTURE: 100,
  ENEMY_MAX_HP: 200,
  ENEMY_MAX_POSTURE: 120,
  
  POSTURE_RECOVERY_RATE: 0.1, // Faster recovery requires constant pressure
  PARRY_WINDOW_MS: 250, 
  
  ENEMY_DEFLECT_CHANCE: 0.7, // 70% chance to block when idle
  
  DAMAGE: {
    LIGHT_ATTACK: 10,
    HEAVY_ATTACK: 25,
    CHIP_DAMAGE: 5, 
  },
  
  POSTURE_DAMAGE: {
    // Player taking hits
    ATTACK_ON_BLOCK: 10,
    PERFECT_PARRY: 30, // Dealt to enemy when player parries
    HIT: 15,
    JUMP_COUNTER: 25, // Dealt to enemy on jump kick

    // Enemy taking hits
    ENEMY_BLOCK: 15, // Dealt to enemy when they block (High posture dmg)
    ENEMY_HIT: 5,    // Dealt to enemy when they get hit (Low posture dmg, high HP dmg)
  },

  TIMING: {
    // The "Telegraph" phase - raising the weapon
    WINDUP_BASE: 800, 
    WINDUP_FAST: 500,
    
    // The "Swing" phase - the active hurtbox duration
    ATTACK_DURATION: 400, 
    
    // Time between hits in a combo
    COMBO_DELAY: 600,
    
    RECOVERY_HIT: 800,
    RECOVERY_PARRIED: 1500,
    JUMP_DURATION: 700,
  },
};

export const BOSS_NAMES = [
  "General Ironwood",
  "The Crimson Spear",
  "Ronin of the Mist",
  "Sword Saint Ashina (Echo)",
  "The Corrupted Guardian"
];

// 0 = Normal, 1 = Sweep
export type AttackPattern = Array<'NORMAL' | 'DELAY' | 'SWEEP'>;

export const BOSS_PATTERNS: Record<number, AttackPattern[]> = {
  0: [['NORMAL'], ['NORMAL', 'DELAY', 'NORMAL']], // Level 1: Single hits or slow doubles
  1: [['NORMAL', 'NORMAL'], ['SWEEP']], // Level 2: Doubles or Sweeps
  2: [['NORMAL', 'NORMAL', 'NORMAL'], ['NORMAL', 'SWEEP']], // Level 3: Triples
  3: [['NORMAL', 'DELAY', 'SWEEP'], ['NORMAL', 'NORMAL', 'NORMAL']], // Level 4: Mixups
  4: [['NORMAL', 'NORMAL', 'NORMAL', 'NORMAL'], ['SWEEP', 'DELAY', 'SWEEP']], // Level 5: Relentless
};
