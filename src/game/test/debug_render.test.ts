import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Game } from '../Game';
import { DIR } from '../constants';
import { SoundEngine } from '../../audio/soundEngine';
import { HUD } from '../../ui/hud';

vi.mock('../../audio/soundEngine', () => ({
  SoundEngine: class { init(){} eatPellet(){} eatPowerPellet(){} levelUp(){} powerMode(){} walk(){} eatGhost(){} death(){} toggleMute(){return true;} }
}));
vi.mock('../../ui/hud', () => ({
  HUD: class { render(){} renderOverlay(){} }
}));

describe('debug', () => {
  let game: any;
  let arcCalls: Array<{x:number;y:number;r:number}>;
  let mockCtx: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    arcCalls = [];
    globalThis.requestAnimationFrame = () => undefined;
    globalThis.cancelAnimationFrame = () => undefined;
    mockCtx = {
      fillRect: vi.fn(), beginPath: vi.fn(), closePath: vi.fn(), stroke: vi.fn(), fill: vi.fn(),
      moveTo: vi.fn(), lineTo: vi.fn(), arc: vi.fn().mockImplementation((x,y,r,sa,ea) => arcCalls.push({x,y,r})),
      strokeRect: vi.fn(), rect: vi.fn(), ellipse: vi.fn(), quadraticCurveTo: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      translate: vi.fn(), scale: vi.fn(), rotate: vi.fn(), save: vi.fn(), restore: vi.fn(),
      fillText: vi.fn(), strokeText: vi.fn(), fillStyle: '', strokeStyle: '', lineWidth: 0, globalAlpha: 1,
     };
    const mockCanvas = { getContext: vi.fn().mockReturnValue(mockCtx), width: 0, height: 0, style: {width:'',height:''} };
    game = new Game(mockCanvas as any, 24);
    game.player.col = 10; game.player.row = 10; game.player.dir = {...DIR.RIGHT};
    game.player.mouthOpen = 0.5;
    (game as any).gameLoop = vi.fn();
   });
  afterEach(() => { game.stop(); });

  it('show all arcs', () => {
    game.render();
    const tile = 24;
    const bodyCenterY = (game.player.row + 1) * tile + tile / 2;
    arcCalls.forEach((a,i) => console.log(`${i}: r=${a.r.toFixed(3)} y_diff_from_body_center=${(a.y - bodyCenterY).toFixed(3)} (${a.x.toFixed(1)}, ${a.y.toFixed(1)})`));
    expect(true).toBe(true);
   });
});
