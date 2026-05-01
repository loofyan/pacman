# Testing Checklist

## Manual Tests (pending browser testing)
- [ ] App starts with start screen overlay
- [ ] Maze displays with colored walls and pellets
- [ ] Player moves with arrow keys
- [ ] Player moves with WASD
- [ ] Turn buffering works (queue direction before intersection)
- [ ] Pellets collect on player overlap
- [ ] Power pellets flash and trigger frightened mode
- [ ] Player cannot walk through walls
- [ ] Tunnel wraps player left/right
- [ ] 4 ghosts appear and move with distinct patterns
- [ ] Ghost release from house on staggered timers
- [ ] Ghost collision reduces lives
- [ ] Lives reset player/ghosts after death animation
- [ ] Power pellets turn ghosts blue (white flash near end)
- [ ] Frightened ghosts can be eaten for 200pts
- [ ] Eaten ghosts return to house and recover
- [ ] Level completes when all pellets eaten
- [ ] New level starts with increased difficulty
- [ ] Score displays correctly in HUD panel
- [ ] Lives display correctly
- [ ] Pause works (Space) - game pauses, overlay shows
- [ ] Restart works (R) - full game restart
- [ ] Game over screen displays at 0 lives
- [ ] Sounds play correctly (walk, eat, power, death, level-up)
- [ ] Mute toggle works (M key)
- [ ] No obvious rendering or performance issues

## Known Bugs
- None verified yet

## Edge Cases
- Player entering tunnel during power mode
- Ghost releasing from house during frightened mode
- Player overlapping ghost house
- Rapid key presses during death animation
- Quick level completion
- Audio context not available (mute fallback)
