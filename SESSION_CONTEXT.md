# Session Context: Maze Chase Start Screen Visual Fixes

## Project
Pac-Man-style arcade game built with Vite + TypeScript + HTML5 Canvas. All assets are procedural (no external files).

**Key files:**
- `src/ui/hud.ts` — Main HUD rendering (start screen overlays, leaderboard, menu)
- `src/main.ts` — Entry point, input handling
- `src/game/Game.ts` — Game loop & canvas sizing (tileSize=24, maze=31x23, canvas=840x648)
- `src/game/maze.ts` — Maze layout (31×23 grid)
- `TASKS.md` — Task tracker

---

## Completed (10/15 tasks)

### Bug Fixes
✅ **Task 1:** "PRESS ENTER TO START" overlapping difficulty/name boxes
- Repositioned from `h*0.46` to `h*0.44`, reduced font from `0.7*tile` to `0.65*tile`
- Moved name input up to `h*0.24`, difficulty up to `h*0.32`

✅ **Task 2:** "TOP SCORES" floating over maze walls
- Added dark background container (`rgba(0,0,0,0.7)`) with blue border (`rgba(33,33,222,0.6)`) behind leaderboard
- Container at `h*0.50`, width `tile*10`

✅ **Task 3:** "MAZE CHASE" title obscuring maze walls
- Repositioned from `h*0.06` to `h*0.05`
- Reduced font from `tile*2.8` to `tile*2.2`

✅ **Task 6:** Bottom instructions too small
- Increased font from `tile*0.3` to `tile*0.35`
- Brightened from `#888888` to `#CCCCCC`
- Repositioned up (0.88→0.86, 0.92→0.90)

✅ **Task 7:** Input box visibility
- Name input: 2px border, glow shadow, pulsing animation (sin-based opacity)
- Difficulty: 2px border, colored glow shadow matching difficulty color

✅ **Task 5:** Central menu background container
- Added `renderMenuContainer()` — dark rounded card (`rgba(0,0,20,0.75)`) with blue border
- Groups name input + difficulty selector into unified visual block

✅ **Task 4:** Scattered high scores
- Replaced hardcoded fake scores (`['9500','8000','7500','5000','3000','2600','2000']`) with actual localStorage scores
- Shows decorative "★ HIGH SCORES ★" label when no scores exist

✅ **Task 8:** Top-left audio controls
- Replaced emoji icons with canvas-drawn speaker symbols
- Color-coded: green (on), red (off/muted)
- Subtle labels: "MUSIC"/"SFX" instead of "MUSIC ON"/"SFX ON"
- Darker, more readable colors (`#00CC00`/`#CC0000`)

✅ **Task 9:** Font inconsistency
- Unified scale: X-Large (2.2×tile title), Large (0.6×tile input/press enter), Medium (0.45-0.55×tile labels), Small (0.28-0.3×tile entries)
- All labels use monospace consistently

✅ **Task 10:** Glitchy cursor in name input
- Fixed cursor positioning to account for "PLAYER" placeholder text
- Added missing closing brace for the if block
- Cursor properly extends after displayed text

---

## Completed ✅

### Task 11: Semi-transparent dark overlay behind start screen menu ✅
- Changed full-screen overlay from `rgba(0,0,0,0.35)` to `rgba(0,0,0,0.5)`
- Added focused menu area overlay using `createLinearGradient` — dark fade (`rgba(0,0,0,0.45)`) centered around the menu card area (Y: name input to difficulty arrow hint)
- Gradient fades to transparent above and below, creating a focused "spotlight" on the player setup area

### Task 12: Redesign central menu as a clean card with clear section labels ✅
- Standardized label colors: both "ENTER YOUR NAME" and "DIFFICULTY" now use `#CCCCCC`
- Added "PLAYER SETUP" header bar at top of menu container with dark background and blue accent line
- Added dashed section divider line between name input and difficulty selector
- Clear visual hierarchy established: header → name section → divider → difficulty section

### Task 13: Enhanced blink effect on "PRESS ENTER TO START" ✅
- Faster blink rate: 20-frame half-period (~333ms) instead of 25 frames
- Added glow pulse: sin-wave modulated cyan shadow (blur 6-24) instead of static 12
- Color shift: white text on "on" phase, cyan-tinted (`#AADDFF`) on "off" phase
- Alpha modulation: 1.0 on, 0.7 on — creates a pulsing visibility effect

### Task 14: Subtle drop shadows for readability ✅
- Added layered shadow approach to all key text elements:
  - **Title "MAZE CHASE"**: Each letter drawn twice — dark drop shadow (offset 3,3) + orange glow
  - **Subtitle**: `rgba(0,0,0,0.8)` drop shadow (offset 2,2) via save/restore
  - **"PRESS ENTER TO START"**: Drop shadow + cyan glow on top
  - **"TOP SCORES"**: Drop shadow (offset 1,1) for readability over maze

### Task 15: Style guide documentation ✅
- Created comprehensive style guide in TASKS.md documenting:
  - 30+ color values with hex codes and usage descriptions
  - 8 typography levels based on `tile` multiplier (4.8px–52.8px range)
  - Standardized spacing values for all UI elements
  - Effect parameters (shadow, glow, blur values)
  - Blink rates for all animated elements
  - Canvas geometry reference table

---

**Progress: 15 / 15 tasks (100%)**
**All start screen visual fixes complete.**

---

## Code Structure Notes

### Start screen rendering order (in `renderOverlay` method of hud.ts):
1. `renderSoundIndicators` — top-left, drawn first
2. Title "MAZE CHASE" — `h*0.05`, font `tile*2.2`
3. Subtitle "A GHOST CHASE GAME" — `h*0.12`, font `tile*0.55`
4. `renderMenuContainer` — card background
5. `renderPlayerNameInput` — `h*0.24`
6. `renderDifficultySelector` — `h*0.32`
7. "PRESS ENTER TO START" — `h*0.44`, font `tile*0.6`
8. `renderLeaderboard` — `h*0.50`, with background container
9. `renderGhostRow` — `h*0.66`
10. `renderScrollingScores` — `h*0.78`
11. `renderControlsHint` — `h*0.86`/`h*0.90`

### Key constants:
- `tile` = `game.mazeWidth` = 24
- Canvas: 840×648
- Blur for glow effects: 4-12
- Blink rates: cursor 15 frames, press enter 25 frames (half-period)

### Environment:
- Dev server: `npm run dev` → `http://localhost:5173/pacman/`
- Screenshot tool: `node screenshot.mjs`
