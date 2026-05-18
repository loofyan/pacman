# Maze Chase — Start Screen Visual Fixes

## Bugs
- [x] 1. Fix "PRESS ENTER TO START" overlapping the difficulty/name boxes — repositioned from h*0.46 to h*0.44, reduced font size, moved name/difficulty up
- [x] 2. Fix "TOP SCORES" floating over maze walls without spacing — added dark background container with blue border
- [x] 3. Fix "MAZE CHASE" title obscuring maze wall lines — repositioned from h*0.06 to h*0.05, reduced font from 2.8*tile to 2.4*tile
- [x] 4. Consolidate scattered high scores — replaced hardcoded ticker with actual localStorage scores; shows decorative label when empty
- [x] 5. Add a background container/border to the central menu — dark rounded card with blue border groups name + difficulty
- [x] 6. Fix bottom instruction text being too small — increased size (0.3→0.35*tile), brightness (#888→#CCC), repositioned up
- [x] 7. Improve input box visibility — added 2px border, glow shadow, and pulsing animation to name & difficulty boxes
- [x] 8. Clean up top-left audio controls — replaced emoji with clean canvas-drawn speaker icons, added subtle labels, darker color coding
- [x] 9. Fix font inconsistency — unified font scale: X-Large (2.2×tile for title), Large (0.6×tile for input/press enter), Medium (0.45-0.55×tile for labels), Small (0.28-0.3×tile for entries)
- [x] 10. Fix glitchy/corrupted cursor artifact — fixed cursor positioning to account for placeholder "PLAYER" text, proper closing brace added

## Enhancements
- [x] 11. Add semi-transparent dark overlay behind the start screen menu
- [x] 12. Redesign central menu as a clean card with clear section labels
- [x] 13. Add blinking cursor effect to "PRESS ENTER TO START"
- [x] 14. Add subtle drop shadow to title and key text for readability

## Style Guide
- [x] 15. Define and document the final color palette and typography rules

---

## Style Guide (Task 15)

### Colors
| Purpose | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background (dark overlay) | Black | `#000000` | Full-screen overlay, panel backgrounds |
| Background (card) | Dark blue-black | `rgba(0,0,20,0.75)` | Menu container, score containers |
| Primary text | White | `#FFFFFF` | Default text, player names |
| Secondary text | Light grey | `#CCCCCC` | Subtitles, labels |
| Muted text | Medium grey | `#888888` / `#666666` | Hints, placeholders |
| Tertiary text | Dark grey-blue | `#555577` | Key hints, helper text |
| Title (primary) | Yellow | `#FFFF00` | "MAZE CHASE" title |
| Title shadow | Orange glow | `#FFA500` | Title letter glow |
| Accent (scores) | Yellow | `#FFFF00` | Score values |
| Accent (labels) | Amber | `#FFAA00` | Ranked score labels (used sparingly) |
| Accent (header) | White | `#FFFFFF` | "PLAYER SETUP" header |
| Borders / outlines | Blue | `#2121DE` / `rgba(33,33,222,...)` | Maze walls, card borders, section dividers |
| Ghost red | Red | `#FF0000` | Blinky, danger states |
| Ghost pink | Pink | `#FFB8FF` | Pinky |
| Ghost cyan | Cyan | `#00FFFF` | Inky, active prompt glow |
| Ghost orange | Orange | `#FFB852` | Clyde |
| Difficulty - easy | Green | `#00FF00` / `#00CC00` | Easy mode, music on indicator |
| Difficulty - normal | Yellow | `#FFFF00` | Normal mode |
| Difficulty - hard | Red | `#FF0000` / `#CC0000` | Hard mode, muted indicator |
| Rank gold | Gold | `#FFD700` | 1st place |
| Rank silver | Silver | `#C0C0C0` | 2nd place |
| Rank bronze | Bronze | `#CD7F32` | 3rd place |
| Game over | Red | `#FF0000` | "GAME OVER" text |
| Level complete | Green | `#00FF00` | "LEVEL COMPLETE" text |
| New high score | Bright green | `#00FF88` / `#00FF00` | Player's own score, new HS |
| Prompt / retry | Warm orange | `#FFB852` | Retry/prompts |
| Drop shadow | Black (opaque) | `rgba(0,0,0,0.7-0.8)` | Text readability overlays |
| Menu overlay gradient | Black (fade) | `rgba(0,0,0,0-0.45)` | Menu area focus |
| Ghost eye white | White | `#FFFFFF` | Ghost eyes |
| Ghost pupil | Dark blue | `#2121DE` | Ghost pupils |
| Highlight (current player) | Teal | `#00FF88` | Matching player names in scores |

### Typography
| Level | Font Size | Usage | Font Weight |
|-------|-----------|-------|-------------|
| X-Large | `tile * 2.2` (52.8px) | Main title "MAZE CHASE" | Bold |
| Large | `tile * 0.9` (21.6px) | "GAME OVER" score title | Bold |
| Large-Med | `tile * 0.7` (16.8px) | Retry prompt, level complete | Regular/Bold |
| Medium | `tile * 0.6` (14.4px) | Name input text, "PRESS ENTER" | Bold |
| Medium-Small | `tile * 0.55` (13.2px) | Subtitle, difficulty text | Bold |
| Small | `tile * 0.45` (10.8px) | Labels, leaderboard title | Bold |
| Tiny | `tile * 0.3` (7.2px) | Score entries, rank numbers | Regular |
| Mini | `tile * 0.2` (4.8px) | Key hints, compact labels | Regular |
| **Base** | `tile` = 24px | Reference unit | - |

All text uses **monospace** family for pixel-accurate alignment.

### Spacing
| Element | Vertical Gap | Horizontal Alignment |
|---------|-------------|----------------------|
| Title to subtitle | `h * 0.07` (Y: 0.05 → 0.12) | Center |
| Subtitle to menu card | `h * 0.08` (Y: 0.12 → 0.20) | Center |
| Name label to box | `-tile * 0.5` above box | Center |
| Name box to difficulty label | `tile * 0.5` above box | Center |
| Label to input box | `tile * 0.5` gap | Center |
| Input box to hint text | `tile * 0.2` below | Center |
| Menu card top padding | `tile * 0.8` | Uniform |
| Menu card side padding | `tile * 1` (container = tile*7, boxes = tile*5) | Centered |

### Effects
| Effect | Value | Usage |
|--------|-------|-------|
| Drop shadow (text readability) | `rgba(0,0,0,0.7-0.8)`, offset (2,2), blur 0 | Title, subtitle, key text |
| Title glow | `#FFA500`, blur 25-40, pulsing | "MAZE CHASE" letters |
| Prompt glow | `#00FFFF`, blur 12-24, pulsing | "PRESS ENTER" text |
| Input box glow | Yellow/colored, blur 4-5, sin-pulse | Active input fields |
| Menu container border | `rgba(33,33,222,0.7)`, width 2px | Card outline |
| Rank colors | Gold/Silver/Bronze/Gray | Scoreboard |

### Blink Rates
| Element | Half-Period | Rate |
|---------|------------|------|
| Name input cursor | 15 frames (~250ms) | ~30Hz |
| "PRESS ENTER" blink | 20 frames (~333ms) | ~15Hz |
| Ghost sound timer | 120 frames (2s) | Ambient |
| Glow pulse | sin(frame * 0.05) | Continuous |
| Input box glow | sin(frame * 0.05-0.06) | Continuous |

### Canvas Geometry
| Property | Value |
|----------|-------|
| Canvas size | 840 × 648 |
| Tile size | 24px (game.mazeWidth) |
| Maze grid | 31 × 23 tiles |
| Score panel | tile × tile × 10 |
| High score panel | tile × tile × 7 |

---

**Progress: 15 / 15 tasks (100%)**
**All tasks complete. Start screen visual fixes finished.**

---

**Progress: 10 / 15 tasks (67%)**
