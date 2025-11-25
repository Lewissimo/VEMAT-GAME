export enum MapSize {
  SMALL = 'SMALL',
  LARGE = 'LARGE',
}

export enum PowerUpType {
  SPEED_BOOST = 'SPEED_BOOST',       // Faster movement
  RAPID_FIRE = 'RAPID_FIRE',         // Lower cooldown
  TRIPLE_SHOT = 'TRIPLE_SHOT',       // Shoot 3 snowballs
  MEGA_DAMAGE = 'MEGA_DAMAGE',       // Higher damage
  HEAL = 'HEAL',                     // Restore health
  BOMB_PACK = 'BOMB_PACK',           // Give bombs
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  id: number;
  position: Vector2D;
  z: number;        // Height for jumping
  velocity: Vector2D;
  velocityZ: number; // Vertical velocity
  rotation: number; // in radians
  health: number;
  score: number;
  cooldown: number;
  bombCooldown: number;
  bombCount: number;
  color: string;
  name: string;
  keys: {
    up: string;
    down: string;
    left: string;
    right: string;
    shoot: string;
    dropBomb: string;
    jump: string;
  };
  activePowerUps: {
    type: PowerUpType;
    expiresAt: number;
  }[];
  stats: {
    maxSpeed: number;
    turnSpeed: number;
    shootCooldown: number;
    damage: number;
    projectileCount: number;
  };
  isDead: boolean;
  respawnTimer: number;
}

export interface Snowball {
  id: string;
  ownerId: number;
  position: Vector2D;
  velocity: Vector2D;
  damage: number;
  createdAt: number;
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Vector2D;
}

export interface Bomb {
  id: string;
  ownerId: number;
  position: Vector2D;
  plantedAt: number;
  explodeAt: number;
  radius: number;
  damage: number;
}

export interface Tree {
  id: string;
  position: Vector2D;
  radius: number;
}

export interface VendingMachine {
  id: string;
  position: Vector2D;
  velocity: Vector2D; // New: Physics support
  width: number;
  height: number;
  rotation: number;
}

export interface GameState {
  players: Player[];
  snowballs: Snowball[];
  powerUps: PowerUp[];
  bombs: Bomb[];
  trees: Tree[];
  vendingMachines: VendingMachine[];
  mapSize: { width: number; height: number };
  gameTime: number;
  isGameOver: boolean;
  winnerId: number | null;
}

export type InputState = Record<string, boolean>;
