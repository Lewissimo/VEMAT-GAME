import { MapSize, PowerUpType } from './types';

export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;

export const MAP_DIMENSIONS = {
  [MapSize.SMALL]: { width: 1600, height: 1200 }, // ~2 screens
  [MapSize.LARGE]: { width: 3200, height: 2400 }, // ~4 screens
};

export const PLAYER_RADIUS = 15; // Reduced from 25 for tighter handling
export const SNOWBALL_RADIUS = 5; // Reduced from 8
export const TREE_RADIUS = 40; // Visual radius stays same
export const POWERUP_RADIUS = 20;

export const VENDING_MACHINE_SIZE = { width: 60, depth: 40, height: 80 };
// Simplified radius for collision (avg of width/depth)
export const VENDING_MACHINE_RADIUS = 25; // Reduced from 40 to allow corner clipping

// Vending Machine Physics
export const VM_PHYSICS = {
  MASS: 3.0, // Heavier than player
  FRICTION: 0.99, // Almost 1.0 means very little friction (slides very far)
  DAMAGE_THRESHOLD: 4.0, // Speed required to deal damage
  COLLISION_DAMAGE: 30, // Damage dealt when hitting player at speed
};

// Placeholder URL - jeśli masz konkretny plik, podmień link tutaj
export const VEMAT_LOGO_URL = '../vemat_logo.jpeg';

// Royalty-free Christmas music
export const MUSIC_URL = 'https://assets.mixkit.co/music/preview/mixkit-christmas-village-148.mp3';

export const BASE_STATS = {
  MAX_SPEED: 6,
  ACCELERATION: 0.2,
  FRICTION: 0.96,
  TURN_SPEED: 0.08,
  SHOOT_COOLDOWN: 30, // frames
  SNOWBALL_SPEED: 12,
  SNOWBALL_LIFETIME: 1500, // ms
  MAX_HEALTH: 100,
  DAMAGE: 10,
};

export const PHYSICS = {
  GRAVITY: 0.6,
  JUMP_FORCE: 10,
};

export const BOMB_STATS = {
  TIMER: 8000, // ms
  RADIUS: 150,
  DAMAGE: 60,
  COOLDOWN: 60, // frames between drops
  PACK_AMOUNT: 10,
};

export const POWERUP_DURATION = 8000; // ms (No longer used for expiry, kept for types)

export const COLORS = {
  p1: '#ef4444', // red-500
  p2: '#3b82f6', // blue-500
  p3: '#22c55e', // green-500
  p4: '#eab308', // yellow-500
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
};
