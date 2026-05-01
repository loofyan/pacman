import { TILE, PLAYER_SPEED_BASE } from './constants';
import type { Direction } from './constants';

export interface TileMap {
  grid: number[][];
  width: number;
  height: number;
  pelletsRemaining: number;
}

// Classic-inspired maze layout (31x23)
function createBaseMap(): number[][] {
  return [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,1,2,1],
    [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,1,3,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,2,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,2,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,0,0,0,0,5,0,0,0,0,1,1,2,1,1,1,1,2,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,1,1,1,2,1,1,1,1],
    [1,1,1,1,1,1,2,0,0,0,1,0,0,0,0,0,0,1,0,0,2,1,1,1,1,1,2,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,2,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,2,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1,1,2,1],
    [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,2,1,3,2,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];
}

export class Maze {
  private grid: number[][];
  public readonly width: number;
  public readonly height: number;
  public pelletsRemaining: number;

  constructor(map?: number[][] | null) {
    if (map === null) {
      throw new Error("Map cannot be null or undefined");
    }
    this.grid = map ? map.map(row => [...row]) : createBaseMap();
    this.width = this.grid[0].length;
    this.height = this.grid.length;
    this.pelletsRemaining = 0;
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell === TILE.PELLET || cell === TILE.POWER_PELLET) {
          this.pelletsRemaining++;
        }
      }
    }
  }

  getTile(col: number, row: number): number {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
      return TILE.EMPTY; // tunnel area
    }
    return this.grid[row][col];
  }

  setTile(col: number, row: number, value: number): void {
    if (col >= 0 && col < this.width && row >= 0 && row < this.height) {
      const oldVal = this.grid[row][col];
      // Update pellet count when changing pellet types
      if ((oldVal === TILE.PELLET || oldVal === TILE.POWER_PELLET) &&
          (value !== TILE.PELLET && value !== TILE.POWER_PELLET)) {
        this.pelletsRemaining--;
      } else if ((value === TILE.PELLET || value === TILE.POWER_PELLET) &&
                 (oldVal !== TILE.PELLET && oldVal !== TILE.POWER_PELLET)) {
        this.pelletsRemaining++;
      }
      this.grid[row][col] = value;
    }
  }

  isWalkable(col: number, row: number, isGhost: boolean = false): boolean {
    if (col < 0 || col >= this.width) return true; // tunnel
    if (row < 0 || row >= this.height) return false;
    const tile = this.grid[row][col];
    if (tile === TILE.WALL) return false;
    if (tile === TILE.GHOST_WALL && !isGhost) return false;
    if (tile === TILE.GHOST_DOOR && !isGhost) return false;
    return true;
  }

  // Check if direction leads to a walkable tile from current position
  canMove(col: number, row: number, dir: { x: number; y: number }, isGhost: boolean = false): boolean {
    const nc = col + dir.x;
    const nr = row + dir.y;
    return this.isWalkable(nc, nr, isGhost);
  }

  // Check if position is exactly at tile center
  isAtCenter(col: number, row: number, tolerance: number = PLAYER_SPEED_BASE): boolean {
    return Math.abs(col - Math.round(col)) < tolerance &&
           Math.abs(row - Math.round(row)) < tolerance;
  }

  resetPellets(): void {
    const baseMap = createBaseMap();
    this.pelletsRemaining = 0;
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        this.grid[r][c] = baseMap[r][c];
        if (baseMap[r][c] === TILE.PELLET || baseMap[r][c] === TILE.POWER_PELLET) {
          this.pelletsRemaining++;
        }
      }
    }
  }

  clone(): Maze {
    const m = new Maze();
    m.grid = this.grid.map(row => [...row]);
    m.pelletsRemaining = this.pelletsRemaining;
    return m;
  }
}
