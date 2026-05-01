import { Maze } from './maze';
import { Player } from './player';
import { Ghost } from './ghost';
import { SoundEngine } from '../audio/soundEngine';
import { HUD } from '../ui/hud';
import {
  TILE,
  DIR,
  FRIGHTENED_DURATION,
  GHOST_MODE,
  CHASE_SCATTER_DURATION,
  DEATH_ANIM_FRAMES,
  DEFEAT_COOLDOWN,
} from './constants';
import type { GameMode } from './constants';
import type { Direction } from './constants';

export class Game {
  public mode: GameMode = 'start';
  public score: number = 0;
  public highScore: number = 0;
  public lives: number = 3;
  public level: number = 1;

  public maze: Maze;
  public player: Player;
  public ghosts: Ghost[];

  public mazeWidth: number;
  public mazeHeight: number;

  public soundEngine: SoundEngine;
  public hud: HUD;

  // Internal state
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tileSize: number;
  private currentFrame: number = 0;
  private frightenedTimer: number = 0;
  private chaseScatterTimer: number = 0;
  private currentChaseScatter: 'chase' | 'scatter' = 'chase';
  private deathAnimFrame: number = 0;
  private pendingDir: Direction = { ...DIR.NONE };
  private gameLoopId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private stepTime: number = 1000 / 60;
  private ghostWalkTimer: number = 0;
  private pelletFlash: number = 0;

  constructor(canvas: HTMLCanvasElement, tileSize: number = 24) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.tileSize = tileSize;

    this.maze = new Maze();
    this.mazeWidth = this.maze.width;
    this.mazeHeight = this.maze.height;

    this.player = new Player(14, 20);
    this.ghosts = [0, 1, 2, 3].map(i => new Ghost(i));

    this.soundEngine = new SoundEngine();
    this.hud = new HUD(canvas);

    // Set canvas size
    canvas.width = (this.mazeWidth + 4) * tileSize;
    canvas.height = (this.mazeHeight + 4) * tileSize;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
  }

  start(): void {
    this.mode = 'playing';
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.resetLevel();
    this.soundEngine.init();
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.gameLoop();
  }

  resetLevel(): void {
    this.maze.resetPellets();
    this.player.reset(14, 20);
    this.ghosts.forEach(g => g.reset());
    this.frightenedTimer = 0;
    this.chaseScatterTimer = 0;
    this.currentChaseScatter = 'chase';
    this.deathAnimFrame = 0;
  }

  fullRestart(): void {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.mode = 'playing';
    this.resetLevel();
  }

  // Called each frame
  update(): void {
    this.currentFrame++;
    this.pelletFlash = (this.pelletFlash + 1) % 30;

    switch (this.mode) {
      case 'playing':
        this.updatePlaying();
        break;
      case 'frightened':
        this.updateFrightened();
        break;
      case 'death':
        this.updateDeath();
        break;
      case 'level_done':
        this.updateLevelDone();
        break;
      case 'paused':
        break;
    }
  }

  private updatePlaying(): void {
    this.player.update(this.pendingDir, this.maze);
    this.checkPelletCollection();
    this.updateGhosts();
    this.checkGhostCollisions();

    this.chaseScatterTimer++;
    if (this.chaseScatterTimer >= CHASE_SCATTER_DURATION) {
      this.chaseScatterTimer = 0;
      this.currentChaseScatter = this.currentChaseScatter === 'chase' ? 'scatter' : 'chase';
      this.ghosts.forEach(g => {
        if (!g.defeated && !g.inHouse) {
          if (this.currentChaseScatter === 'chase') g.setChaseMode();
          else g.setScatterMode();
        }
      });
    }
  }

  private updateFrightened(): void {
    this.player.update(this.pendingDir, this.maze);
    this.checkPelletCollection();
    this.frightenedTimer--;

    // Ghosts flash before reverting
    this.updateGhosts();
    this.checkGhostCollisions();

    if (this.frightenedTimer <= 0) {
      this.mode = 'playing';
    }
  }

  private updateDeath(): void {
    this.deathAnimFrame++;
    if (this.deathAnimFrame >= DEATH_ANIM_FRAMES) {
      this.lives--;
      if (this.lives <= 0) {
        this.mode = 'game_over';
        if (this.score > this.highScore) this.highScore = this.score;
      } else {
        this.player.reset(14, 20);
        this.ghosts.forEach(g => {
          g.reset();
          g.inHouse = true;
          g.defeatedCooldown = DEFEAT_COOLDOWN;
        });
        this.frightenedTimer = 0;
        this.mode = 'playing';
      }
    }
  }

  private updateLevelDone(): void {
    this.pelletFlash++;
    if (this.currentFrame % 30 === 0) {
      this.level++;
      this.resetLevel();
      this.mode = 'playing';
    }
  }

  private checkPelletCollection(): void {
    const pos = this.player.getTilePos();
    const tile = this.maze.getTile(pos.col, pos.row);

    if (tile === TILE.PELLET) {
      this.maze.setTile(pos.col, pos.row, TILE.EMPTY);
      this.score += 10;
      this.soundEngine.eatPellet();
    } else if (tile === TILE.POWER_PELLET) {
      this.maze.setTile(pos.col, pos.row, TILE.EMPTY);
      this.score += 50;
      this.soundEngine.eatPowerPellet();
      this.activateFrightened();
    }

    // Level complete check
    if (this.maze.pelletsRemaining <= 0 && this.mode !== 'death') {
      this.mode = 'level_done';
      this.soundEngine.levelUp();
    }
  }

  private activateFrightened(): void {
    this.mode = 'frightened';
    this.frightenedTimer = FRIGHTENED_DURATION + this.level * 30;
    this.soundEngine.powerMode();
    this.ghosts.forEach(g => {
      if (!g.defeated && !g.inHouse) {
        g.setFrightened(this.frightenedTimer);
      }
    });
  }

  private updateGhosts(): void {
    const pPos = this.player.getTilePos();
    this.ghostWalkTimer++;

    this.ghosts.forEach((ghost, i) => {
      ghost.update(pPos.col, pPos.row, this.maze);
      if ((ghost.mode === GHOST_MODE.CHASE || ghost.mode === GHOST_MODE.SCATTER) &&
          this.ghostWalkTimer % 12 === 0) {
        this.soundEngine.walk(i);
      }
    });
  }

  private checkGhostCollisions(): void {
    const pCol = Math.round(this.player.col);
    const pRow = Math.round(this.player.row);

    this.ghosts.forEach((ghost, i) => {
      if (ghost.inHouse) return;

      const gCol = Math.round(ghost.col);
      const gRow = Math.round(ghost.row);

      if (pCol === gCol && pRow === gRow) {
        if (ghost.mode === GHOST_MODE.FRIGHTENED && !ghost.defeated) {
          ghost.setDefeated();
          this.score += 200;
          this.soundEngine.eatGhost();
        } else if (ghost.mode !== GHOST_MODE.FRIGHTENED && !ghost.defeated) {
          this.mode = 'death';
          this.player.dead = true;
          this.soundEngine.death();
        }
      }
    });
  }

  // Rendering
  render(): void {
    const ctx = this.ctx;
    const tile = this.tileSize;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw maze walls
    this.drawWalls();

    // Draw pellets
    this.drawPellets();

    // Draw ghosts
    this.drawGhosts();

    // Draw player
    if (this.mode !== 'death' || this.deathAnimFrame < DEATH_ANIM_FRAMES) {
      this.drawPlayer();
    }

    // Draw HUD
    this.hud.render(this);

    // Draw overlay for start/game over/pause/level done
    if (this.mode === 'start' || this.mode === 'game_over' ||
        this.mode === 'paused' || this.mode === 'level_done') {
      this.hud.renderOverlay(this);
    }
  }

  private drawWalls(): void {
    const ctx = this.ctx;
    const tile = this.tileSize;

    for (let r = 0; r < this.mazeHeight; r++) {
      for (let c = 0; c < this.mazeWidth; c++) {
        const tileType = this.maze.getTile(c, r);
        if (tileType !== TILE.WALL && tileType !== TILE.GHOST_WALL) continue;

        const py = (r + 1) * tile;
        const x = c * tile;
        const y = py;

        // Check neighbors for rounded corners
        const top = r > 0 && (this.maze.getTile(c, r - 1) === TILE.WALL || this.maze.getTile(c, r - 1) === TILE.GHOST_WALL);
        const bot = r < this.mazeHeight - 1 && (this.maze.getTile(c, r + 1) === TILE.WALL || this.maze.getTile(c, r + 1) === TILE.GHOST_WALL);
        const left = c > 0 && (this.maze.getTile(c - 1, r) === TILE.WALL || this.maze.getTile(c - 1, r) === TILE.GHOST_WALL);
        const right = c < this.mazeWidth - 1 && (this.maze.getTile(c + 1, r) === TILE.WALL || this.maze.getTile(c + 1, r) === TILE.GHOST_WALL);

        // Wall fill with subtle gradient feel
        ctx.fillStyle = '#0a0a6e';
        if (!top && !bot && !left && !right) {
          ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        } else {
          const inset = top ? 0 : 1;
          const ry = top ? y + 1 : y;
          ctx.fillRect(x + inset, ry + inset, tile - inset * 2, tile - inset * 2);
        }

        // Wall highlight (top-left edge glow)
        ctx.strokeStyle = '#4a4aff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const hs = 3;
        if (!top) { ctx.moveTo(x + hs, y + hs); ctx.lineTo(x + tile - hs, y + hs); }
        if (!left) { ctx.moveTo(x + hs, y + hs); ctx.lineTo(x + hs, y + tile - hs); }
        ctx.stroke();

        // Wall shadow (bottom-right edge)
        ctx.strokeStyle = '#0000aa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (!bot) { ctx.moveTo(x + hs, y + tile - hs); ctx.lineTo(x + tile - hs, y + tile - hs); }
        if (!right) { ctx.moveTo(x + tile - hs, y + hs); ctx.lineTo(x + tile - hs, y + tile - hs); }
        ctx.stroke();
      }
    }

    // Draw ghost door
    for (let r = 0; r < this.mazeHeight; r++) {
      for (let c = 0; c < this.mazeWidth; c++) {
        if (this.maze.getTile(c, r) !== TILE.GHOST_DOOR) continue;
        const py = (r + 1) * tile;
        const x = c * tile + tile / 2;
        const pulse = Math.sin(this.currentFrame * 0.15) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 184, 255, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(c * tile + 3, py + tile / 2);
        ctx.lineTo(c * tile + tile - 3, py + tile / 2);
        ctx.stroke();
      }
    }
  }

  private drawPellets(): void {
    const ctx = this.ctx;
    const tile = this.tileSize;

    for (let r = 0; r < this.mazeHeight; r++) {
      for (let c = 0; c < this.mazeWidth; c++) {
        const tileType = this.maze.getTile(c, r);
        const x = c * tile + tile / 2;
        const y = (r + 1) * tile + tile / 2;

        if (tileType === TILE.PELLET) {
          const size = tile * 0.1;
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        } else if (tileType === TILE.POWER_PELLET) {
          // Flash when close to completing level
          if (this.maze.pelletsRemaining < 10 && this.pelletFlash % 10 < 5) continue;
          const pulse = Math.sin(this.currentFrame * 0.15) * 0.15 + 0.85;
          const size = tile * 0.3 * pulse;
          // Glow
          const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
          grad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
          grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
          // Core
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private drawPlayer(): void {
    const ctx = this.ctx;
    const tile = this.tileSize;
    const x = this.player.col * tile + tile / 2;
    const y = (this.player.row + 1) * tile + tile / 2;
    const r = tile * 0.42;

    // Mouth animation
    const mouthAngle = this.player.mouthOpen * 0.35 + 0.05;

    // Direction rotation — use value comparison (not reference) since dir is set via spread
    let rot = 0;
    if (this.player.dir.x === 1 && this.player.dir.y === 0) rot = 0;
    else if (this.player.dir.x === 0 && this.player.dir.y === 1) rot = Math.PI / 2;
    else if (this.player.dir.x === -1 && this.player.dir.y === 0) rot = Math.PI;
    else if (this.player.dir.x === 0 && this.player.dir.y === -1) rot = -Math.PI / 2;

    // Death animation
    if (this.mode === 'death') {
      const t = this.deathAnimFrame / DEATH_ANIM_FRAMES;
      rot = t * Math.PI * 2;
      ctx.globalAlpha = 1 - t;
      const sr = r * (1 - t * 0.3);
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.arc(x, y, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, r, 0, Math.PI * 2);
    ctx.fill();

    // Body gradient
    const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
    grad.addColorStop(0, '#FFFF66');
    grad.addColorStop(1, '#FFCC00');

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, mouthAngle, Math.PI * 2 - mouthAngle);
    ctx.lineTo(0, 0);
    ctx.fill();

    ctx.restore();

     // Eye — drawn in screen-space so it stays above the body regardless of direction
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + r * 0.15, y - r * 0.35, r * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
   }


  private drawGhosts(): void {
    const ctx = this.ctx;
    const tile = this.tileSize;

    this.ghosts.forEach(ghost => {
      if (ghost.inHouse && ghost.releaseTimer > 60) return;

      const x = ghost.col * tile + tile / 2;
      const y = (ghost.row + 1) * tile + tile / 2;
      const r = tile * 0.45;

      if (ghost.defeated) {
        this.drawGhostEyes(ctx, x, y, ghost.dir, r);
        return;
      }

      let color = ghost.color;
      if (ghost.mode === GHOST_MODE.FRIGHTENED) {
        if (ghost.frightenedTimer < 120 && this.currentFrame % 10 < 5) {
          color = '#FFFFFF';
        } else {
          color = '#2121DE';
        }
      }

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x + 1, y + r * 0.5 + 2, r * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Ghost body gradient
      const grad = ctx.createLinearGradient(x, y - r, x, y + r);
      grad.addColorStop(0, this.lightenColor(color, 30));
      grad.addColorStop(1, color);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y - r * 0.15, r, Math.PI, 0);
      ctx.lineTo(x + r, y + r * 0.7);

      // Animated wavy bottom
      const wave = Math.sin(this.currentFrame * 0.25 + ghost.col) * r * 0.08;
      const segW = (r * 2) / 4;
      for (let i = 4; i > 0; i--) {
        const sx = x + r - (4 - i) * segW;
        ctx.quadraticCurveTo(
          sx - segW / 2, y + r * 0.7 + wave + (i % 2 ? r * 0.12 : -r * 0.12),
          sx - segW, y + r * 0.7
        );
      }
      ctx.fill();

      // Frightened face or normal eyes
      if (ghost.mode === GHOST_MODE.FRIGHTENED) {
        ctx.fillStyle = '#FFF';
        ctx.fillRect(x - r * 0.35, y - r * 0.05, r * 0.18, r * 0.18);
        ctx.fillRect(x + r * 0.17, y - r * 0.05, r * 0.18, r * 0.18);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - r * 0.35, y + r * 0.3);
        for (let i = 0; i < 6; i++) {
          ctx.lineTo(x - r * 0.35 + i * r * 0.14, y + r * 0.3 + (i % 2 ? -r * 0.08 : r * 0.08));
        }
        ctx.stroke();
      } else {
        this.drawGhostEyes(ctx, x, y, ghost.dir, r);
      }
    });
  }

  private lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return `rgb(${r},${g},${b})`;
  }

  private drawGhostEyes(ctx: CanvasRenderingContext2D, x: number, y: number, dir: { x: number; y: number }, r: number): void {
    // Left eye
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.28, y - r * 0.12, r * 0.2, r * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.ellipse(x + r * 0.28, y - r * 0.12, r * 0.2, r * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    const po = r * 0.09;
    ctx.fillStyle = '#2121DE';
    ctx.beginPath();
    ctx.arc(x - r * 0.28 + dir.x * po, y - r * 0.12 + dir.y * po, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.28 + dir.x * po, y - r * 0.12 + dir.y * po, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }

  // Input handling
  setDirection(dir: Direction): void {
    this.pendingDir = { ...dir };
  }

  togglePause(): void {
    if (this.mode === 'playing' || this.mode === 'frightened') {
      this.mode = 'paused';
    } else if (this.mode === 'paused') {
      this.mode = 'playing';
    }
  }

  mute(): boolean {
    return this.soundEngine.toggleMute();
  }

  // Game loop
  private gameLoop = (timestamp?: number): void => {
    if (this.mode === 'game_over' || this.mode === 'start') return;

    if (!timestamp) timestamp = performance.now();
    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.accumulator += delta;

    // Fixed timestep update (skip logic when paused, keep rendering)
    while (this.accumulator >= this.stepTime) {
      if (this.mode !== 'paused') {
        this.update();
      }
      this.accumulator -= this.stepTime;
    }

    this.render();
    this.gameLoopId = requestAnimationFrame(this.gameLoop);
  };

  stop(): void {
    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  // Get current ghost target for chase mode
  getCurrentTarget(ghostIndex: number): { x: number; y: number } {
    const pPos = this.player.getTilePos();
    const offset = [
      { x: 0, y: -1 },
      { x: 0, y: -4 },
      { x: 1, y: -2 },
      { x: -2, y: 0 },
    ][ghostIndex % 4];
    return { x: pPos.col + offset.x, y: pPos.row + offset.y };
  }
}
