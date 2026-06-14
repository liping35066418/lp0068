import { v4 as uuidv4 } from 'uuid';
import { LevelGenerator } from './LevelGenerator';
import { Physics } from './Physics';
import type {
  GameState,
  Player,
  ActiveEffect,
  PowerupType,
  GameConfig,
  OutputMessage,
  ClientInputPayload,
} from '../types/shared';

export interface GameEngineEvents {
  onMessage?: (message: OutputMessage) => void;
}

export class GameEngine {
  private config: GameConfig;
  private levelGenerator: LevelGenerator;
  private physics: Physics;
  private events: GameEngineEvents;

  private state: GameState;
  private currentInput: ClientInputPayload;
  private fixedDt: number;
  private accumulator: number;
  private lastTime: number;
  private running: boolean;
  private timer: NodeJS.Timeout | null;

  constructor(config: GameConfig, events: GameEngineEvents = {}) {
    this.config = config;
    this.levelGenerator = new LevelGenerator();
    this.physics = new Physics(config);
    this.events = events;
    this.fixedDt = 1 / 60;
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this.timer = null;
    this.currentInput = { left: false, right: false, jump: false, jumpPressed: false };
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const level = 1;
    const levelData = this.levelGenerator.generate(level);
    return {
      status: 'idle',
      level,
      score: 0,
      lives: this.config.initialLives,
      maxLives: 5,
      cameraX: 0,
      player: this.createPlayer(),
      platforms: levelData.platforms,
      obstacles: levelData.obstacles,
      powerups: levelData.powerups,
      activeEffects: [],
      levelEndX: levelData.levelEndX,
      worldWidth: levelData.worldWidth,
      worldHeight: this.config.worldHeight || 800,
      timestamp: Date.now(),
    };
  }

  private createPlayer(): Player {
    return {
      id: uuidv4(),
      x: 100,
      y: 400,
      width: 40,
      height: 60,
      vx: 0,
      vy: 0,
      onGround: false,
      facingRight: true,
      invincible: false,
      invincibleTimer: 0,
    };
  }

  start(): void {
    if (this.state.status === 'playing') return;
    this.resetToLevel(1);
    this.state.status = 'playing';
    this.state.score = 0;
    this.state.lives = this.config.initialLives;
    this.startGameLoop();
  }

  restart(): void {
    this.stopGameLoop();
    this.resetToLevel(1);
    this.state.status = 'playing';
    this.state.score = 0;
    this.state.lives = this.config.initialLives;
    this.startGameLoop();
  }

  pause(): void {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
      this.stopGameLoop();
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'playing';
      this.startGameLoop();
    }
  }

  setInput(input: ClientInputPayload): void {
    this.currentInput = { ...input };
  }

  getState(): GameState {
    return {
      ...this.state,
      player: { ...this.state.player },
      platforms: this.state.platforms.map((p) => ({ ...p })),
      obstacles: this.state.obstacles.map((o) => ({ ...o })),
      powerups: this.state.powerups.map((p) => ({ ...p })),
      activeEffects: this.state.activeEffects.map((e) => ({ ...e })),
      timestamp: Date.now(),
    };
  }

  private startGameLoop(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = Date.now();
    this.timer = setInterval(() => this.tick(), 1000 / 60);
  }

  private stopGameLoop(): void {
    this.running = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    if (!this.running) return;

    const now = Date.now();
    let frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (frameTime > 0.25) frameTime = 0.25;

    this.accumulator += frameTime;
    while (this.accumulator >= this.fixedDt) {
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    this.updateCamera();
  }

  private update(dt: number): void {
    if (this.state.status !== 'playing') return;

    this.updateEffects(dt);

    if (this.state.player.invincible) {
      this.state.player.invincibleTimer -= dt;
      if (this.state.player.invincibleTimer <= 0) {
        this.state.player.invincible = false;
        this.state.player.invincibleTimer = 0;
      }
    }

    const speedMultiplier = this.hasActiveEffect('speed') ? this.config.speedMultiplier : 1;
    const hasShield = this.hasActiveEffect('shield');
    const scoreMultiplier = this.hasActiveEffect('double') ? 2 : 1;

    const jumpPressed = this.currentInput.jumpPressed;

    const collisionResult = this.physics.updatePlayer(
      this.state.player,
      dt,
      {
        left: this.currentInput.left,
        right: this.currentInput.right,
        jump: this.currentInput.jump,
        jumpPressed,
      },
      this.state.platforms,
      this.state.obstacles,
      this.state.powerups,
      speedMultiplier
    );

    for (const powerup of collisionResult.collectedPowerups) {
      const idx = this.state.powerups.findIndex((p) => p.id === powerup.id);
      if (idx >= 0 && !this.state.powerups[idx].collected) {
        this.state.powerups[idx].collected = true;
        this.applyPowerup(powerup.type, scoreMultiplier);
      }
    }

    if (!this.state.player.invincible && !hasShield && collisionResult.hitObstacles.length > 0) {
      this.takeDamage();
    }

    if (this.state.player.y > this.state.worldHeight) {
      if (!this.state.player.invincible && !hasShield) {
        this.takeDamage();
      }
      this.respawnPlayer();
    }

    if (this.state.player.x >= this.state.levelEndX) {
      this.nextLevel();
    }

    this.currentInput.jumpPressed = false;
  }

  private updateEffects(dt: number): void {
    this.state.activeEffects = this.state.activeEffects.filter((effect) => {
      effect.remaining -= dt;
      return effect.remaining > 0;
    });
  }

  private hasActiveEffect(type: PowerupType): boolean {
    return this.state.activeEffects.some((e) => e.type === type);
  }

  private applyPowerup(type: PowerupType, scoreMultiplier: number): void {
    switch (type) {
      case 'health':
        if (this.state.lives < this.state.maxLives) {
          this.state.lives++;
        }
        this.state.score += 50 * scoreMultiplier;
        break;
      case 'speed':
        this.addEffect('speed', 5, 5);
        this.state.score += 30 * scoreMultiplier;
        break;
      case 'shield':
        this.addEffect('shield', 8, 8);
        this.state.score += 30 * scoreMultiplier;
        break;
      case 'double':
        this.addEffect('double', 10, 10);
        this.state.score += 30 * scoreMultiplier;
        break;
    }

    this.emitEvent('pickup', {
      powerup: type,
      score: this.state.score,
      lives: this.state.lives,
    });
  }

  private addEffect(type: PowerupType, duration: number, remaining: number): void {
    const existing = this.state.activeEffects.find((e) => e.type === type);
    if (existing) {
      existing.remaining = Math.max(existing.remaining, remaining);
    } else {
      this.state.activeEffects.push({ type, duration, remaining });
    }
  }

  private takeDamage(): void {
    if (this.hasActiveEffect('shield')) {
      this.state.activeEffects = this.state.activeEffects.filter((e) => e.type !== 'shield');
      this.emitEvent('damage', {
        lives: this.state.lives,
        shieldBroken: true,
      });
      return;
    }

    this.state.lives--;
    this.state.player.invincible = true;
    this.state.player.invincibleTimer = this.config.invincibleDuration;

    this.emitEvent('damage', {
      lives: this.state.lives,
      invincible: true,
      shieldBroken: false,
    });

    if (this.state.lives <= 0) {
      this.gameOver();
    }
  }

  private respawnPlayer(): void {
    this.state.player.x = Math.max(100, this.state.cameraX + 100);
    this.state.player.y = 200;
    this.state.player.vx = 0;
    this.state.player.vy = 0;
  }

  private nextLevel(): void {
    const nextLevelNum = this.state.level + 1;
    this.state.score += 500 * this.state.level;

    this.emitEvent('levelup', {
      level: nextLevelNum,
      score: this.state.score,
    });

    this.resetToLevel(nextLevelNum);
  }

  private resetToLevel(levelNum: number): void {
    const levelData = this.levelGenerator.generate(levelNum);
    this.state.level = levelNum;
    this.state.platforms = levelData.platforms;
    this.state.obstacles = levelData.obstacles;
    this.state.powerups = levelData.powerups;
    this.state.levelEndX = levelData.levelEndX;
    this.state.worldWidth = levelData.worldWidth;
    this.state.worldHeight = levelData.worldHeight;
    this.state.player = this.createPlayer();
    this.state.cameraX = 0;
    this.state.activeEffects = [];
  }

  private gameOver(): void {
    this.state.status = 'gameover';
    this.stopGameLoop();

    this.emitEvent('gameover', {
      score: this.state.score,
      level: this.state.level,
    });
  }

  private updateCamera(): void {
    const targetX = this.state.player.x - this.config.viewportWidth / 3;
    this.state.cameraX = Math.max(0, targetX);
  }

  private emitEvent(kind: 'pickup' | 'damage' | 'levelup' | 'gameover', data: Record<string, unknown>): void {
    if (this.events.onMessage) {
      this.events.onMessage({
        type: 'event',
        payload: {
          kind,
          data,
          timestamp: Date.now(),
        },
      });
    }
  }

  destroy(): void {
    this.stopGameLoop();
  }
}
