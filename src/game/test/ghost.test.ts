import { describe, it, expect, beforeEach } from 'vitest';
import { Ghost } from '../ghost';
import { Maze } from '../maze';
import { DIR, GHOST_MODE, GHOST_HOUSE, TILE } from '../constants';

describe('Ghost', () => {
  let maze: Maze;

  beforeEach(() => {
    maze = new Maze();
  });

  it('should initialize with correct values', () => {
    const ghost = new Ghost(0); // Blinky
    expect(ghost.col).toBeCloseTo(GHOST_HOUSE.x + (0 % 2 === 0 ? -1 : 1));
    expect(ghost.row).toBeCloseTo(GHOST_HOUSE.y);
    expect(ghost.mode).toBe(GHOST_MODE.HOUSE);
    expect(ghost.inHouse).toBe(true);
    expect(ghost.defeated).toBe(false);
  });

  it('should reset correctly', () => {
    const ghost = new Ghost(0);
    const startCol = ghost.col;
    ghost.setDefeated();
    ghost.col = 5;
    ghost.row = 5;
    ghost.reset();
    expect(ghost.col).toBe(startCol);
    expect(ghost.row).toBe(ghost.homeRow);
    expect(ghost.mode).toBe(GHOST_MODE.HOUSE);
    expect(ghost.inHouse).toBe(true);
    expect(ghost.defeated).toBe(false);
  });

  it('should switch to chase mode', () => {
    const ghost = new Ghost(0);
    ghost.inHouse = false;
    ghost.setChaseMode();
    expect(ghost.mode).toBe(GHOST_MODE.CHASE);
  });

  it('should switch to scatter mode', () => {
    const ghost = new Ghost(0);
    ghost.inHouse = false;
    ghost.setScatterMode();
    expect(ghost.mode).toBe(GHOST_MODE.SCATTER);
  });

  it('should switch to frightened mode', () => {
    const ghost = new Ghost(0);
    ghost.inHouse = false;
    ghost.setFrightened(100);
    expect(ghost.mode).toBe(GHOST_MODE.FRIGHTENED);
    expect(ghost.frightenedTimer).toBe(100);
  });

  it('should handle frightened timer expiration', () => {
    const ghost = new Ghost(0);
    ghost.inHouse = false;
    ghost.setFrightened(10);
    
    // Force it to be at center so it processes direction change
    ghost.col = 10;
    ghost.row = 10;

    // Update multiple times
    for(let i = 0; i < 15; i++) {
        ghost.update(10, 10, maze);
    }
    
    expect(ghost.mode).toBe(GHOST_MODE.CHASE);
  });

  it('should move towards target in chase mode', () => {
    const ghost = new Ghost(0);
    ghost.inHouse = false;
    ghost.mode = GHOST_MODE.CHASE;
    ghost.col = 10;
    ghost.row = 10;
     // Ghost at (10, 10) — a wall tile. Only DOWN (10, 11) is walkable.
     // Ghost should pick the only walkable direction and not go through walls.
     
    ghost.update(11, 11, maze);
     
     // Ghost must have moved to a walkable tile direction (regression: was going through wall)
    const rc = Math.round(ghost.col);
    const rr = Math.round(ghost.row);
    expect(maze.isWalkable(rc + ghost.dir.x, rr + ghost.dir.y, true)).toBe(true);
   });
  it('should handle tunneling', () => {
    const ghost = new Ghost(0);
    ghost.inHouse = false;
    ghost.col = -1.5;
    ghost.row = 10;
    ghost.dir = DIR.LEFT;
    
    ghost.update(10, 10, maze);
    
    expect(ghost.col).toBeGreaterThan(-1);
  });
});
