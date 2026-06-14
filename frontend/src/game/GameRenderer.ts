import type { GameState, Player, Platform, Obstacle, Powerup, ActiveEffect, Particle, GameEvent } from '@/types';

const COLORS = {
  bgDark: '#0f172a',
  bgDarker: '#020617',
  neonCyan: '#22d3ee',
  neonCyanGlow: 'rgba(34, 211, 238, 0.6)',
  neonOrange: '#f97316',
  neonOrangeGlow: 'rgba(249, 115, 22, 0.6)',
  neonGreen: '#10b981',
  neonGreenGlow: 'rgba(16, 185, 129, 0.6)',
  neonRed: '#ef4444',
  neonRedGlow: 'rgba(239, 68, 68, 0.6)',
  neonPink: '#ec4899',
  neonPinkGlow: 'rgba(236, 72, 153, 0.6)',
  neonYellow: '#eab308',
  neonYellowGlow: 'rgba(234, 179, 8, 0.6)',
  neonGold: '#fbbf24',
  neonGoldGlow: 'rgba(251, 191, 36, 0.7)',
  platformMetal1: '#1e293b',
  platformMetal2: '#334155',
  platformEdge: '#475569',
  playerBody: '#22d3ee',
  playerAccent: '#06b6d4',
  scanline: 'rgba(255, 255, 255, 0.03)',
};

interface Star {
  x: number;
  y: number;
  size: number;
  layer: number;
  twinkle: number;
  baseY: number;
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;

  private stars: Star[] = [];
  private particles: Particle[] = [];
  private particleIdCounter = 0;

  private animTime = 0;

  private lastPlayerVy = 0;
  private squashStretch = 1;
  private hurtFlashUntil = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.initStars();
    this.resize();
  }

  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  handleEvent(event: GameEvent): void {
    const now = Date.now();
    switch (event.kind) {
      case 'pickup':
        this.spawnPowerupParticles(event);
        break;
      case 'damage':
        this.hurtFlashUntil = now + 300;
        this.spawnHurtParticles();
        break;
    }
  }

  render(state: GameState, deltaTime: number): void {
    this.animTime += deltaTime;
    this.updateParticles(deltaTime);

    this.updateSquashStretch(state.player, deltaTime);

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground(state.cameraX);
    this.drawWorld(state);
    this.drawScanlines();
    this.drawParticles();

    this.lastPlayerVy = state.player.vy;
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      const layer = Math.random();
      const baseY = Math.random();
      this.stars.push({
        x: Math.random() * 3000,
        y: baseY,
        baseY,
        size: layer > 0.7 ? 2 : layer > 0.4 ? 1.5 : 1,
        layer,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  private drawBackground(cameraX: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, COLORS.bgDarker);
    gradient.addColorStop(0.3, '#0c1929');
    gradient.addColorStop(0.7, '#1a0f2e');
    gradient.addColorStop(1, COLORS.bgDark);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawStars(cameraX);
    this.drawNebula(cameraX);
    this.drawHorizonGlow(cameraX);
  }

  private drawHorizonGlow(cameraX: number): void {
    this.ctx.save();
    this.ctx.globalAlpha = 0.2;
    const grad = this.ctx.createLinearGradient(0, this.height * 0.7, 0, this.height);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.5, COLORS.neonCyan);
    grad.addColorStop(1, COLORS.neonPink);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, this.height * 0.7, this.width, this.height * 0.3);
    this.ctx.restore();
    void cameraX;
  }

  private drawStars(cameraX: number): void {
    for (const star of this.stars) {
      const parallax = 0.1 + star.layer * 0.4;
      const screenX = ((star.x - cameraX * parallax) % (this.width + 200) + this.width + 200) % (this.width + 200) - 100;
      const screenY = star.baseY * this.height * 0.7;
      const twinkle = Math.sin(this.animTime * 2 + star.twinkle) * 0.4 + 0.6;

      this.ctx.globalAlpha = twinkle;
      this.ctx.fillStyle = star.layer > 0.7 ? '#e0f2fe' : star.layer > 0.4 ? '#bae6fd' : '#7dd3fc';
      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawNebula(cameraX: number): void {
    const nebulaX = -cameraX * 0.05;

    this.ctx.save();
    this.ctx.globalAlpha = 0.15;
    const gradient1 = this.ctx.createRadialGradient(
      this.width * 0.2 + nebulaX % this.width,
      this.height * 0.3,
      0,
      this.width * 0.2 + nebulaX % this.width,
      this.height * 0.3,
      250,
    );
    gradient1.addColorStop(0, COLORS.neonCyan);
    gradient1.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient1;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const gradient2 = this.ctx.createRadialGradient(
      this.width * 0.75 + (nebulaX * 1.5) % this.width,
      this.height * 0.6,
      0,
      this.width * 0.75 + (nebulaX * 1.5) % this.width,
      this.height * 0.6,
      300,
    );
    gradient2.addColorStop(0, COLORS.neonPink);
    gradient2.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient2;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const gradient3 = this.ctx.createRadialGradient(
      this.width * 0.5 + (nebulaX * 0.8) % this.width,
      this.height * 0.2,
      0,
      this.width * 0.5 + (nebulaX * 0.8) % this.width,
      this.height * 0.2,
      200,
    );
    gradient3.addColorStop(0, COLORS.neonOrange);
    gradient3.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient3;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  private drawWorld(state: GameState): void {
    const camX = state.cameraX;
    const viewScaleY = this.height / state.worldHeight;
    const scale = Math.min(this.width / 1280, viewScaleY);

    const offsetX = -camX * scale + (this.width - 1280 * scale) / 2;
    const offsetY = (this.height - state.worldHeight * scale) / 2;

    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(scale, scale);

    this.drawWorldBounds(state.worldWidth, state.worldHeight, state.levelEndX);
    this.drawPlatforms(state.platforms);
    this.drawObstacles(state.obstacles, state.timestamp);
    this.drawPowerups(state.powerups, state.timestamp);
    this.drawPlayer(state.player, state.activeEffects, state.timestamp);

    this.ctx.restore();
  }

  private drawWorldBounds(worldWidth: number, worldHeight: number, levelEndX: number): void {
    this.ctx.save();
    this.ctx.strokeStyle = COLORS.neonPink;
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = COLORS.neonPinkGlow;
    this.ctx.shadowBlur = 20;

    this.ctx.strokeRect(0, 0, worldWidth, worldHeight);

    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = COLORS.neonGreen;
    this.ctx.shadowColor = COLORS.neonGreenGlow;
    this.ctx.shadowBlur = 30;
    this.ctx.fillRect(levelEndX - 8, 0, 16, worldHeight);

    this.ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    this.ctx.fillRect(levelEndX, 0, worldWidth - levelEndX, worldHeight);

    this.ctx.restore();
  }

  private drawPlatforms(platforms: Platform[]): void {
    for (const p of platforms) {
      const grad = this.ctx.createLinearGradient(0, p.y, 0, p.y + p.height);

      if (p.type === 'ground') {
        grad.addColorStop(0, '#475569');
        grad.addColorStop(0.3, COLORS.platformMetal2);
        grad.addColorStop(1, COLORS.platformMetal1);
      } else if (p.type === 'low') {
        grad.addColorStop(0, '#0f766e');
        grad.addColorStop(0.5, '#0d9488');
        grad.addColorStop(1, '#134e4a');
      } else {
        grad.addColorStop(0, '#7c3aed');
        grad.addColorStop(0.5, '#8b5cf6');
        grad.addColorStop(1, '#4c1d95');
      }

      const edgeColor = p.type === 'ground' ? COLORS.platformEdge : p.type === 'low' ? COLORS.neonCyan : COLORS.neonPink;
      const shadowColor = p.type === 'ground' ? 'rgba(71, 85, 105, 0.4)' : p.type === 'low' ? COLORS.neonCyanGlow : COLORS.neonPinkGlow;

      this.ctx.shadowColor = shadowColor;
      this.ctx.shadowBlur = 15;

      this.ctx.fillStyle = grad;
      this.roundRect(p.x, p.y, p.width, p.height, 6);
      this.ctx.fill();

      this.ctx.shadowBlur = 0;

      this.ctx.strokeStyle = edgeColor;
      this.ctx.lineWidth = 2;
      this.roundRect(p.x, p.y, p.width, p.height, 6);
      this.ctx.stroke();

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      this.ctx.fillRect(p.x + 6, p.y + 3, p.width - 12, p.height * 0.2);

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x + 6, p.y + p.height * 0.6);
      this.ctx.lineTo(p.x + p.width - 6, p.y + p.height * 0.6);
      this.ctx.stroke();
    }
  }

  private drawObstacles(obstacles: Obstacle[], timestamp: number): void {
    for (const o of obstacles) {
      const pulse = Math.sin(timestamp * 0.005) * 0.3 + 0.7;

      this.ctx.shadowColor = COLORS.neonRed;
      this.ctx.shadowBlur = 20 * pulse;

      if (o.type === 'spike') {
        this.drawSpike(o);
      } else if (o.type === 'saw') {
        this.drawSaw(o, timestamp);
      }

      this.ctx.shadowBlur = 0;
    }
  }

  private drawSpike(o: Obstacle): void {
    const count = Math.max(1, Math.floor(o.width / 20));
    const spikeW = o.width / count;

    this.ctx.fillStyle = '#dc2626';
    this.ctx.strokeStyle = COLORS.neonRed;
    this.ctx.lineWidth = 2;

    for (let i = 0; i < count; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(o.x + i * spikeW, o.y + o.height);
      this.ctx.lineTo(o.x + i * spikeW + spikeW / 2, o.y);
      this.ctx.lineTo(o.x + (i + 1) * spikeW, o.y + o.height);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.beginPath();
      this.ctx.moveTo(o.x + i * spikeW + spikeW * 0.2, o.y + o.height);
      this.ctx.lineTo(o.x + i * spikeW + spikeW / 2, o.y + o.height * 0.3);
      this.ctx.lineTo(o.x + i * spikeW + spikeW / 2, o.y + o.height);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.fillStyle = '#dc2626';
    }
  }

  private drawSaw(o: Obstacle, timestamp: number): void {
    const cx = o.x + o.width / 2;
    const cy = o.y + o.height / 2;
    const r = Math.min(o.width, o.height) / 2;
    const rotation = timestamp * 0.01;
    const teeth = 12;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(rotation);

    this.ctx.fillStyle = '#991b1b';
    this.ctx.strokeStyle = COLORS.neonRed;
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const angle1 = (i / teeth) * Math.PI * 2;
      const angle2 = ((i + 0.5) / teeth) * Math.PI * 2;
      const angle3 = ((i + 1) / teeth) * Math.PI * 2;

      if (i === 0) {
        this.ctx.moveTo(Math.cos(angle1) * r, Math.sin(angle1) * r);
      }
      this.ctx.lineTo(Math.cos(angle2) * r * 0.75, Math.sin(angle2) * r * 0.75);
      this.ctx.lineTo(Math.cos(angle3) * r, Math.sin(angle3) * r);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#7f1d1d';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = COLORS.neonRed;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#fecaca';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawPowerups(powerups: Powerup[], timestamp: number): void {
    for (const p of powerups) {
      if (p.collected) continue;

      const float = Math.sin(timestamp * 0.003 + p.x * 0.01) * 5;
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2 + float;
      const size = p.width / 2;

      const colorMap: Record<string, { main: string; glow: string; symbol: string }> = {
        health: { main: '#ef4444', glow: COLORS.neonRedGlow, symbol: '♥' },
        speed: { main: COLORS.neonYellow, glow: COLORS.neonYellowGlow, symbol: '⚡' },
        shield: { main: COLORS.neonGold, glow: COLORS.neonGoldGlow, symbol: '🛡' },
        double: { main: COLORS.neonPink, glow: COLORS.neonPinkGlow, symbol: '✨' },
      };

      const colors = colorMap[p.type] || colorMap.health;

      this.ctx.save();
      this.ctx.translate(cx, cy);

      this.ctx.shadowColor = colors.glow;
      this.ctx.shadowBlur = 30;

      const rotAngle = timestamp * 0.002;
      this.ctx.rotate(rotAngle);

      this.ctx.strokeStyle = colors.main;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * size * 1.2;
        const y = Math.sin(angle) * size * 1.2;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.stroke();

      this.ctx.shadowBlur = 20;
      this.ctx.fillStyle = colors.main;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.rotate(-rotAngle);
      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = `bold ${size * 1.1}px -apple-system, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(colors.symbol, 0, 1);

      this.ctx.restore();
    }
  }

  private drawPlayer(player: Player, effects: ActiveEffect[], timestamp: number): void {
    const hasShield = effects.some((e) => e.type === 'shield');
    const hasSpeed = effects.some((e) => e.type === 'speed');
    const hasDouble = effects.some((e) => e.type === 'double');

    const invincible = player.invincible;
    const hurtFlash = timestamp < this.hurtFlashUntil;

    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;

    const stretch = this.squashStretch;
    const squash = 2 - stretch;

    const bodyW = player.width * squash;
    const bodyH = player.height * stretch;

    if (invincible && Math.floor(timestamp / 80) % 2 === 0) {
      return;
    }

    this.ctx.save();

    if (hasShield) {
      const shieldPulse = Math.sin(timestamp * 0.01) * 0.2 + 0.8;
      this.ctx.shadowColor = COLORS.neonGoldGlow;
      this.ctx.shadowBlur = 25;
      this.ctx.strokeStyle = `rgba(251, 191, 36, ${shieldPulse})`;
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, Math.max(player.width, player.height) * 0.8, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.strokeStyle = `rgba(255, 255, 255, ${shieldPulse * 0.5})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, Math.max(player.width, player.height) * 0.7, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }

    if (hasSpeed) {
      for (let i = 1; i <= 4; i++) {
        const trailX = cx - (player.facingRight ? 1 : -1) * i * 12;
        const alpha = 1 - i * 0.2;
        this.ctx.globalAlpha = alpha * 0.5;
        this.drawPlayerBody(trailX, cy, bodyW * (1 - i * 0.1), bodyH * (1 - i * 0.05), player, timestamp, hurtFlash);
        const hueShift = (timestamp * 0.5 + i * 40) % 360;
        this.ctx.fillStyle = `hsla(${hueShift}, 100%, 60%, ${alpha * 0.3})`;
        this.ctx.beginPath();
        this.ctx.arc(trailX, cy, Math.max(bodyW, bodyH) * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.globalAlpha = 1;
    }

    if (hasDouble) {
      this.ctx.shadowColor = COLORS.neonPinkGlow;
      this.ctx.shadowBlur = 20;
    }

    if (hurtFlash) {
      this.drawPlayerBody(cx, cy, bodyW, bodyH, player, timestamp, true);
    } else {
      this.drawPlayerBody(cx, cy, bodyW, bodyH, player, timestamp, false);
    }

    this.ctx.restore();
  }

  private drawPlayerBody(
    cx: number,
    cy: number,
    bodyW: number,
    bodyH: number,
    player: Player,
    _timestamp: number,
    hurt: boolean,
  ): void {
    const left = cx - bodyW / 2;
    const top = cy - bodyH / 2;

    const glowColor = hurt ? COLORS.neonRed : COLORS.neonCyanGlow;
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 25;

    const grad = this.ctx.createLinearGradient(left, top, left + bodyW, top + bodyH);
    if (hurt) {
      grad.addColorStop(0, '#fca5a5');
      grad.addColorStop(0.5, '#ef4444');
      grad.addColorStop(1, '#991b1b');
    } else {
      grad.addColorStop(0, '#67e8f9');
      grad.addColorStop(0.4, COLORS.playerBody);
      grad.addColorStop(1, COLORS.playerAccent);
    }

    this.ctx.fillStyle = grad;
    this.roundRect(left, top, bodyW, bodyH, 10);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;

    this.ctx.strokeStyle = hurt ? COLORS.neonRed : '#0e7490';
    this.ctx.lineWidth = 2;
    this.roundRect(left, top, bodyW, bodyH, 10);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(left + 4, top + 4, bodyW - 8, bodyH * 0.25);

    const eyeY = top + bodyH * 0.35;
    const eyeOffset = bodyW * 0.22;
    const eyeSize = Math.max(3, bodyW * 0.13);
    const eyeDir = player.facingRight ? 1 : -1;

    this.ctx.fillStyle = hurt ? '#fecaca' : '#e0f2fe';
    this.ctx.shadowColor = hurt ? COLORS.neonRedGlow : COLORS.neonCyanGlow;
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(cx - eyeOffset + eyeDir * 2, eyeY, eyeSize, 0, Math.PI * 2);
    this.ctx.arc(cx + eyeOffset + eyeDir * 2, eyeY, eyeSize, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = hurt ? '#7f1d1d' : '#0c4a6e';
    this.ctx.beginPath();
    this.ctx.arc(cx - eyeOffset + eyeDir * 4, eyeY, eyeSize * 0.55, 0, Math.PI * 2);
    this.ctx.arc(cx + eyeOffset + eyeDir * 4, eyeY, eyeSize * 0.55, 0, Math.PI * 2);
    this.ctx.fill();

    const mouthY = top + bodyH * 0.65;
    this.ctx.strokeStyle = hurt ? '#7f1d1d' : '#0891b2';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    if (hurt) {
      this.ctx.moveTo(cx - bodyW * 0.12, mouthY + bodyH * 0.04);
      this.ctx.lineTo(cx, mouthY);
      this.ctx.lineTo(cx + bodyW * 0.12, mouthY + bodyH * 0.04);
    } else {
      this.ctx.moveTo(cx - bodyW * 0.1, mouthY);
      this.ctx.quadraticCurveTo(cx, mouthY + bodyH * 0.05, cx + bodyW * 0.1, mouthY);
    }
    this.ctx.stroke();
  }

  private drawScanlines(): void {
    this.ctx.save();
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = COLORS.scanline;
    for (let y = 0; y < this.height; y += 4) {
      this.ctx.fillRect(0, y, this.width, 1);
    }

    const vignetteGrad = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.3,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.8,
    );
    vignetteGrad.addColorStop(0, 'transparent');
    vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    this.ctx.fillStyle = vignetteGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.restore();
  }

  private spawnPowerupParticles(event: GameEvent): void {
    const data = event.data as { x?: number; y?: number; type?: string } | undefined;
    if (!data) return;

    const colors: Record<string, string> = {
      health: '#ef4444',
      speed: '#eab308',
      shield: '#fbbf24',
      double: '#ec4899',
    };
    const color = colors[data.type || 'health'] || '#ffffff';
    const px = data.x || 0;
    const py = data.y || 0;

    for (let i = 0; i < 25; i++) {
      const angle = (Math.PI * 2 * i) / 25 + Math.random() * 0.5;
      const speed = 100 + Math.random() * 180;
      this.particles.push({
        id: this.particleIdCounter++,
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: 0.7 + Math.random() * 0.5,
        maxLife: 1.2,
        color,
        size: 3 + Math.random() * 5,
      });
    }
  }

  private spawnHurtParticles(): void {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;
      this.particles.push({
        id: this.particleIdCounter++,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        color: '#ef4444',
        size: 2 + Math.random() * 4,
      });
    }
  }

  private updateParticles(dt: number): void {
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 450 * dt;
      p.life -= dt;
      return p.life > 0;
    });
  }

  private drawParticles(): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = Math.min(1, alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 12;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
  }

  private updateSquashStretch(player: Player, dt: number): void {
    const diff = 1 - this.squashStretch;
    const easing = 1 - Math.pow(1 - Math.min(dt * 8, 1), 3);
    this.squashStretch += diff * easing;

    if (player.vy < -200 && this.lastPlayerVy >= -200) {
      this.squashStretch = 1.25;
    }

    if (player.vy > 150 && player.onGround && this.lastPlayerVy <= 150) {
      this.squashStretch = 0.75;
      setTimeout(() => {
        this.squashStretch = 1;
      }, 100);
    }
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const radius = Math.min(r, w / 2, h / 2);
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + w - radius, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.ctx.lineTo(x + w, y + h - radius);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.ctx.lineTo(x + radius, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
}
