# Maze Chase

A colorful Pac-Man-style arcade maze chase game built with Vite, TypeScript, and HTML5 Canvas. All visuals and sounds are generated programmatically - no external assets required.

## Features

- Classic maze chase gameplay
- 4 unique ghosts with distinct AI behaviors (chase, scatter, frightened)
- Power pellets that let you eat ghosts
- Multiple levels with increasing difficulty
- Score tracking with high score
- Life system with death animation
- Pause, restart, and mute controls
- Procedurally generated sounds (movement, eating, power-up, death, level-up)
- Colorful visuals with gradients, glow effects, and animations

## Stack

- **Vite** - Dev server and bundler
- **TypeScript** - Type-safe code
- **HTML5 Canvas** - Game rendering
- **Web Audio API** - Generated sounds

## Prerequisites

- Node.js 18+ (for ES2022+ support)

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Build

```bash
npm run build
```

Production build outputs to `dist/`.

## Preview

```bash
npm run preview
```

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move player |
| Enter | Start game / Restart |
| Space | Pause / Resume |
| R | Restart game |
| M | Mute / Unmute sound |

## Gameplay

- Navigate the maze collecting pellets
- Eat power pellets (large flashing dots) to turn ghosts blue and edible
- Eat blue ghosts for bonus points (200pts each)
- Avoid ghosts outside of frightened mode
- Clear all pellets to complete the level
- Complete levels to progress - difficulty increases each level
- Game ends when you run out of lives

## Project Structure

```
pacman/
  index.html              - HTML entry point
  vite.config.ts          - Vite configuration
  tsconfig.json           - TypeScript config
  package.json
  src/
    main.ts               - App entry, input handling
    style.css             - Global styles
    game/
      constants.ts        - Tile types, directions, game constants
      maze.ts             - Maze tile map, collision, rendering
      player.ts           - Player entity, movement, turn buffering
      ghost.ts            - Ghost entity class, AI targeting
      Game.ts             - Game state machine, scoring, rendering
    audio/
      soundEngine.ts      - Web Audio API sound generation
    ui/
      hud.ts              - Score/lives display, overlays
  docs/
    plan.md               - Project plan
    tasks.md              - Task checklist
    architecture.md       - Architecture documentation
    progress-log.md       - Work log
    decisions.md          - Implementation decisions
    testing.md            - Testing checklist
```
