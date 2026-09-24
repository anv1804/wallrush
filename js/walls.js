/* ==========================================================
   WALL GENERATION & COLLISION SYSTEM
   ========================================================== */

class WallSegment {
  constructor(x, width) {
    this.x = x;
    this.width = width;
  }
}

class Wall {
  constructor(y, height, gaps, speed, type = 'static') {
    this.y = y;
    this.height = height || 26;
    this.speed = speed;
    this.type = type; // 'static' or 'moving'
    this.segments = []; // array of {x, width} solid chunks
    this.passed = false;
    this.moveDir = Math.random() > 0.5 ? 1 : -1;
    this.moveSpeed = 1.2;
    this.gaps = gaps; // array of {x, width} openings
  }

  update(arenaWidth) {
    this.y += this.speed;

    if (this.type === 'moving') {
      let shift = this.moveDir * this.moveSpeed;
      let minGapX = Infinity;
      let maxGapRight = -Infinity;

      for (let g of this.gaps) {
        g.x += shift;
        if (g.x < minGapX) minGapX = g.x;
        if (g.x + g.width > maxGapRight) maxGapRight = g.x + g.width;
      }

      if (minGapX <= 20 || maxGapRight >= arenaWidth - 20) {
        this.moveDir *= -1;
      }

      this.recalculateSegments(arenaWidth);
    }
  }

  recalculateSegments(arenaWidth) {
    this.segments = [];
    const sortedGaps = [...this.gaps].sort((a, b) => a.x - b.x);

    let currentX = 0;
    for (let gap of sortedGaps) {
      if (gap.x > currentX) {
        this.segments.push({
          x: currentX,
          width: gap.x - currentX
        });
      }
      currentX = gap.x + gap.width;
    }

    if (currentX < arenaWidth) {
      this.segments.push({
        x: currentX,
        width: arenaWidth - currentX
      });
    }
  }

  draw(ctx) {
    ctx.save();
    for (let seg of this.segments) {
      // Clean modern gradient for walls
      const grad = ctx.createLinearGradient(seg.x, this.y, seg.x, this.y + this.height);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#0f172a');

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Rounded rectangles
      const r = 6;
      ctx.roundRect(seg.x, this.y, seg.width, this.height, r);
      ctx.fill();

      // Top highlight edge
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(seg.x + r, this.y + 1);
      ctx.lineTo(seg.x + seg.width - r, this.y + 1);
      ctx.stroke();

      // Warning hazard stripes along the front
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 4;
      for (let sx = seg.x - 20; sx < seg.x + seg.width + 20; sx += 18) {
        ctx.beginPath();
        ctx.moveTo(sx, this.y);
        ctx.lineTo(sx + 15, this.y + this.height);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw glowing indicators at gap borders
    for (let gap of this.gaps) {
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      // Left gap edge light
      ctx.fillRect(gap.x - 3, this.y, 3, this.height);
      // Right gap edge light
      ctx.fillRect(gap.x + gap.width, this.y, 3, this.height);
    }

    ctx.restore();
  }

  // Check collision with player circle
  checkCollision(player) {
    if (player.isGhost) return false;

    for (let seg of this.segments) {
      // Find closest point to player on this rectangle
      const closestX = Math.max(seg.x, Math.min(player.x, seg.x + seg.width));
      const closestY = Math.max(this.y, Math.min(player.y, this.y + this.height));

      const dx = player.x - closestX;
      const dy = player.y - closestY;
      const distSquared = dx * dx + dy * dy;

      if (distSquared < player.radius * player.radius) {
        return true;
      }
    }
    return false;
  }
}

class WallManager {
  constructor(arenaWidth, arenaHeight) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;
    this.walls = [];
    this.spawnTimer = 0;
    this.spawnInterval = 110; // frames
    this.baseSpeed = 3.2;
    this.speedMultiplier = 1.0;
  }

  reset() {
    this.walls = [];
    this.spawnTimer = 40; // initial grace period
    this.speedMultiplier = 1.0;
  }

  setSpeedMultiplier(mult) {
    this.speedMultiplier = mult;
  }

  update() {
    this.spawnTimer--;
    if (this.spawnTimer <= 0) {
      this.spawnWall();
      // Faster spawn rate as speed increases
      this.spawnInterval = Math.max(65, 115 - (this.speedMultiplier - 1.0) * 45);
      this.spawnTimer = this.spawnInterval;
    }

    const currentSpeed = this.baseSpeed * this.speedMultiplier;

    for (let i = this.walls.length - 1; i >= 0; i--) {
      const wall = this.walls[i];
      wall.speed = currentSpeed;
      wall.update(this.arenaWidth);

      // Remove off-screen walls
      if (wall.y > this.arenaHeight + 50) {
        this.walls.splice(i, 1);
      }
    }
  }

  spawnWall() {
    const wallHeight = 28;
    const speed = this.baseSpeed * this.speedMultiplier;
    const patternType = Math.random();

    let gaps = [];
    let type = 'static';

    const gapWidth = Math.max(75, 110 - (this.speedMultiplier - 1.0) * 20);

    if (patternType < 0.4) {
      // Single wide gap
      const gapX = 60 + Math.random() * (this.arenaWidth - gapWidth - 120);
      gaps.push({ x: gapX, width: gapWidth + 20 });
    } else if (patternType < 0.75) {
      // Double gaps (one for each player or choices)
      const leftGapX = 50 + Math.random() * (this.arenaWidth * 0.4 - gapWidth);
      const rightGapX = this.arenaWidth * 0.55 + Math.random() * (this.arenaWidth * 0.4 - gapWidth);
      gaps.push({ x: leftGapX, width: gapWidth });
      gaps.push({ x: rightGapX, width: gapWidth });
    } else {
      // Moving gap
      type = 'moving';
      const gapX = this.arenaWidth / 2 - gapWidth / 2;
      gaps.push({ x: gapX, width: gapWidth + 15 });
    }

    const wall = new Wall(-wallHeight, wallHeight, gaps, speed, type);
    wall.recalculateSegments(this.arenaWidth);
    this.walls.push(wall);
  }

  draw(ctx) {
    for (let wall of this.walls) {
      wall.draw(ctx);
    }
  }

  checkCollisions(players) {
    const hitResults = [];
    for (let p of players) {
      if (!p.alive) continue;
      for (let wall of this.walls) {
        if (wall.checkCollision(p)) {
          hitResults.push({ player: p, wall });
          break;
        }
      }
    }
    return hitResults;
  }
}

window.WallManager = WallManager;
