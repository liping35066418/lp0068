import type {
  Player,
  Platform,
  Obstacle,
  Powerup,
  Rect,
  GameConfig,
  ClientInputPayload,
} from '../types/shared';

export interface CollisionResult {
  platformCollision: { top: boolean; bottom: boolean; left: boolean; right: boolean };
  hitObstacles: Obstacle[];
  collectedPowerups: Powerup[];
}

export class Physics {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  aabbIntersect(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  updatePlayer(
    player: Player,
    dt: number,
    input: ClientInputPayload,
    platforms: Platform[],
    obstacles: Obstacle[],
    powerups: Powerup[],
    speedMultiplier: number = 1
  ): CollisionResult {
    const result: CollisionResult = {
      platformCollision: { top: false, bottom: false, left: false, right: false },
      hitObstacles: [],
      collectedPowerups: [],
    };

    const moveSpeed = this.config.moveSpeed * speedMultiplier;

    if (input.left) {
      player.vx = -moveSpeed;
      player.facingRight = false;
    } else if (input.right) {
      player.vx = moveSpeed;
      player.facingRight = true;
    } else {
      player.vx = 0;
    }

    if (input.jumpPressed && player.onGround) {
      player.vy = this.config.jumpVelocity;
      player.onGround = false;
    }

    player.vy += this.config.gravity * dt;

    player.x += player.vx * dt;
    for (const platform of platforms) {
      if (this.aabbIntersect(player, platform)) {
        if (player.vx > 0) {
          player.x = platform.x - player.width;
          result.platformCollision.right = true;
        } else if (player.vx < 0) {
          player.x = platform.x + platform.width;
          result.platformCollision.left = true;
        }
      }
    }

    player.y += player.vy * dt;
    player.onGround = false;
    for (const platform of platforms) {
      if (this.aabbIntersect(player, platform)) {
        if (player.vy > 0) {
          player.y = platform.y - player.height;
          player.vy = 0;
          player.onGround = true;
          result.platformCollision.top = true;
        } else if (player.vy < 0) {
          player.y = platform.y + platform.height;
          player.vy = 0;
          result.platformCollision.bottom = true;
        }
      }
    }

    for (const obstacle of obstacles) {
      if (this.aabbIntersect(player, obstacle)) {
        result.hitObstacles.push(obstacle);
      }
    }

    for (const powerup of powerups) {
      if (!powerup.collected && this.aabbIntersect(player, powerup)) {
        result.collectedPowerups.push(powerup);
      }
    }

    return result;
  }
}
