import type { Game } from '../game/Game';

export class HUD {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

      // Sound & display tracking
  private musicStarted: boolean = false;
  private ghostSoundTimer: number = 0;
  private lastMode: string = '';
  private showingHowToPlay: boolean = false;

      // Player name input state
  private playerName: string = '';
  private showCursor: boolean = false;
  private cursorTimer: number = 0;
  private nameInputFocused: boolean = true;

      // Difficulty selector state
  private difficulty: 'easy' | 'normal' | 'hard' = 'normal';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
       }

  render(game: Game): void {
    const ctx = this.ctx;
    const tile = game.mazeWidth;
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;

    // --- Top HUD bar background (compact single-row) ---
    const barH = tile;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvasW, barH);
    ctx.strokeStyle = 'rgba(33, 33, 222, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, barH);
    ctx.lineTo(canvasW, barH);
    ctx.stroke();

    const rowY = tile * 0.5;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // --- Left side: Player name + Score ---
    const leftMargin = tile * 0.3;
    const nameText = game.hud.getPlayerName();

    // Player name
    ctx.fillStyle = '#AAAAAA';
    ctx.font = `bold ${tile * 0.4}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(nameText, leftMargin, rowY);

    // Score with inline label (all on one line)
    const scoreX = leftMargin + nameText.length * tile * 0.3 + tile * 0.5;
    ctx.fillStyle = '#888';
    ctx.font = `bold ${tile * 0.3}px monospace`;
    ctx.fillText('SCORE', scoreX, rowY);
    ctx.fillStyle = '#FFFF00';
    ctx.font = `bold ${tile * 0.45}px monospace`;
    ctx.fillText(`${game.score}`, scoreX + ctx.measureText('SCORE ').width, rowY);

    // --- Lives (centered) ---
    const livesCount = game.lives;
    const livesSpacing = tile * 0.65;
    const livesWidth = livesCount * tile * 0.35 + (livesCount - 1) * tile * 0.15;
    const livesStartX = canvasW / 2 - livesWidth / 2;
    for (let i = 0; i < livesCount; i++) {
      const lx = livesStartX + i * (tile * 0.35 + tile * 0.15);
      const ly = rowY + tile * 0.1;
      const r = tile * 0.2;
      const grad = ctx.createRadialGradient(lx - r * 0.2, ly - r * 0.2, 0, lx, ly, r);
      grad.addColorStop(0, '#FFFF66');
      grad.addColorStop(1, '#FFCC00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Right side: High score + Level ---
    const hiScoreCol = canvasW - tile * 4.2;
    const hiWidth = ctx.measureText('HI ').width + ctx.measureText(`${game.highScore}`).width;
    const lvlCol = hiScoreCol + hiWidth + tile * 0.4;
    ctx.textAlign = 'left';

    // HI with inline value
    ctx.fillStyle = '#888';
    ctx.font = `bold ${tile * 0.3}px monospace`;
    ctx.fillText('HI', hiScoreCol, rowY);
    ctx.fillStyle = '#FFB8FF';
    ctx.font = `bold ${tile * 0.45}px monospace`;
    ctx.fillText(`${game.highScore}`, hiScoreCol + ctx.measureText('HI ').width, rowY);

    // LVL with inline value
    ctx.fillStyle = '#888';
    ctx.font = `bold ${tile * 0.3}px monospace`;
    ctx.fillText('LVL', lvlCol, rowY);
    ctx.fillStyle = '#00FF00';
    ctx.font = `bold ${tile * 0.45}px monospace`;
    ctx.fillText(`${game.level}`, lvlCol + ctx.measureText('LVL ').width, rowY);
       }

  renderOverlay(game: Game): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const tile = game.mazeWidth;

          // Update ghost sound timer only on start screen
    if (game.mode === 'start') {
      this.ghostSoundTimer++;
      // Cursor blink for name input — only when focused
      if (this.nameInputFocused) {
        this.cursorTimer++;
        this.showCursor = Math.floor(this.cursorTimer / 15) % 2 === 0;
      }
         }

          // Render full-screen dark overlay for start, game_over, paused, level_done
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

      // Show how-to-play overlay
    if (this.showingHowToPlay && game.mode === 'start') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
      ctx.fillRect(0, 0, w, h);
      this.renderHowToPlay(ctx, w, h, tile);
      return;
         }

    if (game.mode === 'start') {
             // Sound: play once on entry (detect transition into start), then periodically
      const transitioningIntoStart = this.lastMode !== 'start';
      if (transitioningIntoStart) {
        const soundEngine = game.soundEngine;
        if (soundEngine) {
          soundEngine.init();
          soundEngine.playSelectSound();
          soundEngine.playBackgroundMusic();
             }
        this.musicStarted = true;
        // Update lastMode to 'start' so we don't re-trigger
        this.lastMode = 'start';
             }
      const soundEngine = game.soundEngine;
      if (soundEngine && this.ghostSoundTimer >= 120 && soundEngine.isMusicEnabled()) {
        soundEngine.playGhostSound();
        this.ghostSoundTimer = 0;
             }

                 // ---- Title "MAZE CHASE" ----
      const titleFrame = this.currentFrame();
      const glowPulse = Math.sin(titleFrame * 0.05) * 15 + 25;
      const titleText = 'MAZE CHASE';

                 // Scale bounce effect on first render
      let bounceScale = 1;
      if (titleFrame < 20) {
        const bounceT = titleFrame / 20;
        bounceScale = 0.9 + Math.sin(bounceT * Math.PI) * 0.15;
             }

          // Draw ALL elements with explicit Y positions to prevent overlap


                 // Task 11: Semi-transparent dark overlay behind menu area only
      const menuContainerY = h * 0.24 - tile * 0.8;
      const menuContainerH = (h * 0.32 - h * 0.24) + tile * 3;
      const menuOverlayGrad = ctx.createLinearGradient(0, menuContainerY - tile * 2, 0, menuContainerY + menuContainerH + tile * 2);
      menuOverlayGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      menuOverlayGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0.45)');
      menuOverlayGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.45)');
      menuOverlayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = menuOverlayGrad;
      ctx.fillRect(0, menuContainerY - tile * 2, w, menuContainerH + tile * 4);

                 // P3: Subtle animated blue glow behind menu elements
      const glowIntensity = Math.sin(this.currentFrame() * 0.02) * 0.05 + 0.08;
      const glowRadius = Math.min(w, h) * 0.4;
      const glowGrad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, glowRadius);
      glowGrad.addColorStop(0, `rgba(33, 33, 222, ${glowIntensity})`);
      glowGrad.addColorStop(1, 'rgba(33, 33, 222, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);
          // 1) Sound indicators — top-left, drawn first (behind everything)
          this.renderSoundIndicators(ctx, w, h, tile, soundEngine);

          // 2) Title centered — h * 0.05 (repositioned up, shorter font to avoid overlap)
          ctx.save();
          ctx.translate(w / 2, h * 0.05);
          ctx.scale(bounceScale, bounceScale);

                 // Draw letters one by one with fade-in
          const letterSpacing = tile * 2.2 * 0.55;
          titleText.split('').forEach((letter, i) => {
            const x = (i - titleText.length / 2) * letterSpacing;
            const letterReveal = Math.max(0, Math.min(1, (titleFrame - i * 3) / 10));
            ctx.globalAlpha = letterReveal;
            // Task 14: Layered shadow — dark drop shadow for readability, then orange glow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = '#FFFF00';
            ctx.font = `bold ${tile * 2.2}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, x, 0);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowColor = '#FFA500';
            ctx.shadowBlur = glowPulse;
            ctx.fillText(letter, x, 0);
            ctx.shadowBlur = 0;
             });

          ctx.restore();
          ctx.globalAlpha = 1;

          // 3) Subtitle — well below title, h * 0.12 (Task 14: drop shadow)
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = '#CCCCCC';
          ctx.font = `bold ${tile * 0.55}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('A GHOST CHASE GAME', w / 2, h * 0.12);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.restore();


            // 4) Menu container background — groups name + difficulty into a card
          this.renderMenuContainer(ctx, w, h, tile);

            // 5) Player name input — h * 0.24 (moved up for spacing)
          this.renderPlayerNameInput(ctx, w, h, tile, titleFrame);

            // 6) Difficulty selector — h * 0.32 (moved up for spacing)
          this.renderDifficultySelector(ctx, w, h, tile, titleFrame);

            // 7) "Press Enter to Start" — h * 0.44 (Task 14: drop shadow + Task 13: enhanced blink)
          const blinkFrame = this.currentFrame();
          const blinkOn = Math.floor(blinkFrame / 20) % 2 === 0;
          const promptGlow = Math.sin(blinkFrame * 0.08) * 8 + 16;

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${tile * 0.6}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('PRESS ENTER TO START', w / 2, h * 0.48);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.shadowColor = blinkOn ? '#00FFFF' : '#0088AA';
          ctx.shadowBlur = blinkOn ? promptGlow : 6;
          ctx.globalAlpha = blinkOn ? 1 : 0.7;
          if (blinkOn) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('PRESS ENTER TO START', w / 2, h * 0.48);
          } else {
            // Cyan-tinted dim phase
            ctx.fillStyle = '#AADDFF';
            ctx.fillText('PRESS ENTER TO START', w / 2, h * 0.48);
          }
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
          ctx.restore();

            // 7) Leaderboard with background container — STARTS at h * 0.50 (P0: added bg box)
          if (game.mode === 'start') {
            this.renderLeaderboard(ctx, w, h, tile, titleFrame);
           }

            // 8) Ghost row decoration — h * 0.66 (P0: rendered below all text, no overlap)
          this.renderGhostRow(ctx, w, h, tile, titleFrame);

            // 9) Scrolling high score line — h * 0.78 (P1: removed from game maze area)
          this.renderScrollingScores(ctx, w, h, tile, titleFrame);

            // 10) Controls hint — at the bottom (P1: brighter text)
          this.renderControlsHint(ctx, w, h, tile);
        }

     if (game.mode === 'game_over') {
             // Red glow
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#FF0000';
      ctx.font = `bold ${tile * 2}px monospace`;
      ctx.fillText('GAME OVER', w / 2, h * 0.33);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#FFF';
      ctx.font = `bold ${tile * 0.9}px monospace`;
      ctx.fillText(`Score: ${game.score}`, w / 2, h * 0.48);
      ctx.fillText(`Level: ${game.level}`, w / 2, h * 0.58);

      if (game.score >= game.highScore && game.highScore > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${tile * 0.65}px monospace`;
        ctx.fillText('★ NEW HIGH SCORE ★', w / 2, h * 0.65);
      } else {
        ctx.fillStyle = '#FFB8FF';
        ctx.font = `${tile * 0.6}px monospace`;
        ctx.fillText(`High Score: ${game.highScore}`, w / 2, h * 0.65);
      }

      ctx.fillStyle = '#FFB852';
      ctx.font = `${tile * 0.7}px monospace`;
      if (Math.floor(this.currentFrame() / 30) % 2 === 0) {
        ctx.fillText('PRESS ENTER TO RETRY', w / 2, h * 0.78);
      } else {
        ctx.globalAlpha = 0.5;
        ctx.fillText('PRESS ENTER TO RETRY', w / 2, h * 0.78);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = '#888888';
      ctx.font = `${tile * 0.5}px monospace`;
      ctx.fillText('ESC  →  Start Screen', w / 2, h * 0.90);
         }

     if (game.mode === 'level_done') {
      ctx.shadowColor = '#00FF00';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00FF00';
      ctx.font = `bold ${tile * 1.3}px monospace`;
      ctx.fillText(`LEVEL ${game.level} COMPLETE!`, w / 2, h * 0.45);
      ctx.shadowBlur = 0;
         }

     if (game.mode === 'paused') {
      ctx.shadowColor = '#FFF';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FFF';
      ctx.font = `bold ${tile * 1.8}px monospace`;
      ctx.fillText('PAUSED', w / 2, h * 0.43);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#AAAAAA';
      ctx.font = `${tile * 0.8}px monospace`;
      if (Math.floor(this.currentFrame() / 30) % 2 === 0) {
        ctx.fillText('Press Space to Resume', w / 2, h * 0.6);
          }
         }
       }

        // ---- Menu Container (Task 5) ----
        // Shared background card that groups name input + difficulty selector
  private renderMenuContainer(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number): void {
    const nameBoxY = h * 0.23;
    const diffBoxY = h * 0.36;
    // Top edge: above player setup area
    const containerTop = nameBoxY - tile * 1.8;
    // Bottom edge: below difficulty box with padding
    const containerBottom = diffBoxY + tile * 1.8;
    // Width: slightly wider than input boxes
    const containerW = tile * 10;
    const containerX = w / 2 - containerW / 2;
    const containerH = containerBottom - containerTop;

    // Rounded background panel
    ctx.fillStyle = 'rgba(0, 0, 20, 0.75)';
    ctx.beginPath();
    ctx.roundRect(containerX, containerTop, containerW, containerH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(33, 33, 222, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(containerX, containerTop, containerW, containerH, 8);
    ctx.stroke();

    // Task 12: Player setup header with top accent bar
    const headerY = containerTop + tile * 0.1;
    const headerH = tile * 1.0;
    // Dark header background
    ctx.fillStyle = 'rgba(20, 20, 50, 0.6)';
    ctx.beginPath();
    ctx.roundRect(containerX + 2, headerY, containerW - 4, headerH, [6, 6, 0, 0]);
    ctx.fill();
    // Accent line below header text
    ctx.strokeStyle = 'rgba(33, 33, 222, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(containerX + 4, headerY + headerH - 2);
    ctx.lineTo(containerX + containerW - 4, headerY + headerH - 2);
    ctx.stroke();
    // Header text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${tile * 0.5}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PLAYER SETUP', w / 2, headerY + headerH / 2);
    ctx.textAlign = 'left'; // Reset

    // Section divider line between name and difficulty
    const dividerY = nameBoxY + tile * 0.35;
    ctx.strokeStyle = 'rgba(33, 33, 222, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(containerX + tile * 0.5, dividerY);
    ctx.lineTo(containerX + containerW - tile * 0.5, dividerY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

        // ---- Player Name Input (Task 12) ----
        // Positioned at h * 0.24 of screen
  private renderPlayerNameInput(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number, frame: number): void {
    const cursorAlpha = this.showCursor ? 1 : 0;
    const boxWidth = tile * 8;
    const boxHeight = tile * 1.3;
    const boxX = w / 2 - boxWidth / 2;
    const boxY = h * 0.23;

          // Label — left-aligned field label above the box (avoids overlap with header)
    ctx.fillStyle = '#CCCCCC';
    ctx.font = `bold ${tile * 0.45}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ENTER YOUR NAME:', boxX, boxY - tile * 0.05);

          // Text box — bright border when focused, dim when unfocused
    const hasFocus = this.nameInputFocused;
    if (hasFocus) {
      const glowIntensity = Math.sin(frame * 0.05) * 0.3 + 0.7;
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 4;
      ctx.fillStyle = `rgba(80, 80, 200, 0.25)`;
      ctx.strokeStyle = `rgba(255, 255, 0, ${glowIntensity})`;
      ctx.lineWidth = 2;
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(40, 40, 100, 0.15)`;
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
      ctx.lineWidth = 1;
    }
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.shadowBlur = 0;

          // Player name text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${tile * 0.6}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    // Show "PLAYER" as greyed-out placeholder when name is empty
    const isPlaceholder = this.playerName.length === 0;
    ctx.fillStyle = isPlaceholder ? '#888888' : '#FFFFFF';
    ctx.font = `bold ${tile * 0.6}px monospace`;
    const displayName = isPlaceholder ? 'PLAYER' : this.playerName;
    ctx.fillText(displayName, boxX + tile * 0.35, boxY + boxHeight / 2);

          // Blinking cursor — only visible when focused
    if (hasFocus && this.showCursor) {
      const textW = isPlaceholder ? 'PLAYER'.length * tile * 0.35 : this.playerName.length * tile * 0.35;
      const cursorX = boxX + tile * 0.3 + textW;
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(cursorX, boxY + boxHeight * 0.15, Math.max(2, tile * 0.12), boxHeight * 0.7);
      ctx.globalAlpha = 1;
    }

       }

        // ---- Difficulty Selector (Task 13) ----
        // Positioned at h * 0.32 of screen
  private renderDifficultySelector(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number, frame: number): void {
    const boxWidth = tile * 8;
    const boxHeight = tile * 1.3;
    const boxX = w / 2 - boxWidth / 2;
    const boxY = h * 0.36;

          // Label — left-aligned field label above the box (same margin as name label)
    ctx.fillStyle = '#CCCCCC';
    ctx.font = `bold ${tile * 0.45}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('DIFFICULTY:', boxX, boxY - tile * 0.05);

          // Text box — P7: thicker border, glow to show interactivity
    const diffColors = { easy: '#00FF00', normal: '#FFFF00', hard: '#FF0000' };
    const color = diffColors[this.difficulty];
    const glowPulse = Math.sin(frame * 0.06) * 0.3 + 0.7;
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    ctx.fillStyle = `rgba(${color === '#00FF00' ? '0,255,0' : color === '#FFFF00' ? '255,255,0' : '255,0,0'}, 0.2)`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.shadowBlur = 0;

          // Difficulty text
    ctx.fillStyle = color;
    ctx.font = `bold ${tile * 0.55}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.difficulty.toUpperCase(), w / 2, boxY + boxHeight / 2);
    ctx.textAlign = 'left'; // Reset align
        }
        // ---- Leaderboard (Task 17) ----
        // Leaderboard starts at h * 0.50 with background container
  private renderLeaderboard(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number, frame: number): void {
    // Background container for readability over maze
    const containerY = h * 0.50;
    const containerH = tile * 3.5;
    const containerW = tile * 10;
    const containerX = w / 2 - containerW / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(containerX, containerY, containerW, containerH);
    ctx.strokeStyle = 'rgba(33, 33, 222, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(containerX, containerY, containerW, containerH);

    // Title — Task 14: drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#FFAA00';
    ctx.font = `bold ${tile * 0.45}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOP SCORES', w / 2, containerY + tile * 0.35);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.restore();

          // Load and display scores
    try {
      const scores: any[] = JSON.parse(localStorage.getItem('mazeChaseScores') || '[]');
      const displayCount = Math.min(scores.length, 5);
      for (let i = 0; i < displayCount; i++) {
        const score = scores[i];
        const y = containerY + tile * 0.9 + i * tile * 0.5;

        // Rank color
        const rankColor = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#AAAAAA';

             // Rank indicator
        ctx.fillStyle = rankColor;
        ctx.font = `bold ${tile * 0.3}px monospace`;
        ctx.textAlign = 'right';
        ctx.fillText(`${i + 1}.`, w / 2 - tile * 2.0, y);

             // Score name
        ctx.fillStyle = score.name === this.playerName ? '#00FF88' : '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.font = `${tile * 0.3}px monospace`;
        ctx.fillText(`${score.name}`, w / 2 - tile * 1.6, y);

             // Score value
        ctx.fillStyle = '#FFFF00';
        ctx.font = `bold ${tile * 0.3}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`${score.score || 0}`, w / 2 + tile * 0.6, y);
           }
          // "No scores yet" message
          if (displayCount === 0) {
        ctx.fillStyle = '#888888';
        ctx.font = `${tile * 0.3}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('Play to earn a score!', w / 2, containerY + tile * 1.5);
           }
          } catch {
          // No scores
           }

         }

        // ---- Ghost row (Task 9+10) ----
        // Positioned at h * 0.52 of screen
  private renderGhostRow(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number, frame: number): void {
    const ghosts = [
           { color: '#FF0000' },
           { color: '#FFB8FF' },
           { color: '#00FFFF' },
           { color: '#FFB852' },
           ];
    const spacing = tile * 1.8;
    const startX = w / 2 - tile * 2.7;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ghosts.forEach((ghost, i) => {
      const gx = startX + i * spacing;
      const gy = h * 0.66 + Math.sin(frame * 0.03 + i * 1.5) * 6;
      const r = tile * 0.22;

             // Ghost body
      // Semi-transparent dark pill behind ghost for visibility through maze
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.arc(gx, gy - 4, r + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.fillStyle = ghost.color;
      ctx.beginPath();
      ctx.arc(gx, gy - 4, r, Math.PI, 0);
      ctx.lineTo(gx + r, gy + tile * 0.13);

             // Wavy bottom
      const wave = Math.sin(frame * 0.2 + i) * r * 0.08;
      const segW = (r * 2) / 4;
      for (let s = 4; s > 0; s--) {
        const sx = gx + r - (4 - s) * segW;
        ctx.quadraticCurveTo(
          sx - segW / 2, gy + tile * 0.13 + wave + (s % 2 ? r * 0.1 : -r * 0.1),
          sx - segW, gy + tile * 0.13
             );
           }
      ctx.fill();

             // Eyes
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.ellipse(gx - r * 0.22, gy - r * 0.1, r * 0.18, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(gx + r * 0.22, gy - r * 0.1, r * 0.18, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2121DE';
      ctx.beginPath();
      ctx.arc(gx - r * 0.22 + r * 0.06, gy - r * 0.1, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gx + r * 0.22 + r * 0.06, gy - r * 0.1, r * 0.09, 0, Math.PI * 2);
      ctx.fill();

         });
       }

        // ---- Scrolling high score line (Task 4: consolidated, uses actual scores) ----
        // Positioned at h * 0.78 of screen
  private renderScrollingScores(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number, frame: number): void {
    // Use actual stored scores instead of hardcoded values
    let displayScores: { name: string; score: number }[] = [];
    try {
      const scores: any[] = JSON.parse(localStorage.getItem('mazeChaseScores') || '[]');
      displayScores = scores.slice(0, 5).map((s: any) => ({ name: s.name || '???', score: s.score || 0 }));
    } catch {}

    // If no stored scores, show a decorative empty state
    if (displayScores.length === 0) {
      ctx.fillStyle = '#444466';
      ctx.font = `bold ${tile * 0.35}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★ HIGH SCORES ★', w / 2, h * 0.78);
      return;
    }

    // Scroll actual scores across the screen
    const scrollSpeed = 0.8;
    const scrollOffset = Math.floor(frame * scrollSpeed) % (w + 100);
    const spacing = (w + 60) / displayScores.length;

    displayScores.forEach((scoreEntry, i) => {
      const baseX = i * spacing - (scrollOffset % spacing);
      const ghostColor = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852', '#FF0000'][i % 4];

      // Fade at edges
      const edgeFade = Math.min(1, baseX / 50, (w - baseX) / 50);
      const alpha = Math.min(1, Math.max(0.15, edgeFade));

      ctx.globalAlpha = alpha;

      // Small colored dot
      ctx.fillStyle = ghostColor;
      ctx.beginPath();
      ctx.arc(baseX + 8, h * 0.78, 3, 0, Math.PI * 2);
      ctx.fill();

      // Score with name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${tile * 0.28}px monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${scoreEntry.name}  ${scoreEntry.score}`, baseX + 14, h * 0.78);

      ctx.globalAlpha = 1;
    });
  }

         // ---- Sound Toggle Indicators (P2: speaker icons) ----
         // Positioned top-left, drawn first (behind title text)
  private renderSoundIndicators(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number, soundEngine: any): void {
    if (!soundEngine) return;
    const musicOn = soundEngine.isMusicEnabled();
    const textOn = !soundEngine.isMuted();

          // Top-left corner
    const indicatorX = tile * 2;
    const indicatorY = tile * 0.3;
    const iconSize = tile * 0.8;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

           // Music icon — clean canvas-drawn speaker symbol (P8)
    const musicColor = musicOn ? '#00CC00' : '#CC0000';
    ctx.save();
    ctx.strokeStyle = musicColor;
    ctx.fillStyle = musicColor;
    ctx.lineWidth = Math.max(1, iconSize * 0.15);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // Speaker body (trapezoid)
    const sw = iconSize * 0.4;
    const sh = iconSize * 0.25;
    ctx.beginPath();
    ctx.moveTo(indicatorX + sw * 0.5, indicatorY - sh * 0.5);
    ctx.lineTo(indicatorX - sw * 0.3, indicatorY - sh);
    ctx.lineTo(indicatorX - sw * 0.3, indicatorY + sh);
    ctx.lineTo(indicatorX + sw * 0.5, indicatorY + sh * 0.5);
    ctx.closePath();
    ctx.stroke();
    // Sound waves (one or two arcs)
    if (musicOn) {
      ctx.beginPath();
      ctx.arc(indicatorX + sw * 0.6, indicatorY, sw * 0.55, -0.6, 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(indicatorX + sw * 0.75, indicatorY, sw * 0.75, -0.5, 0.5);
      ctx.stroke();
    } else {
      // Mute slash
      ctx.beginPath();
      ctx.moveTo(indicatorX + sw * 0.3, indicatorY - sw * 0.6);
      ctx.lineTo(indicatorX + sw * 0.9, indicatorY + sw * 0.6);
      ctx.stroke();
    }
    ctx.restore();
    // Subtle label
    ctx.fillStyle = musicColor;
    ctx.font = `bold ${tile * 0.22}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(musicOn ? 'MUSIC' : 'MUTE', indicatorX + iconSize + 3, indicatorY);

           // SFX icon — clean canvas-drawn sound icon (P8)
    const sfxColor = textOn ? '#00CC00' : '#CC0000';
    ctx.save();
    ctx.strokeStyle = sfxColor;
    ctx.fillStyle = sfxColor;
    ctx.lineWidth = Math.max(1, iconSize * 0.15);
    // Sound bar (vertical rectangle)
    const barW = iconSize * 0.2;
    const barH = iconSize * 0.5;
    const barX = indicatorX;
    const barY = indicatorY + iconSize * 0.8;
    ctx.beginPath();
    ctx.roundRect(barX, barY - barH, barW, barH * 2, 2);
    ctx.fill();
    // Sound waves
    if (textOn) {
      ctx.beginPath();
      ctx.arc(barX + barW + 2, barY, iconSize * 0.2, -0.5, 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(barX + barW + 4, barY, iconSize * 0.3, -0.4, 0.4);
      ctx.stroke();
    } else {
      // Mute slash
      ctx.beginPath();
      ctx.moveTo(barX - 2, barY - barH * 0.6);
      ctx.lineTo(barX + barW + 4, barY + barH * 0.6);
      ctx.stroke();
    }
    ctx.restore();
    // Subtle label
    ctx.fillStyle = sfxColor;
    ctx.font = `bold ${tile * 0.22}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(textOn ? 'SFX' : 'MUTED', indicatorX + iconSize + 3, indicatorY + iconSize * 0.8);

          // Compact key hints
    ctx.fillStyle = '#555577';
    ctx.font = `${tile * 0.2}px monospace`;
    ctx.textBaseline = 'top';
    ctx.fillText('N:Music  M:Mute', indicatorX, indicatorY + iconSize * 1.6);

          // Right-side helper indicator
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#AAAAAA';
    ctx.font = `bold ${tile * 0.45}px monospace`;
    ctx.fillText('H = Help', w - tile * 3, tile * 0.3);
        }

        // ---- Controls Hint (P1: brighter, better contrast) ----
        // Controls at bottom of start screen
  private renderControlsHint(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number): void {
    ctx.fillStyle = '#CCCCCC';
    ctx.font = `${tile * 0.35}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Arrow Keys / WASD to Move', w / 2, h * 0.86);
    ctx.fillText('Space  Pause  |  R  Restart', w / 2, h * 0.90);
       }

        // ---- How To Play Panel (Task 18) ----
  private renderHowToPlay(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number): void {
    const panelW = w * 0.85;
    const panelH = h * 0.8;
    const panelX = w / 2 - panelW / 2;
    const panelY = h / 2 - panelH / 2;

          // Panel background
    ctx.fillStyle = 'rgba(0, 0, 30, 0.95)';
    ctx.strokeStyle = '#4a4aff';
    ctx.lineWidth = 3;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeRect(panelX, panelY, panelW, panelH);

          // Content
    const lineHeight = tile * 0.65;
    const startX = panelX + tile * 0.5;
    const startY = panelY + tile;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';

          // Title
    ctx.fillStyle = '#FFFF00';
    ctx.font = `bold ${tile * 1}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO PLAY', w / 2, panelY + tile);

          // Instructions
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${tile * 0.5}px monospace`;
    ctx.textAlign = 'left';
    let y = startY + tile * 0.5;

    const sections = [
           { title: 'OBJECTIVE', color: '#00FFFF' },
           { title: 'Eat all pellets to advance to the next level!', color: '#FFFFFF' },
           { title: '', color: '#FFFFFF' },
           { title: 'GHOSTS', color: '#FF0000' },
           { title: 'Blinky (red)    - Directly chases you', color: '#FFFFFF' },
           { title: 'Pinky (pink)    - Ambushes ahead', color: '#FFFFFF' },
           { title: 'Inky (cyan)     - Unpredictable', color: '#FFFFFF' },
           { title: 'Clyde (orange) - Random behavior', color: '#FFFFFF' },
           { title: '', color: '#FFFFFF' },
           { title: 'POWER-PELLETS', color: '#FFD700' },
           { title: 'Large golden pellets make ghosts frightened.', color: '#FFFFFF' },
           { title: 'Eat frightened ghosts for bonus points!', color: '#FFFFFF' },
           { title: '', color: '#FFFFFF' },
           { title: 'CONTROLS', color: '#8888FF' },
           { title: 'Arrow Keys / WASD    - Move Pac-Man', color: '#FFFFFF' },
           { title: 'E / F                 - Change difficulty', color: '#FFFFFF' },
           { title: 'N                     - Toggle music', color: '#FFFFFF' },
           { title: 'Space                 - Pause', color: '#FFFFFF' },
           { title: 'R                     - Restart', color: '#FFFFFF' },
           { title: 'M                     - Mute sound', color: '#FFFFFF' },
           { title: 'H                     - This panel', color: '#FFFFFF' },
           { title: 'Enter                 - Start / Select', color: '#FFFFFF' },
           ];

    sections.forEach((section) => {
      if (section.title) {
        ctx.fillStyle = section.color;
        ctx.font = `bold ${tile * 0.55}px monospace`;
           } else {
        ctx.fillStyle = '#BBBBBB';
        ctx.font = `${tile * 0.45}px monospace`;
           }
      ctx.fillText(section.title, startX, y);
      y += lineHeight;
         });

          // Close instruction
    ctx.fillStyle = '#FFB852';
    ctx.font = `bold ${tile * 0.5}px monospace`;
    ctx.textAlign = 'center';

    const fadeAlpha = Math.max(0.3, Math.sin(this.currentFrame() * 0.1) * 0.3 + 0.7);
    ctx.globalAlpha = fadeAlpha;
    ctx.fillText('Press SPACE or H to close', w / 2, panelY + panelH - tile);
    ctx.globalAlpha = 1;
       }

        // ---- Game Over Score Entry (Task 16) ----
  renderGameOverWithScore(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number, game: Game): void {
    const topScores = this.getTopScores();
    const qualifies = topScores.length < 10 || game.score > (topScores[topScores.length - 1]?.score || 0);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

          // Score display
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FF0000';
    ctx.font = `bold ${tile * 2}px monospace`;
    ctx.fillText('GAME OVER', w / 2, h * 0.24);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFF';
    ctx.font = `bold ${tile * 0.9}px monospace`;
    ctx.fillText(`Score: ${game.score}`, w / 2, h * 0.37);
    ctx.fillText(`Level: ${game.level}`, w / 2, h * 0.48);

          // Show top 5 scores
    if (topScores.length > 0) {
      ctx.fillStyle = '#FFFF00';
      ctx.font = `bold ${tile * 0.65}px monospace`;
      ctx.fillText('HIGH SCORES', w / 2, h * 0.58);

      for (let i = 0; i < Math.min(topScores.length, 5); i++) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${tile * 0.45}px monospace`;
        ctx.fillText(`${i + 1}. ${topScores[i].name} - ${topScores[i].score}`, w / 2, h * 0.63 + i * tile * 0.7);
           }
         }

          // Retry prompt
    ctx.fillStyle = '#FFB852';
    ctx.font = `${tile * 0.7}px monospace`;
    if (Math.floor(this.currentFrame() / 30) % 2 === 0) {
      ctx.fillText('PRESS ENTER TO RETRY', w / 2, h * 0.82);
         }
       }

        // ---- Helper Methods ----
  private currentFrame(): number {
    return Math.floor(performance.now() / 16.67);
       }

  toggleHowToPlay(): void {
    this.showingHowToPlay = !this.showingHowToPlay;
       }

  closeHowToPlay(): void {
    this.showingHowToPlay = false;
       }

  cycleDifficulty(): void {
    if (this.difficulty === 'easy') this.difficulty = 'normal';
    else if (this.difficulty === 'normal') this.difficulty = 'hard';
    else this.difficulty = 'easy';
       }

  getDifficulty(): 'easy' | 'normal' | 'hard' {
    return this.difficulty;
       }

  updatePlayerName(key: string): void {
    if (key === 'Backspace') {
      this.playerName = this.playerName.slice(0, -1);
         }
    else if (key.length === 1 && this.playerName.length < 8) {
      this.playerName = this.playerName + key.toUpperCase();
         }
       }

  getPlayerName(): string {
    return this.playerName.length === 0 ? 'PLAYER' : this.playerName;
       }

  setNameInputFocused(focused: boolean): void {
    this.nameInputFocused = focused;
       }

  getNameInputFocused(): boolean {
    return this.nameInputFocused;
       }

  getTopScores(): any[] {
    try {
      return JSON.parse(localStorage.getItem('mazeChaseScores') || '[]') as any[];
         } catch {
      return [];
         }
       }

          // Render game over with score entry (Task 16)
  renderGameOverScoreEntry(ctx: CanvasRenderingContext2D, w: number, h: number, tile: number, game: Game, score: number): void {
    const scores = this.getTopScores();
    const qualifies = scores.length < 10 || score > (scores[scores.length - 1]?.score || 0);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

          // Game over text
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#FF0000';
    ctx.font = `bold ${tile * 2}px monospace`;
    ctx.fillText('GAME OVER', w / 2, h * 0.24);
    ctx.shadowBlur = 0;

          // Score
    ctx.fillStyle = '#FFF';
    ctx.font = `bold ${tile * 0.9}px monospace`;
    ctx.fillText(`Score: ${score}`, w / 2, h * 0.37);
    ctx.fillText(`Level: ${game.level}`, w / 2, h * 0.43);

    if (qualifies) {
               // Score entered!
      ctx.fillStyle = '#00FF00';
      ctx.font = `bold ${tile * 0.7}px monospace`;
      ctx.fillText('NEW HIGH SCORE!', w / 2, h * 0.56);
      ctx.fillStyle = '#FFB8FF';
      ctx.font = `${tile * 0.5}px monospace`;
      ctx.fillText('Enter your initials:', w / 2, h * 0.64);
      ctx.fillText('?? ?', w / 2, h * 0.72);
         } else {
      ctx.fillStyle = '#FFB8FF';
      ctx.font = `${tile * 0.55}px monospace`;
      ctx.fillText(`Best: ${game.highScore}`, w / 2, h * 0.56);
         }

          // Retry prompt
    ctx.fillStyle = '#FFB852';
    ctx.font = `${tile * 0.7}px monospace`;
    if (Math.floor(this.currentFrame() / 30) % 2 === 0) {
      ctx.fillText('PRESS ENTER TO RETRY', w / 2, h * 0.85);
         }
       }
     }
