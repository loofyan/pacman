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
    } else if (this.musicEnabled && this.enabled && this.ctx) {
      // Restart music when unmuting
      this.playBackgroundMusic();
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
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
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
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
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

  // Chill ambient melody — pentatonic scale, slow and relaxing
  // Using C major pentatonic: C4(262), D4(294), E4(330), G4(392), A4(440), C5(523), D5(587), E5(659), G5(784)
  // Pattern: gentle arpeggios with lots of space between notes
  private static readonly MUSIC_PATTERN: number[] = [
    // Phrase 1: warm descending
    523, 440, 392, 330, 0, 330, 294, 262,
    // Phrase 2: gentle rise
    0, 294, 330, 392, 440, 0, 392, 330,
    // Phrase 3: settled motion
    262, 294, 330, 392, 0, 440, 392, 0,
    // Phrase 4: soft resolution
    330, 294, 262, 0, 330, 392, 440, 0,
  ];

  // Slow rhythm — long relaxed durations with silence gaps
  private static readonly MUSIC_RHYTHM: number[] = [
    1.5, 1.0, 1.5, 1.0, 0.5, 1.0, 1.5, 1.0,
    0.5, 1.0, 1.0, 1.5, 1.0, 0.5, 1.5, 1.0,
    1.5, 1.0, 1.0, 1.5, 0.5, 1.0, 1.5, 0.5,
    1.0, 1.0, 1.5, 0.5, 1.0, 1.0, 1.5, 1.0,
  ];

   /**
   * Play a looping chill ambient melody.
   * Uses warm sine/triangle waves at low volume for a relaxing vibe.
   */
  playBackgroundMusic(): void {
    if (this.musicPlaying || !this.enabled || this.muted || !this.musicEnabled) return;
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx) return;
    // Ensure context is running (resume is async, so check state)
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
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

        // Alternate between sine (warm pad) and triangle (soft lead)
        osc.type = beatIndex % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Smooth, relaxed envelope
        const duration = rhythmValue * 0.4;
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + duration * 0.6);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration + 0.02);
      }

      noteIndex++;
      beatIndex++;

      // Schedule next note at relaxed pace
      const nextNoteDelay = rhythmValue * 350;
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
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
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
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
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
