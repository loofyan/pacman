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

function startScreenLoop_(): void {
  if (game.mode === 'start' || game.mode === 'game_over') {
    game.render();
    startScreenLoop = requestAnimationFrame(startScreenLoop_);
  }
}

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

  // ---- START SCREEN: Name input takes priority over all action keys ----
  // On the start screen, only Enter starts the game.
  // All letter keys type into the player name textbox.
  if (game.mode === 'start') {
    // Player name input (letters and backspace)
    if (e.key === 'Backspace') {
      hud.updatePlayerName('Backspace');
    } else if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
      hud.updatePlayerName(e.key);
    }

    // Only when name has NOT been edited, E/F changes difficulty
    if (hud.getPlayerName() === 'PLAYER') {
      if (e.key === 'e' || e.key === 'E') {
        hud.cycleDifficulty();
      }
    }

    // Only Enter starts the game on start screen
    if (e.key === 'Enter') {
      game.start();
      hud.toggleHowToPlay();
    }
    return; // Consumed — no other actions work on start screen
  }

  // ---- GAMEPLAY ACTIONS (R, M, N, H, Enter, Space) ----

  // Enter: Retry / Restart after game over
  if (e.key === 'Enter') {
    hud.toggleHowToPlay();
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
    game.fullRestart();
    game.start();
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

  // H: How To Play panel
  if (e.key === 'h' || e.key === 'H') {
    hud.toggleHowToPlay();
    return;
  }
});

// Initial render of start screen (with animation loop)
game.render();
startScreenLoop = requestAnimationFrame(startScreenLoop_);
