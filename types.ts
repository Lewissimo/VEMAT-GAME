export enum MapSize {
  SMALL = 'SMALL',
  LARGE = 'LARGE',
}

export enum GameMode {
  DEATHMATCH = 'DEATHMATCH',
  CTF = 'CTF', // Capture The Flag
}

export enum PowerUpType {
  SPEED_BOOST = 'SPEED_BOOST',
  RAPID_FIRE = 'RAPID_FIRE',
  TRIPLE_SHOT = 'TRIPLE_SHOT',
  MEGA_DAMAGE = 'MEGA_DAMAGE',
  HEAL = 'HEAL',
  BOMB_PACK = 'BOMB_PACK',
  COFFEE = 'COFFEE',
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  id: number;
  teamId: number; // 0 or 1 for CTF, -1 for Deathmatch
  position: Vector2D;
  z: number;
  velocity: Vector2D;
  velocityZ: number;
  rotation: number;
  health: number;
  score: number;
  cooldown: number;
  bombCooldown: number;
  bombCount: number;
  hasFlag: boolean; // For CTF
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
  velocity: Vector2D;
  width: number;
  height: number;
  rotation: number;
}

export enum FlagStatus {
  HOME = 'HOME',
  CARRIED = 'CARRIED',
  DROPPED = 'DROPPED',
}

export interface Flag {
  teamId: number; // The team this flag belongs to (Red Base / Blue Base)
  position: Vector2D;
  homePosition: Vector2D;
  status: FlagStatus;
  carrierId: number | null; // ID of player carrying it
}

export interface GameState {
  gameMode: GameMode;
  players: Player[];
  snowballs: Snowball[];
  powerUps: PowerUp[];
  bombs: Bomb[];
  trees: Tree[];
  vendingMachines: VendingMachine[];
  flags: Flag[]; // For CTF
  teamScores: { [key: number]: number }; // For CTF
  mapSize: { width: number; height: number };
  gameTime: number;
  isGameOver: boolean;
  winnerId: number | null; // Player ID for Deathmatch
  winningTeam: number | null; // Team ID for CTF
}

export type InputState = Record<string, boolean>;