import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HUD } from './hud';

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

/** Create a minimal game stub that covers every HUD.render path. */
function makeGame(overrides: Partial<GameLike> = {}): GameLike {
  return {
    mazeWidth: 31,
    mazeHeight: 25,
    score: 1234,
    highScore: 9999,
    lives: 3,
    level: 5,
    mode: 'playing' as any,
    ...overrides,
  };
}

function makeCanvas(overrides: Partial<CanvasLike> = {}): CanvasLike {
  const ctx = makeCtx();
  return {
    width: 900,
    height: 744,
    getContext: vi.fn().mockReturnValue(ctx),
    ...overrides,
  };
}

function makeCtx(): CanvasCtxMock {
  const arcCalls: number[] = [];
  const fillTextCalls: string[] = [];
  const createRadialGradientCalls: Array<[number, number, number, number, number, number]> = [];

  const canvas: CanvasCtxMock = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '' as any,
    textBaseline: '' as any,
    shadowColor: '',
    shadowBlur: 0,
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    stroke: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    drawImage: vi.fn(),
    scale: vi.fn(),
    setTransform: vi.fn(),
    getTransform: vi.fn(),
    isPointInPath: vi.fn(),
    isPointInStroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn((_text: string, _x: number, _y: number) => {
      fillTextCalls.push(_text);
      return canvas;
    }),
    arc: vi.fn((_x: number, _y: number, _r: number, _start: number, _end: number) => {
      arcCalls.push(_r);
      return canvas;
    }),
    createRadialGradient: vi.fn((x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
      createRadialGradientCalls.push([x0, y0, r0, x1, y1, r1]);
      return {
        addColorStop: vi.fn(),
      };
    }),
    beginPath: vi.fn(() => {
      return canvas;
    }),
    beginPathMock: vi.fn(),
    fill: vi.fn(() => {
      return canvas;
    }),
    fillTextCalls: () => fillTextCalls,
    arcCalls: () => arcCalls,
    createRadialGradientCalls: () => createRadialGradientCalls,
    fillRectCalls: () => (canvas.fillRect as any).mock?.calls?.map((c: any[]) => ({ x: c[0], y: c[1], w: c[2], h: c[3] })) ?? [],
    strokeRectCalls: () => (canvas.strokeRect as any).mock?.calls?.map((c: any[]) => ({ x: c[0], y: c[1], w: c[2], h: c[3] })) ?? [],
    textCalls: () => canvas.fillTextCalls(),
  };
  return canvas;
}

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

interface GameLike {
  mazeWidth: number;
  mazeHeight: number;
  score: number;
  highScore: number;
  lives: number;
  level: number;
  mode: string;
}

interface CanvasLike {
  width: number;
  height: number;
  getContext: ReturnType<typeof vi.fn<[], CanvasCtxMock>>;
}

interface CanvasCtxMock {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  textAlign: string;
  textBaseline: string;
  shadowColor: string;
  shadowBlur: number;
  clearRect: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  scale: ReturnType<typeof vi.fn>;
  setTransform: ReturnType<typeof vi.fn>;
  getTransform: ReturnType<typeof vi.fn>;
  isPointInPath: ReturnType<typeof vi.fn>;
  isPointInStroke: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  rect: ReturnType<typeof vi.fn>;
  clip: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  strokeRect: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  arc: ReturnType<typeof vi.fn>;
  createRadialGradient: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  // helper accessors
  fillTextCalls: () => string[];
  arcCalls: () => number[];
  createRadialGradientCalls: () => Array<[number, number, number, number, number, number]>;
  fillRectCalls: () => Array<{ x: number; y: number; w: number; h: number }>;
  strokeRectCalls: () => Array<{ x: number; y: number; w: number; h: number }>;
  textCalls: () => string[];
}

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------

describe('HUD', () => {
  let game: GameLike;
  let canvas: CanvasLike;
  let ctx: CanvasCtxMock;

  beforeEach(() => {
    ctx = makeCtx();
    canvas = makeCanvas();
    (canvas as any).getContext = vi.fn().mockReturnValue(ctx);
    game = makeGame();
  });

  // ----- HUD.render -----------------------------------------------------

  describe('render', () => {
    it('should render score panel rect', () => {
      const tile = game.mazeWidth; // 31
      const hud = new HUD(canvas as any);
      (hud as any).render(game);

      expect(ctx.fillRectCalls()).toContainEqual({ x: tile, y: -tile - 20, w: tile * 10, h: tile });
    });

    it('should render score stroke outline', () => {
      const tile = game.mazeWidth;
      const hud = new HUD(canvas as any);
      (hud as any).render(game);

      expect(ctx.strokeRectCalls()).toContainEqual({ x: tile, y: -tile - 20, w: tile * 10, h: tile });
    });

    it('should render score value', () => {
      const hud = new HUD(canvas as any);
      (hud as any).render(game);

      expect(ctx.fillTextCalls()).toContain('1234');
    });

    it('should render high score panel', () => {
      const hud = new HUD(canvas as any);
      (hud as any).render(game);

      expect(ctx.fillTextCalls()).toContain('9999');
    });

    it('should render lives as circles', () => {
      const hud = new HUD(canvas as any);
      (hud as any).render(game);

      expect(ctx.arcCalls().length).toBe(3);
    });

    it('should render level panel', () => {
      const hud = new HUD(canvas as any);
      (hud as any).render(game);

      expect(ctx.fillTextCalls()).toContain('5');
    });

    it('should render SCORE, HI, and LVL labels', () => {
      const hud = new HUD(canvas as any);
      (hud as any).render(game);

      const labels = ctx.textCalls();
      expect(labels).toContain('SCORE');
      expect(labels).toContain('HI');
      expect(labels).toContain('LVL');
    });
  });

  // ----- HUD.renderOverlay ----------------------------------------------

  describe('renderOverlay', () => {
    it('should render start screen title', () => {
      game.mode = 'start';
      const hud = new HUD(canvas as any);
      (hud as any).renderOverlay(game);

      expect(ctx.fillTextCalls().some(t => t === 'MAZE CHASE')).toBe(true);
    });

    it('should render game over text', () => {
      game.mode = 'game_over';
      const hud = new HUD(canvas as any);
      (hud as any).renderOverlay(game);

      expect(ctx.fillTextCalls()).toContain('GAME OVER');
      expect(ctx.fillTextCalls()).toContain('PRESS ENTER TO RETRY');
    });

    it('should render paused text', () => {
      game.mode = 'paused';
      const hud = new HUD(canvas as any);
      (hud as any).renderOverlay(game);

      expect(ctx.fillTextCalls()).toContain('PAUSED');
    });

    it('should render level done text', () => {
      game.mode = 'level_done';
      const hud = new HUD(canvas as any);
      (hud as any).renderOverlay(game);

      const titles = ctx.fillTextCalls().filter(t => t && t.startsWith('LEVEL'));
      expect(titles.length).toBe(1);
    });

    it('should draw overlay background for every mode', () => {
      const hud = new HUD(canvas as any);
      const modes: string[] = ['start', 'game_over', 'paused', 'level_done'];
      for (const mode of modes) {
        game.mode = mode;
        ctx.fillRectCalls = () => (ctx.fillRect as any).mock?.calls?.map((c: any[]) => ({ x: c[0], y: c[1], w: c[2], h: c[3] })) ?? [];
        (hud as any).renderOverlay(game);
        expect(ctx.fillRectCalls().length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
