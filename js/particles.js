/* ==========================================================
   PARTICLE SYSTEM & VISUAL EFFECTS
   ========================================================== */

class Particle {
  constructor(x, y, vx, vy, color, size, life, decay, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.initialSize = size;
    this.life = life;
    this.maxLife = life;
    this.decay = decay;
    this.shape = shape;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.life -= this.decay;
    this.rotation += this.rotSpeed;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size * (this.life / this.maxLife), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'square') {
      const s = this.size * (this.life / this.maxLife);
      ctx.fillRect(-s / 2, -s / 2, s, s);
    } else if (this.shape === 'spark') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(this.size, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  clear() {
    this.particles = [];
  }

  // Dash trail behind players
  createDashTrail(x, y, color) {
    for (let i = 0; i < 3; i++) {
      const vx = (Math.random() - 0.5) * 1.5;
      const vy = (Math.random() - 0.5) * 1.5;
      this.particles.push(
        new Particle(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8, vx, vy, color, 8, 1, 0.05, 'circle')
      );
    }
  }

  // Impact crash explosion
  createExplosion(x, y, color) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const shape = Math.random() > 0.5 ? 'circle' : 'square';
      const size = 4 + Math.random() * 6;
      this.particles.push(
        new Particle(x, y, vx, vy, color, size, 1, 0.025 + Math.random() * 0.02, shape)
      );
    }
  }

  // Item pickup sparkle
  createPickupEffect(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.particles.push(
        new Particle(x, y, vx, vy, color, 5, 1, 0.04, 'circle')
      );
    }
  }

  // Victory celebratory confetti
  createConfetti(width, height) {
    const colors = ['#0088ff', '#ff4757', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * width;
      const y = -10 - Math.random() * 40;
      const vx = (Math.random() - 0.5) * 3;
      const vy = 2 + Math.random() * 4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(
        new Particle(x, y, vx, vy, color, 6 + Math.random() * 5, 2.5, 0.015, 'square')
      );
    }
  }

  update() {
    this.particles = this.particles.filter(p => p.update());
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }
}

window.particleSystem = new ParticleSystem();
