import { v4 as uuidv4 } from 'uuid';
import type {
  LevelData,
  Platform,
  Obstacle,
  Powerup,
  ObstacleType,
  PowerupType,
} from '../types/shared';

export class LevelGenerator {
  private baseLevelLength = 4000;
  private levelLengthIncrement = 1500;
  private baseObstacleDensity = 0.001;
  private obstacleDensityIncrement = 0.25;
  private groundY = 500;
  private groundHeight = 300;
  private worldHeight = 800;

  generate(level: number): LevelData {
    const length = this.baseLevelLength + (level - 1) * this.levelLengthIncrement;
    const obstacleDensity =
      this.baseObstacleDensity * Math.pow(1 + this.obstacleDensityIncrement, level - 1);

    const platforms = this.generatePlatforms(level, length);
    const obstacles = this.generateObstacles(level, length, platforms, obstacleDensity);
    const powerups = this.generatePowerups(level, length, platforms);

    return {
      level,
      worldWidth: length,
      worldHeight: this.worldHeight,
      levelEndX: length - 120,
      platforms,
      obstacles,
      powerups,
    };
  }

  private generatePlatforms(level: number, length: number): Platform[] {
    const platforms: Platform[] = [];

    platforms.push({
      id: uuidv4(),
      x: 0,
      y: this.groundY,
      width: length,
      height: this.groundHeight,
      type: 'ground',
    });

    let x = 400;
    while (x < length - 400) {
      const isHigh = Math.random() > 0.5;
      const platformY = isHigh ? this.groundY - 180 : this.groundY - 80;
      const platformWidth = 120 + Math.random() * 180;

      if (Math.random() > 0.3) {
        platforms.push({
          id: uuidv4(),
          x,
          y: platformY,
          width: platformWidth,
          height: 20,
          type: isHigh ? 'high' : 'low',
        });
      }

      x += 200 + Math.random() * 300;
    }

    return platforms;
  }

  private generateObstacles(
    level: number,
    length: number,
    platforms: Platform[],
    density: number
  ): Obstacle[] {
    const obstacles: Obstacle[] = [];
    const obstacleCount = Math.floor(length * density);

    for (let i = 0; i < obstacleCount; i++) {
      const x = 300 + Math.random() * (length - 600);
      const type: ObstacleType = Math.random() > 0.6 ? 'saw' : 'spike';

      const onGround = Math.random() > 0.4;
      let y: number;
      let width: number;
      let height: number;

      if (onGround) {
        width = type === 'spike' ? 30 : 40;
        height = type === 'spike' ? 30 : 40;
        y = this.groundY - height;
      } else {
        const elevatedPlatforms = platforms.filter(
          (p) => p.type !== 'ground' && x >= p.x && x <= p.x + p.width
        );
        if (elevatedPlatforms.length > 0) {
          const platform = elevatedPlatforms[0];
          width = type === 'spike' ? 30 : 40;
          height = type === 'spike' ? 30 : 40;
          y = platform.y - height;
        } else {
          continue;
        }
      }

      const overlaps = obstacles.some(
        (o) =>
          x < o.x + o.width + 50 &&
          x + width + 50 > o.x &&
          y < o.y + o.height &&
          y + height > o.y
      );

      if (!overlaps) {
        obstacles.push({
          id: uuidv4(),
          x,
          y,
          width,
          height,
          type,
        });
      }
    }

    return obstacles;
  }

  private generatePowerups(level: number, length: number, platforms: Platform[]): Powerup[] {
    const powerups: Powerup[] = [];
    const powerupCount = 5 + Math.floor(level * 1.5);
    const powerupTypes: PowerupType[] = ['health', 'speed', 'shield', 'double'];

    for (let i = 0; i < powerupCount; i++) {
      const x = 500 + (i + 1) * ((length - 800) / (powerupCount + 1)) + (Math.random() - 0.5) * 100;
      const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];

      const nearbyPlatforms = platforms.filter(
        (p) => p.type !== 'ground' && x >= p.x - 20 && x <= p.x + p.width + 20
      );

      let y: number;
      if (nearbyPlatforms.length > 0) {
        const platform = nearbyPlatforms[0];
        y = platform.y - 50;
      } else {
        y = this.groundY - 100 - Math.random() * 80;
      }

      powerups.push({
        id: uuidv4(),
        x,
        y,
        width: 30,
        height: 30,
        type,
        collected: false,
      });
    }

    return powerups;
  }
}
