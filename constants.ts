import { MapSize, PowerUpType } from './types';

export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;

export const MAP_DIMENSIONS = {
  [MapSize.SMALL]: { width: 1600, height: 1200 }, // ~2 screens
  [MapSize.LARGE]: { width: 3200, height: 2400 }, // ~4 screens
};

export const PLAYER_RADIUS = 15; 
export const SNOWBALL_RADIUS = 5; 
export const TREE_RADIUS = 40; 
export const POWERUP_RADIUS = 20;

export const VENDING_MACHINE_SIZE = { width: 60, depth: 40, height: 80 };
export const VENDING_MACHINE_RADIUS = 25;

// Vending Machine Physics
export const VM_PHYSICS = {
  MASS: 3.0, 
  FRICTION: 0.99, 
  DAMAGE_THRESHOLD: 4.0, 
  COLLISION_DAMAGE: 30, 
};

export const CTF_STATS = {
  WIN_SCORE: 3,
  BASE_RADIUS: 100, // Zone to return flag
  FLAG_RADIUS: 20, // Collision to pick up
};

export const VEMAT_LOGO_URL = '../logo_vemat.png';
export const MUSIC_URL = 'https://assets.mixkit.co/music/preview/mixkit-christmas-village-148.mp3';

export const BASE_STATS = {
  MAX_SPEED: 6,
  ACCELERATION: 0.2,
  FRICTION: 0.96,
  TURN_SPEED: 0.08,
  SHOOT_COOLDOWN: 30, 
  SNOWBALL_SPEED: 12,
  SNOWBALL_LIFETIME: 1500, 
  MAX_HEALTH: 100,
  DAMAGE: 10,
};

export const PHYSICS = {
  GRAVITY: 0.6,
  JUMP_FORCE: 10,
};

export const BOMB_STATS = {
  TIMER: 8000, 
  RADIUS: 150,
  DAMAGE: 60,
  COOLDOWN: 60, 
  PACK_AMOUNT: 10,
};

export const POWERUP_DURATION = 8000; 

export const COLORS = {
  p1: '#ef4444', // red-500
  p2: '#3b82f6', // blue-500
  p3: '#22c55e', // green-500
  p4: '#eab308', // yellow-500
};

// Team Colors for CTF
export const TEAM_COLORS = {
  0: '#ef4444', // Red Team
  1: '#3b82f6', // Blue Team
};

export const CONTROLS = [
  // P1: WASD move, Space shoot, E bomb, Q jump
  { up: 'w', down: 's', left: 'a', right: 'd', shoot: ' ', dropBomb: 'e', jump: 'q' },
  // P2: Arrows move, Enter shoot, . bomb, / jump
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter', dropBomb: '.', jump: '/' }, 
  // P3: IJKL move, ; shoot, O bomb, U jump
  { up: 'i', down: 'k', left: 'j', right: 'l', shoot: ';', dropBomb: 'o', jump: 'u' }, 
  // P4: TFGH move, Y shoot, U bomb, R jump
  { up: 't', down: 'g', left: 'f', right: 'h', shoot: 'y', dropBomb: 'u', jump: 'r' }, 
];

export const POWERUP_CONFIG = {
  [PowerUpType.SPEED_BOOST]: { color: '#06b6d4', icon: '⚡' },
  [PowerUpType.RAPID_FIRE]: { color: '#f97316', icon: '🔥' },
  [PowerUpType.TRIPLE_SHOT]: { color: '#8b5cf6', icon: '🔱' },
  [PowerUpType.MEGA_DAMAGE]: { color: '#be123c', icon: '💪' },
  [PowerUpType.HEAL]: { color: '#10b981', icon: '❤️' },
  [PowerUpType.BOMB_PACK]: { color: '#1e293b', icon: '💣' },
  [PowerUpType.COFFEE]: { color: '#78350f', icon: '☕' },
};