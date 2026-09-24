/* ==========================================================
   PLAYER LOGIC & RENDERING
   ========================================================== */

class Player {
  constructor(id, x, y, color, accentColor, keys) {
    this.id = id;
    this.initialX = x;
    this.initialY = y;
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.color = color;
    this.accentColor = accentColor;
    this.keys = keys;

    // Movement physics
    this.vx = 0;
    this.vy = 0;
    this.baseSpeed = 5.2;
    this.friction = 0.88;
    this.accel = 1.1;

    // Dash / Rush mechanics
    this.isDashing = false;
    this.dashCooldownMax = 120; // frames (~2 sec)
    this.dashCooldown = 0;
    this.dashDuration = 14; // frames
    this.dashTimer = 0;
    this.dashSpeedMultiplier = 2.6;
    this.dashDirX = 0;
    this.dashDirY = -1; // default forward

    // Status & Buffs
    this.alive = true;
    this.hasShield = false;
    this.isGhost = false;
    this.ghostTimer = 0;
    this.speedBuffTimer = 0;
    this.slowDebuffTimer = 0;

    // Animation details
    this.facingAngle = -Math.PI / 2;
    this.squish = 1;
  }

  reset(x, y) {
    this.x = x || this.initialX;
    this.y = y || this.initialY;
    this.vx = 0;
    this.vy = 0;
    this.isDashing = false;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.alive = true;
    this.hasShield = false;
    this.isGhost = false;
    this.ghostTimer = 0;
    this.speedBuffTimer = 0;
    this.slowDebuffTimer = 0;
  }

  update(keyState, arenaWidth, arenaHeight) {
    if (!this.alive) return;

    // Handle buff timers
    if (this.ghostTimer > 0) {
      this.ghostTimer--;
      this.isGhost = true;
    } else {
      this.isGhost = false;
    }

    if (this.speedBuffTimer > 0) this.speedBuffTimer--;
    if (this.slowDebuffTimer > 0) this.slowDebuffTimer--;
    if (this.dashCooldown > 0) this.dashCooldown--;

    // Speed calculation
    let currentSpeed = this.baseSpeed;
    if (this.speedBuffTimer > 0) currentSpeed *= 1.45;
    if (this.slowDebuffTimer > 0) currentSpeed *= 0.65;

    // Dash execution
    if (this.isDashing) {
      this.dashTimer--;
      this.vx = this.dashDirX * currentSpeed * this.dashSpeedMultiplier;
      this.vy = this.dashDirY * currentSpeed * this.dashSpeedMultiplier;
      window.particleSystem.createDashTrail(this.x, this.y, this.accentColor);

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      // Normal input movement
      let moveX = 0;
      let moveY = 0;

      if (keyState[this.keys.up]) moveY -= 1;
      if (keyState[this.keys.down]) moveY += 1;
      if (keyState[this.keys.left]) moveX -= 1;
      if (keyState[this.keys.right]) moveX += 1;

      // Normalize diagonal movement
      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      if (moveX !== 0 || moveY !== 0) {
        this.vx += moveX * this.accel;
        this.vy += moveY * this.accel;
        this.dashDirX = moveX;
        this.dashDirY = moveY;
        this.facingAngle = Math.atan2(moveY, moveX);
      }

      // Trigger Dash
      if (keyState[this.keys.dash] && this.dashCooldown <= 0) {
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = this.dashCooldownMax;
        window.soundSystem.playDash();
        window.particleSystem.createDashTrail(this.x, this.y, this.accentColor);
      }

      // Apply friction
      this.vx *= this.friction;
      this.vy *= this.friction;
    }

    // Apply movement
    this.x += this.vx;
    this.y += this.vy;

    // Boundary constraints
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = 0;
    }
    if (this.x + this.radius > arenaWidth) {
      this.x = arenaWidth - this.radius;
      this.vx = 0;
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = 0;
    }
    if (this.y + this.radius > arenaHeight) {
      this.y = arenaHeight - this.radius;
      this.vy = 0;
    }
  }

  // Hit reaction (shield absorbs or fatal)
  takeHit() {
    if (this.hasShield) {
      this.hasShield = false;
      window.soundSystem.playHit();
      window.particleSystem.createExplosion(this.x, this.y, '#38bdf8');
      return false; // Survived thanks to shield
    }
    this.alive = false;
    window.soundSystem.playHit();
    window.particleSystem.createExplosion(this.x, this.y, this.color);
    return true; // Eliminated
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Ghost transparency effect
    if (this.isGhost) {
      ctx.globalAlpha = 0.45;
    }

    // Draw Shield Aura if active
    if (this.hasShield) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();
      ctx.stroke();
    }

    // Draw Glow
    const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.4, 0, 0, this.radius + 5);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.6, this.color);
    gradient.addColorStop(1, this.accentColor);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.shadowColor = this.accentColor;
    ctx.shadowBlur = this.isDashing ? 20 : 10;
    ctx.fill();

    // Directional visor / eye
    ctx.save();
    ctx.rotate(this.facingAngle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.radius * 0.45, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(this.radius * 0.55, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Status effect ring (slow/speed)
    if (this.speedBuffTimer > 0) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.slowDebuffTimer > 0) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

window.Player = Player;
