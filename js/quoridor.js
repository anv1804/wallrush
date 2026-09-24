/* ==========================================================
   QUORIDOR ENGINE (CORE RULES & PATHFINDING)
   Supports 2 Players & 4 Players (1v1, 2v2, 1v1v1v1)
   ========================================================== */

class QuoridorGame {
  constructor(mode = '2p') {
    this.BOARD_SIZE = 9;
    this.mode = mode; // '2p', '4p', '2v2'
    this.reset(mode);
  }

  reset(mode = this.mode) {
    this.mode = mode;
    this.is4P = (mode === '4p' || mode === '1v1v1v1' || mode === '2v2');
    const wallCount = this.is4P ? 5 : 10;

    // Player 1: Bottom (row 8, col 4), Goal: row 0
    this.p1 = {
      id: 1,
      r: 8,
      c: 4,
      wallsLeft: wallCount,
      goalType: 'row',
      goalVal: 0,
      team: (mode === '2v2') ? 'A' : null
    };

    // Player 2: Top (row 0, col 4), Goal: row 8
    this.p2 = {
      id: 2,
      r: 0,
      c: 4,
      wallsLeft: wallCount,
      goalType: 'row',
      goalVal: 8,
      team: (mode === '2v2') ? 'B' : null
    };

    this.players = [this.p1, this.p2];

    if (this.is4P) {
      // Player 3: Left (row 4, col 0), Goal: col 8
      this.p3 = {
        id: 3,
        r: 4,
        c: 0,
        wallsLeft: wallCount,
        goalType: 'col',
        goalVal: 8,
        team: (mode === '2v2') ? 'A' : null
      };

      // Player 4: Right (row 4, col 8), Goal: col 0
      this.p4 = {
        id: 4,
        r: 4,
        c: 8,
        wallsLeft: wallCount,
        goalType: 'col',
        goalVal: 0,
        team: (mode === '2v2') ? 'B' : null
      };

      this.players.push(this.p3, this.p4);
    }

    this.walls = []; // array of { r, c, orientation, player }
    this.currentTurn = 1; // 1..2 or 1..4
    this.winner = null;
    this.winningTeam = null;
    this.moveHistory = [];
  }

  getCurrentPlayer() {
    return this.players.find(p => p.id === this.currentTurn) || this.players[0];
  }

  isBlockedByWall(r1, c1, r2, c2) {
    // Horizontal step: (r, c) <-> (r, c+1)
    if (r1 === r2) {
      const minC = Math.min(c1, c2);
      for (const w of this.walls) {
        if (w.orientation === 'v' && w.c === minC) {
          if (w.r === r1 || w.r === r1 - 1) return true;
        }
      }
      return false;
    }

    // Vertical step: (r, c) <-> (r+1, c)
    if (c1 === c2) {
      const minR = Math.min(r1, r2);
      for (const w of this.walls) {
        if (w.orientation === 'h' && w.r === minR) {
          if (w.c === c1 || w.c === c1 - 1) return true;
        }
      }
      return false;
    }

    return true; // Not adjacent
  }

  // Check if a cell contains any other player
  getPawnAt(r, c) {
    return this.players.find(p => p.r === r && p.c === c);
  }

  // Get all legal pawn moves for a player
  getValidMoves(player = this.getCurrentPlayer()) {
    if (this.winner) return [];

    const moves = [];
    const deltas = [
      { dr: -1, dc: 0 }, // Up
      { dr: 1, dc: 0 },  // Down
      { dr: 0, dc: -1 }, // Left
      { dr: 0, dc: 1 }   // Right
    ];

    for (const d of deltas) {
      const nr = player.r + d.dr;
      const nc = player.c + d.dc;

      // Board limits
      if (nr < 0 || nr >= this.BOARD_SIZE || nc < 0 || nc >= this.BOARD_SIZE) continue;

      // Wall obstruction
      if (this.isBlockedByWall(player.r, player.c, nr, nc)) continue;

      const opp = this.getPawnAt(nr, nc);

      if (!opp) {
        moves.push({ r: nr, c: nc, isJump: false });
      } else {
        // Another pawn is in adjacent cell! Jump straight or diagonally
        const jumpR = nr + d.dr;
        const jumpC = nc + d.dc;

        const canJumpStraight =
          jumpR >= 0 && jumpR < this.BOARD_SIZE &&
          jumpC >= 0 && jumpC < this.BOARD_SIZE &&
          !this.getPawnAt(jumpR, jumpC) &&
          !this.isBlockedByWall(opp.r, opp.c, jumpR, jumpC);

        if (canJumpStraight) {
          moves.push({ r: jumpR, c: jumpC, isJump: true });
        } else {
          // Cannot jump straight -> diagonal jumps
          const perpDeltas = (d.dr !== 0)
            ? [{ dr: 0, dc: -1 }, { dr: 0, dc: 1 }]
            : [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }];

          for (const pd of perpDeltas) {
            const diagR = opp.r + pd.dr;
            const diagC = opp.c + pd.dc;
            if (diagR >= 0 && diagR < this.BOARD_SIZE && diagC >= 0 && diagC < this.BOARD_SIZE) {
              if (!this.getPawnAt(diagR, diagC) && !this.isBlockedByWall(opp.r, opp.c, diagR, diagC)) {
                moves.push({ r: diagR, c: diagC, isJump: true });
              }
            }
          }
        }
      }
    }

    return moves;
  }

  // Validate if a wall can be placed
  isValidWallPlacement(r, c, orientation) {
    const player = this.getCurrentPlayer();
    if (player.wallsLeft <= 0 || this.winner) return { valid: false, reason: 'Hết tường!' };

    if (r < 0 || r > 7 || c < 0 || c > 7) {
      return { valid: false, reason: 'Ngoài bàn cờ' };
    }

    // Check intersection / overlap with existing walls
    for (const w of this.walls) {
      if (w.r === r && w.c === c) {
        return { valid: false, reason: 'Giao điểm đã có tường' };
      }

      if (orientation === 'h' && w.orientation === 'h') {
        if (w.r === r && (w.c === c || w.c === c - 1 || w.c === c + 1)) {
          return { valid: false, reason: 'Trùng hoặc đè lên tường ngang khác' };
        }
      }

      if (orientation === 'v' && w.orientation === 'v') {
        if (w.c === c && (w.r === r || w.r === r - 1 || w.r === r + 1)) {
          return { valid: false, reason: 'Trùng hoặc đè lên tường dọc khác' };
        }
      }
    }

    // Crucial Quoridor Rule: Must not block all paths to goal for ANY player!
    this.walls.push({ r, c, orientation, player: player.id });
    let allPlayersHavePath = true;
    for (const p of this.players) {
      if (!this.hasPathToGoal(p)) {
        allPlayersHavePath = false;
        break;
      }
    }
    this.walls.pop(); // Revert test wall

    if (!allPlayersHavePath) {
      return { valid: false, reason: 'Không được chặn hoàn toàn đường về đích của người chơi!' };
    }

    return { valid: true };
  }

  // BFS check if player has a path to their goal row/col
  hasPathToGoal(player) {
    const queue = [{ r: player.r, c: player.c }];
    const visited = Array.from({ length: this.BOARD_SIZE }, () => Array(this.BOARD_SIZE).fill(false));
    visited[player.r][player.c] = true;

    const deltas = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ];

    while (queue.length > 0) {
      const { r, c } = queue.shift();

      // Check reached goal
      if (player.goalType === 'row' && r === player.goalVal) return true;
      if (player.goalType === 'col' && c === player.goalVal) return true;

      for (const d of deltas) {
        const nr = r + d.dr;
        const nc = c + d.dc;

        if (nr >= 0 && nr < this.BOARD_SIZE && nc >= 0 && nc < this.BOARD_SIZE && !visited[nr][nc]) {
          if (!this.isBlockedByWall(r, c, nr, nc)) {
            visited[nr][nc] = true;
            queue.push({ r: nr, c: nc });
          }
        }
      }
    }

    return false;
  }

  // Shortest path distance
  getShortestPathDistance(player) {
    const queue = [{ r: player.r, c: player.c, dist: 0 }];
    const visited = Array.from({ length: this.BOARD_SIZE }, () => Array(this.BOARD_SIZE).fill(false));
    visited[player.r][player.c] = true;

    const deltas = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 }
    ];

    while (queue.length > 0) {
      const { r, c, dist } = queue.shift();

      if (player.goalType === 'row' && r === player.goalVal) return dist;
      if (player.goalType === 'col' && c === player.goalVal) return dist;

      for (const d of deltas) {
        const nr = r + d.dr;
        const nc = c + d.dc;

        if (nr >= 0 && nr < this.BOARD_SIZE && nc >= 0 && nc < this.BOARD_SIZE && !visited[nr][nc]) {
          if (!this.isBlockedByWall(r, c, nr, nc)) {
            visited[nr][nc] = true;
            queue.push({ r: nr, c: nc, dist: dist + 1 });
          }
        }
      }
    }

    return Infinity;
  }

  // Execute a pawn move
  movePawn(r, c) {
    const validMoves = this.getValidMoves();
    const isLegal = validMoves.some(m => m.r === r && m.c === c);

    if (!isLegal) {
      return { success: false, reason: 'Nước đi không hợp lệ!' };
    }

    const player = this.getCurrentPlayer();
    this.moveHistory.push({
      type: 'move',
      player: player.id,
      from: { r: player.r, c: player.c },
      to: { r, c }
    });

    player.r = r;
    player.c = c;

    // Check win condition
    const hasWon = (player.goalType === 'row' && player.r === player.goalVal) ||
                   (player.goalType === 'col' && player.c === player.goalVal);

    if (hasWon) {
      this.winner = player.id;
      if (this.mode === '2v2') {
        this.winningTeam = player.team;
      }
      return { success: true, won: true, winner: player.id, winningTeam: this.winningTeam };
    }

    this.advanceTurn();
    return { success: true, won: false };
  }

  // Execute wall placement
  placeWall(r, c, orientation) {
    const check = this.isValidWallPlacement(r, c, orientation);
    if (!check.valid) {
      return { success: false, reason: check.reason };
    }

    const player = this.getCurrentPlayer();
    player.wallsLeft--;
    this.walls.push({ r, c, orientation, player: player.id });

    this.moveHistory.push({
      type: 'wall',
      player: player.id,
      wall: { r, c, orientation }
    });

    this.advanceTurn();
    return { success: true };
  }

  advanceTurn() {
    const total = this.players.length;
    this.currentTurn = (this.currentTurn % total) + 1;
  }
}

if (typeof window !== 'undefined') window.QuoridorGame = QuoridorGame;
if (typeof module !== 'undefined') module.exports = { QuoridorGame };
