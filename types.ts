export enum CombatState {
  IDLE = 'IDLE',
  ENEMY_WINDUP = 'ENEMY_WINDUP', // Enemy is preparing to hit
  ENEMY_ATTACKING = 'ENEMY_ATTACKING', // The active hit window
  PLAYER_RECOVERING = 'PLAYER_RECOVERING', // Player staggered
  ENEMY_RECOVERING = 'ENEMY_RECOVERING', // Enemy staggered
  DEATHBLOW_WINDOW = 'DEATHBLOW_WINDOW', // Enemy broken
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
}

export enum AttackType {
  NORMAL = 'NORMAL', // Can be blocked or parried
  PERILOUS_SWEEP = 'PERILOUS_SWEEP', // Must jump
  PERILOUS_THRUST = 'PERILOUS_THRUST', // Must deflect perfectly
}

export enum PlayerAction {
  NONE = 'NONE',
  BLOCK = 'BLOCK',
  PARRY = 'PARRY',
  ATTACK = 'ATTACK',
  JUMP = 'JUMP',
}

export interface EntityStats {
  hp: number;
  maxHp: number;
  posture: number;
  maxPosture: number;
  state: 'IDLE' | 'ATTACK' | 'DEFLECT' | 'HIT' | 'DEAD' | 'JUMPING';
}

export interface GameLog {
  message: string;
  type: 'info' | 'danger' | 'success' | 'system';
  timestamp: number;
}