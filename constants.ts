
export const GAME_CONFIG = {
  PLAYER_MAX_HP: 100,
  PLAYER_MAX_POSTURE: 100,
  ENEMY_MAX_HP: 200,
  ENEMY_MAX_POSTURE: 150, // Increased slightly
  
  POSTURE_RECOVERY_RATE: 0.15, // Slightly faster recovery to force aggression
  PARRY_WINDOW_MS: 500, // Generous 0.5s window
  
  ENEMY_DEFLECT_CHANCE: 0.8, // 80% chance to block/deflect when idle
  
  DAMAGE: {
    LIGHT_ATTACK: 10,
    HEAVY_ATTACK: 30,
    CHIP_DAMAGE: 5, 
  },
  
  POSTURE_DAMAGE: {
    // Player taking hits
    ATTACK_ON_BLOCK: 10,
    PERFECT_PARRY: 35, // High reward for the 0.5s parry
    HIT: 20,
    JUMP_COUNTER: 30,

    // Enemy taking hits
    ENEMY_BLOCK: 10, // Chip posture damage
    ENEMY_HIT: 5,    // HP damage focus
  },

  TIMING: {
    // The "Telegraph" phase - raising the weapon
    WINDUP_BASE: 1200, // 1.2 seconds to see it coming
    WINDUP_FAST: 900,  // Even fast attacks are readable
    
    // The "Swing" phase - the active hurtbox duration
    ATTACK_DURATION: 600, // 0.6 seconds for the weapon to travel
    
    // Time between hits in a combo
    COMBO_DELAY: 700,
    
    RECOVERY_HIT: 800,
    RECOVERY_PARRIED: 2000, // Long punish window
    JUMP_DURATION: 800,
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
  0: [
    ['NORMAL', 'DELAY', 'NORMAL'], 
    ['NORMAL', 'NORMAL']
  ], 
  1: [
    ['NORMAL', 'NORMAL', 'DELAY', 'NORMAL'], 
    ['SWEEP', 'DELAY', 'NORMAL']
  ], 
  2: [
    ['NORMAL', 'NORMAL', 'NORMAL', 'SWEEP'], 
    ['SWEEP', 'NORMAL', 'SWEEP']
  ], 
  3: [
    ['NORMAL', 'DELAY', 'SWEEP', 'NORMAL', 'NORMAL'], 
    ['NORMAL', 'NORMAL', 'NORMAL', 'NORMAL']
  ], 
  4: [
    ['NORMAL', 'NORMAL', 'SWEEP', 'DELAY', 'NORMAL', 'NORMAL'], 
    ['SWEEP', 'SWEEP', 'DELAY', 'SWEEP']
  ], 
};
