// Tile types
export const TILE = {
  EMPTY: 0,
  WALL: 1,
  PELLET: 2,
  POWER_PELLET: 3,
  GHOST_WALL: 4,
  GHOST_DOOR: 5,
} as const;

// Directions
export const DIR = {
  NONE: { x: 0, y: 0 },
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
} as const;

export type Direction = { readonly x: number; readonly y: number };

// Ghost colors and types
export const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
export const GHOST_NAMES = ['blinky', 'pinky', 'inky', 'clyde'];

// Ghost AI modes
export const GHOST_MODE = {
  CHASE: 'chase',
  SCATTER: 'scatter',
  FRIGHTENED: 'frightened',
  HOUSE: 'house',
  RETURN: 'return',
} as const;

export type GhostMode = typeof GHOST_MODE[keyof typeof GHOST_MODE];

// Game modes
export const GAME_MODE = {
  START: 'start',
  PLAYING: 'playing',
  FRIGHTENED: 'frightened',
  DEATH: 'death',
  LEVEL_DONE: 'level_done',
  GAME_OVER: 'game_over',
} as const;

export type GameMode = typeof GAME_MODE[keyof typeof GAME_MODE] | 'paused';

// Default config
export const TILE_SIZE = 24;
export const FPS = 60;
export const PLAYER_SPEED_BASE = 0.08;
export const GHOST_SPEED_BASE = 0.07;
export const FRIGHTENED_DURATION = 480; // frames (~8 seconds at 60fps)
export const DEFEAT_RETURN_FRAMES = 60;
export const DEFEAT_COOLDOWN = 300; // frames before defeated ghost can release
export const GHOST_RELEASE_INTERVAL = 180;
export const CHASE_SCATTER_DURATION = 420; // 7 seconds at 60fps
export const DEATH_ANIM_FRAMES = 90;
export const LEVEL_PELLET_TIMEOUT = 180;

// Ghost target offsets for chase mode (relative to player position)
export const CHASE_TARGETS = [
  { x: 0, y: -1 },   // blinky: directly on player
  { x: 0, y: -4 },   // pinky: 4 tiles ahead of player
  { x: 1, y: -2 },   // inky: complex offset
  { x: -2, y: 0 },   // clyde: 2 tiles left
];

// Scatter corners
export const SCATTER_TARGETS = [
  { x: 27, y: 0 },    // blinky: top-right
  { x: 3, y: 0 },     // pinky: top-left
  { x: 29, y: 21 },   // inky: bottom-right
  { x: 0, y: 21 },    // clyde: bottom-left
];

// Ghost house position
export const GHOST_HOUSE = { x: 14, y: 11 };
