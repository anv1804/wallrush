const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// HTTP Static Server
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// WebSocket Server
const wss = new WebSocketServer({ server });

const queues = {
  '1v1': [],
  '2v2': [],
  '1v1v1v1': []
};
const rooms = new Map(); // roomId -> Room
const userSocketMap = new Map(); // userId -> ws

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

class Room {
  constructor(id, mode, isCustom = false) {
    this.id = id;
    this.mode = mode; // '1v1', '2v2', '1v1v1v1'
    this.capacity = mode === '1v1' ? 2 : 4;
    this.isCustom = isCustom;
    this.players = []; // array of { userId, ws, profile, seat, team, isOnline, disconnectTimer }
    this.state = 'WAITING'; // 'WAITING', 'PLAYING', 'FINISHED'
    this.currentTurn = 1;
    this.turnTimer = null;
    this.turnDeadline = 0;
    this.rematchRequests = new Set();
    this.gameState = {
      walls: [], // array of { r, c, orientation, player }
      pawns: [], // array of { seat, r, c }
      history: []
    };
  }

  broadcast(message, excludeWs = null) {
    const payload = JSON.stringify(message);
    for (const p of this.players) {
      if (p.ws && p.ws.readyState === WebSocket.OPEN && p.ws !== excludeWs) {
        try {
          p.ws.send(payload);
        } catch (e) {}
      }
    }
  }

  getPublicPlayerList() {
    return this.players.map(p => ({
      userId: p.userId,
      seat: p.seat,
      team: p.team,
      nickname: p.profile.nickname,
      avatar: p.profile.avatar,
      color: p.profile.color || 'indigo',
      rating: p.profile.rating,
      isOnline: p.isOnline !== false
    }));
  }
}

wss.on('connection', (ws) => {
  ws.userId = null;
  ws.currentRoomId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(ws, msg);
    } catch (err) {
      console.error('Invalid WS payload:', err);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });
});

function handleMessage(ws, msg) {
  // Bind userId on any initial event
  if (msg.userId) {
    ws.userId = msg.userId;
    userSocketMap.set(ws.userId, ws);
  }

  switch (msg.type) {
    // 0. Handshake / Init
    case 'init_session': {
      ws.userId = msg.userId;
      ws.profile = msg.profile || ws.profile || { nickname: 'Người chơi', rating: 1000, avatar: '👤', color: 'indigo', friendCode: 'WR-0000' };
      if (msg.friendCode) ws.profile.friendCode = msg.friendCode;
      userSocketMap.set(ws.userId, ws);
      ws.send(JSON.stringify({
        type: 'session_ready',
        userId: ws.userId
      }));
      break;
    }

    // Update Profile / Friend Code on Server
    case 'sync_profile': {
      ws.userId = msg.userId || ws.userId;
      ws.profile = { ...(ws.profile || {}), ...(msg.profile || {}) };
      if (ws.userId) userSocketMap.set(ws.userId, ws);
      break;
    }

    // Search Players by Name or Friend Code
    case 'search_players': {
      const query = (msg.query || '').trim().toLowerCase();
      if (!query || query.length < 2) {
        ws.send(JSON.stringify({ type: 'search_results', results: [] }));
        return;
      }

      const results = [];
      for (const [uid, sock] of userSocketMap.entries()) {
        if (uid === ws.userId || !sock.profile) continue;
        const nick = (sock.profile.nickname || '').toLowerCase();
        const fcode = (sock.profile.friendCode || '').toLowerCase();

        if (nick.includes(query) || fcode.includes(query) || uid.toLowerCase().includes(query)) {
          let status = 'online';
          if (sock.currentRoomId) {
            const r = rooms.get(sock.currentRoomId);
            status = (r && r.state === 'PLAYING') ? 'in_game' : 'in_room';
          }
          results.push({
            id: uid,
            friendCode: sock.profile.friendCode || 'WR-8888',
            nickname: sock.profile.nickname,
            avatar: sock.profile.avatar || '🦊',
            color: sock.profile.color || 'indigo',
            rating: sock.profile.rating || 1000,
            status
          });
          if (results.length >= 10) break;
        }
      }

      ws.send(JSON.stringify({
        type: 'search_results',
        query: msg.query,
        results
      }));
      break;
    }

    // Query status of a list of friend IDs
    case 'check_friends_status': {
      const friendIds = Array.isArray(msg.friendIds) ? msg.friendIds : [];
      const statuses = {};

      friendIds.forEach(fid => {
        const sock = userSocketMap.get(fid);
        if (sock && sock.readyState === WebSocket.OPEN) {
          let st = 'online';
          if (sock.currentRoomId) {
            const r = rooms.get(sock.currentRoomId);
            st = (r && r.state === 'PLAYING') ? 'in_game' : 'in_room';
          }
          statuses[fid] = {
            online: true,
            status: st,
            nickname: sock.profile ? sock.profile.nickname : undefined,
            avatar: sock.profile ? sock.profile.avatar : undefined,
            rating: sock.profile ? sock.profile.rating : undefined,
            color: sock.profile ? sock.profile.color : undefined
          };
        } else {
          statuses[fid] = { online: false, status: 'offline' };
        }
      });

      ws.send(JSON.stringify({
        type: 'friends_status_update',
        statuses
      }));
      break;
    }

    // Invite Friend to Room
    case 'invite_friend': {
      const { targetUserId, roomCode, mode } = msg;
      const targetSock = userSocketMap.get(targetUserId);

      if (!targetSock || targetSock.readyState !== WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'invite_sent_status', success: false, reason: 'Bạn bè hiện đang ngoại tuyến!' }));
        return;
      }

      const inviterName = ws.profile ? ws.profile.nickname : 'Bạn bè';
      const inviterAvatar = ws.profile ? ws.profile.avatar : '🦊';

      targetSock.send(JSON.stringify({
        type: 'receive_room_invite',
        fromUserId: ws.userId,
        fromNickname: inviterName,
        fromAvatar: inviterAvatar,
        roomCode,
        mode: mode || '2v2'
      }));

      ws.send(JSON.stringify({
        type: 'invite_sent_status',
        success: true,
        targetUserId,
        message: `Đã gửi lời mời tới ${targetSock.profile ? targetSock.profile.nickname : 'bạn bè'}!`
      }));
      break;
    }

    // 1. RECONNECT INTO ONGOING MATCH
    case 'reconnect_match': {
      const { roomId, userId } = msg;
      ws.userId = userId;
      userSocketMap.set(userId, ws);

      const room = rooms.get(roomId);
      if (!room) {
        ws.send(JSON.stringify({ type: 'reconnect_failed', reason: 'Phòng không tồn tại hoặc trận đấu đã kết thúc!' }));
        return;
      }

      const player = room.players.find(p => p.userId === userId);
      if (!player) {
        ws.send(JSON.stringify({ type: 'reconnect_failed', reason: 'Bạn không thuộc phòng đấu này!' }));
        return;
      }

      // Reconnect successfully!
      if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer);
        player.disconnectTimer = null;
      }

      player.ws = ws;
      player.isOnline = true;
      ws.currentRoomId = roomId;

      // Send complete snapshot of game state to the reconnected player
      ws.send(JSON.stringify({
        type: 'reconnect_success',
        roomId: room.id,
        mode: room.mode,
        state: room.state,
        mySeat: player.seat,
        myTeam: player.team,
        players: room.getPublicPlayerList(),
        currentTurn: room.currentTurn,
        gameState: room.gameState
      }));

      // Notify other players
      room.broadcast({
        type: 'player_reconnected',
        seat: player.seat,
        nickname: player.profile.nickname,
        message: `${player.profile.nickname} đã kết nối lại vào bàn cờ!`
      }, ws);
      break;
    }

    // 2. Quick Match Queue
    case 'queue_join': {
      const mode = msg.mode || '1v1';
      const profile = msg.profile || { nickname: 'Người chơi', rating: 1000, avatar: '👤' };
      ws.profile = profile;

      removeFromAllQueues(ws);

      const targetCapacity = (mode === '1v1') ? 2 : 4;
      const queue = queues[mode] || queues['1v1'];

      queue.push(ws);
      ws.send(JSON.stringify({
        type: 'queue_status',
        mode,
        count: queue.length,
        needed: targetCapacity
      }));

      if (queue.length >= targetCapacity) {
        const matchedSockets = queue.splice(0, targetCapacity);
        const roomId = 'QM_' + generateRoomCode();
        const room = new Room(roomId, mode, false);

        matchedSockets.forEach((sock, idx) => {
          const seat = idx + 1;
          const team = (mode === '2v2') ? (seat % 2 === 1 ? 'A' : 'B') : null;
          sock.currentRoomId = roomId;
          room.players.push({
            userId: sock.userId,
            ws: sock,
            profile: sock.profile,
            seat,
            team,
            isOnline: true
          });
        });

        rooms.set(roomId, room);
        startRoomGame(room);
      }
      break;
    }

    case 'queue_leave': {
      removeFromAllQueues(ws);
      ws.send(JSON.stringify({ type: 'queue_left' }));
      break;
    }

    // 3. Create Custom Room
    case 'room_create': {
      const mode = msg.mode || '1v1';
      const profile = msg.profile || { nickname: 'Chủ phòng', rating: 1000, avatar: '👑' };
      ws.profile = profile;

      removeFromAllQueues(ws);
      leaveCurrentRoom(ws);

      const roomCode = generateRoomCode();
      const room = new Room(roomCode, mode, true);
      ws.currentRoomId = roomCode;

      room.players.push({
        userId: ws.userId,
        ws,
        profile,
        seat: 1,
        team: (mode === '2v2') ? 'A' : null,
        isOnline: true
      });

      rooms.set(roomCode, room);

      ws.send(JSON.stringify({
        type: 'room_created',
        roomCode,
        mode,
        capacity: room.capacity,
        players: room.getPublicPlayerList(),
        isHost: true
      }));
      break;
    }

    // 4. Join Custom Room
    case 'room_join': {
      const roomCode = (msg.roomCode || '').toUpperCase().trim();
      const profile = msg.profile || { nickname: 'Người chơi', rating: 1000, avatar: '👤' };
      ws.profile = profile;

      removeFromAllQueues(ws);
      leaveCurrentRoom(ws);

      const room = rooms.get(roomCode);
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Mã phòng không tồn tại!' }));
        return;
      }

      if (room.state !== 'WAITING') {
        ws.send(JSON.stringify({ type: 'error', message: 'Trận đấu trong phòng này đã bắt đầu!' }));
        return;
      }

      if (room.players.length >= room.capacity) {
        ws.send(JSON.stringify({ type: 'error', message: 'Phòng đã đủ người chơi!' }));
        return;
      }

      const seat = room.players.length + 1;
      const team = (room.mode === '2v2') ? (seat % 2 === 1 ? 'A' : 'B') : null;
      ws.currentRoomId = roomCode;

      room.players.push({
        userId: ws.userId,
        ws,
        profile,
        seat,
        team,
        isOnline: true
      });

      ws.send(JSON.stringify({
        type: 'room_joined',
        roomCode,
        mode: room.mode,
        capacity: room.capacity,
        players: room.getPublicPlayerList(),
        isHost: false
      }));

      room.broadcast({
        type: 'room_updated',
        players: room.getPublicPlayerList()
      }, ws);

      if (room.players.length === room.capacity) {
        startRoomGame(room);
      }
      break;
    }

    // 5. Host Manual Start
    case 'room_start': {
      const room = rooms.get(ws.currentRoomId);
      if (room && room.isCustom && room.players[0].ws === ws) {
        if (room.players.length >= 2) {
          startRoomGame(room);
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Cần ít nhất 2 người chơi để bắt đầu!' }));
        }
      }
      break;
    }

    // 6. In-game Actions (Move or Wall)
    case 'game_action': {
      const room = rooms.get(ws.currentRoomId);
      if (!room || room.state !== 'PLAYING') return;

      const player = room.players.find(p => p.ws === ws);
      if (!player) return;

      const act = msg.action;

      // Update room state snapshot
      if (act.type === 'move') {
        const existingPawn = room.gameState.pawns.find(p => p.seat === player.seat);
        if (existingPawn) {
          existingPawn.r = act.r;
          existingPawn.c = act.c;
        } else {
          room.gameState.pawns.push({ seat: player.seat, r: act.r, c: act.c });
        }
      } else if (act.type === 'wall') {
        room.gameState.walls.push({
          r: act.r,
          c: act.c,
          orientation: act.orientation,
          player: player.seat
        });
      }

      // Advance turn in room
      const totalPlayers = room.players.length;
      room.currentTurn = (room.currentTurn % totalPlayers) + 1;

      // Reset and start 3-minute turn timer
      startTurnTimer(room);

      // Broadcast action to all other players
      room.broadcast({
        type: 'game_action',
        action: act,
        nextTurn: room.currentTurn,
        fromSeat: player.seat
      }, ws);
      break;
    }

    // 7. Game Over
    case 'game_over': {
      const room = rooms.get(ws.currentRoomId);
      if (!room || room.state !== 'PLAYING') return;

      if (room.turnTimer) {
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
      }

      room.state = 'FINISHED';
      room.broadcast({
        type: 'game_over',
        winnerSeat: msg.winnerSeat,
        winnerTeam: msg.winnerTeam,
        reason: msg.reason
      });
      break;
    }

    // 8. Emoji Reaction
    case 'emoji': {
      const room = rooms.get(ws.currentRoomId);
      if (room) {
        const player = room.players.find(p => p.ws === ws);
        if (player) {
          room.broadcast({
            type: 'emoji',
            seat: player.seat,
            emoji: msg.emoji
          });
        }
      }
      break;
    }

    // 9. In-Game Chat Message
    case 'chat_message': {
      const room = rooms.get(ws.currentRoomId);
      if (room) {
        const player = room.players.find(p => p.ws === ws);
        if (player) {
          const text = (msg.text || '').trim().substring(0, 120);
          if (text) {
            room.broadcast({
              type: 'chat_message',
              seat: player.seat,
              nickname: player.profile.nickname,
              avatar: player.profile.avatar,
              color: player.profile.color,
              team: player.team,
              text,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            });
          }
        }
      }
      break;
    }

    // 10. Rematch Request
    case 'rematch_request': {
      const room = rooms.get(ws.currentRoomId);
      if (!room) return;
      const player = room.players.find(p => p.ws === ws);
      if (!player) return;

      room.rematchRequests.add(player.seat);

      room.broadcast({
        type: 'rematch_requested',
        fromSeat: player.seat,
        nickname: player.profile.nickname,
        acceptedCount: room.rematchRequests.size,
        neededCount: room.players.length
      });

      // If all players want a rematch, restart game!
      if (room.rematchRequests.size >= room.players.length) {
        room.rematchRequests.clear();
        room.gameState = { walls: [], pawns: [], history: [] };
        startRoomGame(room);
      }
      break;
    }
  }
}

function startRoomGame(room) {
  room.state = 'PLAYING';
  room.currentTurn = 1;
  // Initialize pawns based on mode
  if (room.mode === '1v1') {
    room.gameState.pawns = [
      { seat: 1, r: 8, c: 4 },
      { seat: 2, r: 0, c: 4 }
    ];
  } else {
    room.gameState.pawns = [
      { seat: 1, r: 8, c: 4 },
      { seat: 2, r: 0, c: 4 },
      { seat: 3, r: 4, c: 0 },
      { seat: 4, r: 4, c: 8 }
    ];
  }

  // Clear any existing turn timer
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

  room.players.forEach(p => {
    p.ws.send(JSON.stringify({
      type: 'match_start',
      roomId: room.id,
      mode: room.mode,
      mySeat: p.seat,
      myTeam: p.team,
      players: room.getPublicPlayerList(),
      currentTurn: 1
    }));
  });
}

function startTurnTimer(room) {
  // Mặc định không set giới hạn thời gian lượt đi
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }
}

function removeFromAllQueues(ws) {
  for (const mode of Object.keys(queues)) {
    const idx = queues[mode].indexOf(ws);
    if (idx !== -1) {
      queues[mode].splice(idx, 1);
    }
  }
}

function leaveCurrentRoom(ws) {
  if (!ws.currentRoomId) return;
  const room = rooms.get(ws.currentRoomId);
  if (room) {
    const idx = room.players.findIndex(p => p.ws === ws);
    if (idx !== -1) {
      room.players.splice(idx, 1);
      if (room.players.length === 0) {
        rooms.delete(room.id);
      } else if (room.state === 'WAITING') {
        room.players.forEach((p, i) => { p.seat = i + 1; });
        room.broadcast({
          type: 'room_updated',
          players: room.getPublicPlayerList()
        });
      }
    }
  }
  ws.currentRoomId = null;
}

function handleDisconnect(ws) {
  removeFromAllQueues(ws);
  if (!ws.currentRoomId) return;

  const room = rooms.get(ws.currentRoomId);
  if (!room) return;

  const player = room.players.find(p => p.ws === ws);
  if (!player) return;

  // If in waiting room, leave immediately
  if (room.state === 'WAITING') {
    leaveCurrentRoom(ws);
    return;
  }

  // If in ACTIVE MATCH: Provide 60 seconds Reconnection Grace Period!
  if (room.state === 'PLAYING') {
    player.isOnline = false;
    player.ws = null;

    // Broadcast temporary disconnect warning with timer
    room.broadcast({
      type: 'player_disconnected_temporary',
      seat: player.seat,
      nickname: player.profile.nickname,
      timeoutSeconds: 60,
      message: `${player.profile.nickname} vừa ngắt kết nối. Đang chờ kết nối lại (60s)...`
    });

    // Start 60s forfeit timer
    player.disconnectTimer = setTimeout(() => {
      // Check if still disconnected
      if (!player.isOnline && room.state === 'PLAYING') {
        room.state = 'FINISHED';
        // Remaining players win
        const remaining = room.players.filter(p => p.isOnline);
        const winnerSeat = remaining.length > 0 ? remaining[0].seat : null;
        const winnerTeam = remaining.length > 0 ? remaining[0].team : null;

        room.broadcast({
          type: 'game_over',
          winnerSeat,
          winnerTeam,
          reason: `${player.profile.nickname} đã rời trận đấu quá thời gian cho phép!`
        });
        rooms.delete(room.id);
      }
    }, 60000);
  } else {
    if (ws.userId && userSocketMap.get(ws.userId) === ws) {
      userSocketMap.delete(ws.userId);
    }
  }
}

server.listen(PORT, () => {
  console.log(`WallRush Server (HTTP + WebSocket) running at http://localhost:${PORT}/`);
});
