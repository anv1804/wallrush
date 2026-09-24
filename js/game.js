/* ==========================================================
   WALLRUSH (QUORIDOR ONLINE) - MASTER APP CONTROLLER
   Be Vietnam Pro typography, First-time Onboarding, Reconnection logic
   ========================================================== */

class WallRushApp {
  constructor() {
    this.storage = window.playerStorage;
    this.network = window.networkClient;
    this.audio = window.gameAudio;

    // Game State
    this.game = null;
    this.isOnline = false;
    this.mySeat = 1;
    this.myTeam = null;
    this.gameMode = '1v1';
    this.onlinePlayers = [];

    // Wall placement state
    this.wallMode = false;
    this.wallOrientation = 'h';
    this.wallCursor = { r: 3, c: 3 };
    this.feedbackMsg = null;
    this.feedbackTimer = null;

    this.cacheDOM();
    this.initBoardDOM();
    this.setupListeners();
    this.setupNetworkEvents();
    this.updateLobbyProfile();

    // Check First-Time Onboarding
    this.checkFirstTimeUser();

    // Check if player can resume previous match (after refresh)
    this.checkMatchResume();

    // Periodic check for friends status
    setInterval(() => {
      this.refreshFriendsStatus();
    }, 10000);
  }

  cacheDOM() {
    // Screens
    this.screenLobby = document.getElementById('screen-lobby');
    this.screenWaiting = document.getElementById('screen-waiting');
    this.screenGame = document.getElementById('screen-game');
    this.reconnectBanner = document.getElementById('reconnect-banner');
    this.btnCancelReconnect = document.getElementById('btn-cancel-reconnect');

    // Lobby Elements
    this.lobbyAvatar = document.getElementById('lobby-avatar');
    this.lobbyNickname = document.getElementById('lobby-nickname');
    this.lobbyRating = document.getElementById('lobby-rating');
    this.lobbyWinrate = document.getElementById('lobby-winrate');
    this.serverStatusDot = document.getElementById('server-status-dot');
    this.serverStatusText = document.getElementById('server-status-text');

    // Mode Cards
    this.card1v1 = document.getElementById('card-1v1');
    this.card2v2 = document.getElementById('card-2v2');
    this.cardQuad = document.getElementById('card-quad');
    this.cardCustom = document.getElementById('card-custom');
    this.cardLocal = document.getElementById('card-local');

    // Waiting Elements
    this.waitingTitle = document.getElementById('waiting-title');
    this.waitingSub = document.getElementById('waiting-sub');
    this.roomCodeBox = document.getElementById('room-code-box');
    this.displayRoomCode = document.getElementById('display-room-code');
    this.btnCopyCode = document.getElementById('btn-copy-code');
    this.seatsContainer = document.getElementById('seats-container');
    this.btnStartRoom = document.getElementById('btn-start-room');
    this.btnLeaveWaiting = document.getElementById('btn-leave-waiting');

    // Gameplay Elements
    this.boardEl = document.getElementById('board');
    this.viewRotation = 0;
    this.edgeTop = document.getElementById('edge-top');
    this.edgeBottom = document.getElementById('edge-bottom');
    this.edgeLeft = document.getElementById('edge-left');
    this.edgeRight = document.getElementById('edge-right');
    this.gameModeTag = document.getElementById('game-mode-tag');
    this.playersStatusStrip = document.getElementById('players-status-strip');
    this.turnBanner = document.getElementById('turn-banner');
    this.turnText = document.getElementById('turn-text');
    this.dockWallsCount = document.getElementById('dock-walls-count');
    this.wallModeIndicator = document.getElementById('wall-mode-indicator');
    this.btnWallH = document.getElementById('btn-wall-h');
    this.btnWallV = document.getElementById('btn-wall-v');
    this.btnCancelWall = document.getElementById('btn-cancel-wall');
    this.btnGameSound = document.getElementById('btn-game-sound');
    this.btnGameHelp = document.getElementById('btn-game-help');
    this.btnGameExit = document.getElementById('btn-game-exit');

    // Onboarding Modal
    this.modalOnboarding = document.getElementById('modal-onboarding');
    this.inputOnboardNickname = document.getElementById('input-onboard-nickname');
    this.onboardAvatarPicker = document.getElementById('onboard-avatar-picker');
    this.onboardColorPicker = document.getElementById('onboard-color-picker');
    this.btnFinishOnboarding = document.getElementById('btn-finish-onboarding');
    this.onboardSelectedAvatar = '🦊';
    this.onboardSelectedColor = 'indigo';

    // Profile Modal
    this.modalProfile = document.getElementById('modal-profile');
    this.inputNickname = document.getElementById('input-nickname');
    this.avatarPicker = document.getElementById('avatar-picker');
    this.profileColorPicker = document.getElementById('profile-color-picker');
    this.btnSaveProfile = document.getElementById('btn-save-profile');
    this.btnCloseProfile = document.getElementById('btn-close-profile');
    this.btnEditProfile = document.getElementById('btn-edit-profile');
    this.profileCard = document.getElementById('profile-card');
    this.selectedColor = 'indigo';

    // Color definitions
    this.colorPalettes = {
      indigo: { main: '#4f46e5', light: '#e0e7ff', shadow: 'rgba(79, 70, 229, 0.45)', name: 'Chàm' },
      rose: { main: '#f43f5e', light: '#ffe4e6', shadow: 'rgba(244, 63, 94, 0.45)', name: 'Đỏ Hồng' },
      emerald: { main: '#10b981', light: '#d1fae5', shadow: 'rgba(16, 185, 129, 0.45)', name: 'Lục Bảo' },
      amber: { main: '#f59e0b', light: '#fef3c7', shadow: 'rgba(245, 158, 11, 0.45)', name: 'Cam Vàng' },
      cyan: { main: '#06b6d4', light: '#cffafe', shadow: 'rgba(6, 182, 212, 0.45)', name: 'Lam Ngọc' },
      purple: { main: '#9333ea', light: '#f3e8ff', shadow: 'rgba(147, 51, 234, 0.45)', name: 'Tím' }
    };

    // Custom Room Modal
    this.modalCustomRoom = document.getElementById('modal-custom-room');
    this.tabCreateRoom = document.getElementById('tab-create-room');
    this.tabJoinRoom = document.getElementById('tab-join-room');
    this.paneCreate = document.getElementById('pane-create');
    this.paneJoin = document.getElementById('pane-join');
    this.btnDoCreateRoom = document.getElementById('btn-do-create-room');
    this.inputJoinCode = document.getElementById('input-join-code');
    this.btnDoJoinRoom = document.getElementById('btn-do-join-room');
    this.btnCloseCustomRoom = document.getElementById('btn-close-custom-room');

    // Victory Modal & Review / Rematch
    this.modalGameOver = document.getElementById('modal-gameover');
    this.winTitle = document.getElementById('win-title');
    this.winDesc = document.getElementById('win-desc');
    this.ratingChangeBox = document.getElementById('rating-change-box');
    this.ratingChangeVal = document.getElementById('rating-change-val');
    this.btnReturnLobby = document.getElementById('btn-return-lobby');
    this.btnReviewBoard = document.getElementById('btn-review-board');
    this.btnRematch = document.getElementById('btn-rematch');
    this.rematchWaitingNote = document.getElementById('rematch-waiting-note');
    this.reviewBoardBar = document.getElementById('review-board-bar');
    this.btnReopenGameover = document.getElementById('btn-reopen-gameover');

    // Turn Countdown Timer
    this.turnTimerPill = document.getElementById('turn-timer-pill');
    this.turnTimerVal = document.getElementById('turn-timer-val');
    this.turnTimerInterval = null;
    this.currentTurnDeadline = 0;

    // In-game Live Chat
    this.inGameChatCard = document.getElementById('in-game-chat-card');
    this.chatMessagesContainer = document.getElementById('chat-messages-container');
    this.inputChatMsg = document.getElementById('input-chat-msg');
    this.btnSendChat = document.getElementById('btn-send-chat');
    this.quickPhraseSelect = document.getElementById('quick-phrase-select');

    // Rules Modal
    this.modalRules = document.getElementById('modal-rules');
    this.btnCloseRules = document.getElementById('btn-close-rules');
    this.btnRulesOk = document.getElementById('btn-rules-ok');

    // 2v2 Choice Modal
    this.modal2v2Choice = document.getElementById('modal-2v2-choice');
    this.btn2v2CreateRoom = document.getElementById('btn-2v2-create-room');
    this.btn2v2QuickMatch = document.getElementById('btn-2v2-quick-match');
    this.btnClose2v2Choice = document.getElementById('btn-close-2v2-choice');

    // Friends Modal & Header
    this.btnOpenFriends = document.getElementById('btn-open-friends');
    this.friendsOnlineBadge = document.getElementById('friends-online-badge');
    this.modalFriends = document.getElementById('modal-friends');
    this.btnCloseFriends = document.getElementById('btn-close-friends');
    this.displayMyCode = document.getElementById('display-my-code');
    this.myFriendCodeDisplay = document.getElementById('my-friend-code-display');
    this.tabFriendsList = document.getElementById('tab-friends-list');
    this.tabFriendsSearch = document.getElementById('tab-friends-search');
    this.paneFriendsList = document.getElementById('pane-friends-list');
    this.paneFriendsSearch = document.getElementById('pane-friends-search');
    this.friendsCountNum = document.getElementById('friends-count-num');
    this.friendsListContainer = document.getElementById('friends-list-container');
    this.inputSearchFriends = document.getElementById('input-search-friends');
    this.btnDoSearchFriends = document.getElementById('btn-do-search-friends');
    this.searchResultsContainer = document.getElementById('search-results-container');
    this.btnInviteFriends = document.getElementById('btn-invite-friends');

    // Invite Toast
    this.inviteToast = document.getElementById('invite-toast');
    this.toastInviterAvatar = document.getElementById('toast-inviter-avatar');
    this.toastInviterName = document.getElementById('toast-inviter-name');
    this.toastRoomMode = document.getElementById('toast-room-mode');
    this.toastRoomCode = document.getElementById('toast-room-code');
    this.btnToastAccept = document.getElementById('btn-toast-accept');
    this.btnToastDecline = document.getElementById('btn-toast-decline');

    // Custom Alert & Confirm Dialog Modal
    this.modalCustomDialog = document.getElementById('modal-custom-dialog');
    this.dialogIcon = document.getElementById('dialog-icon');
    this.dialogTitle = document.getElementById('dialog-title');
    this.dialogMessage = document.getElementById('dialog-message');
    this.btnDialogCancel = document.getElementById('btn-dialog-cancel');
    this.btnDialogConfirm = document.getElementById('btn-dialog-confirm');

    this.currentPendingInvite = null;
    this.friendsOnlineStatuses = {};

    this.initCustomDialog();
    this.initRouterAndReloadProtection();
  }

  // ==========================================
  // CUSTOM ALERT & CONFIRM MODAL SYSTEM
  // ==========================================
  initCustomDialog() {
    this._dialogResolve = null;

    this.btnDialogConfirm.addEventListener('click', () => {
      this.modalCustomDialog.classList.add('hidden');
      if (this._dialogResolve) {
        this._dialogResolve(true);
        this._dialogResolve = null;
      }
    });

    this.btnDialogCancel.addEventListener('click', () => {
      this.modalCustomDialog.classList.add('hidden');
      if (this._dialogResolve) {
        this._dialogResolve(false);
        this._dialogResolve = null;
      }
    });
  }

  showCustomAlert(message, title = 'Thông báo', icon = 'ℹ️') {
    return new Promise((resolve) => {
      this._dialogResolve = resolve;
      this.dialogIcon.textContent = icon;
      this.dialogTitle.textContent = title;
      this.dialogMessage.textContent = message;
      this.btnDialogCancel.classList.add('hidden');
      this.btnDialogConfirm.textContent = 'ĐÃ HIỂU';
      this.btnDialogConfirm.className = 'btn btn-primary';
      this.modalCustomDialog.classList.remove('hidden');
    });
  }

  showCustomConfirm(message, title = 'Xác nhận', options = {}) {
    const {
      icon = '⚠️',
      confirmText = 'ĐỒNG Ý',
      cancelText = 'HỦY BỎ',
      isDestructive = false
    } = options;

    return new Promise((resolve) => {
      this._dialogResolve = resolve;
      this.dialogIcon.textContent = icon;
      this.dialogTitle.textContent = title;
      this.dialogMessage.textContent = message;
      this.btnDialogCancel.classList.remove('hidden');
      this.btnDialogCancel.textContent = cancelText;
      this.btnDialogConfirm.textContent = confirmText;
      this.btnDialogConfirm.className = isDestructive ? 'btn btn-danger' : 'btn btn-primary';
      this.modalCustomDialog.classList.remove('hidden');
    });
  }

  // ==========================================
  // URL ROUTER & RELOAD WARNING / RESUME
  // ==========================================
  initRouterAndReloadProtection() {
    // 1. Browser Beforeunload warning: Warn player before reloading/closing during match
    window.addEventListener('beforeunload', (e) => {
      if (this.game && !this.game.winner && (this.isOnline || this.gameMode === 'local')) {
        e.preventDefault();
        e.returnValue = 'Bạn đang trong trận đấu! Nếu tải lại trang, bạn có thể bị xử thua.';
        return e.returnValue;
      }
    });

    // 2. Hash change listener
    window.addEventListener('hashchange', () => {
      this.handleHashRoute();
    });
  }

  handleHashRoute() {
    const hash = window.location.hash || '#/lobby';
    if (hash.startsWith('#/room/')) {
      const roomCode = hash.replace('#/room/', '').trim();
      if (roomCode && (!this.currentWaitingRoomCode || this.currentWaitingRoomCode !== roomCode)) {
        this.network.joinRoom(roomCode);
        this.switchScreen('waiting', false);
      }
    } else if (hash.startsWith('#/game/')) {
      const roomId = hash.replace('#/game/', '').trim();
      if (roomId && (!this.game || !this.isOnline)) {
        this.checkMatchResume(roomId);
      }
    } else if (hash === '#/lobby' || !hash || hash === '#/') {
      if (!this.game || this.game.winner) {
        this.switchScreen('lobby', false);
      }
    }
  }

  checkFirstTimeUser() {
    if (!this.storage.hasCompletedOnboarding()) {
      this.modalOnboarding.classList.remove('hidden');
      setTimeout(() => {
        if (this.inputOnboardNickname) this.inputOnboardNickname.focus();
      }, 200);
    } else {
      const hash = window.location.hash;
      if (!hash || hash === '#/' || hash === '#/lobby') {
        this.switchScreen('lobby');
      } else {
        this.handleHashRoute();
      }
    }
  }

  checkMatchResume(specificRoomId = null) {
    const active = this.storage.getActiveRoom();
    const roomIdToResume = specificRoomId || (active && active.roomId);

    if (roomIdToResume) {
      this.reconnectBanner.classList.remove('hidden');
      // If the URL does not have the hash, update it
      if (window.location.hash !== `#/game/${roomIdToResume}`) {
        window.history.replaceState(null, '', `#/game/${roomIdToResume}`);
      }
      // Wait for WS connection to establish
      setTimeout(() => {
        this.network.reconnectMatch(roomIdToResume);
      }, 500);
    }
  }

  switchScreen(screenName, updateHash = true) {
    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
    if (screenName === 'lobby') {
      this.screenLobby.classList.add('active');
      if (updateHash) window.history.replaceState(null, '', '#/lobby');
    } else if (screenName === 'waiting') {
      this.screenWaiting.classList.add('active');
      if (updateHash && this.currentWaitingRoomCode) {
        window.history.replaceState(null, '', `#/room/${this.currentWaitingRoomCode}`);
      }
    } else if (screenName === 'game') {
      this.screenGame.classList.add('active');
      const active = this.storage.getActiveRoom();
      if (updateHash && active && active.roomId) {
        window.history.replaceState(null, '', `#/game/${active.roomId}`);
      }
    }
  }

  updateLobbyProfile() {
    const prof = this.storage.getProfile();
    this.lobbyAvatar.textContent = prof.avatar || '🦊';
    this.lobbyNickname.textContent = prof.nickname || 'Chiến Tướng';
    this.lobbyRating.textContent = prof.rating || 1000;
    this.lobbyWinrate.textContent = prof.winRate || '0%';
    const userColor = prof.color || 'indigo';
    const pal = this.colorPalettes[userColor] || this.colorPalettes.indigo;
    this.lobbyAvatar.style.filter = `drop-shadow(0 2px 8px ${pal.shadow})`;
    this.updateThemeCSS();
    this.updateFriendsBadge();
    this.refreshFriendsStatus();

    if (this.network && this.network.connected) {
      this.network.syncProfile();
    }
  }

  updateThemeCSS() {
    const root = document.documentElement;
    const defaultColorKeys = ['indigo', 'rose', 'emerald', 'amber'];

    for (let i = 1; i <= 4; i++) {
      const p = this.onlinePlayers ? this.onlinePlayers.find(x => x.seat === i) : null;
      let colorKey = (p && p.color) ? p.color : defaultColorKeys[i - 1];
      
      // In local mode, seat 2 defaults to rose if seat 1 picked rose
      if (!this.isOnline && i === 2) {
        const p1Color = (this.onlinePlayers && this.onlinePlayers[0] && this.onlinePlayers[0].color) || 'indigo';
        if (colorKey === p1Color) {
          colorKey = (p1Color === 'rose') ? 'indigo' : 'rose';
        }
      }

      const pal = this.colorPalettes[colorKey] || this.colorPalettes.indigo;
      root.style.setProperty(`--p${i}-color`, pal.main);
      root.style.setProperty(`--p${i}-light`, pal.light);
      root.style.setProperty(`--p${i}-shadow`, pal.shadow);
    }
  }

  initBoardDOM() {
    this.boardEl.innerHTML = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${r}-${c}`;
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.style.gridRow = `${2 * r + 1}`;
        cell.style.gridColumn = `${2 * c + 1}`;
        this.boardEl.appendChild(cell);
      }
    }

    this.ghostWallEl = document.createElement('div');
    this.ghostWallEl.className = 'ghost-wall hidden';
    this.boardEl.appendChild(this.ghostWallEl);

    this.boardEl.addEventListener('mousemove', (e) => this.handleBoardMouseMove(e));
    this.boardEl.addEventListener('click', (e) => this.handleBoardClick(e));
  }

  setupListeners() {
    // Unfocus all buttons on click so Enter key never clicks them
    document.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('mouseup', () => btn.blur());
      btn.addEventListener('click', () => btn.blur());
    });

    // 1. First-time Onboarding Listener
    this.onboardAvatarPicker.addEventListener('click', (e) => {
      const opt = e.target.closest('.avatar-opt');
      if (opt) {
        this.onboardAvatarPicker.querySelectorAll('.avatar-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        this.onboardSelectedAvatar = opt.textContent;
      }
    });

    this.onboardColorPicker.addEventListener('click', (e) => {
      const opt = e.target.closest('.color-swatch-btn');
      if (opt) {
        this.onboardColorPicker.querySelectorAll('.color-swatch-btn').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        this.onboardSelectedColor = opt.dataset.color || 'indigo';
      }
    });

    this.btnFinishOnboarding.addEventListener('click', async () => {
      const name = this.inputOnboardNickname.value.trim();
      if (!name) {
        await this.showCustomAlert('Vui lòng nhập tên của bạn để tiếp tục!', 'Thiếu tên người chơi', '⚠️');
        this.inputOnboardNickname.focus();
        return;
      }
      this.storage.completeOnboarding(name, this.onboardSelectedAvatar, this.onboardSelectedColor);
      this.updateLobbyProfile();
      this.modalOnboarding.classList.add('hidden');
      this.switchScreen('lobby');
    });

    this.inputOnboardNickname.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.btnFinishOnboarding.click();
      }
    });

    // Cancel reconnect
    this.btnCancelReconnect.addEventListener('click', () => {
      this.storage.clearActiveRoom();
      this.reconnectBanner.classList.add('hidden');
    });

    // Profile Click
    const openProfile = () => {
      const prof = this.storage.getProfile();
      this.inputNickname.value = prof.nickname;
      this.selectedAvatar = prof.avatar;
      this.selectedColor = prof.color || 'indigo';

      // Mark active avatar
      this.avatarPicker.querySelectorAll('.avatar-opt').forEach(o => {
        o.classList.toggle('active', o.textContent.trim() === this.selectedAvatar);
      });

      // Mark active color
      this.profileColorPicker.querySelectorAll('.color-swatch-btn').forEach(o => {
        o.classList.toggle('active', o.dataset.color === this.selectedColor);
      });

      this.modalProfile.classList.remove('hidden');
    };
    this.profileCard.addEventListener('click', openProfile);
    this.btnEditProfile.addEventListener('click', (e) => { e.stopPropagation(); openProfile(); });

    this.avatarPicker.addEventListener('click', (e) => {
      const opt = e.target.closest('.avatar-opt');
      if (opt) {
        this.avatarPicker.querySelectorAll('.avatar-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        this.selectedAvatar = opt.textContent;
      }
    });

    this.profileColorPicker.addEventListener('click', (e) => {
      const opt = e.target.closest('.color-swatch-btn');
      if (opt) {
        this.profileColorPicker.querySelectorAll('.color-swatch-btn').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        this.selectedColor = opt.dataset.color || 'indigo';
      }
    });

    this.btnSaveProfile.addEventListener('click', () => {
      const nick = this.inputNickname.value;
      this.storage.updateProfile(nick, this.selectedAvatar, this.selectedColor);
      this.updateLobbyProfile();
      this.modalProfile.classList.add('hidden');
    });

    this.btnCloseProfile.addEventListener('click', () => {
      this.modalProfile.classList.add('hidden');
    });

    // Mode Card Clicks
    this.card1v1.addEventListener('click', () => this.startQuickMatch('1v1'));
    
    // 2v2 Mode: Open choice modal for Dedicated Waiting Room or Quick Match
    this.card2v2.addEventListener('click', () => {
      this.modal2v2Choice.classList.remove('hidden');
    });

    this.btn2v2CreateRoom.addEventListener('click', () => {
      this.modal2v2Choice.classList.add('hidden');
      this.selectedCustomMode = '2v2';
      this.network.createRoom('2v2');
      this.switchScreen('waiting');
    });

    this.btn2v2QuickMatch.addEventListener('click', () => {
      this.modal2v2Choice.classList.add('hidden');
      this.startQuickMatch('2v2');
    });

    this.btnClose2v2Choice.addEventListener('click', () => {
      this.modal2v2Choice.classList.add('hidden');
    });

    this.cardQuad.addEventListener('click', () => this.startQuickMatch('1v1v1v1'));

    this.cardCustom.addEventListener('click', () => {
      this.modalCustomRoom.classList.remove('hidden');
    });

    this.cardLocal.addEventListener('click', () => {
      this.startLocalGame();
    });

    // Custom Room Modal Tabs
    this.tabCreateRoom.addEventListener('click', () => {
      this.tabCreateRoom.classList.add('active');
      this.tabJoinRoom.classList.remove('active');
      this.paneCreate.classList.remove('hidden');
      this.paneJoin.classList.add('hidden');
    });

    this.tabJoinRoom.addEventListener('click', () => {
      this.tabJoinRoom.classList.add('active');
      this.tabCreateRoom.classList.remove('active');
      this.paneJoin.classList.remove('hidden');
      this.paneCreate.classList.add('hidden');
    });

    document.querySelectorAll('.rm-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rm-pick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCustomMode = btn.dataset.mode;
      });
    });
    this.selectedCustomMode = '1v1';

    this.btnDoCreateRoom.addEventListener('click', () => {
      this.modalCustomRoom.classList.add('hidden');
      this.network.createRoom(this.selectedCustomMode);
      this.switchScreen('waiting');
    });

    this.btnDoJoinRoom.addEventListener('click', () => {
      const code = this.inputJoinCode.value.trim();
      if (code.length >= 4) {
        this.modalCustomRoom.classList.add('hidden');
        this.network.joinRoom(code);
        this.switchScreen('waiting');
      }
    });

    this.btnCloseCustomRoom.addEventListener('click', () => {
      this.modalCustomRoom.classList.add('hidden');
    });

    // Waiting Screen Actions
    this.btnCopyCode.addEventListener('click', () => {
      const code = this.displayRoomCode.textContent;
      navigator.clipboard.writeText(code).then(() => {
        this.showCustomAlert(`Đã sao chép mã phòng: ${code}\nBạn có thể gửi mã này cho bạn bè để cùng chơi.`, 'Sao chép thành công', '📋');
      });
    });

    this.btnInviteFriends.addEventListener('click', () => {
      this.openFriendsModal();
    });

    this.btnStartRoom.addEventListener('click', () => {
      this.network.startRoomGame();
    });

    this.btnLeaveWaiting.addEventListener('click', () => {
      this.network.leaveQueue();
      this.storage.clearActiveRoom();
      this.currentWaitingRoomCode = null;
      this.switchScreen('lobby');
    });

    // Friends Modal Listeners
    this.btnOpenFriends.addEventListener('click', () => {
      this.openFriendsModal();
    });

    this.btnCloseFriends.addEventListener('click', () => {
      this.modalFriends.classList.add('hidden');
    });

    this.myFriendCodeDisplay.addEventListener('click', () => {
      const code = this.displayMyCode.textContent;
      navigator.clipboard.writeText(code).then(() => {
        this.showCustomAlert(`Đã sao chép Mã bạn bè của bạn: ${code}`, 'Sao chép thành công', '📋');
      });
    });

    this.tabFriendsList.addEventListener('click', () => {
      this.tabFriendsList.classList.add('active');
      this.tabFriendsSearch.classList.remove('active');
      this.paneFriendsList.classList.remove('hidden');
      this.paneFriendsSearch.classList.add('hidden');
      this.renderFriendsList();
    });

    this.tabFriendsSearch.addEventListener('click', () => {
      this.tabFriendsSearch.classList.add('active');
      this.tabFriendsList.classList.remove('active');
      this.paneFriendsSearch.classList.remove('hidden');
      this.paneFriendsList.classList.add('hidden');
      if (this.inputSearchFriends) this.inputSearchFriends.focus();
    });

    this.btnDoSearchFriends.addEventListener('click', () => {
      this.executeFriendSearch();
    });

    this.inputSearchFriends.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.executeFriendSearch();
      }
    });

    // Toast Actions
    this.btnToastAccept.addEventListener('click', () => {
      if (this.currentPendingInvite) {
        const code = this.currentPendingInvite.roomCode;
        this.inviteToast.classList.add('hidden');
        this.currentPendingInvite = null;
        this.network.joinRoom(code);
        this.switchScreen('waiting');
      }
    });

    this.btnToastDecline.addEventListener('click', () => {
      this.inviteToast.classList.add('hidden');
      this.currentPendingInvite = null;
    });

    // Gameplay Actions
    this.btnWallH.addEventListener('click', (e) => {
      e.stopPropagation();
      this.audio.init();
      this.selectWallOrientation('h');
    });

    this.btnWallV.addEventListener('click', (e) => {
      e.stopPropagation();
      this.audio.init();
      this.selectWallOrientation('v');
    });

    this.btnCancelWall.addEventListener('click', (e) => {
      e.stopPropagation();
      this.exitWallMode();
    });

    this.btnGameExit.addEventListener('click', async () => {
      const isOngoing = this.game && !this.game.winner;
      const confirmText = isOngoing
        ? '⚠️ TRẬN ĐẤU ĐANG DIỄN RA!\nBạn có chắc chắn muốn đầu hàng và thoát ra sảnh chính không?\n(Bạn sẽ bị xử thua trận này)'
        : 'Bạn có chắc chắn muốn thoát trận đấu về sảnh chính?';

      const confirmed = await this.showCustomConfirm(confirmText, 'Xác nhận thoát trận', {
        icon: isOngoing ? '⚠️' : '🚪',
        confirmText: isOngoing ? 'ĐẦU HÀNG & THOÁT' : 'THOÁT RA SẢNH',
        cancelText: 'TIẾP TỤC ĐẤU',
        isDestructive: isOngoing
      });

      if (confirmed) {
        if (this.turnTimerInterval) clearInterval(this.turnTimerInterval);
        this.storage.clearActiveRoom();
        this.network.leaveQueue();
        this.switchScreen('lobby');
        this.updateLobbyProfile();
      }
    });

    this.btnGameHelp.addEventListener('click', () => {
      this.modalRules.classList.remove('hidden');
    });
    this.btnCloseRules.addEventListener('click', () => this.modalRules.classList.add('hidden'));
    this.btnRulesOk.addEventListener('click', () => this.modalRules.classList.add('hidden'));

    // Victory Modal: Review Board, Rematch, Return to Lobby
    this.btnReviewBoard.addEventListener('click', () => {
      this.modalGameOver.classList.add('hidden');
      this.reviewBoardBar.classList.remove('hidden');
    });

    this.btnReopenGameover.addEventListener('click', () => {
      this.reviewBoardBar.classList.add('hidden');
      this.modalGameOver.classList.remove('hidden');
    });

    this.btnRematch.addEventListener('click', () => {
      if (this.isOnline) {
        this.network.requestRematch();
        this.btnRematch.disabled = true;
        this.btnRematch.textContent = 'Đã gửi yêu cầu!';
        this.rematchWaitingNote.classList.remove('hidden');
      } else {
        // Local rematch
        this.modalGameOver.classList.add('hidden');
        this.startLocalGame();
      }
    });

    this.btnReturnLobby.addEventListener('click', () => {
      if (this.turnTimerInterval) clearInterval(this.turnTimerInterval);
      this.storage.clearActiveRoom();
      this.modalGameOver.classList.add('hidden');
      this.reviewBoardBar.classList.add('hidden');
      this.switchScreen('lobby');
      this.updateLobbyProfile();
    });

    // In-game Chat actions
    this.btnSendChat.addEventListener('click', () => {
      this.sendChatMessageFromInput();
    });

    this.inputChatMsg.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.sendChatMessageFromInput();
      }
    });

    this.quickPhraseSelect.addEventListener('change', () => {
      const phrase = this.quickPhraseSelect.value;
      if (phrase) {
        if (this.isOnline) {
          this.network.sendChatMessage(phrase);
        } else {
          this.addChatMessageLocally(this.storage.getProfile().nickname, this.storage.getProfile().avatar, phrase, true);
        }
        this.quickPhraseSelect.value = '';
      }
    });

    // Emoji reaction clicks
    document.querySelectorAll('.btn-emoji').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji;
        this.spawnFloatingEmoji(emoji, this.mySeat);
        if (this.isOnline) {
          this.network.sendEmoji(emoji);
        }
      });
    });

    // Full Keyboard controls with capturing = true
    window.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    }, true);
  }

  setupNetworkEvents() {
    this.network.on('connection_status', (data) => {
      if (data.connected) {
        this.serverStatusDot.className = 'status-dot online';
        this.serverStatusText.textContent = 'Máy chủ Online';
      } else {
        this.serverStatusDot.className = 'status-dot';
        this.serverStatusText.textContent = 'Mất kết nối máy chủ';
      }
    });

    this.network.on('queue_status', (data) => {
      this.waitingTitle.textContent = 'ĐANG TÌM ĐỐI THỦ...';
      this.waitingSub.textContent = `Chế độ ${data.mode.toUpperCase()}: Đã tìm thấy ${data.count}/${data.needed} người chơi`;
      this.roomCodeBox.classList.add('hidden');
      this.btnStartRoom.classList.add('hidden');
    });

    this.network.on('room_created', (data) => {
      this.currentWaitingRoomCode = data.roomCode;
      this.waitingTitle.textContent = `PHÒNG CHỜ (${data.mode.toUpperCase()})`;
      this.waitingSub.textContent = data.mode === '2v2' ? 'Mời bạn bè hoặc gửi mã phòng để tham gia đấu đội 2v2' : 'Chờ bạn bè vào phòng để bắt đầu trận đấu';
      this.displayRoomCode.textContent = data.roomCode;
      this.roomCodeBox.classList.remove('hidden');
      this.btnStartRoom.classList.remove('hidden');
      this.btnInviteFriends.classList.remove('hidden');
      this.renderWaitingSeats(data.players, data.capacity, data.mode);
    });

    this.network.on('room_joined', (data) => {
      this.currentWaitingRoomCode = data.roomCode;
      this.waitingTitle.textContent = `PHÒNG CHỜ (${data.mode.toUpperCase()})`;
      this.waitingSub.textContent = 'Đã vào phòng, chờ chủ phòng bắt đầu...';
      this.displayRoomCode.textContent = data.roomCode;
      this.roomCodeBox.classList.remove('hidden');
      this.btnStartRoom.classList.add('hidden');
      this.btnInviteFriends.classList.remove('hidden');
      this.renderWaitingSeats(data.players, data.capacity, data.mode);
    });

    this.network.on('room_updated', (data) => {
      this.renderWaitingSeats(data.players, data.players.length >= 3 ? 4 : (this.selectedCustomMode === '1v1' ? 2 : 4), this.selectedCustomMode);
    });

    // Friend Network Events
    this.network.on('search_results', (data) => {
      this.renderSearchResults(data.results || []);
    });

    this.network.on('friends_status_update', (data) => {
      this.friendsOnlineStatuses = data.statuses || {};
      this.updateFriendsBadge();
      if (!this.modalFriends.classList.contains('hidden') && this.tabFriendsList.classList.contains('active')) {
        this.renderFriendsList();
      }
    });

    this.network.on('receive_room_invite', (data) => {
      this.currentPendingInvite = data;
      this.toastInviterAvatar.textContent = data.fromAvatar || '🦊';
      this.toastInviterName.textContent = data.fromNickname || 'Bạn bè';
      this.toastRoomMode.textContent = data.mode.toUpperCase();
      this.toastRoomCode.textContent = data.roomCode;
      this.inviteToast.classList.remove('hidden');
      this.audio.playMove();
    });

    this.network.on('invite_sent_status', (data) => {
      if (data.message) {
        this.showFeedback(data.message);
      }
    });

    this.network.on('queue_status', (data) => {
      this.currentWaitingRoomCode = null;
      this.waitingTitle.textContent = 'ĐANG TÌM ĐỐI THỦ...';
      this.waitingSub.textContent = `Chế độ ${data.mode.toUpperCase()}: Đã tìm thấy ${data.count}/${data.needed} người chơi`;
      this.roomCodeBox.classList.add('hidden');
      this.btnStartRoom.classList.add('hidden');
      this.btnInviteFriends.classList.add('hidden');
    });

    this.network.on('match_start', (data) => {
      this.storage.saveActiveRoom(data.roomId, data.mode);
      this.startOnlineMatch(data);
    });

    // Reconnection Success!
    this.network.on('reconnect_success', (data) => {
      this.reconnectBanner.classList.add('hidden');
      this.resumeOnlineMatch(data);
    });

    this.network.on('reconnect_failed', () => {
      this.storage.clearActiveRoom();
      this.reconnectBanner.classList.add('hidden');
    });

    this.network.on('game_action', (data) => {
      this.handleRemoteAction(data.action);
    });

    this.network.on('game_over', (data) => {
      this.storage.clearActiveRoom();
      this.handleRemoteGameOver(data);
    });

    this.network.on('player_disconnected_temporary', (data) => {
      this.showFeedback(`⚠️ ${data.message}`);
    });

    this.network.on('player_reconnected', (data) => {
      this.showFeedback(`✅ ${data.message}`);
    });

    this.network.on('player_left', async (data) => {
      await this.showCustomAlert(data.message || 'Một người chơi đã thoát khỏi trận!', 'Người chơi thoát', '🏃');
      if (this.game && !this.game.winner) {
        this.handleVictory(this.mySeat, 'Đối thủ bỏ cuộc');
      }
    });

    this.network.on('error', (data) => {
      this.showCustomAlert(data.message || 'Đã xảy ra lỗi!', 'Lỗi máy chủ', '⚠️');
      this.switchScreen('lobby');
    });

    this.network.on('emoji', (data) => {
      this.spawnFloatingEmoji(data.emoji, data.seat);
    });

    this.network.on('chat_message', (data) => {
      const isMine = (data.seat === this.mySeat);
      this.addChatMessageLocally(data.nickname, data.avatar, data.text, isMine, data.time);
      if (!isMine) {
        this.spawnChatBubbleAbovePawn(data.seat, data.text);
      }
    });

    this.network.on('turn_timer_sync', (data) => {
      this.startTurnTimerCountdown(data.deadline);
    });

    this.network.on('rematch_requested', (data) => {
      this.showFeedback(`🔄 ${data.nickname} yêu cầu tái đấu (${data.acceptedCount}/${data.neededCount})!`);
      if (this.rematchWaitingNote) {
        this.rematchWaitingNote.textContent = `${data.nickname} muốn tái đấu (${data.acceptedCount}/${data.neededCount})! Bấm [TÁI ĐẤU NGAY] để tham gia!`;
        this.rematchWaitingNote.classList.remove('hidden');
      }
    });

    this.network.on('rematch_start', () => {
      this.modalGameOver.classList.add('hidden');
      this.reviewBoardBar.classList.add('hidden');
      if (this.rematchWaitingNote) this.rematchWaitingNote.classList.add('hidden');
      this.btnRematch.disabled = false;
      this.btnRematch.textContent = '🔄 TÁI ĐẤU NGAY';
    });
  }

  renderWaitingSeats(players, capacity, mode = '2v2') {
    this.seatsContainer.innerHTML = '';
    const is2v2 = mode === '2v2';

    for (let i = 1; i <= capacity; i++) {
      const p = players.find(x => x.seat === i);
      const card = document.createElement('div');
      card.className = `seat-card ${p ? 'filled' : ''}`;

      let teamBadge = '';
      if (is2v2) {
        const teamName = (i % 2 === 1) ? 'Đội Xanh (Team A)' : 'Đội Đỏ (Team B)';
        const teamColor = (i % 2 === 1) ? '#4f46e5' : '#f43f5e';
        teamBadge = `<div style="font-size:0.72rem; font-weight:800; color:${teamColor}; margin-bottom:4px;">${teamName}</div>`;
      }

      if (p) {
        card.innerHTML = `
          ${teamBadge}
          <div class="seat-avatar">${p.avatar}</div>
          <div class="seat-name">${p.nickname}</div>
          <div class="seat-rating">🏆 ${p.rating}</div>
        `;
      } else {
        card.innerHTML = `
          ${teamBadge}
          <div class="seat-empty">Chỗ trống #${i}</div>
          <button type="button" class="btn-invite-sm mt-4 btn-seat-invite" style="padding:4px 10px; font-size:0.75rem;">+ Mời bạn</button>
        `;
        const btnInv = card.querySelector('.btn-seat-invite');
        if (btnInv) {
          btnInv.addEventListener('click', () => {
            this.openFriendsModal();
          });
        }
      }
      this.seatsContainer.appendChild(card);
    }
  }

  startQuickMatch(mode) {
    this.audio.init();
    this.switchScreen('waiting');
    this.network.joinQueue(mode);
  }

  startOnlineMatch(data) {
    this.isOnline = true;
    this.gameMode = data.mode;
    this.mySeat = data.mySeat;
    this.myTeam = data.myTeam;
    this.onlinePlayers = data.players;

    this.game = new QuoridorGame(data.mode);
    this.gameModeTag.textContent = `${data.mode.toUpperCase()} ONLINE`;

    this.updateThemeCSS();
    this.updateViewPerspective();
    this.updateGoalIndicators();

    this.modalGameOver.classList.add('hidden');
    this.reviewBoardBar.classList.add('hidden');
    if (this.rematchWaitingNote) this.rematchWaitingNote.classList.add('hidden');
    this.btnRematch.disabled = false;
    this.btnRematch.textContent = '🔄 TÁI ĐẤU NGAY';

    // Reset Chat Messages Container
    if (this.chatMessagesContainer) {
      this.chatMessagesContainer.innerHTML = '<div class="chat-empty-hint">Trận đấu bắt đầu! Hãy gửi lời chào đến đối thủ.</div>';
    }

    this.switchScreen('game');
    this.render();

    // Mặc định không set giới hạn thời gian (không đếm ngược 3 phút)
    if (this.turnTimerInterval) {
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
    }
    if (this.turnTimerPill) {
      this.turnTimerPill.classList.add('hidden');
    }
  }

  // Resume active game after refresh/reconnect
  resumeOnlineMatch(data) {
    this.isOnline = true;
    this.gameMode = data.mode;
    this.mySeat = data.mySeat;
    this.myTeam = data.myTeam;
    this.onlinePlayers = data.players;

    this.game = new QuoridorGame(data.mode);
    this.game.currentTurn = data.currentTurn;

    // Restore placed walls
    if (data.gameState && data.gameState.walls) {
      this.game.walls = data.gameState.walls;
      // Deduct wall counts for players
      data.gameState.walls.forEach(w => {
        const p = this.game.players.find(x => x.id === w.player);
        if (p) p.wallsLeft = Math.max(0, p.wallsLeft - 1);
      });
    }

    // Restore pawns positions
    if (data.gameState && data.gameState.pawns) {
      data.gameState.pawns.forEach(pos => {
        const p = this.game.players.find(x => x.id === pos.seat);
        if (p) {
          p.r = pos.r;
          p.c = pos.c;
        }
      });
    }

    this.gameModeTag.textContent = `${data.mode.toUpperCase()} ONLINE (ĐÃ KẾT NỐI LẠI)`;

    this.updateThemeCSS();
    this.updateViewPerspective();
    this.updateGoalIndicators();

    this.switchScreen('game');
    this.render();
    this.showFeedback('✅ Đã kết nối lại thành công vào bàn cờ!');
  }

  startLocalGame() {
    this.isOnline = false;
    this.gameMode = 'local';
    this.mySeat = 1;
    this.game = new QuoridorGame('2p');
    this.gameModeTag.textContent = 'CHƠI CỤC BỘ (OFFLINE)';

    const prof = this.storage.getProfile();
    const p1Color = prof.color || 'indigo';
    const p2Color = (p1Color === 'rose') ? 'indigo' : 'rose';

    this.onlinePlayers = [
      { seat: 1, nickname: prof.nickname || 'Player 1', avatar: prof.avatar || '🦊', color: p1Color, rating: prof.rating },
      { seat: 2, nickname: 'Player 2 (Đối thủ)', avatar: '🦁', color: p2Color, rating: 1000 }
    ];

    this.updateThemeCSS();
    this.updateViewPerspective();
    this.updateGoalIndicators();

    this.switchScreen('game');
    this.render();
  }

  updateViewPerspective() {
    // Góc nhìn người chơi luôn ở dưới đáy màn hình, hướng về đích phía trên!
    if (this.game && this.game.is4P) {
      if (this.mySeat === 1) this.viewRotation = 0;       // P1: xuất phát đáy (r=8) -> 0°
      else if (this.mySeat === 2) this.viewRotation = 180; // P2: xuất phát đỉnh (r=0) -> 180°
      else if (this.mySeat === 3) this.viewRotation = 270; // P3: xuất phát trái (c=0) -> 270° (quay 90° ngược chiều kim để đáy)
      else if (this.mySeat === 4) this.viewRotation = 90;  // P4: xuất phát phải (c=8) -> 90° (quay 90° thuận chiều kim để đáy)
      else this.viewRotation = 0;
    } else {
      // 1v1 Online: P2 xuất phát đỉnh (r=0) -> quay 180° để góc nhìn ở dưới đáy!
      if (this.isOnline && this.mySeat === 2) {
        this.viewRotation = 180;
      } else {
        this.viewRotation = 0;
      }
    }

    if (this.boardEl) {
      this.boardEl.classList.remove('board-rot-180', 'board-rot-90', 'board-rot-270');
      if (this.viewRotation) {
        this.boardEl.classList.add(`board-rot-${this.viewRotation}`);
      }
    }
  }

  updateGoalIndicators() {
    if (!this.game) return;

    const getPlayerInfo = (seat) => this.onlinePlayers.find(p => p.seat === seat) || { nickname: `P${seat}` };

    if (this.game.is4P) {
      this.edgeLeft.classList.remove('hidden');
      this.edgeRight.classList.remove('hidden');

      // Canonical goals: P1 -> Top, P2 -> Bottom, P3 -> Right, P4 -> Left
      // Ánh xạ các cạnh đích theo góc quay màn hình của người chơi
      let topSeat = 1, botSeat = 2, rightSeat = 3, leftSeat = 4;
      if (this.viewRotation === 180) {
        topSeat = 2; botSeat = 1; rightSeat = 4; leftSeat = 3;
      } else if (this.viewRotation === 270) {
        topSeat = 3; botSeat = 4; rightSeat = 2; leftSeat = 1;
      } else if (this.viewRotation === 90) {
        topSeat = 4; botSeat = 3; rightSeat = 1; leftSeat = 2;
      }

      const pTop = getPlayerInfo(topSeat);
      const pBot = getPlayerInfo(botSeat);
      const pRight = getPlayerInfo(rightSeat);
      const pLeft = getPlayerInfo(leftSeat);

      const topLabel = (topSeat === this.mySeat) ? `🏁 ĐÍCH CỦA BẠN (${pTop.nickname.toUpperCase()}) 🏁` : `🏁 ĐÍCH CỦA ${pTop.nickname.toUpperCase()} 🏁`;
      const botLabel = (botSeat === this.mySeat) ? `🏁 ĐÍCH CỦA BẠN (${pBot.nickname.toUpperCase()}) 🏁` : `🏁 ĐÍCH CỦA ${pBot.nickname.toUpperCase()} 🏁`;
      const rightLabel = (rightSeat === this.mySeat) ? `🏁 ĐÍCH CỦA BẠN (${pRight.nickname.toUpperCase()}) 🏁` : `🏁 ĐÍCH CỦA ${pRight.nickname.toUpperCase()} 🏁`;
      const leftLabel = (leftSeat === this.mySeat) ? `🏁 ĐÍCH CỦA BẠN (${pLeft.nickname.toUpperCase()}) 🏁` : `🏁 ĐÍCH CỦA ${pLeft.nickname.toUpperCase()} 🏁`;

      this.edgeTop.innerHTML = `<span style="color: var(--p${topSeat}-color); font-weight: 800;">${topLabel}</span>`;
      this.edgeBottom.innerHTML = `<span style="color: var(--p${botSeat}-color); font-weight: 800;">${botLabel}</span>`;
      this.edgeRight.innerHTML = `<span style="color: var(--p${rightSeat}-color); font-weight: 800;">${rightLabel}</span>`;
      this.edgeLeft.innerHTML = `<span style="color: var(--p${leftSeat}-color); font-weight: 800;">${leftLabel}</span>`;
    } else {
      this.edgeLeft.classList.add('hidden');
      this.edgeRight.classList.add('hidden');

      const p1Info = getPlayerInfo(1);
      const p2Info = getPlayerInfo(2);

      // Khi viewRotation === 180 (P2), đích đến của P2 (hàng 8 chuẩn) hiển thị trực diện ở đỉnh màn hình!
      if (this.viewRotation === 180) {
        this.edgeTop.innerHTML = `<span style="color: var(--p2-color); font-weight: 800;">🏁 ĐÍCH CỦA BẠN (${p2Info.nickname.toUpperCase()}) 🏁</span>`;
        this.edgeBottom.innerHTML = `<span style="color: var(--p1-color); font-weight: 800;">🏁 ĐÍCH CỦA ${p1Info.nickname.toUpperCase()} 🏁</span>`;
      } else {
        const p1Label = (this.isOnline && this.mySeat === 1) ? `🏁 ĐÍCH CỦA BẠN (${p1Info.nickname.toUpperCase()}) 🏁` : `🏁 ĐÍCH CỦA ${p1Info.nickname.toUpperCase()} 🏁`;
        this.edgeTop.innerHTML = `<span style="color: var(--p1-color); font-weight: 800;">${p1Label}</span>`;
        this.edgeBottom.innerHTML = `<span style="color: var(--p2-color); font-weight: 800;">🏁 ĐÍCH CỦA ${p2Info.nickname.toUpperCase()} 🏁</span>`;
      }
    }
  }

  selectWallOrientation(orientation) {
    const curPlayer = this.game.getCurrentPlayer();
    if (this.isOnline && curPlayer.id !== this.mySeat) return;

    if (curPlayer.wallsLeft <= 0) {
      this.audio.playInvalid();
      this.showFeedback('Bạn đã dùng hết tường!');
      return;
    }

    if (this.wallMode && this.wallOrientation === orientation) {
      this.exitWallMode();
      return;
    }

    this.wallMode = true;
    this.wallOrientation = orientation;
    this.wallCursor.r = Math.min(7, Math.max(0, curPlayer.r - 1));
    this.wallCursor.c = Math.min(7, Math.max(0, curPlayer.c - 1));

    this.audio.playMove();
    this.render();
  }

  exitWallMode() {
    this.wallMode = false;
    this.render();
  }

  rotateWall() {
    if (!this.wallMode) {
      this.selectWallOrientation('h');
      return;
    }
    this.wallOrientation = this.wallOrientation === 'h' ? 'v' : 'h';
    this.audio.playMove();
    this.render();
  }

  transformVisualDirection(vdr, vdc) {
    if (this.viewRotation === 180) {
      return { dr: -vdr, dc: -vdc };
    }
    if (this.viewRotation === 90) {
      return { dr: -vdc, dc: vdr };
    }
    if (this.viewRotation === 270) {
      return { dr: vdc, dc: -vdr };
    }
    return { dr: vdr, dc: vdc };
  }

  handleKeyDown(e) {
    if (!this.game || this.game.winner) return;

    if (['Space', 'Enter', 'NumpadEnter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code) || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }

    if (document.activeElement && document.activeElement.blur && document.activeElement !== document.body) {
      document.activeElement.blur();
    }

    this.audio.init();

    const curTurn = this.game.currentTurn;
    if (this.isOnline && curTurn !== this.mySeat) return;

    // Shift to select / toggle wall
    if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      if (!this.wallMode) this.selectWallOrientation(this.wallOrientation || 'h');
      else this.exitWallMode();
      return;
    }

    // Ctrl to rotate wall
    if (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
      this.rotateWall();
      return;
    }

    const isP2Local = (!this.isOnline && curTurn === 2);

    if (isP2Local) {
      if (this.wallMode) {
        if (e.code === 'ArrowUp') this.moveWallCursor(-1, 0);
        else if (e.code === 'ArrowDown') this.moveWallCursor(1, 0);
        else if (e.code === 'ArrowLeft') this.moveWallCursor(0, -1);
        else if (e.code === 'ArrowRight') this.moveWallCursor(0, 1);
        else if (e.code === 'Enter' || e.code === 'Space') this.attemptPlaceWall();
        else if (e.code === 'Backspace' || e.code === 'Escape') this.exitWallMode();
      } else {
        if (e.code === 'ArrowUp') this.tryDirectMove(-1, 0);
        else if (e.code === 'ArrowDown') this.tryDirectMove(1, 0);
        else if (e.code === 'ArrowLeft') this.tryDirectMove(0, -1);
        else if (e.code === 'ArrowRight') this.tryDirectMove(0, 1);
        else if (e.code === 'Enter') this.selectWallOrientation(this.wallOrientation);
      }
    } else {
      let vdr = 0, vdc = 0;
      let isMoveKey = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') { vdr = -1; vdc = 0; isMoveKey = true; }
      else if (e.code === 'KeyS' || e.code === 'ArrowDown') { vdr = 1; vdc = 0; isMoveKey = true; }
      else if (e.code === 'KeyA' || e.code === 'ArrowLeft') { vdr = 0; vdc = -1; isMoveKey = true; }
      else if (e.code === 'KeyD' || e.code === 'ArrowRight') { vdr = 0; vdc = 1; isMoveKey = true; }

      if (isMoveKey) {
        const d = this.transformVisualDirection(vdr, vdc);
        if (this.wallMode) {
          this.moveWallCursor(d.dr, d.dc);
        } else {
          this.tryDirectMove(d.dr, d.dc);
        }
      } else if (this.wallMode) {
        if (e.code === 'Space' || e.code === 'Enter') this.attemptPlaceWall();
        else if (e.code === 'KeyQ' || e.code === 'Escape') this.exitWallMode();
      } else {
        if (e.code === 'Space') this.selectWallOrientation(this.wallOrientation);
      }
    }
  }

  tryDirectMove(dr, dc) {
    const player = this.game.getCurrentPlayer();
    const validMoves = this.game.getValidMoves(player);

    let target = validMoves.find(m => m.r === player.r + dr && m.c === player.c + dc);
    if (!target) {
      target = validMoves.find(m => m.r === player.r + dr * 2 && m.c === player.c + dc * 2);
    }

    if (target) {
      this.executeMove(target.r, target.c);
    } else {
      this.audio.playInvalid();
    }
  }

  moveWallCursor(dr, dc) {
    const nr = Math.max(0, Math.min(7, this.wallCursor.r + dr));
    const nc = Math.max(0, Math.min(7, this.wallCursor.c + dc));
    if (nr !== this.wallCursor.r || nc !== this.wallCursor.c) {
      this.wallCursor.r = nr;
      this.wallCursor.c = nc;
      this.audio.playMove();
      this.render();
    }
  }

  handleBoardMouseMove(e) {
    if (!this.wallMode) return;

    const rect = this.boardEl.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    // Chuyển đổi tọa độ chuột theo góc xoay bàn cờ của người chơi
    if (this.viewRotation === 180) {
      mouseX = rect.width - mouseX;
      mouseY = rect.height - mouseY;
    } else if (this.viewRotation === 90) {
      const ox = mouseX;
      mouseX = mouseY;
      mouseY = rect.width - ox;
    } else if (this.viewRotation === 270) {
      const ox = mouseX;
      mouseX = rect.height - mouseY;
      mouseY = ox;
    }

    // Use cell 0,0 and cell 8,8 to compute exact layout stride and offset
    const c00 = document.getElementById('cell-0-0');
    const c11 = document.getElementById('cell-1-1');

    let stride = 68;
    let offset = 56;

    if (c00 && c11) {
      stride = c11.offsetLeft - c00.offsetLeft;
      offset = c00.offsetLeft + c00.offsetWidth + (c11.offsetLeft - (c00.offsetLeft + c00.offsetWidth)) / 2;
    }

    const c = Math.max(0, Math.min(7, Math.round((mouseX - offset) / stride)));
    const r = Math.max(0, Math.min(7, Math.round((mouseY - offset) / stride)));

    if (r !== this.wallCursor.r || c !== this.wallCursor.c) {
      this.wallCursor.r = r;
      this.wallCursor.c = c;
      this.renderGhostWall();
    }
  }

  handleBoardClick(e) {
    if (!this.game || this.game.winner) return;

    this.audio.init();

    if (this.isOnline && this.game.currentTurn !== this.mySeat) {
      this.audio.playInvalid();
      this.showFeedback('Chưa tới lượt của bạn!');
      return;
    }

    if (this.wallMode) {
      this.attemptPlaceWall();
      return;
    }

    const cell = e.target.closest('.cell');
    if (cell) {
      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);
      const validMoves = this.game.getValidMoves();
      const isTarget = validMoves.some(m => m.r === r && m.c === c);

      if (isTarget) {
        this.executeMove(r, c);
      } else {
        this.audio.playInvalid();
      }
    }
  }

  attemptPlaceWall() {
    const res = this.game.placeWall(this.wallCursor.r, this.wallCursor.c, this.wallOrientation);
    if (res.success) {
      this.audio.playWallPlace();
      const action = {
        type: 'wall',
        r: this.wallCursor.r,
        c: this.wallCursor.c,
        orientation: this.wallOrientation,
        seat: this.game.currentTurn
      };

      if (this.isOnline) {
        this.network.sendGameAction(action);
      }

      this.wallMode = false;
      this.feedbackMsg = null;
      this.render();
    } else {
      this.audio.playInvalid();
      this.showFeedback(`⚠️ ${res.reason || 'Không thể đặt tường tại đây!'}`);
    }
  }

  executeMove(r, c) {
    const result = this.game.movePawn(r, c);
    if (result.success) {
      this.audio.playMove();
      const action = {
        type: 'move',
        r,
        c,
        seat: this.game.currentTurn
      };

      if (this.isOnline) {
        this.network.sendGameAction(action);
      }

      this.feedbackMsg = null;
      this.render();

      if (result.won) {
        this.handleVictory(result.winner, result.winningTeam);
        if (this.isOnline) {
          this.network.sendGameOver(result.winner, result.winningTeam, 'Cán đích thành công!');
        }
      }
    }
  }

  handleRemoteAction(action) {
    if (action.type === 'move') {
      this.game.movePawn(action.r, action.c);
      this.audio.playMove();
    } else if (action.type === 'wall') {
      this.game.placeWall(action.r, action.c, action.orientation);
      this.audio.playWallPlace();
    }
    this.render();
  }

  handleVictory(winnerSeat, winningTeam = null) {
    this.audio.playVictory();

    const winnerPlayer = this.onlinePlayers.find(p => p.seat === winnerSeat) || { nickname: `Người chơi #${winnerSeat}` };
    let won = false;

    if (this.game.mode === '2v2') {
      won = (this.myTeam === winningTeam);
      const teamName = winningTeam === 'A' ? 'ĐỘI XANH (TEAM A)' : 'ĐỘI ĐỎ (TEAM B)';
      this.winTitle.textContent = won ? `🏆 ĐỘI BẠN CHIẾN THẮNG!` : `🏆 ${teamName} CHIẾN THẮNG!`;
      this.winDesc.textContent = `${winnerPlayer.nickname} đã đưa quân cờ cán đích thành công!`;
    } else {
      won = (this.mySeat === winnerSeat);
      this.winTitle.textContent = won ? `🏆 BẠN ĐÃ CHIẾN THẮNG!` : `🏆 ${winnerPlayer.nickname.toUpperCase()} THẮNG!`;
      this.winDesc.textContent = `Đã xuất sắc đưa quân cờ cán đích thành công sau ${this.game.moveHistory.length} lượt đi!`;
    }

    if (this.isOnline) {
      const stats = this.storage.recordMatch(won, 1000, this.gameMode);
      this.ratingChangeBox.classList.remove('hidden');
      this.ratingChangeVal.textContent = stats.delta >= 0 ? `+${stats.delta}` : `${stats.delta}`;
      this.ratingChangeVal.style.color = stats.delta >= 0 ? '#10b981' : '#ef4444';
    } else {
      this.ratingChangeBox.classList.add('hidden');
    }

    if (this.turnTimerInterval) {
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
    }
    if (this.turnTimerPill) {
      this.turnTimerPill.classList.add('hidden');
    }

    this.btnRematch.disabled = false;
    this.btnRematch.textContent = '🔄 TÁI ĐẤU NGAY';
    if (this.rematchWaitingNote) this.rematchWaitingNote.classList.add('hidden');

    this.modalGameOver.classList.remove('hidden');
  }

  handleRemoteGameOver(data) {
    this.handleVictory(data.winnerSeat, data.winnerTeam);
  }

  spawnFloatingEmoji(emoji, seat) {
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.textContent = emoji;

    const boardRect = this.boardEl.getBoundingClientRect();
    el.style.left = `${boardRect.left + boardRect.width / 2 + (Math.random() - 0.5) * 140}px`;
    el.style.top = `${boardRect.top + boardRect.height / 2 + (Math.random() - 0.5) * 100}px`;

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1900);
  }

  showFeedback(msg) {
    this.feedbackMsg = msg;
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      this.feedbackMsg = null;
      this.render();
    }, 2800);
    this.render();
  }

  render() {
    if (!this.game) return;

    // 0. Update Board Goal Cells (Đích được đánh dấu theo màu đối thủ / đích đến)
    document.querySelectorAll('.cell').forEach(c => {
      c.classList.remove('goal-cell', 'goal-p1', 'goal-p2', 'goal-p3', 'goal-p4');
    });

    if (this.game.is4P) {
      // 4P: P1 goal = row 0, P2 goal = row 8, P3 goal = col 8, P4 goal = col 0
      for (let c = 0; c < 9; c++) {
        const cTop = document.getElementById(`cell-0-${c}`);
        if (cTop) cTop.classList.add('goal-cell', 'goal-p1');
        const cBot = document.getElementById(`cell-8-${c}`);
        if (cBot) cBot.classList.add('goal-cell', 'goal-p2');
      }
      for (let r = 0; r < 9; r++) {
        const cRight = document.getElementById(`cell-${r}-8`);
        if (cRight) cRight.classList.add('goal-cell', 'goal-p3');
        const cLeft = document.getElementById(`cell-${r}-0`);
        if (cLeft) cLeft.classList.add('goal-cell', 'goal-p4');
      }
    } else {
      // 2P:
      // Row 0 is P1's goal (Đích của P1, phía trên đỉnh)
      // Row 8 is P2's goal (Đích của P2, phía dưới đáy)
      for (let c = 0; c < 9; c++) {
        const cTop = document.getElementById(`cell-0-${c}`);
        if (cTop) cTop.classList.add('goal-cell', 'goal-p1');
        const cBot = document.getElementById(`cell-8-${c}`);
        if (cBot) cBot.classList.add('goal-cell', 'goal-p2');
      }
    }

    // 1. Render Player Status Cards
    this.playersStatusStrip.innerHTML = '';
    const colorClasses = ['p1-av', 'p2-av', 'p3-av', 'p4-av'];

    this.game.players.forEach(p => {
      const info = this.onlinePlayers.find(x => x.seat === p.id) || {
        nickname: `P${p.id}`,
        avatar: p.id === 1 ? '🦊' : p.id === 2 ? '🦁' : p.id === 3 ? '🐯' : '🦅'
      };

      const colorVariant = info.color ? `color-${info.color}` : '';
      const card = document.createElement('div');
      card.className = `p-pill ${p.id === this.game.currentTurn ? 'active-turn' : ''}`;
      const teamBadge = p.team ? `<span style="font-size:0.68rem; color:#fff; background:${p.team === 'A' ? '#4f46e5' : '#f43f5e'}; padding:1px 6px; border-radius:4px; margin-left:4px; font-weight:800;">Team ${p.team}</span>` : '';

      card.innerHTML = `
        <div class="p-avatar ${colorClasses[p.id - 1]} ${colorVariant}">${info.avatar || '👤'}</div>
        <div class="p-info">
          <div class="p-name">${info.nickname} ${teamBadge}</div>
          <div class="p-walls">🧱 ${p.wallsLeft} tường</div>
        </div>
      `;
      this.playersStatusStrip.appendChild(card);
    });

    // 2. Render Turn Banner & Dock
    const curPlayer = this.game.getCurrentPlayer();
    const curInfo = this.onlinePlayers.find(x => x.seat === curPlayer.id) || { nickname: `Player ${curPlayer.id}` };
    const isMyTurn = !this.isOnline || (curPlayer.id === this.mySeat);

    this.dockWallsCount.textContent = `🧱 ${curPlayer.wallsLeft}`;

    this.btnWallH.classList.remove('active');
    this.btnWallV.classList.remove('active');

    if (this.feedbackMsg) {
      this.turnText.innerHTML = `<span style="color:#ef4444; font-weight:800;">${this.feedbackMsg}</span>`;
    } else if (this.wallMode) {
      const orient = this.wallOrientation === 'h' ? 'Tường Ngang' : 'Tường Dọc';
      this.turnText.innerHTML = `Đang đặt <b>${orient}</b> — Click bàn cờ hoặc bấm <b>[Space/Enter]</b> để chốt`;
      this.wallModeIndicator.innerHTML = `Chế độ: <b style="color:var(--p${curPlayer.id}-color, #10b981)">Đang đặt ${orient}</b>`;
      if (this.wallOrientation === 'h') this.btnWallH.classList.add('active');
      else this.btnWallV.classList.add('active');
      this.btnCancelWall.classList.remove('hidden');
    } else {
      if (isMyTurn) {
        this.turnText.innerHTML = `<b>LƯỢT CỦA BẠN!</b> — Click ô hoặc dùng phím để đi / đặt tường`;
      } else {
        this.turnText.innerHTML = `Lượt của <b>${curInfo.nickname}</b> — Đang chờ đối thủ...`;
      }
      this.wallModeIndicator.innerHTML = `Chế độ: <b>Đi quân</b>`;
      this.btnCancelWall.classList.add('hidden');
    }

    this.btnWallH.disabled = !isMyTurn || curPlayer.wallsLeft <= 0;
    this.btnWallV.disabled = !isMyTurn || curPlayer.wallsLeft <= 0;

    // 3. Render Pawns & Move highlights
    document.querySelectorAll('.pawn, .placed-wall').forEach(el => el.remove());
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('valid-move'));

    const pawnClasses = ['p1-pawn', 'p2-pawn', 'p3-pawn', 'p4-pawn'];
    this.game.players.forEach(p => {
      const cell = document.getElementById(`cell-${p.r}-${p.c}`);
      if (cell) {
        const info = this.onlinePlayers.find(x => x.seat === p.id);
        const colorVariant = (info && info.color) ? `color-${info.color}` : '';
        const el = document.createElement('div');
        el.className = `pawn ${pawnClasses[p.id - 1]} ${colorVariant}`;
        cell.appendChild(el);
      }
    });

    if (isMyTurn && !this.wallMode && !this.game.winner) {
      const validMoves = this.game.getValidMoves();
      for (const m of validMoves) {
        const cell = document.getElementById(`cell-${m.r}-${m.c}`);
        if (cell) cell.classList.add('valid-move');
      }
    }

    // 4. Render Placed Walls
    this.renderPlacedWalls();

    // 5. Render Ghost Wall Preview
    this.renderGhostWall();
  }

  renderPlacedWalls() {
    const wallClasses = ['p1-wall', 'p2-wall', 'p3-wall', 'p4-wall'];

    for (const w of this.game.walls) {
      const wallEl = document.createElement('div');
      const playerSeat = w.player || 1;
      const info = this.onlinePlayers.find(x => x.seat === playerSeat);
      const colorVariant = (info && info.color) ? `color-${info.color}` : '';
      wallEl.className = `placed-wall ${wallClasses[playerSeat - 1]} ${colorVariant}`;

      const cellTL = document.getElementById(`cell-${w.r}-${w.c}`);
      const cellBR = document.getElementById(`cell-${w.r + 1}-${w.c + 1}`);

      if (cellTL && cellBR) {
        if (w.orientation === 'h') {
          wallEl.style.left = `${cellTL.offsetLeft}px`;
          wallEl.style.top = `${cellTL.offsetTop + cellTL.offsetHeight}px`;
          wallEl.style.width = `${(cellBR.offsetLeft + cellBR.offsetWidth) - cellTL.offsetLeft}px`;
          wallEl.style.height = `${cellBR.offsetTop - (cellTL.offsetTop + cellTL.offsetHeight)}px`;
        } else {
          wallEl.style.left = `${cellTL.offsetLeft + cellTL.offsetWidth}px`;
          wallEl.style.top = `${cellTL.offsetTop}px`;
          wallEl.style.width = `${cellBR.offsetLeft - (cellTL.offsetLeft + cellTL.offsetWidth)}px`;
          wallEl.style.height = `${(cellBR.offsetTop + cellBR.offsetHeight) - cellTL.offsetTop}px`;
        }
      }

      this.boardEl.appendChild(wallEl);
    }
  }

  renderGhostWall() {
    if (!this.wallMode || !this.game || this.game.winner) {
      this.ghostWallEl.classList.add('hidden');
      return;
    }

    this.ghostWallEl.classList.remove('hidden');

    const r = this.wallCursor.r;
    const c = this.wallCursor.c;

    const cellTL = document.getElementById(`cell-${r}-${c}`);
    const cellBR = document.getElementById(`cell-${r + 1}-${c + 1}`);

    if (cellTL && cellBR) {
      if (this.wallOrientation === 'h') {
        this.ghostWallEl.style.left = `${cellTL.offsetLeft}px`;
        this.ghostWallEl.style.top = `${cellTL.offsetTop + cellTL.offsetHeight}px`;
        this.ghostWallEl.style.width = `${(cellBR.offsetLeft + cellBR.offsetWidth) - cellTL.offsetLeft}px`;
        this.ghostWallEl.style.height = `${cellBR.offsetTop - (cellTL.offsetTop + cellTL.offsetHeight)}px`;
      } else {
        this.ghostWallEl.style.left = `${cellTL.offsetLeft + cellTL.offsetWidth}px`;
        this.ghostWallEl.style.top = `${cellTL.offsetTop}px`;
        this.ghostWallEl.style.width = `${cellBR.offsetLeft - (cellTL.offsetLeft + cellTL.offsetWidth)}px`;
        this.ghostWallEl.style.height = `${(cellBR.offsetTop + cellBR.offsetHeight) - cellTL.offsetTop}px`;
      }
    }

    const curPlayer = this.game.getCurrentPlayer();
    const info = this.onlinePlayers.find(x => x.seat === curPlayer.id);
    const colorKey = (info && info.color) ? info.color : (curPlayer.id === 1 ? 'indigo' : curPlayer.id === 2 ? 'rose' : curPlayer.id === 3 ? 'emerald' : 'amber');
    const pal = this.colorPalettes[colorKey] || this.colorPalettes.indigo;

    const check = this.game.isValidWallPlacement(r, c, this.wallOrientation);
    if (check.valid) {
      this.ghostWallEl.className = 'ghost-wall valid';
      this.ghostWallEl.style.background = pal.light;
      this.ghostWallEl.style.borderColor = pal.main;
      this.ghostWallEl.style.boxShadow = `0 0 16px ${pal.shadow}`;
    } else {
      this.ghostWallEl.className = 'ghost-wall invalid';
      this.ghostWallEl.style.background = '';
      this.ghostWallEl.style.borderColor = '';
      this.ghostWallEl.style.boxShadow = '';
    }
  }

  // ==========================================
  // FRIENDS SYSTEM METHODS
  // ==========================================
  openFriendsModal() {
    const prof = this.storage.getProfile();
    this.displayMyCode.textContent = prof.friendCode || 'WR-0000';
    this.modalFriends.classList.remove('hidden');

    // Default to friend list tab
    this.tabFriendsList.classList.add('active');
    this.tabFriendsSearch.classList.remove('active');
    this.paneFriendsList.classList.remove('hidden');
    this.paneFriendsSearch.classList.add('hidden');

    this.refreshFriendsStatus();
    this.renderFriendsList();
  }

  refreshFriendsStatus() {
    const friends = this.storage.getFriends();
    if (friends.length > 0 && this.network) {
      this.network.checkFriendsStatus(friends.map(f => f.id));
    }
  }

  updateFriendsBadge() {
    const friends = this.storage.getFriends();
    let onlineCount = 0;
    friends.forEach(f => {
      const st = this.friendsOnlineStatuses[f.id];
      if (st && st.online) onlineCount++;
    });

    if (onlineCount > 0) {
      this.friendsOnlineBadge.textContent = onlineCount;
      this.friendsOnlineBadge.classList.remove('hidden');
    } else {
      this.friendsOnlineBadge.classList.add('hidden');
    }
  }

  renderFriendsList() {
    const friends = this.storage.getFriends();
    this.friendsCountNum.textContent = friends.length;
    this.friendsListContainer.innerHTML = '';

    if (friends.length === 0) {
      this.friendsListContainer.innerHTML = `
        <div class="empty-friends-msg">
          <div style="font-size:2rem; margin-bottom:8px;">👥</div>
          <div>Bạn chưa có bạn bè nào trong danh sách.</div>
          <div style="font-size:0.8rem; margin-top:4px; color:#64748b;">Chuyển sang tab <b>"Tìm & Kết Bạn"</b> để thêm bạn bè cùng chơi nhé!</div>
        </div>
      `;
      return;
    }

    friends.forEach(f => {
      const st = this.friendsOnlineStatuses[f.id] || { online: false, status: 'offline' };
      const row = document.createElement('div');
      row.className = 'friend-row';

      let statusClass = 'offline';
      let statusText = 'Ngoại tuyến';

      if (st.online) {
        if (st.status === 'in_game') {
          statusClass = 'in_game';
          statusText = 'Đang trong trận đấu';
        } else if (st.status === 'in_room') {
          statusClass = 'in_room';
          statusText = 'Đang trong phòng chờ';
        } else {
          statusClass = 'online';
          statusText = 'Trực tuyến (Sảnh)';
        }
      }

      // Check if we can invite this friend (when in a waiting room)
      const canInvite = this.currentWaitingRoomCode && st.online;

      row.innerHTML = `
        <div class="friend-info-left">
          <div class="friend-avatar-wrap">
            <span>${f.avatar || '🦊'}</span>
            <span class="friend-status-dot ${statusClass}"></span>
          </div>
          <div class="friend-meta">
            <div class="friend-name">${f.nickname} <span style="font-size:0.75rem; color:#7c5cff; font-weight:700;">(${f.friendCode})</span></div>
            <div class="friend-status-text ${statusClass}">● ${statusText} • 🏆 ${f.rating || 1000}</div>
          </div>
        </div>
        <div class="friend-actions-right">
          ${canInvite ? `<button type="button" class="btn-invite-sm btn-action-invite">Mời vào phòng</button>` : ''}
          <button type="button" class="btn-remove-sm btn-action-remove" title="Xóa bạn">✕</button>
        </div>
      `;

      if (canInvite) {
        const btnInv = row.querySelector('.btn-action-invite');
        if (btnInv) {
          btnInv.addEventListener('click', () => {
            this.network.inviteFriend(f.id, this.currentWaitingRoomCode, this.selectedCustomMode || '2v2');
            btnInv.textContent = 'Đã gửi lời mời!';
            btnInv.disabled = true;
          });
        }
      }

      const btnRem = row.querySelector('.btn-action-remove');
      if (btnRem) {
        btnRem.addEventListener('click', async () => {
          const ok = await this.showCustomConfirm(
            `Bạn có chắc chắn muốn xóa "${f.nickname}" (${f.friendCode}) khỏi danh sách bạn bè không?`,
            'Xác nhận xóa bạn',
            { icon: '🗑️', confirmText: 'XÓA BẠN', cancelText: 'HỦY', isDestructive: true }
          );
          if (ok) {
            this.storage.removeFriend(f.id);
            this.renderFriendsList();
            this.updateFriendsBadge();
          }
        });
      }

      this.friendsListContainer.appendChild(row);
    });
  }

  executeFriendSearch() {
    const q = this.inputSearchFriends.value.trim();
    if (q.length < 2) {
      this.showCustomAlert('Vui lòng nhập ít nhất 2 ký tự (Tên hoặc Mã bạn bè) để tìm kiếm!', 'Tìm kiếm bạn bè', '🔍');
      return;
    }
    this.searchResultsContainer.innerHTML = '<div class="search-placeholder">Đang tìm kiếm người chơi...</div>';
    this.network.searchPlayers(q);
  }

  renderSearchResults(results) {
    this.searchResultsContainer.innerHTML = '';

    if (results.length === 0) {
      this.searchResultsContainer.innerHTML = `
        <div class="empty-friends-msg">
          <div>Không tìm thấy người chơi nào khớp với từ khóa tìm kiếm.</div>
          <div style="font-size:0.8rem; margin-top:4px;">Hãy thử tìm bằng chính xác Mã Người Chơi (VD: WR-XXXX).</div>
        </div>
      `;
      return;
    }

    results.forEach(u => {
      const isAlreadyFriend = this.storage.isFriend(u.id);
      const row = document.createElement('div');
      row.className = 'friend-row';

      row.innerHTML = `
        <div class="friend-info-left">
          <div class="friend-avatar-wrap">
            <span>${u.avatar || '🦊'}</span>
            <span class="friend-status-dot ${u.status || 'online'}"></span>
          </div>
          <div class="friend-meta">
            <div class="friend-name">${u.nickname} <span style="font-size:0.75rem; color:#7c5cff; font-weight:700;">(${u.friendCode})</span></div>
            <div class="friend-status-text ${u.status || 'online'}">🏆 Điểm: ${u.rating}</div>
          </div>
        </div>
        <div class="friend-actions-right">
          ${isAlreadyFriend
            ? `<span style="font-size:0.8rem; color:#10b981; font-weight:800;">✓ Đã là bạn</span>`
            : `<button type="button" class="btn-invite-sm btn-add-friend" style="background:#10b981;">+ Kết Bạn</button>`
          }
        </div>
      `;

      if (!isAlreadyFriend) {
        const btnAdd = row.querySelector('.btn-add-friend');
        if (btnAdd) {
          btnAdd.addEventListener('click', () => {
            this.storage.addFriend(u);
            btnAdd.textContent = '✓ Đã thêm';
            btnAdd.disabled = true;
            this.updateFriendsBadge();
            this.refreshFriendsStatus();
          });
        }
      }

      this.searchResultsContainer.appendChild(row);
    });
  }

  // ==========================================
  // IN-GAME LIVE CHAT & 3-MINUTE TURN TIMER
  // ==========================================
  startTurnTimerCountdown(deadline) {
    this.currentTurnDeadline = deadline;
    if (this.turnTimerInterval) clearInterval(this.turnTimerInterval);

    if (this.turnTimerPill) {
      this.turnTimerPill.classList.remove('hidden');
    }

    const updateTimer = () => {
      const now = Date.now();
      const remainingMs = Math.max(0, this.currentTurnDeadline - now);
      const remainingSec = Math.ceil(remainingMs / 1000);

      const mins = Math.floor(remainingSec / 60);
      const secs = remainingSec % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      if (this.turnTimerVal) {
        this.turnTimerVal.textContent = formatted;
      }

      if (this.turnTimerPill) {
        if (remainingSec <= 30) {
          this.turnTimerPill.classList.add('urgent');
        } else {
          this.turnTimerPill.classList.remove('urgent');
        }
      }

      if (remainingSec <= 0) {
        clearInterval(this.turnTimerInterval);
        this.turnTimerInterval = null;
      }
    };

    updateTimer();
    this.turnTimerInterval = setInterval(updateTimer, 500);
  }

  sendChatMessageFromInput() {
    const text = this.inputChatMsg.value.trim();
    if (!text) return;

    if (this.isOnline) {
      this.network.sendChatMessage(text);
    } else {
      const prof = this.storage.getProfile();
      this.addChatMessageLocally(prof.nickname, prof.avatar, text, true);
    }
    this.inputChatMsg.value = '';
  }

  addChatMessageLocally(nickname, avatar, text, isMine, time = null) {
    if (!this.chatMessagesContainer) return;

    const emptyHint = this.chatMessagesContainer.querySelector('.chat-empty-hint');
    if (emptyHint) emptyHint.remove();

    const row = document.createElement('div');
    row.className = `chat-msg-row ${isMine ? 'mine' : ''}`;

    const timeStr = time || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    row.innerHTML = `
      <div class="chat-msg-avatar">${avatar || '🦊'}</div>
      <div class="chat-msg-bubble">
        ${!isMine ? `<div class="chat-msg-author">${nickname}</div>` : ''}
        <div class="chat-msg-text">${this.escapeHTML(text)}</div>
      </div>
    `;

    this.chatMessagesContainer.appendChild(row);
    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
  }

  spawnChatBubbleAbovePawn(seat, text) {
    const pawn = this.game.players.find(p => p.id === seat);
    if (!pawn) return;

    const cell = document.getElementById(`cell-${pawn.r}-${pawn.c}`);
    if (!cell) return;

    const bubble = document.createElement('div');
    bubble.className = 'pawn-speech-bubble';
    bubble.style.position = 'absolute';
    bubble.style.bottom = '100%';
    bubble.style.left = '50%';
    bubble.style.transform = `translateX(-50%) rotate(-${this.viewRotation || 0}deg)`;
    bubble.style.background = '#1e1b4b';
    bubble.style.color = '#ffffff';
    bubble.style.padding = '4px 10px';
    bubble.style.borderRadius = '10px';
    bubble.style.fontSize = '0.75rem';
    bubble.style.fontWeight = '700';
    bubble.style.whiteSpace = 'nowrap';
    bubble.style.zIndex = '40';
    bubble.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    bubble.style.pointerEvents = 'none';
    bubble.textContent = text.length > 25 ? text.substring(0, 25) + '...' : text;

    cell.appendChild(bubble);
    setTimeout(() => bubble.remove(), 3200);
  }

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new WallRushApp();
});
