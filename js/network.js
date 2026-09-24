/* ==========================================================
   WALLRUSH NETWORK CLIENT (WEBSOCKET WITH RECONNECT)
   Handles online matchmaking, rooms, reconnecting & state sync
   ========================================================== */

class NetworkClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.callbacks = {};
    this.reconnectTimer = null;
    this.init();
  }

  getUserId() {
    return window.playerStorage ? window.playerStorage.getProfile().id : 'anon_' + Math.random();
  }

  init() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = location.host || 'localhost:3000';
    const wsUrl = `${protocol}//${host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.pendingQueue = [];

      this.ws.onopen = () => {
        this.connected = true;
        const prof = window.playerStorage ? window.playerStorage.getProfile() : null;
        // Identify session with full profile
        this.send({
          type: 'init_session',
          userId: this.getUserId(),
          friendCode: prof ? prof.friendCode : undefined,
          profile: prof
        });
        // Flush pending messages
        if (this.pendingQueue && this.pendingQueue.length > 0) {
          const queue = [...this.pendingQueue];
          this.pendingQueue = [];
          queue.forEach(p => this.send(p));
        }
        this.trigger('connection_status', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {}
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.trigger('connection_status', { connected: false });
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.init();
          }, 2500);
        }
      };

      this.ws.onerror = () => {
        this.connected = false;
      };
    } catch (e) {}
  }

  send(payload) {
    if (!payload.userId) {
      payload.userId = this.getUserId();
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      if (!this.pendingQueue) this.pendingQueue = [];
      this.pendingQueue.push(payload);
    }
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  handleServerMessage(msg) {
    switch (msg.type) {
      case 'session_ready':
      case 'queue_status':
      case 'queue_left':
      case 'match_start':
      case 'room_created':
      case 'room_joined':
      case 'room_updated':
      case 'game_action':
      case 'game_over':
      case 'player_left':
      case 'player_disconnected_temporary':
      case 'player_reconnected':
      case 'reconnect_success':
      case 'reconnect_failed':
      case 'error':
      case 'emoji':
      case 'chat_message':
      case 'rematch_requested':
      case 'rematch_start':
      case 'time_warning':
      case 'search_results':
      case 'friends_status_update':
      case 'receive_room_invite':
      case 'invite_sent_status':
        this.trigger(msg.type, msg);
        break;
      default:
        break;
    }
  }

  // Send Chat message (text or quick preset)
  sendChatMessage(text) {
    this.send({
      type: 'chat_message',
      text
    });
  }

  // Request Rematch after victory
  requestRematch() {
    this.send({
      type: 'rematch_request'
    });
  }

  // Client Actions
  syncProfile() {
    const profile = window.playerStorage ? window.playerStorage.getProfile() : null;
    if (profile) {
      this.send({
        type: 'sync_profile',
        userId: this.getUserId(),
        profile
      });
    }
  }

  searchPlayers(query) {
    this.send({
      type: 'search_players',
      query
    });
  }

  checkFriendsStatus(friendIds) {
    this.send({
      type: 'check_friends_status',
      friendIds
    });
  }

  inviteFriend(targetUserId, roomCode, mode = '2v2') {
    this.send({
      type: 'invite_friend',
      targetUserId,
      roomCode,
      mode
    });
  }

  joinQueue(mode) {
    const profile = window.playerStorage ? window.playerStorage.getProfile() : { nickname: 'Người chơi', rating: 1000, avatar: '👤' };
    this.send({
      type: 'queue_join',
      mode,
      profile
    });
  }

  leaveQueue() {
    this.send({ type: 'queue_leave' });
  }

  createRoom(mode) {
    const profile = window.playerStorage ? window.playerStorage.getProfile() : { nickname: 'Chủ phòng', rating: 1000, avatar: '👑' };
    this.send({
      type: 'room_create',
      mode,
      profile
    });
  }

  joinRoom(roomCode) {
    const profile = window.playerStorage ? window.playerStorage.getProfile() : { nickname: 'Người chơi', rating: 1000, avatar: '👤' };
    this.send({
      type: 'room_join',
      roomCode,
      profile
    });
  }

  reconnectMatch(roomId) {
    this.send({
      type: 'reconnect_match',
      roomId,
      userId: this.getUserId()
    });
  }

  startRoomGame() {
    this.send({ type: 'room_start' });
  }

  sendGameAction(action) {
    this.send({
      type: 'game_action',
      action
    });
  }

  sendGameOver(winnerSeat, winnerTeam, reason) {
    this.send({
      type: 'game_over',
      winnerSeat,
      winnerTeam,
      reason
    });
  }

  sendEmoji(emoji) {
    this.send({
      type: 'emoji',
      emoji
    });
  }
}

window.networkClient = new NetworkClient();
