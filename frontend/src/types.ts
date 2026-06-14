export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export type PlatformType = 'ground' | 'low' | 'high';

export type ObstacleType = 'spike' | 'saw';

export type PowerupType = 'health' | 'speed' | 'shield' | 'double';

export type EffectType = PowerupType;

export type GameEventKind = 'pickup' | 'damage' | 'levelup' | 'gameover';

export interface Player {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facingRight: boolean;
  invincible: boolean;
  invincibleTimer: number;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
}

export interface Powerup {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerupType;
  collected: boolean;
}

export interface ActiveEffect {
  type: EffectType;
  remaining: number;
  duration: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
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

export interface InputFrame {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
  timestamp: number;
}

export interface GameEvent {
  kind: GameEventKind;
  data: Record<string, unknown>;
  timestamp: number;
  _id?: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
