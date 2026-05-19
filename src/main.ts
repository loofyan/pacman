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

let startScreenLoop: number | null = null;
let nameInputFocused: boolean = true; // default: focus on name box

function isInsideNameBox(clientX: number, clientY: number): boolean {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const w = canvas.width;
  const h = canvas.height;
  const tile = 24;
  const boxWidth = tile * 5;
  const boxHeight = tile;
  const boxX = w / 2 - boxWidth / 2;
  const boxY = h * 0.24;
  return x >= boxX && x <= boxX + boxWidth && y >= boxY && y <= boxY + boxHeight;
}

function startScreenLoop_(): void {
  if (game.mode === 'start' || game.mode === 'game_over') {
    game.render();
    startScreenLoop = requestAnimationFrame(startScreenLoop_);
  }
}

// Click to set focus on the name input box
canvas.addEventListener('click', (e: MouseEvent) => {
  nameInputFocused = isInsideNameBox(e.clientX, e.clientY);
  game.hud.setNameInputFocused(nameInputFocused);
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
  // Prevent scrolling for game keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }

  const hud = game.hud;
  const soundEngine = game.soundEngine;

  // Movement (only when playing)
  const dir = keyMap[e.key];
  if (dir && (game.mode === 'playing' || game.mode === 'frightened')) {
    game.setDirection(dir);
    return;
  }

  // ---- START SCREEN ----
  if (game.mode === 'start') {
    // Enter always starts the game on the start screen
    if (e.key === 'Enter') {
      game.start(hud.getDifficulty());
      hud.toggleHowToPlay();
      return;
    }

    if (nameInputFocused) {
      // Focus is on the name box: letters type, Backspace deletes
      if (e.key === 'Backspace') {
        hud.updatePlayerName('Backspace');
        return;
      }
      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        hud.updatePlayerName(e.key);
        return;
      }
      // Any other key is ignored when focus is on name box
      return;
    }

    // Focus is NOT on the name box: let keys fall through to gameplay actions
    // (r=restart, m=mute, n=toggle music, h=help, etc.)
  }

  // ---- GAMEPLAY ACTIONS (R, M, N, H, Enter, Space) ----

  // Enter: Retry after game over (starts new game)
  if (e.key === 'Enter' && game.mode === 'game_over') {
    const difficulty = hud.getDifficulty();
    game.fullRestart(difficulty);
    game.start(difficulty);
    return;
  }

  // ESC: Go back to start screen from game_over or death
  if ((e.key === 'Escape' || e.code === 'Escape') &&
      (game.mode === 'game_over' || game.mode === 'death')) {
    game.stop();
    game.goToStart();
    game.render();
    return;
  }

  // Space: Pause
  if (e.key === ' ') {
    game.togglePause();
    hud.toggleHowToPlay();
    return;
  }

  // R: Restart
  if (e.key === 'r' || e.key === 'R') {
    game.stop();
    const difficulty = hud.getDifficulty();
    game.fullRestart(difficulty);
    game.start(difficulty);
    return;
  }

  // M: Mute sound effects
  if (e.key === 'm' || e.key === 'M') {
    game.mute();
    return;
  }

  // N: Toggle music
  if (e.key === 'n' || e.key === 'N') {
    soundEngine.toggleMusic();
    return;
  }

  // E/F: Cycle difficulty (only on start screen)
  if ((e.key === 'e' || e.key === 'E') && game.mode === 'start') {
    hud.cycleDifficulty();
    return;
  }

  // H: How To Play panel
  if (e.key === 'h' || e.key === 'H') {
    hud.toggleHowToPlay();
    return;
  }
});

// Initial render of start screen (with animation loop)
game.render();
startScreenLoop = requestAnimationFrame(startScreenLoop_);
