# Bug Report: Player Movement Stuck in Corridor

## Reproduction
1. Start the game
2. Player moves right from spawn position (14, 20)
3. Gets stuck in the middle of a corridor with no visible obstacle
4. When trying to turn left, stops in the middle of two cells instead of at an intersection

## Root Cause Analysis

### Thesis 1: Snap-to-center caused position oscillation
The player's `isAtCenter` function used `PLAYER_SPEED_BASE` (0.08) as tolerance, which **equaled** the player's speed (also 0.08). This created two overlapping issues:

**Issue A: Snap-to-center back-propagation**
When the player was within the tolerance zone of a tile center, the code would snap `this.col = rc` and `this.row = rr` to the grid center. Then on the same frame, the player moved forward by `speed`. If speed < tolerance, the player was still within tolerance on the next frame → get snapped back → repeat → stuck in an oscillation loop.

```
Frame N: player at (8, 0.06) → center distance = 0.06 < 0.08 → snap to (8, 0) → move to (8, 0.08)
Frame N+1: player at (8, 0.08) → center distance = 0.08 < 0.08 = FALSE → no snap → OK...
Frame N+2: ... (continues moving)
```

But if the player was moving in a direction where the cell ahead was WALKABLE, the snap-back and re-move would cancel out, leaving the player oscillating around the center point without actually leaving the tile.

**Issue B: Tolerance equals speed boundary**
At exactly one speed-step from center (distance = 0.08), `0.08 < 0.08` evaluates to `false` due to the strict less-than comparison. The center check fails exactly when the player should be "near enough" to center for turning purposes.

### Validation Tests
- Player stuck for 29/30 consecutive frames at row boundary (`expect(30).toBeLessThan(3)`)
- Player only moved 0.56 tiles in 100 frames instead of ~6 tiles
- Player at (14.92, 15.0) oscillated 10 out of 11 frames at exact same positions

## Fix Applied

Two changes in `src/game/player.ts`:

### Change 1: Removed snap-to-center logic
```diff
- // Snap position to tile center
- if (maze.canMove(rc, rr, this.nextDir)) {
-   this.col = rc;
-   this.row = rr;
-   this.dir = { ...this.nextDir };
- }
+ // Change direction at intersections if nextDir is valid — do NOT snap position
+ if (atCenter && maze.canMove(Math.round(this.col), Math.round(this.row), this.nextDir)) {
+   this.dir = { ...this.nextDir };
+ }
```

### Change 2: Fixed tolerance value
```diff
- const tolerance = PLAYER_SPEED_BASE;
+ // Tolerance slightly larger than speed for reliable edge detection
+ const tolerance = 0.1;
```

## Result
- All 81 existing tests pass
- Player now walks through corridors freely without getting stuck
- Direction changes happen cleanly at intersections
- Test added: `stuck-movement.repro.test.ts` covering all three symptoms
