export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export type PowerupType = 'health' | 'speed' | 'shield' | 'double';

export type ObstacleType = 'spike' | 'saw';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Rect {
  id: string;
  vx: number;
  vy: number;
  onGround: boolean;
  facingRight: boolean;
  invincible: boolean;
  invincibleTimer: number;
}

export interface Platform extends Rect {
  id: string;
  type: 'ground' | 'low' | 'high';
}

export interface Obstacle extends Rect {
  id: string;
  type: ObstacleType;
}

export interface Powerup extends Rect {
  id: string;
  type: PowerupType;
  collected: boolean;
}

export interface ActiveEffect {
  type: PowerupType;
  remaining: number;
  duration: number;
}

export interface LevelData {
  level: number;
  worldWidth: number;
  worldHeight: number;
  levelEndX: number;
  platforms: Platform[];
  obstacles: Obstacle[];
  powerups: Powerup[];
}

export interface GameState {
  status: GameStatus;
  level: number;
  score: number;
  lives: number;
  maxLives: number;
  cameraX: number;
  player: Player;
  platforms: Platform[];
  obstacles: Obstacle[];
  powerups: Powerup[];
  activeEffects: ActiveEffect[];
  levelEndX: number;
  worldWidth: number;
  worldHeight: number;
  timestamp: number;
}

export interface ClientInputPayload {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
}

export type InputMessage =
  | { type: 'start' }
  | { type: 'restart' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'input'; payload: ClientInputPayload };

export type EventKind = 'pickup' | 'damage' | 'levelup' | 'gameover';

export interface GameEventPayload {
  kind: EventKind;
  data: Record<string, unknown>;
  timestamp: number;
}

export type OutputMessage =
  | { type: 'state'; payload: GameState }
  | { type: 'event'; payload: GameEventPayload };

export interface GameConfig {
  gravity: number;
  jumpVelocity: number;
  moveSpeed: number;
  initialLives: number;
  baseLevelLength: number;
  levelLengthIncrement: number;
  baseObstacleDensity: number;
  obstacleDensityIncrement: number;
  invincibleDuration: number;
  speedMultiplier: number;
  viewportWidth: number;
  viewportHeight: number;
  worldHeight: number;
}
