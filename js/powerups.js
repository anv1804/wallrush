/* ==========================================================
   POWERUPS SYSTEM
   ========================================================== */

const POWERUP_TYPES = {
  SHIELD: {
    id: 'shield',
    name: 'Khiên Bảo Vệ',
    icon: '🛡️',
    color: '#0284c7',
    duration: 0, // permanent until hit
  },
  SPEED: {
    id: 'speed',
    name: 'Tăng Tốc',
    icon: '⚡',
    color: '#f59e0b',
    duration: 360, // ~6 seconds (60fps)
  },
  GHOST: {
    id: 'ghost',
    name: 'Xuyên Tường',
    icon: '👻',
    color: '#a855f7',
    duration: 240, // ~4 seconds
  },
  SLOW: {
    id: 'slow',
    name: 'Làm Chậm Đối Thủ',
    icon: '❄️',
    color: '#3b82f6',
    duration: 240, // ~4 seconds
  }
};

class PowerupItem {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 16;
    this.speed = 1.6;
    this.alive = true;
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  update() {
    this.y += this.speed;
    this.floatOffset += 0.06;
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.save();
    const bobY = this.y + Math.sin(this.floatOffset) * 4;

    // Glowing circle
    ctx.shadowColor = this.type.color;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(this.x, bobY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.strokeStyle = this.type.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Emoji / Icon
    ctx.font = '16px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.icon, this.x, bobY + 1);

    ctx.restore();
  }

  checkCollision(player) {
    if (!this.alive || !player.alive) return false;
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius + player.radius;
  }
}

class PowerupManager {
  constructor(arenaWidth, arenaHeight) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;
    this.items = [];
    this.spawnTimer = 180;
  }

  reset() {
    this.items = [];
    this.spawnTimer = 200;
  }

  update(players) {
    this.spawnTimer--;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = 280 + Math.floor(Math.random() * 220); // ~5-8 seconds
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update();

      // Check pickup by players
      for (let player of players) {
        if (item.checkCollision(player)) {
          this.applyBuff(player, item.type, players);
          window.soundSystem.playPowerup();
          window.particleSystem.createPickupEffect(item.x, item.y, item.type.color);
          item.alive = false;
          break;
        }
      }

      // Remove out of bounds or collected
      if (!item.alive || item.y > this.arenaHeight + 40) {
        this.items.splice(i, 1);
      }
    }
  }

  spawn() {
    const x = 50 + Math.random() * (this.arenaWidth - 100);
    const types = [
      POWERUP_TYPES.SHIELD,
      POWERUP_TYPES.SPEED,
      POWERUP_TYPES.GHOST,
      POWERUP_TYPES.SLOW
    ];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    this.items.push(new PowerupItem(x, -20, chosenType));
  }

  applyBuff(collector, buffType, allPlayers) {
    if (buffType.id === 'shield') {
      collector.hasShield = true;
    } else if (buffType.id === 'speed') {
      collector.speedBuffTimer = buffType.duration;
    } else if (buffType.id === 'ghost') {
      collector.ghostTimer = buffType.duration;
    } else if (buffType.id === 'slow') {
      // Find opponent and apply slow
      for (let p of allPlayers) {
        if (p.id !== collector.id) {
          p.slowDebuffTimer = buffType.duration;
          window.particleSystem.createExplosion(p.x, p.y, '#3b82f6');
        }
      }
    }
  }

  draw(ctx) {
    for (let item of this.items) {
      item.draw(ctx);
    }
  }
}

window.PowerupManager = PowerupManager;
