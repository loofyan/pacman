import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Game } from '../Game';
import { DIR } from '../constants';
import { SoundEngine } from '../../audio/soundEngine';
import { HUD } from '../../ui/hud';

// Mock dependencies
vi.mock('../../audio/soundEngine', () => ({
  SoundEngine: class { init(){} eatPellet(){} eatPowerPellet(){} levelUp(){} powerMode(){} walk(){} eatGhost(){} death(){} toggleMute(){return true;} }
}));
vi.mock('../../ui/hud', () => ({
  HUD: class { render(){} renderOverlay(){} }
}));

/**
 * Integration test: Simulates real Canvas2D transform matrix
 * to catch bugs that mock tests miss.
 *
 * This verifies that the eye position in SCREEN SPACE is the same
 * regardless of the player's facing direction.
 */
describe('Player Rendering — eye screen-space position (with real transforms)', () => {
  let game: Game;
  let ctx: SimulatedCanvasCtx;

  beforeEach(() => {
    globalThis.requestAnimationFrame = () => undefined;
    globalThis.cancelAnimationFrame = () => undefined;

    ctx = new SimulatedCanvasCtx();

    const mockCanvas = { getContext: vi.fn().mockReturnValue(ctx), width: 500, height: 500, style: {width:'',height:''} };
     // @ts-ignore
    game = new Game(mockCanvas as any, 24);
    game.player.col = 10;
    game.player.row = 10;
    game.player.mouthOpen = 0.5;
     (game as any).gameLoop = vi.fn();
   });

  afterEach(() => { game.stop(); });

  it('eye screen-space position is the same for all directions', () => {
    const tile = 24;
    const bodyCenter = {
      x: game.player.col * tile + tile / 2,
      y: (game.player.row + 1) * tile + tile / 2,
     };
    const r = tile * 0.42;

    const results: Array<{ dir: string; screenEyeX: number; screenEyeY: number }> = [];

    for (const dir of [DIR.RIGHT, DIR.LEFT, DIR.UP, DIR.DOWN]) {
      const dirName = dir.x === 1 ? 'RIGHT' : dir.x === -1 ? 'LEFT' : dir.y === 1 ? 'DOWN' : 'UP';
      game.player.dir = { ...dir };

      ctx = new SimulatedCanvasCtx();
       (game as any).ctx = ctx;
      game.render();

       // Find the eye arc in screen-space (eye radius is r*0.1)
      const eyeArc = ctx.arcCalls.find(a => Math.abs(a.r - r * 0.1) < 0.01);
      expect(eyeArc, `Eye arc not found for direction ${dirName}`).not.toBeNull();

       // Convert the arc coordinates to screen-space using the recorded transform at the time of the arc call
      const screenEye = eyeArc!.transform.transformPoint(eyeArc!.x, eyeArc!.y);

      results.push({ dir: dirName, screenEyeX: screenEye.x, screenEyeY: screenEye.y });
     }

     // All directions should produce the same screen-space eye position
    const expectedEyeX = bodyCenter.x + r * 0.15;
    const expectedEyeY = bodyCenter.y - r * 0.35;

    for (const result of results) {
      expect(result.screenEyeX, `Eye X for ${result.dir}`).toBeCloseTo(expectedEyeX, 0);
      expect(result.screenEyeY, `Eye Y for ${result.dir}`).toBeCloseTo(expectedEyeY, 0);
     }

     // Cross-verify: all directions produce identical screen-space positions
    expect(results[0].screenEyeX).toBe(results[1].screenEyeX); // RIGHT == LEFT
    expect(results[0].screenEyeY).toBe(results[1].screenEyeY);
    expect(results[0].screenEyeX).toBe(results[2].screenEyeX); // RIGHT == UP
    expect(results[0].screenEyeY).toBe(results[2].screenEyeY);
    expect(results[0].screenEyeX).toBe(results[3].screenEyeX); // RIGHT == DOWN
    expect(results[0].screenEyeY).toBe(results[3].screenEyeY);
   });

  it('eye is visible (not below the body center for any direction)', () => {
    const tile = 24;
    const y = (game.player.row + 1) * tile + tile / 2;

    for (const dir of [DIR.RIGHT, DIR.LEFT, DIR.UP, DIR.DOWN]) {
      const dirName = dir.x === 1 ? 'RIGHT' : dir.x === -1 ? 'LEFT' : dir.y === 1 ? 'DOWN' : dir.y === -1 ? 'UP' : '?';
      game.player.dir = { ...dir };

      ctx = new SimulatedCanvasCtx();
       (game as any).ctx = ctx;
      game.render();

      const r = tile * 0.42;
      const eyeArc = ctx.arcCalls.find(a => Math.abs(a.r - r * 0.1) < 0.01)!;
      const screenEye = eyeArc.transform.transformPoint(eyeArc.x, eyeArc.y);
      const screenEyeY = screenEye.y;

      expect(screenEyeY, `Eye Y should be above body center for ${dirName}`).toBeLessThan(y);
     }
   });
});

// ─── Simulated CanvasRenderingContext2D with proper matrix transforms ───
// This simulates how a real browser canvas applies translate/rotate/save/restore.

class CanvasTransformMatrix {
  constructor(
    public a: number, public b: number,
    public c: number, public d: number,
    public e: number, public f: number
    ) {}

  static identity() {
    return new CanvasTransformMatrix(1, 0, 0, 1, 0, 0);
   }

  clone() {
    return new CanvasTransformMatrix(this.a, this.b, this.c, this.d, this.e, this.f);
   }

  multiply(m: CanvasTransformMatrix): CanvasTransformMatrix {
    return new CanvasTransformMatrix(
      this.a * m.a + this.c * m.b,
      this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d,
      this.b * m.c + this.d * m.d,
      this.a * m.e + this.c * m.f + this.e,
      this.b * m.e + this.d * m.f + this.f
     );
   }

  translate(dx: number, dy: number): CanvasTransformMatrix {
    return this.multiply(new CanvasTransformMatrix(1, 0, 0, 1, dx, dy));
   }

  rotate(angle: number): CanvasTransformMatrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return this.multiply(new CanvasTransformMatrix(cos, sin, -sin, cos, 0, 0));
   }

   /** Convert local coordinates to screen-space using this transform */
  transformPoint(px: number, py: number): { x: number; y: number } {
    return {
      x: this.a * px + this.c * py + this.e,
      y: this.b * px + this.d * py + this.f,
     };
   }
}

class SimulatedCanvasCtx {
  arcCalls: Array<{ x: number; y: number; r: number; transform: CanvasTransformMatrix }> = [];
  transform = CanvasTransformMatrix.identity();
  private _transformStack: CanvasTransformMatrix[] = [];
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 0;
  globalAlpha = 1;

  fillRect(_x: number, _y: number, _w: number, _h: number) {}
  beginPath() {}
  closePath() {}
  stroke() {}
  fill() {}
  moveTo(_x: number, _y: number) {}
  lineTo(_x: number, _y: number) {}
  arc(x: number, y: number, r: number, _sa: number, _ea: number) {
    this.arcCalls.push({ x, y, r, transform: this.transform.clone() });
   }
  strokeRect() {}
  rect() {}
  ellipse() {}
  quadraticCurveTo() {}
  createRadialGradient() { return { addColorStop: () => {} }; }
  createLinearGradient() { return { addColorStop: () => {} }; }
  translate(dx: number, dy: number) { this.transform = this.transform.translate(dx, dy); }
  scale() {}
  rotate(angle: number) { this.transform = this.transform.rotate(angle); }
  save() { this._transformStack.push(this.transform.clone()); }
  restore() { this.transform = this._transformStack.pop()!; }
  fillText() {}
  strokeText() {}
}
