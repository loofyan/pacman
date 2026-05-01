import type { Game } from '../game/Game';

export class HUD {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(game: Game): void {
    const ctx = this.ctx;
    const tile = game.mazeWidth;

    // Score panel
    ctx.fillStyle = '#000';
    ctx.fillRect(tile, -tile - 20, tile * 10, tile);
    ctx.strokeStyle = '#2121DE';
    ctx.lineWidth = 1;
    ctx.strokeRect(tile, -tile - 20, tile * 10, tile);

    // Score label
    ctx.fillStyle = '#FFF';
    ctx.font = `bold ${tile * 0.5}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SCORE', tile + 2, -tile - 18);

    // Score value
    ctx.fillStyle = '#FFFF00';
    ctx.font = `bold ${tile * 0.8}px monospace`;
    ctx.fillText(`${game.score}`, tile + 2, -tile - 6);

    // High score
    ctx.fillStyle = '#000';
    ctx.fillRect(tile * 14, -tile - 20, tile * 7, tile);
    ctx.strokeStyle = '#2121DE';
    ctx.strokeRect(tile * 14, -tile - 20, tile * 7, tile);
    ctx.fillStyle = '#FFF';
    ctx.font = `${tile * 0.45}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('HI', tile * 14 + 2, -tile - 18);
    ctx.fillStyle = '#FFB8FF';
    ctx.font = `bold ${tile * 0.7}px monospace`;
    ctx.fillText(`${game.highScore}`, tile * 14 + 2, -tile - 6);

    // Lives row
    for (let i = 0; i < game.lives; i++) {
      const lx = tile * (3 + i);
      const ly = tile * (game.mazeHeight + 1);
      const r = tile * 0.3;
      const grad = ctx.createRadialGradient(lx - r * 0.2, ly - r * 0.2, 0, lx, ly, r);
      grad.addColorStop(0, '#FFFF66');
      grad.addColorStop(1, '#FFCC00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Level panel
    ctx.fillStyle = '#000';
    ctx.fillRect(tile * (game.mazeWidth + 1), tile * (game.mazeHeight + 1), tile * 3, tile);
    ctx.strokeStyle = '#2121DE';
    ctx.strokeRect(tile * (game.mazeWidth + 1), tile * (game.mazeHeight + 1), tile * 3, tile);
    ctx.fillStyle = '#FFF';
    ctx.font = `${tile * 0.4}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText('LVL', tile * (game.mazeWidth + 2) - 2, tile * (game.mazeHeight + 1) + 2);
    ctx.fillStyle = '#00FF00';
    ctx.font = `bold ${tile * 0.65}px monospace`;
    ctx.fillText(`${game.level}`, tile * (game.mazeWidth + 2) - 2, tile * (game.mazeHeight + 1) + 12);
  }

  renderOverlay(game: Game): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const tile = game.mazeWidth;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (game.mode === 'start') {
      // Title with glow
      ctx.fillStyle = '#FFFF00';
      ctx.font = `bold ${tile * 2.8}px monospace`;
      ctx.shadowColor = '#FFA500';
      ctx.shadowBlur = 20;
      ctx.fillText('MAZE CHASE', w / 2, h * 0.22);
      ctx.shadowBlur = 0;

      // Ghost row decoration
      const ghosts = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
      ghosts.forEach((color, i) => {
        const gx = w / 2 - tile * 2 + i * tile;
        const gy = h * 0.38;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(gx, gy - 5, tile * 0.3, Math.PI, 0);
        ctx.lineTo(gx + tile * 0.3, gy + tile * 0.2);
        ctx.lineTo(gx - tile * 0.3, gy + tile * 0.2);
        ctx.fill();
      });

      // Blinking "press enter"
      if (Math.floor(this.currentFrame() / 30) % 2 === 0) {
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${tile * 1}px monospace`;
        ctx.fillText('PRESS ENTER TO START', w / 2, h * 0.58);
      }

      // Controls
      ctx.fillStyle = '#AAAAAA';
      ctx.font = `${tile * 0.65}px monospace`;
      ctx.fillText('Arrow Keys / WASD to Move', w / 2, h * 0.72);
      ctx.fillText('Space = Pause  |  R = Restart', w / 2, h * 0.80);
      ctx.fillText('M = Mute Sound', w / 2, h * 0.87);
    }

    if (game.mode === 'game_over') {
      // Red glow
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#FF0000';
      ctx.font = `bold ${tile * 2}px monospace`;
      ctx.fillText('GAME OVER', w / 2, h * 0.33);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#FFF';
      ctx.font = `bold ${tile * 0.9}px monospace`;
      ctx.fillText(`Score: ${game.score}`, w / 2, h * 0.48);
      ctx.fillText(`Level: ${game.level}`, w / 2, h * 0.58);

      ctx.fillStyle = '#FFB852';
      ctx.font = `${tile * 0.7}px monospace`;
      if (Math.floor(this.currentFrame() / 30) % 2 === 0) {
        ctx.fillText('PRESS ENTER TO RETRY', w / 2, h * 0.75);
      }
    }

    if (game.mode === 'level_done') {
      ctx.shadowColor = '#00FF00';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00FF00';
      ctx.font = `bold ${tile * 1.3}px monospace`;
      ctx.fillText(`LEVEL ${game.level} COMPLETE!`, w / 2, h * 0.45);
      ctx.shadowBlur = 0;
    }

    if (game.mode === 'paused') {
      ctx.shadowColor = '#FFF';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FFF';
      ctx.font = `bold ${tile * 1.8}px monospace`;
      ctx.fillText('PAUSED', w / 2, h * 0.43);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#AAAAAA';
      ctx.font = `${tile * 0.8}px monospace`;
      if (Math.floor(this.currentFrame() / 30) % 2 === 0) {
        ctx.fillText('Press Space to Resume', w / 2, h * 0.6);
      }
    }
  }

  private currentFrame(): number {
    return Math.floor(performance.now() / 16.67);
  }
}
