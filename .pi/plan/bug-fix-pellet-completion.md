# Bug Fix Plan — Pellet Completion & Stage End

## Problem

Eating all pellets does not reliably complete the stage. Sometimes the level never ends; sometimes it ends with a delay.

## Root Causes

1. **Double-decrement**: `pelletsRemaining` is decremented twice per pellet eaten — once in `Game.checkPelletCollection()` (explicit `--`) and once inside `Maze.setTile()` (automatic). This causes the counter to drift negative.

2. **Completion check is pellet-gated**: The level completion check (`pelletsRemaining <= 0 → mode = 'level_done'`) lives inside `checkPelletCollection()`, which only fires when the player is on a pellet/power-pellet tile. When the last pellet is a power pellet, `mode` switches to `'frightened'` first, then the player stands on an empty tile. The completion check never fires on empty tiles, so the level hangs until the player happens to revisit a pellet tile (which doesn't exist).

3. **Frightened mode expiry mask**: When frightened mode expires and reverts to `'playing'`, `updatePlaying()` runs again but `checkPelletCollection()` only checks the current tile. If `pelletsRemaining <= 0` but the player is on `EMPTY`, the completion condition is silently skipped forever.

---

## Fix Steps

### Step 1 — Remove double-decrement (`game/Game.ts`)

Remove the explicit `this.maze.pelletsRemaining--` lines from `checkPelletCollection()`. `Maze.setTile()` already handles this counter correctly when changing a pellet tile to `EMPTY`.

**Before:**
```ts
if (tile === TILE.PELLET) {
  this.maze.setTile(pos.col, pos.row, TILE.EMPTY);
  this.maze.pelletsRemaining--;      // ← REMOVE
  this.score += 10;
  this.soundEngine.eatPellet();
} else if (tile === TILE.POWER_PELLET) {
  this.maze.setTile(pos.col, pos.row, TILE.EMPTY);
  this.maze.pelletsRemaining--;      // ← REMOVE
  this.score += 50;
  this.soundEngine.eatPowerPellet();
  this.activateFrightened();
}
```

**After:**
```ts
if (tile === TILE.PELLET) {
  this.maze.setTile(pos.col, pos.row, TILE.EMPTY);
  this.score += 10;
  this.soundEngine.eatPellet();
} else if (tile === TILE.POWER_PELLET) {
  this.maze.setTile(pos.col, pos.row, TILE.EMPTY);
  this.score += 50;
  this.soundEngine.eatPowerPellet();
  this.activateFrightened();
}
```

---

### Step 2 — Extract unconditional level completion check (`game/Game.ts`)

Extract the completion logic into its own method and call it every frame regardless of player position.

**New method:**
```ts
private checkLevelComplete(): void {
  if (this.mode !== 'death' && this.maze.pelletsRemaining <= 0) {
    this.mode = 'level_done';
    this.soundEngine.levelUp();
  }
}
```

**Changes to `updatePlaying()`:**
After the existing calls (`checkPelletCollection`, `updateGhosts`, `checkGhostCollisions`, chase/scatter timer), append `this.checkLevelComplete();`.

**Changes to `updateFrightened()`:**
Append `this.checkLevelComplete();` at the end (after `frightenedTimer` decrement and `mode` revert).

**Remove** the completion block from `checkPelletCollection()`:
```ts
// REMOVE THIS BLOCK from checkPelletCollection():
if (this.maze.pelletsRemaining <= 0 && this.mode !== 'death') {
  this.mode = 'level_done';
  this.soundEngine.levelUp();
}
```

---

### Step 3 — Regression tests (`game/test/game.test.ts`)

Add 4 new test cases:

1. **"should decrement pelletsRemaining exactly once per pellet eaten"**
   - Set `pelletsRemaining` to a known value, place a PELLET on player tile, call `update()`
   - Assert `pelletsRemaining` decreased by exactly 1

2. **"should decrement pelletsRemaining exactly once per power pellet eaten"**
   - Same as above but with POWER_PELLET
   - Assert `pelletsRemaining` decreased by exactly 1

3. **"should complete level immediately when last pellet is eaten"**
   - Set `pelletsRemaining = 1`, place PELLET on player tile, call `update()`
   - Assert `mode === 'level_done'` and `pelletsRemaining === 0`

4. **"should complete level when last power pellet is eaten"**
   - Set `pelletsRemaining = 1`, place POWER_PELLET on player tile, call `update()`
   - Assert `pelletsRemaining === 0`
   - Assert `mode === 'level_done'` (not stuck in `'frightened'`)

---

## Files Changed

| File | Change |
|------|--------|
| `src/game/Game.ts` | Remove 2 lines + add `checkLevelComplete()` method + call from 2 hot paths |
| `src/game/test/game.test.ts` | Add 4 regression tests |
| `src/game/maze.ts` | No change (setTile counter logic is correct) |

## Verification Criteria

- All existing tests pass
- All 4 new tests pass
- Manual play: level completes immediately after last pellet, regardless of pellet type
