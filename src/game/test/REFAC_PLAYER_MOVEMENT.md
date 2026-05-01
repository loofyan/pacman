# Refactor: Player Movement — Instructions

## Current Architecture (what exists today)

The player has two position attributes (`col`, `row` as floats), a `dir` (current movement direction), a `nextDir` (buffered input), and a speed of 0.08 tiles/frame. The core movement loop is in `Player.update()`:

```
1. Check if position is within tolerance (0.1) of a tile center
2. If near center AND a key is pressed, buffer that direction into nextDir
3. If near center AND nextDir is walkable, IMMEDIATELY switch to that direction
4. Move forward by speed (0.08) — only if the tile ahead is walkable
5. If blocked by a wall, snap (Math.round) to nearest integer position
```

## Fundamental Design Problems

### PROBLEM 1: No tile-level alignment concept

There is no distinction between "on a tile" (aligned to an integer grid position) and "between tiles" (moving from one tile to the next). The player exists in a continuous coordinate space but the maze is discrete. This creates three categories of positions:

- `col = 15.0` → centered on tile (15, row)
- `col = 15.42` → traveling through space between tiles
- `col = 15.92` → one speed-step from tile (16, row)

The player is never *truly* aligned to a tile — they snap with `Math.round` only when stopped by a wall, which is a stop-gap, not a design.

**Impact:** Turning logic checks `isAtCenter` with a fuzzy tolerance (0.1) instead of a precise tile-aligned predicate. The player can turn while 0.08 tiles off, causing them to approach walls at an angle.

### PROBLEM 2: Turning triggers while offset from tile center

When the player is within the tolerance zone around a tile center (within 0.1 tiles), they can turn. But 0.08 < 0.1, so the player turns **one frame after** reaching center — while still offset by 0.08 tiles from the tile center.

This means: if moving RIGHT toward a wall at tile 16, at `col = 15.92`, the player is still in the tolerance zone. Pressing LEFT triggers a turn. The player's center is now at col 15.92, but the left direction makes them walk left — however, because their position is off-center, the first few frames of moving left put them partially inside the wall at tile 16 (since they were walking INTO tile 16's space to reach 15.92).

**Impact:** Turning early (before reaching the precise tile center) offsets the player's walking path. They end up walking "half on the route, half on the wall."

### PROBLEM 3: Snap-to-center is applied inconsistently

When speed > tolerance, the player naturally snaps to center when arriving near a tile. When speed < tolerance (the current case), the player arrives at center but the snap logic never fires because they drift through the tolerance zone without ever being "at center" when moving. Then when they stop against a wall at 15.92 and snap to 16.0, they've jumped.

Even the current `Math.round(this.col) / Math.round(this.row)` stop-gap causes two sub-problems:
- **jumps:** visual discontinuity when position snaps
- **wrong stopping point:** if moving RIGHT from 15 toward tile 16, `Math.round(15.92) = 16` places the player *inside* the wall, not just outside it

### PROBLEM 4: Direction queue (`nextDir`) and immediate turn logic fight each other

The code has two competing direction-change mechanisms:
1. **Queue:** `nextDir` stores the press, applied later when reaching center
2. **Instant:** `if (queuedDir.x !== 0) this.dir = queuedDir` — applies immediately if walkable

The instants turn happens **every frame**, not just once at the center. So if you hold LEFT while moving RIGHT, you'll instantaneously switch direction as soon as `canMove` is true — even from the middle of a corridor. This is not how Pac-Man works; turning should only happen *at intersections*.

### PROBLEM 5: Ghost movement and player movement are misaligned

The Ghost class uses the same fundamental model (continuous coords, tolerance-based center detection) but applies it more consistently: ghosts always snap to exact integer positions when at a center. The player does it only on wall collision. This creates inconsistent collision detection between player and ghosts — both use `Math.round()` to check for overlaps.

## Classic Pac-Man Movement Model

In the original Pac-Man game, movement is **tile-driven**, not position-driven:

- The player exists at an **exact tile** (integer row/col)
- Movement is a discrete step: `targetTile = currentTile + dir`
- The player is "between" tiles during the animation, approaching the target
- Direction changes **only** happen when the player is exactly at a tile center
- The pending direction is checked **at the tile center**, not at any arbitrary offset
- When the player hits a wall, they stop at the **last valid tile** (not snapped to an arbitrary center)

There are two valid approaches:

### APPROACH A: True discrete step model (recommended)

```
state: position = integer { col, row }  (always aligned to grid)
state: progress = float 0..1  (fractional progress toward next tile)
state: dir = Direction
state: pendingDir = Direction | null

update():
  if at tile center (progress == 1):
    if pendingDir exists and tile(pendingDir) is walkable:
      dir = pendingDir
      pendingDir = null
    target = currentTile + dir (walk check)
    if walkable:
      targetTile = target
    else:
      stop (remain at currentTile, progress = 1)
  else:
    progress += speed / 1.0  (progress advances toward 1.0)
  renderPosition = currentTile + (targetTile - currentTile) * progress
```

This ensures:
- Turning only happens at exact tile centers
- The player is always cleanly aligned when deciding to turn
- No "half wall" issue — turns happen from the center, not the edge
- No snap jumps — progress interpolates smoothly

### APPROACH B: Continuous position with tile-aligned turn gate

```
state: position = float { x, y }  (continuous)
state: tileCol = Math.round(x), tileRow = Math.round(y)
state: dir = Direction
state: pendingDir = Direction | null
state: atTileCenter = { x, y } == { tileCol, tileRow }  (not approximate)

update():
  // Check turn ONLY at exact center
  if pos exactly at tile center (not within tolerance):
    if pendingDir exists and tile(pendingDir) is walkable:
      dir = pendingDir
      pendingDir = null
  
  // Always continue in dir unless blocked
  targetTile = tileCol + dir
  if tile(targetTile) not walkable:
    stop (don't move, don't snap)
  else:
    pos += dir * speed
```

This ensures exact center checking, but requires that progress *never* lands on a tile center unless it's the destination. The tolerance-based center is replaced by an exact equality check.

## What the Refactoring Agent Must Do

### Scope: Rewrite `Player` class movement in `src/game/player.ts`

### Inputs: `queuedDir` (Direction pressed by player), `maze: Maze`

### Output: Player moves smoothly through the maze, turns at intersections, stops cleanly at walls

### Requirements:

1. **Direction changes only at tile centers.** A turn must only be allowed when the player is at an exact tile grid position (integer coordinates after the movement step completes). Use `progress == 1` or exact integer check — not fuzzy tolerance.

2. **Pending direction buffering.** Player presses a key → direction is stored in a buffer. The buffer is consumed at the next tile center (not instantaneously, not repeatedly each frame).

3. **Clean wall stopping.** When the player hits a wall, they must stop at the **last walkable tile** they were at. No snapping to arbitrary centers. No jumping. The position is always exactly at a tile center when stationary.

4. **Smooth visual movement.** During travel between tiles, render position should interpolate linearly from the current tile to the target tile. No frame-level jumps.

5. **No turning before reaching a cell.** The player must walk the full length of a corridor in one direction before they can change direction. They should not be able to "cut a corner" into a wall.

6. **Compatible with ghost collision.** Collision detection uses `Math.round(player.col)` / `Math.round(player.row)`. Since the player will always be at exact integer positions when turning or stopped, and near-integer during travel, ghost-to-player collision must remain accurate.

7. **Tunnel wrapping must still work.** Wrap around the maze edges when the player passes through the tunnel zone.

8. **Keep existing public API.** `Player.col`, `Player.row`, `Player.dir`, `Player.nextDir` must remain (may change type/signature but not eliminate them). `getTilePos()`, `reset()`, `dead` flag all stay.

9. **Keep `isWalkable` and `canMove` from Maze.** These are the source of truth for walkability. The new code calls them — doesn't duplicate.

10. **All existing tests must pass.** No behavioral change expected that would break tests. Add regression tests for wall-stopping and turning.

### Ghost class: also needs review but lower priority

The ghost class has the same `atCenter` tolerance problem (hardcoded 0.15 vs speed). Apply same approach: change turns only at exact tile centers.

### Files to modify:

- `src/game/player.ts` — main movement rewrite
- `src/game/ghost.ts` — apply same alignment concept
- `src/game/test/stuck-movement.repro.test.ts` — may need updating
- Add new test: `src/game/test/movement-alignment.test.ts`

### What NOT to do:

- Don't change tile size, speed, or maze layout
- Don't change rendering
- Don't change ghost AI logic, only their movement alignment
- Don't change pellet collection logic
- Don't change tunnel wrapping logic
