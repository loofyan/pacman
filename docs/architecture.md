# Architecture

## File Structure
```
pacman/
  index.html          - HTML entry
  vite.config.ts      - Vite config
  tsconfig.json       - TS config
  package.json
  src/
    main.ts           - Entry, canvas setup, game loop
    style.css         - Global styles
    game/
      Maze.ts         - Maze tile map, rendering, wall collision
      Player.ts       - Player entity, movement, turn buffering
      Ghost.ts        - Ghost entities, AI targeting
      Game.ts         - Game state machine, scoring, lives, levels
    audio/
      SoundEngine.ts  - Web Audio API sound generation
    ui/
      HUD.ts          - Score/lives rendering
```

## Game Loop
- requestAnimationFrame loop in main.ts
- Each frame: update() then render()
- update() calls Player.update(), Ghost.update(), Game.update()
- render() calls Maze.render(), player.render(), ghost.render(), HUD.render()
- All coordinates in tile space, rendered with tile size multiplier

## State Management
- Game class owns all game state (score, lives, level, mode, timer)
- Player and Ghost are pure entity classes with state
- Maze is immutable after creation
- Mode transitions: START -> PLAYING -> FRIGHTENED -> DEATH -> LEVEL_DONE -> GAME_OVER

## Rendering
- Single Canvas element
- All drawing via Canvas 2D API
- Tile-based coordinate system
- Player: colored circle with mouth animation
- Ghosts: colored shapes with eyes, animated when frightened
- Pellets: small circles
- Power pellets: larger blinking circles

## Input
- Keyboard (Arrow keys + W/A/S/D)
- Turn buffering: queue next direction at player position
- On each tile center, check if queued direction is valid, apply it
- Space: pause/unpause
- R: restart
- M: mute audio

## Ghost AI
- 4 ghosts with distinct targeting
- Chase mode: each ghost targets a different offset ahead of player
- Scatter mode: each ghost targets a corner
- Frightened mode: random movement
- Release from ghost house on timer
- Return to house when defeated (white eyes)
- Chase/scatter timer alternates every 7 seconds

## Audio
- Web Audio API oscillator-based sounds
- No external audio files
- Short functions for each sound type
- Mute flag in Game state
