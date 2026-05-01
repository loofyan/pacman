import { DIR, PLAYER_SPEED_BASE } from './constants';
import type { Direction } from './constants';
import type { Maze } from './maze';

export interface PlayerState {
  col: number;
  row: number;
  dir: Direction;
  nextDir: Direction;
  speed: number;
  mouthOpen: number;
  mouthDir: number;
}

export class Player {
  public col: number;
  public row: number;
  public dir: Direction;
  public nextDir: Direction;
  public speed: number;
  public mouthOpen: number;
  public mouthDir: number;
  public dead: boolean;

  // ─── Discrete movement internals ───
  private _fromCol: number;
  private _fromRow: number;
  private _toCol: number;
  private _toRow: number;
  private _progress: number; // 0..1 — fraction toward _toCol/_toRow

  constructor(col: number, row: number) {
    this.col = col;
    this.row = row;
    this.dir = { ...DIR.RIGHT };
    this.nextDir = { ...DIR.RIGHT };
    this.speed = PLAYER_SPEED_BASE;
    this.mouthOpen = 0;
    this.mouthDir = 1;
    this.dead = false;
    this._initDiscrete(col, row);
  }

  reset(col: number, row: number): void {
    this.col = col;
    this.row = row;
    this.dir = { ...DIR.RIGHT };
    this.nextDir = { ...DIR.RIGHT };
    this.speed = PLAYER_SPEED_BASE;
    this.dead = false;
    this._initDiscrete(col, row);
  }

  // ────────────────────────────────────────
  // Core movement loop — discrete, tile-driven
  // ────────────────────────────────────────

  update(queuedDir: Direction, maze: Maze): void {
    if (this.dead) return;

    // ── Animate mouth
    this.mouthOpen += this.mouthDir * 0.15;
    if (this.mouthOpen > 1)     { this.mouthOpen = 1;  this.mouthDir = -1; }
    if (this.mouthOpen < 0)     { this.mouthOpen = 0;  this.mouthDir = 1;  }

    // ── Tunnel wrap for player already at tunnel edges (not moving)
    if (this.col <= -0.5) {
      this.col = maze.width + 0.5;
      this._syncToCurrent();
      return;
    } else if (this.col >= maze.width - 0.5) {
      this.col = -0.5;
      this._syncToCurrent();
      return;
    }

    // ── Ensure internal discrete state matches current position
    //     (handles cases where external code wrote col/row directly)
    const tileCol = Math.round(this.col);
    const tileRow = Math.round(this.row);
    if (this._progress >= 1) {
      this._fromCol = tileCol;
      this._fromRow = tileRow;
      this._toCol   = tileCol;
      this._toRow   = tileRow;
    }

    const atCenter = this._progress >= 1;

    if (atCenter) {
      // ═══ Direction changes ONLY at tile centers ═══

      // Buffer queued direction
      this.nextDir =
        (queuedDir.x !== 0 || queuedDir.y !== 0)
          ? { ...queuedDir }
          : this.nextDir;

      // Apply pending turn if tile ahead is walkable
      if (this.nextDir.x !== 0 || this.nextDir.y !== 0) {
        if (maze.canMove(tileCol, tileRow, this.nextDir)) {
          this.dir = { ...this.nextDir };
          this.nextDir = { ...DIR.NONE };
        }
      }

      // ── Start new travel step
      const targetCol = tileCol + this.dir.x;
      const targetRow = tileRow + this.dir.y;

      if (this._isWalkable(targetCol, targetRow, maze)) {
        this._startStep(targetCol, targetRow);
      } else {
        // Blocked — stay at current tile; progress stays at 1
        this._syncToCurrent();
      }
    }

    // ── Advance progress every frame
    this._progress += this.speed / 1;

    if (this._progress >= 1) {
      // ── Arrived at target tile
      const arrivalCol = this._toCol;
      const arrivalRow = this._toRow;

      if (arrivalCol < 0) {
        this.col = maze.width - 0.5;
        this.row = arrivalRow;
      } else if (arrivalCol >= maze.width) {
        this.col = 0.5;
        this.row = arrivalRow;
      } else {
        this.col = arrivalCol;
        this.row = arrivalRow;
      }
      this._fromCol = Math.round(this.col);
      this._fromRow = arrivalRow;
      this._toCol   = arrivalCol;
      this._toRow   = arrivalRow;
      this._progress = 1;
    } else {
      // ── Interpolate visual position toward target
      const t = this._progress;
      this.col = this._fromCol + (this._toCol - this._fromCol) * t;
      this.row = this._fromRow + (this._toRow - this._fromRow) * t;
    }
  }

  // ────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────

  private _initDiscrete(col: number, row: number): void {
    this._fromCol = col;
    this._fromRow = row;
    this._toCol   = col;
    this._toRow   = row;
    this._progress = 1;
  }

  private _syncToCurrent(): void {
    this._progress = 1;
    this._fromCol = Math.round(this.col);
    this._fromRow = Math.round(this.row);
    this._toCol   = this._fromCol;
    this._toRow   = this._fromRow;
  }

  private _isWalkable(col: number, row: number, maze: Maze): boolean {
    // Tunnel: walking off the left edge should arrive on the right side
    if (col < 0)    col = maze.width - 1;
    if (col >= maze.width) col = 0;
    return maze.isWalkable(col, row);
  }

  private _startStep(toCol: number, toRow: number): void {
    this._fromCol = Math.round(this.col);
    this._fromRow = Math.round(this.row);
    this._toCol   = toCol;
    this._toRow   = toRow;
    this._progress = 0;
  }

  // ────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────

  /** Rounded grid position (used by collision & pellets) */
  getTilePos() {
    return {
      col: Math.round(Math.abs(this.col)),
      row: Math.round(Math.abs(this.row)),
    };
  }
}
