import { describe, it, expect, beforeEach } from 'vitest';
import { TILE } from '../constants';
import { Maze } from '../maze';

describe('Maze', () => {
  let maze: Maze;

  beforeEach(() => {
    maze = new Maze();
  });

  describe('constructor', () => {
    it('should create maze with correct dimensions', () => {
      expect(maze.width).toBe(31);
      expect(maze.height).toBe(25);
      expect(maze.pelletsRemaining).toBeGreaterThan(0);
    });

    it('should count pellets correctly', () => {
      const baseMap = [
        [1,1,1,1,1],
        [1,2,2,2,1],
        [1,2,3,2,1],
        [1,1,1,1,1],
      ];
      const customMaze = new Maze(baseMap);
      expect(customMaze.width).toBe(5);
      expect(customMaze.height).toBe(4);
      // 3 pellets in row 1 + 2 pellets in row 2 + 1 power pellet in row 2 = 6
      expect(customMaze.pelletsRemaining).toBe(6);
    });

    it('should reject null map', () => {
      expect(() => new Maze(null)).toThrow("Map cannot be null or undefined");
    });
  });

  describe('getTile', () => {
    it('should return WALL (1) for border tiles', () => {
      expect(maze.getTile(0, 0)).toBe(TILE.WALL);
      expect(maze.getTile(30, 0)).toBe(TILE.WALL);
      expect(maze.getTile(0, 24)).toBe(TILE.WALL);
    });

    it('should return PELLET (2) for inner walkable tiles', () => {
      expect(maze.getTile(1, 1)).toBe(TILE.PELLET);
    });

    it('should return POWER_PELLET (3) for power pellet tiles', () => {
      // Power pellets are at positions like (1,3), (29,3), (1,20), (28,20)
      expect(maze.getTile(1, 3)).toBe(TILE.POWER_PELLET);
      expect(maze.getTile(29, 3)).toBe(TILE.POWER_PELLET);
      expect(maze.getTile(1, 20)).toBe(TILE.POWER_PELLET);
      expect(maze.getTile(28, 20)).toBe(TILE.POWER_PELLET);
    });

    it('should return GHOST_WALL (4) for ghost house walls', () => {
      // Ghost walls are in the ghost house at row 12, columns 13 and 14
      expect(maze.getTile(13, 12)).toBe(TILE.GHOST_WALL);
      expect(maze.getTile(14, 12)).toBe(TILE.GHOST_WALL);
    });

    it('should return GHOST_DOOR (5) for ghost house door', () => {
      expect(maze.getTile(14, 11)).toBe(TILE.GHOST_DOOR);
    });

    it('should return EMPTY (0) for tunnel area outside maze bounds', () => {
      expect(maze.getTile(-1, 12)).toBe(TILE.EMPTY);
      expect(maze.getTile(maze.width, 12)).toBe(TILE.EMPTY);
    });

    it('should return EMPTY for above-bounds row', () => {
      expect(maze.getTile(15, -1)).toBe(TILE.EMPTY);
    });

    it('should return correct tile for specific positions', () => {
      expect(maze.getTile(14, 11)).toBe(TILE.GHOST_DOOR);
      expect(maze.getTile(15, 9)).toBe(TILE.EMPTY); // Ghost house interior
    });
  });

  describe('setTile', () => {
    it('should update tile value', () => {
      maze.setTile(2, 2, TILE.EMPTY);
      expect(maze.getTile(2, 2)).toBe(TILE.EMPTY);
    });

    it('should persist tile changes', () => {
      maze.setTile(5, 5, TILE.WALL);
      expect(maze.getTile(5, 5)).toBe(TILE.WALL);
    });

    it('should clamp values within maze bounds', () => {
      // Should not throw or error
      maze.setTile(-5, -5, TILE.EMPTY);
      maze.setTile(maze.width * 2, maze.height * 2, TILE.EMPTY);
      expect(maze.pelletsRemaining).toBeGreaterThan(0);
    });
  });

  describe('isWalkable', () => {
    it('should return true for walkable tiles', () => {
      expect(maze.isWalkable(1, 1, false)).toBe(true);
      expect(maze.isWalkable(1, 2, false)).toBe(true);
      expect(maze.isWalkable(2, 1, false)).toBe(true);
    });

    it('should return false for walls', () => {
      expect(maze.isWalkable(0, 0, false)).toBe(false);
      expect(maze.isWalkable(1, 0, false)).toBe(false);
      expect(maze.isWalkable(30, 0, false)).toBe(false);
    });

    it('should return false for ghost walls for non-ghosts', () => {
      expect(maze.isWalkable(14, 12, false)).toBe(false);
    });

    it('should return true for ghost walls for ghosts', () => {
      expect(maze.isWalkable(14, 12, true)).toBe(true);
    });

    it('should return false for ghost door for non-ghosts', () => {
      expect(maze.isWalkable(14, 11, false)).toBe(false);
    });

    it('should return true for ghost door for ghosts (to allow exit)', () => {
      expect(maze.isWalkable(14, 11, true)).toBe(true);
    });

    it('should return true for tunnel (outside bounds)', () => {
      expect(maze.isWalkable(-1, 12, false)).toBe(true);
      expect(maze.isWalkable(maze.width, 12, false)).toBe(true);
    });

    it('should return false for out of bounds rows', () => {
      expect(maze.isWalkable(15, -1, false)).toBe(false);
      expect(maze.isWalkable(15, maze.height, false)).toBe(false);
    });
  });

  describe('canMove', () => {
    it('should allow movement in valid directions', () => {
      expect(maze.canMove(14, 11, { x: -1, y: 0 })).toBe(true);
      expect(maze.canMove(14, 11, { x: 1, y: 0 })).toBe(true);
    });

    it('should disallow movement into walls', () => {
      expect(maze.canMove(0, 0, { x: 1, y: 0 })).toBe(false);
      expect(maze.canMove(0, 0, { x: 0, y: 1 })).toBe(false);
    });

    it('should allow ghost movement through ghost walls', () => {
      // Ghosts can move through ghost walls
      expect(maze.canMove(13, 12, { x: 1, y: 0 }, true)).toBe(true);
      expect(maze.canMove(13, 12, { x: 0, y: -1 }, true)).toBe(true);
    });
  });

  describe('isAtCenter', () => {
    it('should return true for exact tile center', () => {
      expect(maze.isAtCenter(5.0, 5.0)).toBe(true);
      expect(maze.isAtCenter(10.0, 10.0)).toBe(true);
    });

    it('should return false for off-center positions', () => {
      expect(maze.isAtCenter(5.5, 5.0)).toBe(false);
      expect(maze.isAtCenter(10.0, 10.5)).toBe(false);
    });

    it('should respect tolerance parameter', () => {
      expect(maze.isAtCenter(5.1, 5.0, 0.2)).toBe(true);
      expect(maze.isAtCenter(5.5, 5.0, 0.2)).toBe(false);
    });
  });

  describe('resetPellets', () => {
    it('should restore all pellets', () => {
      // Eat some pellets using setTile (now properly updates pelletsRemaining)
      maze.setTile(1, 1, TILE.EMPTY);
      maze.setTile(2, 1, TILE.EMPTY);
      expect(maze.pelletsRemaining).toBeLessThan(new Maze().pelletsRemaining);

      // Reset and verify count is restored
      maze.resetPellets();
      const freshMaze = new Maze();
      expect(maze.pelletsRemaining).toBe(freshMaze.pelletsRemaining);
    });

    it('should reset correct tile types', () => {
      // Corrupt a power pellet
      maze.setTile(1, 3, TILE.EMPTY);
      maze.resetPellets();
      expect(maze.getTile(1, 3)).toBe(TILE.POWER_PELLET);
    });
  });

  describe('clone', () => {
    it('should create independent copy', () => {
      const cloned = maze.clone();
      // Use a known pellet position: (1, 1) is a pellet on the default maze
      cloned.setTile(1, 1, TILE.EMPTY);
      expect(maze.getTile(1, 1)).toBe(TILE.PELLET); // Original unchanged
    });

    it('should preserve pellet count', () => {
      const cloned = maze.clone();
      expect(cloned.pelletsRemaining).toBe(maze.pelletsRemaining);
    });
  });
});
