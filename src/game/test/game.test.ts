import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from '../Game';
import { Maze } from '../maze';
import { Player } from '../player';
import { Ghost } from '../ghost';
import { SoundEngine } from '../../audio/soundEngine';
import { HUD } from '../../ui/hud';
import { TILE, GHOST_MODE } from '../constants';

// Mock SoundEngine
vi.mock('../../audio/soundEngine', () => ({
  SoundEngine: class {
    init() {}
    eatPellet() {}
    eatPowerPellet() {}
    levelUp() {}
    powerMode() {}
    walk() {}
    eatGhost() {}
    death() {}
    toggleMute() { return true; }
  }
}));

// Mock HUD
vi.mock('../../ui/hud', () => ({
  HUD: class {
    render() {}
    renderOverlay() {}
  }
}));

// Mock HTMLCanvasElement and 2D Context
const mockCtx = {
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  strokeRect: vi.fn(),
  rect: vi.fn(),
  createRadialGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
  createLinearGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
  ellipse: vi.fn(),
  rotate: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  globalAlpha: 1,
} as any;

const mockCanvas = {
  getContext: vi.fn().mockReturnValue(mockCtx),
  width: 0,
  height: 0,
  style: {
    width: '',
    height: '',
  },
};

describe('Game', () => {
  let game: Game;

  beforeEach(() => {
    vi.clearAllMocks();

    globalThis.requestAnimationFrame = () => undefined;
    globalThis.cancelAnimationFrame = () => undefined;
    // Create game instance
    // @ts-ignore
    game = new Game(mockCanvas as any, 24);
    // Override gameLoop to noop
    (game as any).gameLoop = vi.fn();
  });

  it('should initialize correctly', () => {
    expect(game.mode).toBe('start');
    expect(game.score).toBe(0);
    expect(game.lives).toBe(3);
    expect(game.level).toBe(1);
    expect(game.maze).toBeInstanceOf(Maze);
    expect(game.player).toBeInstanceOf(Player);
    expect(game.ghosts.length).toBe(4);
  });

  it('should start the game', () => {
    game.start();
    expect(game.mode).toBe('playing');
    expect(game.score).toBe(0);
    expect(game.lives).toBe(3);
    expect(game.level).toBe(1);
  });

  it('should handle pellet collection', () => {
    game.start();
    const pPos = game.player.getTilePos();
    game.maze.setTile(pPos.col, pPos.row, TILE.PELLET);
    
    game.update();
    
    expect(game.score).toBe(10);
    expect(game.maze.getTile(pPos.col, pPos.row)).toBe(TILE.EMPTY);
  });

  it('should handle power pellet collection', () => {
    game.start();
    const pPos = game.player.getTilePos();
    game.maze.setTile(pPos.col, pPos.row, TILE.POWER_PELLET);
    
    game.update();
    
    expect(game.score).toBe(50);
    expect(game.mode).toBe('frightened');
  });

  it('should handle death on ghost collision', () => {
    game.start();
    const pPos = game.player.getTilePos();
    const ghost = game.ghosts[0];
    ghost.col = pPos.col;
    ghost.row = pPos.row;
    ghost.inHouse = false;
    ghost.mode = GHOST_MODE.CHASE;

    game.update();

    expect(game.mode).toBe('death');
    expect(game.player.dead).toBe(
      true
    );
  });

  it('should trigger death only when ghost shares the same tile, not adjacent', () => {
    game.start();
    const pPos = game.player.getTilePos();
    const ghostSame = game.ghosts[0];

    // Same tile — should cause death
    ghostSame.inHouse = false;
    ghostSame.mode = GHOST_MODE.CHASE;
    ghostSame.col = pPos.col;
    ghostSame.row = pPos.row;
    game.update();
    expect(game.mode).toBe('death');
    expect(game.player.dead).toBe(true);
  });

  it('should not trigger death when ghost is adjacent (one tile away)', () => {
    game.start();
    const pPos = game.player.getTilePos();
    const ghost = game.ghosts[0];
    ghost.inHouse = false;
    ghost.mode = GHOST_MODE.CHASE;

    // Place ghost one tile to the right — adjacent, not same tile
    ghost.col = pPos.col + 1;
    ghost.row = pPos.row;
    game.update();

    expect(game.mode).not.toBe('death');
  });

  it('should handle level completion', () => {
    game.start();
    (game.maze as any).pelletsRemaining = 0;
    
    game.update();

    expect(game.mode).toBe('level_done');
  });
});
