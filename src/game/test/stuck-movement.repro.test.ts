import { describe, it, expect, beforeEach } from 'vitest';
import { DIR, PLAYER_SPEED_BASE } from '../constants';
import { Player } from '../player';
import { Maze } from '../maze';

describe('Bug reproduction: player gets stuck in corridor (user-reported)', () => {
  let maze: Maze;

  beforeEach(() => {
    maze = new Maze();
  });

  it('player traverses open corridor without getting stuck mid-corridor', () => {
    // Main corridor at row 20, cols 15-21 are all walkable.
    // Player should be able to walk freely without getting stuck at any frame.
    const p = new Player(14, 20);
    p.dir = { ...DIR.RIGHT };
    p.speed = PLAYER_SPEED_BASE;
    p.col = 15.0;
    p.row = 20.0;

    let maxStreakAtCenter = 0;
    let stuck = false;
    const beforePos = p.col;
    
    // Walk toward the wall at col 22
    for (let i = 0; i < 100; i++) {
      const beforeCol = p.col;
      
      // Count consecutive frames where player is at center but not moving (potential oscillation)
      const wasAtCenter = p.col < 15.92; // Approximate center check
      const beforeAtCenter = wasAtCenter;
      
      p.update({ ...DIR.RIGHT }, maze);
      const colDiff = Math.abs(p.col - beforeCol);
      
      if (beforeAtCenter && colDiff < 1e-10) {
        stuck = true;
        maxStreakAtCenter++;
      } else {
        stuck = false;
      }
    }

    // Player should NOT be stuck at all
    expect(maxStreakAtCenter).toBeLessThan(1);
    // And should have moved forward (toward the wall at col 22)
    const dist = p.col - beforePos;
    expect(dist).toBeGreaterThan(0);
  });

  it('player can turn LEFT at an intersection', () => {
    const p = new Player(14, 20);
    p.dir = { ...DIR.DOWN };
    p.speed = PLAYER_SPEED_BASE;
    p.col = 15.0;
    p.row = 20.0;

    // Queue LEFT at intersection
    p.update({ ...DIR.LEFT }, maze);
    
    // Should turn LEFT
    expect(p.dir.x).toBe(-1);
    
    // And move in that direction
    const colStart = p.col;
    for (let i = 0; i < 10; i++) {
      p.update({ ...DIR.LEFT }, maze);
    }
    expect(p.col).toBeLessThan(colStart - 0.5);
  });

  it('player does NOT oscillate when approaching any tile center', () => {
    // Place player near but not exactly at tile center
    // Should approach and pass through the center without getting stuck
    const p = new Player(14, 12);
    p.dir = { ...DIR.DOWN };
    p.speed = PLAYER_SPEED_BASE;
    p.col = 15.0;
    p.row = 3.92; // 0.08 from center of row 4

    const rowBefore = p.row;
    for (let i = 0; i < 10; i++) {
      p.update({ ...DIR.DOWN }, maze);
    }
    
    expect(p.row).toBeGreaterThan(rowBefore + 0.01); // Must advance
  });
});
