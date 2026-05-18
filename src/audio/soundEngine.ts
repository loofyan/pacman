// Lightweight sound engine using Web Audio API oscillators
// All sounds are generated programmatically - no external assets

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private enabled: boolean = false;

  // Background music state
  private musicEnabled: boolean = true;
  private musicPlaying: boolean = false;
  private musicTimeout: number | null = null;
  private currentContext: AudioContext | null = null;

  init(): void {
    if (this.enabled) return;
    try {
      this.ctx = new AudioContext();
      this.currentContext = this.ctx;
      this.enabled = true;
      // Resume to avoid browser auto-suspend (required for modern browsers)
      void this.ctx.resume();
    } catch {
      this.enabled = false;
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBackgroundMusic();
    }
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
    return this.musicEnabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  private play(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.15): void {
    if (!this.enabled || this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

   // Each ghost has a different walking sound pitch
  walk(ghostIndex: number = 0): void {
    const baseFreq = 180 + ghostIndex * 40;
    this.play(baseFreq, 0.08, 'square', 0.06);
  }

  eatPellet(): void {
    this.play(600, 0.05, 'square', 0.08);
  }

  eatPowerPellet(): void {
    this.play(300, 0.15, 'sine', 0.12);
    setTimeout(() => this.play(450, 0.1, 'sine', 0.1), 80);
  }

  eatGhost(): void {
    this.play(800, 0.1, 'square', 0.1);
    setTimeout(() => this.play(1000, 0.15, 'square', 0.1), 80);
    setTimeout(() => this.play(1200, 0.2, 'square', 0.08), 160);
  }

  death(): void {
    if (!this.enabled || this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.8);
  }

  levelUp(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.play(freq, 0.15, 'sine', 0.1), i * 100);
    });
  }

  powerMode(): void {
    this.play(200, 0.3, 'triangle', 0.08);
  }

  // ========== Background Music ==========

  // Short chiptune jingle notes (frequencies) — looping pattern
  private static readonly MUSIC_PATTERN: number[] = [
    // Bar 1: Ascending arpeggio
    523, 659, 784, 1047,
    // Bar 2: Descending
    880, 784, 659, 523,
    // Bar 3: Melody
    587, 659, 784, 659,
    // Bar 4: Resolution
    523, 440, 523, 659,
    // Bar 5: Second phrase
    784, 880, 784, 659,
    // Bar 6: Running down
    523, 587, 659, 523,
    // Bar 7: Approach
    440, 523, 659, 784,
    // Bar 8: Land
    523, 0, 523, 659,
  ];

  // Rhythmic pattern — which notes get longer durations for groove
  private static readonly MUSIC_RHYTHM: number[] = [
    1, 0.75, 1, 0.75,
    0.75, 1, 0.75, 1,
    1, 0.5, 1, 0.5,
    0.5, 1, 0.5, 1,
    1, 0.75, 1, 0.75,
    0.75, 1, 0.75, 1,
    1, 0.5, 1, 0.5,
    0.5, 1, 0.5, 1,
  ];

   /**
   * Play a looping chiptune jingle using oscillators.
   * Uses different wave types per note and a repeating pattern.
   */
  playBackgroundMusic(): void {
    if (this.musicPlaying || !this.enabled || this.muted || !this.musicEnabled) return;
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx) return;

    this.musicPlaying = true;
    this.currentContext = this.ctx;
    let noteIndex = 0;
    let beatIndex = 0;

    const playNextNote = (): void => {
      if (!this.musicPlaying || !this.ctx || this.muted || !this.musicEnabled) {
        this.musicPlaying = false;
        return;
      }

      const freq = SoundEngine.MUSIC_PATTERN[noteIndex % SoundEngine.MUSIC_PATTERN.length];
      const rhythmValue = SoundEngine.MUSIC_RHYTHM[beatIndex % SoundEngine.MUSIC_RHYTHM.length];

      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Use triangle for warm lead, square for bass undertone
        const isBass = beatIndex % 4 === 0;
        osc.type = isBass ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // ADSR envelope
        const duration = rhythmValue * 0.22;
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(isBass ? 0.08 : 0.05, this.ctx.currentTime + 0.01);
        gain.gain.linearRampToValueAtTime(isBass ? 0.06 : 0.035, this.ctx.currentTime + duration * 0.5);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration + 0.01);
      }

      noteIndex++;
      beatIndex++;

      // Schedule next note
      const nextNoteDelay = rhythmValue * 200;
      this.musicTimeout = window.setTimeout(playNextNote, nextNoteDelay);
    };

    playNextNote();
  }

   /**
   * Stop the background music loop.
   */
  stopBackgroundMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimeout !== null) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
  }

  // ========== Menu Sounds ==========

   /**
   * Short blip for menu interactions (select / confirm).
   */
  playSelectSound(): void {
    if (!this.enabled || this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  }

   /**
   * Subtle ambient ghost sound for title screen — a soft wobble.
   */
  playGhostSound(): void {
    if (!this.enabled || this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    // Wobble effect by modulating frequency
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(180, this.ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.35);
  }
}
