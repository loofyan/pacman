import {
  DIR,
  GHOST_MODE,
  GHOST_COLORS,
  GHOST_NAMES,
  CHASE_TARGETS,
  SCATTER_TARGETS,
  GHOST_HOUSE,
  GHOST_SPEED_BASE,
  FRIGHTENED_DURATION,
  DEFEAT_COOLDOWN,
} from './constants';
import type { Direction, GhostMode } from './constants';
import type { Maze } from './maze';

export interface GhostState {
  col: number;
  row: number;
  dir: Direction;
  mode: GhostMode;
  color: string;
  name: string;
  speed: number;
  frightenedTimer: number;
  defeated: boolean;
  inHouse: boolean;
  releaseTimer: number;
  scatterTimer: number;
  // Internal state
  homeCol: number;
  homeRow: number;
}

export class Ghost {
  public col: number;
  public row: number;
  public dir: Direction;
  public mode: GhostMode;
  public color: string;
  public name: string;
  public speed: number;
  public frightenedTimer: number;
  public defeated: boolean;
  public inHouse: boolean;
  public releaseTimer: number;
  public scatterTimer: number;
  public defeatedCooldown: number;

  // Discrete movement internals
  private _fromCol!: number;
  private _fromRow!: number;
  private _toCol!: number;
  private _toRow!: number;
  private _progress!: number;
  private _initialReleaseTimer!: number;

  constructor(index: number) {
    const startCol = GHOST_HOUSE.x + (index % 2 === 0 ? -1 : 1);
    const startRow = GHOST_HOUSE.y;
    this.col = startCol;
    this.row = startRow;
    this.dir = { ...DIR.UP };
    this.mode = GHOST_MODE.HOUSE;
    this.color = GHOST_COLORS[index % GHOST_COLORS.length];
    this.name = GHOST_NAMES[index % GHOST_NAMES.length];
    this.speed = GHOST_SPEED_BASE;
    this.frightenedTimer = 0;
    this.defeated = false;
    this.inHouse = true;
    this._initialReleaseTimer = index * 30 + 60;
    this.releaseTimer = this._initialReleaseTimer;
    this.scatterTimer = 0;
    this.defeatedCooldown = 0;
    this.homeCol = startCol;
    this.homeRow = startRow;
    this._initDiscrete(startCol, startRow);
  }

  reset(): void {
    this.col = this.homeCol;
    this.row = this.homeRow;
    this.dir = { ...DIR.UP };
    this.mode = GHOST_MODE.HOUSE;
    this.frightenedTimer = 0;
    this.defeated = false;
    this.inHouse = true;
    this.releaseTimer = this._initialReleaseTimer;
    this.defeatedCooldown = 0;
    this._initDiscrete(this.homeCol, this.homeRow);
  }

  setChaseMode(): void {
    if (this.inHouse || this.defeated) return;
    this.mode = GHOST_MODE.CHASE;
    this.scatterTimer = 0;
  }

  setScatterMode(): void {
    if (this.inHouse || this.defeated) return;
    this.mode = GHOST_MODE.SCATTER;
    this.scatterTimer = 0;
  }

  setFrightened(duration: number): void {
    if (this.defeated || this.inHouse) return;
    this.mode = GHOST_MODE.FRIGHTENED;
    this.frightenedTimer = duration;
    // Reverse direction when frightened
    this.dir = { x: -this.dir.x, y: -this.dir.y };
  }

  setDefeated(): void {
    this.defeated = true;
    this.mode = GHOST_MODE.RETURN;
    this.frightenedTimer = 0;
  }

  update(playerCol: number, playerRow: number, maze: Maze): void {
    this.scatterTimer++;

    // Handle house timer (no movement needed)
    if (this.inHouse) {
      if (this.defeatedCooldown > 0) {
        this.defeatedCooldown--;
        return;
      }
      this.releaseTimer--;
      if (this.releaseTimer <= 0) {
        this.inHouse = false;
        // Release ghost above the house
        this.col = GHOST_HOUSE.x;
        this.row = GHOST_HOUSE.y - 1;
        this.dir = { ...DIR.UP };
        this.mode = GHOST_MODE.CHASE;
        this.defeatedCooldown = 0;
        this._initDiscrete(this.col, this.row);
      }
      return;
    }

    // Handle frightened timer
    if (this.mode === GHOST_MODE.FRIGHTENED) {
      this.frightenedTimer--;
      if (this.frightenedTimer <= 0) {
        this.mode = GHOST_MODE.CHASE;
      }
    }

    // Handle defeated return
    if (this.defeated) {
      const target = GHOST_HOUSE;
      if (Math.abs(this.col - target.x) < 0.5 && Math.abs(this.row - target.y) < 0.5) {
        this.defeated = false;
        this.mode = GHOST_MODE.HOUSE;
        this.inHouse = true;
        this.defeatedCooldown = DEFEAT_COOLDOWN;
      }
    }

    const atCenter = this._progress >= 1;

    if (!atCenter) {
      // Still traveling — advance progress
      this._progress += this.speed;

      if (this._progress >= 1) {
        // Arrived at target tile
        this._syncToTarget();
        this._progress = 1;
      } else {
        // Interpolate visual position
        const t = this._progress;
        this.col = this._fromCol + (this._toCol - this._fromCol) * t;
        this.row = this._fromRow + (this._toRow - this._fromRow) * t;
      }

      // Tunnel wrap while moving
      if (this.col < -1) this.col = maze.width + 1;
      if (this.col > maze.width + 1) this.col = -1;

      return;
    }

    // ─── At tile center — pick new direction ───

    const rc = Math.round(this.col);
    const rr = Math.round(this.row);
    let targetCol: number, targetRow: number;

    // Determine target for direction choosing
    if (this.defeated) {
      targetCol = GHOST_HOUSE.x;
      targetRow = GHOST_HOUSE.y;
    } else if (this.mode === GHOST_MODE.FRIGHTENED) {
      // Random valid direction
      this.dir = this._pickRandomDir(rc, rr, maze);
      // Start moving immediately in that direction
      this._startStep(rc + this.dir.x, rr + this.dir.y);
      this.col += this.dir.x * this.speed;
      this.row += this.dir.y * this.speed;
      // Tunnel wrap
      if (this.col < -1) this.col = maze.width + 1;
      if (this.col > maze.width + 1) this.col = -1;
      return;
    } else if (this.mode === GHOST_MODE.SCATTER) {
      const idx = GHOST_NAMES.indexOf(this.name);
      targetCol = SCATTER_TARGETS[idx % SCATTER_TARGETS.length].x;
      targetRow = SCATTER_TARGETS[idx % SCATTER_TARGETS.length].y;
    } else {
      // Chase mode
      const idx = GHOST_NAMES.indexOf(this.name);
      const offset = CHASE_TARGETS[idx % CHASE_TARGETS.length];
      targetCol = playerCol + offset.x;
      targetRow = playerRow + offset.y;
    }

    // Pick direction that minimizes distance to target
    this.dir = this._pickBestDir(rc, rr, targetCol, targetRow, maze);

    // Start moving toward next tile
    this._startStep(rc + this.dir.x, rr + this.dir.y);
    this.col += this.dir.x * this.speed;
    this.row += this.dir.y * this.speed;

    // Tunnel wrap for ghosts
    if (this.col < -1) this.col = maze.width + 1;
    if (this.col > maze.width + 1) this.col = -1;
  }

  // ───── Discrete movement helpers ─────

  private _initDiscrete(col: number, row: number): void {
    this._fromCol = col;
    this._fromRow = row;
    this._toCol = col;
    this._toRow = row;
    this._progress = 1;
  }

  private _syncToTarget(): void {
    this.col = this._toCol;
    this.row = this._toRow;
    this._fromCol = this._toCol;
    this._fromRow = this._toRow;
  }

  private _startStep(toCol: number, toRow: number): void {
    this._fromCol = Math.round(this.col);
    this._fromRow = Math.round(this.row);
    this._toCol = toCol;
    this._toRow = toRow;
    this._progress = 0;
  }

  private _pickBestDir(
    rc: number,
    rr: number,
    targetCol: number,
    targetRow: number,
    maze: Maze
  ): Direction {
    const dirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
    let bestDir: Direction | null = null;
    let bestDist = Infinity;

    for (const d of dirs) {
       // Don't allow reversing direction
      if (d.x === -this.dir.x && d.y === -this.dir.y) continue;

      const nc = rc + d.x;
      const nr = rr + d.y;
      if (!maze.isWalkable(nc, nr, true)) continue;

      const dist = distance(nc, nr, targetCol, targetRow);
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = d;
       }
      }

     // Fallback to reverse if completely stuck (dead end)
    if (bestDir === null) {
      return { x: -this.dir.x, y: -this.dir.y };
       }
    return bestDir;
   }

  private _pickRandomDir(rc: number, rr: number, maze: Maze): Direction {
    const dirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
    const valid = dirs.filter(d => {
      // Don't reverse (unless it's the only option)
      if (d.x === -this.dir.x && d.y === -this.dir.y && validCount(rc, rr, maze) > 1) return false;
      const nc = rc + d.x;
      const nr = rr + d.y;
      return maze.isWalkable(nc, nr, true);
    });

    if (valid.length === 0) {
      return { x: -this.dir.x, y: -this.dir.y };
    }

    return valid[Math.floor(Math.random() * valid.length)];
  }

  getPixelPos(tileSize: number, offset: number = 0) {
    return {
      x: this.col * tileSize + tileSize / 2,
      y: this.row * tileSize + tileSize / 2 + offset,
    };
  }
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function validCount(rc: number, rr: number, maze: Maze): number {
  const dirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
  return dirs.filter(d => maze.isWalkable(rc + d.x, rr + d.y, true)).length;
}
