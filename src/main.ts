import { Game } from './game/Game';
import { DIR } from './game/constants';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas, 24);
(window as any).game = game;

// Input handling
const keyMap: Record<string, { x: number; y: number } | null> = {
  'ArrowUp': { x: 0, y: -1 },
  'ArrowDown': { x: 0, y: 1 },
  'ArrowLeft': { x: -1, y: 0 },
  'ArrowRight': { x: 1, y: 0 },
  'w': { x: 0, y: -1 },
  's': { x: 0, y: 1 },
  'a': { x: -1, y: 0 },
  'd': { x: 1, y: 0 },
  'W': { x: 0, y: -1 },
  'S': { x: 0, y: 1 },
  'A': { x: -1, y: 0 },
  'D': { x: 1, y: 0 },
};

document.addEventListener('keydown', (e: KeyboardEvent) => {
  // Prevent scrolling for game keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }

  const dir = keyMap[e.key];
  if (dir) {
    game.setDirection(dir);
    return;
  }

  if (e.key === 'Enter') {
    if (game.mode === 'start' || game.mode === 'game_over') {
      game.start();
    }
  }

  if (e.key === ' ') {
    game.togglePause();
  }

  if (e.key === 'r' || e.key === 'R') {
    game.stop();
    game.fullRestart();
    game.start();
  }

  if (e.key === 'm' || e.key === 'M') {
    game.mute();
  }
});

// Initial render of start screen
game.render();

// Draw title screen background
const ctx = canvas.getContext('2d')!;
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
