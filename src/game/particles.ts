// Simple particle emitter system for the start screen
// Particles float upward with gentle physics, like floating pellets

export interface ParticleConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;

  constructor(config: ParticleConfig) {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.life = config.life;
    this.maxLife = config.maxLife;
    this.color = config.color;
    this.size = config.size;
    }

   /** Returns true if particle is still alive */
  isAlive(): boolean {
    return this.life > 0;
    }

   /** Returns current alpha based on remaining life */
  alpha(): number {
    return Math.max(0, this.life / this.maxLife);
    }
  }

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number;
  public spawnTimer: number = 0;

  constructor(maxParticles: number = 200) {
    this.maxParticles = maxParticles;
    }

   /**
    * Spawn particles at a position with random colors and velocities.
    */
  spawn(x: number, y: number, count: number, colors: string[]): void {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      this.particles.push(new Particle({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 1.5 + 0.3),  // float upward
        life: Math.floor(Math.random() * 60 + 40),
        maxLife: 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 1.5,
        }));
      }
    }

   /**
    * Update all particles — decrease life, apply physics.
    */
  update(): void {
    this.spawnTimer++;
    // Remove dead particles
    this.particles = this.particles.filter(p => p.isAlive());
    for (const p of this.particles) {
      p.life--;
      p.x += p.vx;
      p.vy *= 0.99;  // slight drag (float upward with deceleration)
      p.y += p.vy;
      }
    }

   /**
    * Render all particles to the canvas context.
    */
  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.alpha();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      }
    ctx.globalAlpha = 1;
    }

   /** Clear all particles */
  clear(): void {
    this.particles = [];
    }

   /** Current particle count */
  get count(): number {
    return this.particles.length;
    }
  }
