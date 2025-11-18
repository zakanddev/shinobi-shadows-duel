export const GAME_CONFIG = {
  PLAYER_MAX_HP: 100,
  PLAYER_MAX_POSTURE: 100,
  ENEMY_MAX_HP: 200,
  ENEMY_MAX_POSTURE: 150,
  
  POSTURE_RECOVERY_RATE: 0.2, // Per tick
  PARRY_WINDOW_MS: 250, // Time window for a perfect parry
  
  DAMAGE: {
    LIGHT_ATTACK: 10,
    HEAVY_ATTACK: 20,
    CHIP_DAMAGE: 2, // Damage taken when blocking instead of parrying
  },
  
  POSTURE_DAMAGE: {
    ATTACK_ON_BLOCK: 10, // Posture dmg to blocker
    PERFECT_PARRY: 30, // Posture dmg to attacker on parry
    HIT: 5, // Posture dmg to victim on direct hit
  },

  TIMING: {
    WINDUP_NORMAL: 800,
    WINDUP_PERILOUS: 1200,
    ATTACK_DURATION: 300,
    RECOVERY_HIT: 1000,
    RECOVERY_PARRIED: 1500,
  }
};

export const BOSS_NAMES = [
  "General Tenzen",
  "Seven Spears",
  "Owl Father",
  "Sword Saint",
  "Corrupted Monk"
];