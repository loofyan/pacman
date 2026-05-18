# Project: Pac-Man Maze Chase

A Pac-Man-style arcade game built with Vite, TypeScript, and HTML5 Canvas. All visuals/sounds are generated programmatically — zero external assets.

## Key Commands
- `npm run dev` — start dev server (http://localhost:5173)
- `npm run build` — production build → `dist/`
- `npm test` — run vitest tests

## Project Structure
```
src/
  main.ts          — App entry & input handling
  style.css        — Global styles
  game/            — Game logic (Game.ts, Maze, Player, Ghost, constants)
  audio/           — Web Audio API sound generation (soundEngine.ts)
  ui/              — HUD, overlays, score display
  utils/           — Utilities
```

## Important Notes
- No external assets — all graphics/audio are procedural/programmatic
- `docs/` contains plan.md, architecture.md, decisions.md, testing.md — consult for context on game design and rules
- Uses vitest for testing; playwright for browser-based E2E tests
