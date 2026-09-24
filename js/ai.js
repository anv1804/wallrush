/* ==========================================================
   SMART AI FOR QUORIDOR (WALL RUSH)
   Uses BFS shortest path evaluation and strategic blocking
   ========================================================== */

class QuoridorAI {
  constructor(game) {
    this.game = game;
  }

  // Get best move for AI (Player 2)
  getBestMove() {
    const ai = this.game.p2;
    const human = this.game.p1;

    const myDist = this.game.getShortestPathDistance(ai);
    const humanDist = this.game.getShortestPathDistance(human);

    // If human is very close to goal or winning, try aggressively to block
    const shouldConsiderWall = ai.wallsLeft > 0 && (humanDist <= 4 || humanDist < myDist || Math.random() < 0.4);

    let bestWall = null;
    let maxAdvantage = -Infinity;

    if (shouldConsiderWall) {
      // Evaluate candidate walls around the human player's path
      const candidates = this.getCandidateWalls(human);

      for (const w of candidates) {
        if (this.game.isValidWallPlacement(w.r, w.c, w.orientation).valid) {
          // Temporarily place wall
          this.game.walls.push({ r: w.r, c: w.c, orientation: w.orientation });
          const newHumanDist = this.game.getShortestPathDistance(human);
          const newAiDist = this.game.getShortestPathDistance(ai);
          this.game.walls.pop();

          // Advantage is slowing down human more than AI
          if (newHumanDist !== Infinity && newAiDist !== Infinity) {
            const humanDelta = newHumanDist - humanDist;
            const aiDelta = newAiDist - myDist;
            const advantage = humanDelta * 2.5 - aiDelta;

            if (humanDelta > 0 && advantage > maxAdvantage) {
              maxAdvantage = advantage;
              bestWall = w;
            }
          }
        }
      }
    }

    // If a good blocking wall is found that delays human by >= 2 steps, place it
    if (bestWall && maxAdvantage >= 2) {
      return { type: 'wall', wall: bestWall };
    }

    // Otherwise, move along the shortest path
    const validMoves = this.game.getValidMoves(ai);
    let bestMove = null;
    let minPathDist = Infinity;

    for (const m of validMoves) {
      // Temporarily simulate move
      const oldR = ai.r;
      const oldC = ai.c;
      ai.r = m.r;
      ai.c = m.c;

      const dist = this.game.getShortestPathDistance(ai);

      ai.r = oldR;
      ai.c = oldC;

      if (dist < minPathDist) {
        minPathDist = dist;
        bestMove = m;
      }
    }

    if (bestMove) {
      return { type: 'move', move: bestMove };
    }

    // Fallback to random valid move
    if (validMoves.length > 0) {
      return { type: 'move', move: validMoves[0] };
    }

    return null;
  }

  // Get relevant wall positions around human player to reduce search space
  getCandidateWalls(player) {
    const candidates = [];
    const minR = Math.max(0, player.r - 2);
    const maxR = Math.min(7, player.r + 2);
    const minC = Math.max(0, player.c - 2);
    const maxC = Math.min(7, player.c + 2);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        candidates.push({ r, c, orientation: 'h' });
        candidates.push({ r, c, orientation: 'v' });
      }
    }

    return candidates;
  }
}

window.QuoridorAI = QuoridorAI;
