# Implementation Decisions

## Tech Decisions
- **Vite**: Fast dev server, simple bundling, no webpack complexity
- **TypeScript**: Type safety, better IDE support, catches errors early
- **Canvas 2D**: No engine needed, lightweight, direct control over rendering
- **Web Audio API**: Generated sounds, zero asset dependencies, very small bundle
- **No external deps**: Minimal attack surface, low memory, fast builds

## Maze Design
- Classic-style layout using 2D tile array
- 0 = empty, 1 = wall, 2 = pellet, 3 = power pellet, 4 = ghost house wall, 5 = ghost house door
- Tile size: 20px (configurable)
- Tunnel on left/right edges for player escape

## Movement
- Tile-based grid movement (not pixel-smooth arbitrary)
- Player moves from tile center to tile center
- Turn buffering: queue direction, apply at next intersection
- Speed increases with level

## Ghost AI
- Simple tile-targeting: at each intersection, pick direction closest to target tile
- 4 ghosts: 3 chase-mode targeting offsets, 1 patrols top
- Chase/scatter mode alternates on timer
- Frightened: random valid direction at intersections

## Performance
- No DOM manipulation during gameplay
- Canvas rendering only
- Minimal object allocation in game loop
- Audio generated on-demand, no buffers
