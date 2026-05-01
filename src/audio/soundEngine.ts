// Lightweight sound engine using Web Audio API oscillators
// All sounds are generated programmatically - no external assets

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private enabled: boolean = false;

  init(): void {
    if (this.enabled) return;
    try {
      this.ctx = new AudioContext();
      this.enabled = true;
    } catch {
      this.enabled = false;
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted; // Returns true if now muted, false if now unmuted
  }

  isMuted(): boolean {
    return this.muted;
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
}
