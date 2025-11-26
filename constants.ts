export const GAME_CONFIG = {
  PLAYER_MAX_HP: 100,
  PLAYER_MAX_POSTURE: 100,
  ENEMY_MAX_HP: 200,
  ENEMY_MAX_POSTURE: 150,
  
  POSTURE_RECOVERY_RATE: 0.1, // Per tick
  PARRY_WINDOW_MS: 200, // Tighter window
  
  DAMAGE: {
    LIGHT_ATTACK: 10,
    HEAVY_ATTACK: 25,
    CHIP_DAMAGE: 5, // Damage taken when blocking instead of parrying
  },
  
  POSTURE_DAMAGE: {
    ATTACK_ON_BLOCK: 15, // Posture dmg to blocker
    PERFECT_PARRY: 35, // Posture dmg to attacker on parry
    HIT: 10, // Posture dmg to victim on direct hit
    JUMP_COUNTER: 20, // Posture dmg when jumping over sweep
  },

  TIMING: {
    WINDUP_NORMAL: 600,
    WINDUP_PERILOUS: 1000,
    ATTACK_DURATION: 300,
    RECOVERY_HIT: 800,
    RECOVERY_PARRIED: 1200,
    JUMP_DURATION: 600,
  },
};

export const BOSS_NAMES = [
  "General Ironwood",
  "The Crimson Spear",
  "Ronin of the Mist",
  "Sword Saint Ashina (Echo)",
  "The Corrupted Guardian"
];