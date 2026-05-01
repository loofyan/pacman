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
 * Reproduction test: Player eye should render at screen-space coordinates
 * (not inside the rotation transform) so it stays above the body in all directions.
 *
 * Bug: Eye was drawn inside ctx.save()/ctx.rotate()/ctx.restore(), so for LEFT
 * direction (rot=Math.PI), the Y coordinate flipped → eye appeared at bottom.
 *
 * Fix: Draw eye OUTSIDE save/restore using screen-space coordinates
 * (x + r*0.15, y - r*0.35).
 *
 * Test strategy: Verify the eye arc uses absolute screen-space coordinates
 * close to the body center position (not tiny local-space values).
 */
describe('Player Rendering — eye stays above body in all directions', () => {
  let game: Game;
  let mockCtx: any;
  let arcCalls: Array<{ x: number; y: number; r: number }>;

  beforeEach(() => {
    vi.restoreAllMocks();
    arcCalls = [];
    globalThis.requestAnimationFrame = () => undefined;
    globalThis.cancelAnimationFrame = () => undefined;

    mockCtx = {
      fillRect: vi.fn(), beginPath: vi.fn(), closePath: vi.fn(),
      stroke: vi.fn(), fill: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      arc: vi.fn().mockImplementation((x: number, y: number, r: number, _sa: number, _ea: number) =>
        arcCalls.push({ x, y, r })
         ),
      strokeRect: vi.fn(), rect: vi.fn(), ellipse: vi.fn(), quadraticCurveTo: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(), save: vi.fn(), restore: vi.fn(),
      fillText: vi.fn(), strokeText: vi.fn(),
      fillStyle: '', strokeStyle: '', lineWidth: 0, globalAlpha: 1,
       };

    const mockCanvas = { getContext: vi.fn().mockReturnValue(mockCtx), width: 0, height: 0, style: {width:'',height:''} };
       // @ts-ignore
    game = new Game(mockCanvas as any, 24);
    game.player.col = 10;
    game.player.row = 10;
    game.player.mouthOpen = 0.5;
    (game as any).gameLoop = vi.fn();
      });

  afterEach(() => { game.stop(); });

    /**
     * Player eye radius: tile * 0.42 * 0.1 = 1.008
     * (tight tolerance to exclude ghost pupils at 0.972)
     */
  function getPlayerEye(tile: number) {
    return arcCalls.find(a => Math.abs(a.r - tile * 0.42 * 0.1) < 0.01);
     }

  function getBodyCenter(tile: number) {
    return {
      x: game.player.col * tile + tile / 2,
      y: (game.player.row + 1) * tile + tile / 2,
        };
      }

  it('eye uses screen-space coordinates (not local-space inside transform)', () => {
    game.player.dir = { ...DIR.RIGHT };
    arcCalls = [];
    game.render();

    const tile = 24;
    const eye = getPlayerEye(tile);
    const center = getBodyCenter(tile);

    expect(eye).not.toBeNull();
     // If eye is drawn inside the rotation transform, it would be at tiny
     // local-space coords like (1.008, -3.528) — bodyCenter is ~276 away.
     // If drawn in screen-space, eye Y ≈ bodyCenterY - r*0.35 = bodyCenterY - 3.528
    expect(eye!.y).toBeCloseTo(center.y - tile * 0.42 * 0.35, 1);
    expect(eye!.x).toBeCloseTo(center.x + tile * 0.42 * 0.15, 1);
     });

  it('LEFT: eye Y is above body center (regression)', () => {
    game.player.dir = { ...DIR.LEFT };
    arcCalls = [];
    game.render();

    const tile = 24;
    const eye = getPlayerEye(tile);
    const center = getBodyCenter(tile);

    expect(eye).not.toBeNull();
    expect(eye!.y).toBeCloseTo(center.y - tile * 0.42 * 0.35, 1);
      });

  it('DOWN: eye Y is above body center', () => {
    game.player.dir = { ...DIR.DOWN };
    arcCalls = [];
    game.render();

    const tile = 24;
    const eye = getPlayerEye(tile);
    const center = getBodyCenter(tile);

    expect(eye).not.toBeNull();
    expect(eye!.y).toBeCloseTo(center.y - tile * 0.42 * 0.35, 1);
      });

  it('UP: eye Y is above body center', () => {
    game.player.dir = { ...DIR.UP };
    arcCalls = [];
    game.render();

    const tile = 24;
    const eye = getPlayerEye(tile);
    const center = getBodyCenter(tile);

    expect(eye).not.toBeNull();
    expect(eye!.y).toBeCloseTo(center.y - tile * 0.42 * 0.35, 1);
      });

  it('eye position is direction-independent (same screen-space Y for all directions)', () => {
    const tile = 24;
    const eyeYs: number[] = [];

    for (const dir of [DIR.RIGHT, DIR.LEFT, DIR.UP, DIR.DOWN]) {
      game.player.dir = { ...dir };
      arcCalls = [];
      game.render();
      const eye = getPlayerEye(tile)!;
      eyeYs.push(eye.y);
       }

    expect(eyeYs[0]).toBe(eyeYs[1]); // RIGHT == LEFT
    expect(eyeYs[0]).toBe(eyeYs[2]); // RIGHT == UP
    expect(eyeYs[0]).toBe(eyeYs[3]); // RIGHT == DOWN
     });
});
