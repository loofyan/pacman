import { describe, it, expect, beforeEach } from 'vitest';
import { Ghost } from '../ghost';
import { Maze } from '../maze';
import { DIR, GHOST_HOUSE, TILE } from '../constants';

describe('Ghost wall collision regression', () => {
  let maze: Maze;

  beforeEach(() => {
    maze = new Maze();
   });

  describe('Bug: ghosts can move through walls', () => {
    it('should not move through a wall when released from the ghost house', () => {
       // Ghost released from house is placed at (GHOST_HOUSE.x, GHOST_HOUSE.y - 1) = (14, 10)
       // Row 10, col 14 is a WALL tile (value 1)
      const ghost = new Ghost(0);
      ghost.inHouse = false;
      ghost.col = GHOST_HOUSE.x;    // 14
      ghost.row = GHOST_HOUSE.y - 1; // 10 — THIS IS A WALL TILE
      ghost.dir = { ...DIR.UP };
      ghost.mode = 'chase';

      // Verify the starting position is indeed a wall
      expect(maze.getTile(14, 10)).toBe(TILE.WALL);

      // Player is far away so the ghost's target pulls it toward the wall
      const playerCol = 14;
      const playerRow = 2; // far above, so ghost wants to go UP through the wall

      const startCol = ghost.col;
      const startRow = ghost.row;

      // Run several update frames
      for (let i = 0; i < 10; i++) {
        ghost.update(playerCol, playerRow, maze);
       }

      // The ghost should NOT have moved into the wall above it
      // (14, 9) is also a WALL. If moving through walls, col would still be 14 but row would decrease.
      // Valid moves from (14, 10) for ghosts: DOWN (14,11=GHOST_DOOR) or RIGHT (15,10=EMPTY)
      // So the ghost should have moved DOWN or RIGHT, not UP.
      expect(ghost.row).toBeGreaterThanOrEqual(startRow);
     });

    it('_pickBestDir should always return a walkable direction', () => {
       // Place ghost at a wall tile where UP is blocked but DOWN/RIGHT are walkable
      const ghost = new Ghost(0);
      ghost.inHouse = false;
      ghost.col = 14;
      ghost.row = 10;
      ghost.dir = { ...DIR.UP };

      // Run one update — ghost should pick a valid direction
      ghost.update(14, 5, maze);

      // After one update, the ghost's chosen direction must point to a walkable tile
      const rc = Math.round(ghost.col);
      const rr = Math.round(ghost.row);
      expect(maze.isWalkable(rc + ghost.dir.x, rr + ghost.dir.y, true)).toBe(true);
     });

    it('should not pass through walls on repeated updates', () => {
       // Simulate ghost released from house, chasing a player
      const ghost = new Ghost(0);
      ghost.inHouse = false;
      ghost.col = GHOST_HOUSE.x;     // 14
      ghost.row = GHOST_HOUSE.y - 1; // 10 — WALL
      ghost.dir = { ...DIR.UP };
      ghost.mode = 'chase';

      const startCol = ghost.col;

      // Run many updates — ghost should never end up in a wall tile
      for (let i = 0; i < 50; i++) {
        ghost.update(15 + (i % 5), 20, maze);
       }

      // After arriving at any tile center, that tile must be walkable for ghosts
      const finalRc = Math.round(ghost.col);
      const finalRr = Math.round(ghost.row);
      expect(maze.isWalkable(finalRc, finalRr, true)).toBe(true);
     });

    it('should pick a walkable direction even when current direction points to a wall', () => {
       // Create a scenario where the ghost's current direction points to a wall
      const ghost = new Ghost(0);
      ghost.inHouse = false;
      ghost.col = 14;
      ghost.row = 10;
      ghost.dir = { ...DIR.UP }; // points to (14, 9) which is WALL
      ghost.mode = 'chase';

      // Before update, verify current direction is unwalkable
      expect(maze.isWalkable(14 + 0, 10 + (-1), true)).toBe(false); // UP is wall

      // Trigger one update — ghost should NOT move through the wall
      const startRow = ghost.row;
      ghost.update(14, 2, maze);

      // Ghost should have moved away from the wall (DOWN or RIGHT), not through it (UP)
      expect(ghost.row).toBeGreaterThanOrEqual(startRow - 0.001);
     });
  });
});
