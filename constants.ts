
import { Theme } from './types';

export const GAME_CONFIG = {
  PLAYER_MAX_HP: 100,
  PLAYER_MAX_POSTURE: 100,
  ENEMY_MAX_HP: 200,
  ENEMY_MAX_POSTURE: 150, 
  
  POSTURE_RECOVERY_RATE: 0.15,
  PARRY_WINDOW_MS: 500,
  
  ENEMY_DEFLECT_CHANCE: 0.8,
  
  DAMAGE: {
    LIGHT_ATTACK: 10,
    HEAVY_ATTACK: 30,
    CHIP_DAMAGE: 5, 
  },
  
  POSTURE_DAMAGE: {
    ATTACK_ON_BLOCK: 10,
    PERFECT_PARRY: 35,
    HIT: 20,
    JUMP_COUNTER: 30,

    ENEMY_BLOCK: 10,
    ENEMY_HIT: 5,
  },

  TIMING: {
    WINDUP_BASE: 1200,
    WINDUP_FAST: 900,
    ATTACK_DURATION: 600,
    COMBO_DELAY: 700,
    RECOVERY_HIT: 800,
    RECOVERY_PARRIED: 2000,
    JUMP_DURATION: 800,
  },
};

export const THEME_DATA = {
  [Theme.SAMURAI]: {
    title: "Ronin: Spirit Duel",
    playerTitle: "Wolf",
    enemyTitlePrefix: "General",
    bossNames: ["General Ironwood", "The Crimson Spear", "Ronin of the Mist", "Sword Saint Ashina (Echo)", "The Corrupted Guardian"],
    colors: {
      bg: "bg-slate-900",
      playerMain: "bg-slate-700",
      playerAccent: "bg-blue-900", // Scarf
      enemyMain: "bg-red-800",
      enemyAccent: "bg-red-900",
      weapon: "bg-gray-200",
    }
  },
  [Theme.MEDIEVAL]: {
    title: "Iron & Honor",
    playerTitle: "Squire",
    enemyTitlePrefix: "Sir",
    bossNames: ["Sir Galahad", "The Black Knight", "Gregor the Mountain", "Kingsguard Jaime", "The Dark Soul"],
    colors: {
      bg: "bg-stone-900",
      playerMain: "bg-slate-300", // Silver armor
      playerAccent: "bg-red-700", // Cape
      enemyMain: "bg-neutral-800", // Black armor
      enemyAccent: "bg-yellow-600", // Gold trim
      weapon: "bg-slate-100",
    }
  },
  [Theme.INDIAN]: {
    title: "Empire of Swords",
    playerTitle: "Sipahi",
    enemyTitlePrefix: "Raja",
    bossNames: ["Raja Singh", "General Akbar", "The Tiger of Mysore", "Warrior Aurangzeb", "The Eternal Rajput"],
    colors: {
      bg: "bg-amber-950",
      playerMain: "bg-emerald-700", // Green Sherwani
      playerAccent: "bg-orange-500", // Turban
      enemyMain: "bg-orange-700",
      enemyAccent: "bg-yellow-500",
      weapon: "bg-slate-200",
    }
  },
  [Theme.AZTEC]: {
    title: "Obsidian Sun",
    playerTitle: "Jaguar",
    enemyTitlePrefix: "Eagle",
    bossNames: ["Cuauhtémoc", "The Sun Eater", "Jaguar Claw", "Blood Priest", "Quetzalcoatl's Chosen"],
    colors: {
      bg: "bg-teal-950",
      playerMain: "bg-yellow-700", // Skin/Leopard
      playerAccent: "bg-teal-500", // Feathers
      enemyMain: "bg-red-700",
      enemyAccent: "bg-green-600",
      weapon: "bg-stone-800", // Obsidian
    }
  },
  [Theme.AFRICAN]: {
    title: "Savanna Warlords",
    playerTitle: "Warrior",
    enemyTitlePrefix: "Chief",
    bossNames: ["Shaka", "The Lion's Tooth", "Impi Commander", "The Thunder Spear", "King Cetshwayo"],
    colors: {
      bg: "bg-orange-950",
      playerMain: "bg-stone-700", // Dark skin/clothing
      playerAccent: "bg-amber-600", // Pelts
      enemyMain: "bg-stone-800",
      enemyAccent: "bg-white", // Face paint/Shield
      weapon: "bg-stone-300",
    }
  }
};

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
