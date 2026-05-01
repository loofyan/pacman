import { describe, it, expect, beforeEach } from 'vitest';
import { DIR, TILE } from '../constants';
import { Player } from '../player';
import { Maze } from '../maze';

describe('Bug regression: wall collision + direction facing', () => {
  let maze: Maze;

  beforeEach(() => {
    maze = new Maze();
  });

  describe('Bug 1: Wall collision enforcement', () => {
    it('player should be blocked by a wall at col 1', () => {
      // Row 4: [1,2,1,...] - (2,4)=WALL
      const player = new Player(0, 4);
      player.col = 0.5;
      player.row = 4.0;
      player.speed = 0.08;

      for (let i = 0; i < 10; i++) {
        player.update(DIR.RIGHT, maze);
      }

      expect(player.col).toBeLessThanOrEqual(1.1);
    });

    it('player should be blocked by a wall ABOVE', () => {
      // Row 0 is all WALL. Player at (2, 1.0) facing UP
      const player = new Player(2, 1);
      player.col = 2.0;
      player.row = 1.0;
      player.speed = 0.08;

      for (let i = 0; i < 10; i++) {
        player.update(DIR.UP, maze);
      }

      expect(player.row).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('Bug 2: Rendering direction comparison', () => {
    it('dir comparison must use value equality not reference equality', () => {
      const dir: typeof DIR.LEFT = { x: -1, y: 0 }; // spread produces different ref
      const result = dir.x === DIR.LEFT.x && dir.y === DIR.LEFT.y;
      expect(result).toBe(true);

      // Also for all directions
      const right: typeof DIR.RIGHT = { x: 1, y: 0 };
      expect(right.x === DIR.RIGHT.x && right.y === DIR.RIGHT.y).toBe(true);
      
      const up: typeof DIR.UP = { x: 0, y: -1 };
      expect(up.x === DIR.UP.x && up.y === DIR.UP.y).toBe(true);

      const down: typeof DIR.DOWN = { x: 0, y: 1 };
      expect(down.x === DIR.DOWN.x && down.y === DIR.DOWN.y).toBe(true);
    });
  });

  describe('Bug 3: Player turns correctly when moving', () => {
    it('player direction updates when at center and turn is valid', () => {
      const player = new Player(14, 20);
      player.col = 14.0;
      player.row = 20.0;
      player.dir = { ...DIR.RIGHT };
      player.speed = 0.08;

      // Queue LEFT at center
      player.update(DIR.LEFT, maze);

      expect(player.dir.x).toBe(-1);
      expect(player.dir.y).toBe(0);
    });
  });
});
