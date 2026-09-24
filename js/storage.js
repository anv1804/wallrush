/* ==========================================================
   WALLRUSH STORAGE & ONBOARDING (LOCALSTORAGE)
   Persistent User ID, First-time Onboarding, Room State & Elo
   ========================================================== */

class PlayerStorage {
  constructor() {
    this.STORAGE_KEY = 'wallrush_player_profile';
    this.ACTIVE_ROOM_KEY = 'wallrush_active_room';
    this.profile = this.loadProfile();
  }

  loadProfile() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (!parsed.id) {
          parsed.id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        }
        if (!parsed.friendCode) {
          parsed.friendCode = 'WR-' + Math.floor(1000 + Math.random() * 9000);
        }
        if (!parsed.friends) {
          parsed.friends = [];
        }
        this.save(parsed);
        return parsed;
      }
    } catch (e) {}

    // First-time Default Profile
    const initial = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      friendCode: 'WR-' + Math.floor(1000 + Math.random() * 9000),
      nickname: '',
      avatar: '🦊',
      color: 'indigo',
      hasCompletedOnboarding: false, // Flag for first-time onboarding modal
      rating: 1000,
      games: 0,
      wins: 0,
      losses: 0,
      winRate: '0%',
      friends: [], // array of { id, friendCode, nickname, avatar, rating, color }
      history: []
    };

    this.save(initial);
    return initial;
  }

  save(profile = this.profile) {
    try {
      this.profile = profile;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {}
  }

  getProfile() {
    return this.profile;
  }

  hasCompletedOnboarding() {
    return !!(this.profile && this.profile.hasCompletedOnboarding && this.profile.nickname);
  }

  completeOnboarding(nickname, avatar, color = 'indigo') {
    this.profile.nickname = (nickname && nickname.trim()) ? nickname.trim().substring(0, 16) : `Chiến Binh #${Math.floor(1000 + Math.random() * 9000)}`;
    this.profile.avatar = avatar || '🦊';
    this.profile.color = color || 'indigo';
    this.profile.hasCompletedOnboarding = true;
    this.save();
    return this.profile;
  }

  updateProfile(nickname, avatar, color) {
    if (nickname && nickname.trim()) {
      this.profile.nickname = nickname.trim().substring(0, 16);
    }
    if (avatar) {
      this.profile.avatar = avatar;
    }
    if (color) {
      this.profile.color = color;
    }
    this.save();
    return this.profile;
  }

  getFriends() {
    if (!this.profile.friends) this.profile.friends = [];
    return this.profile.friends;
  }

  addFriend(friend) {
    if (!this.profile.friends) this.profile.friends = [];
    const exists = this.profile.friends.some(f => f.id === friend.id || f.friendCode === friend.friendCode);
    if (!exists) {
      this.profile.friends.push({
        id: friend.id,
        friendCode: friend.friendCode,
        nickname: friend.nickname,
        avatar: friend.avatar || '🦊',
        color: friend.color || 'indigo',
        rating: friend.rating || 1000
      });
      this.save();
    }
    return this.profile.friends;
  }

  removeFriend(friendId) {
    if (!this.profile.friends) return [];
    this.profile.friends = this.profile.friends.filter(f => f.id !== friendId && f.friendCode !== friendId);
    this.save();
    return this.profile.friends;
  }

  isFriend(friendId) {
    if (!this.profile.friends) return false;
    return this.profile.friends.some(f => f.id === friendId || f.friendCode === friendId);
  }

  // Active match room persistence for reconnecting
  saveActiveRoom(roomId, mode) {
    try {
      localStorage.setItem(this.ACTIVE_ROOM_KEY, JSON.stringify({ roomId, mode, time: Date.now() }));
    } catch (e) {}
  }

  getActiveRoom() {
    try {
      const data = localStorage.getItem(this.ACTIVE_ROOM_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Only valid if under 2 minutes old
        if (Date.now() - parsed.time < 120000) {
          return parsed;
        } else {
          this.clearActiveRoom();
        }
      }
    } catch (e) {}
    return null;
  }

  clearActiveRoom() {
    try {
      localStorage.removeItem(this.ACTIVE_ROOM_KEY);
    } catch (e) {}
  }

  // Match stats & Elo calculation
  recordMatch(won, opponentRating = 1000, mode = '1v1') {
    this.profile.games++;
    if (won) {
      this.profile.wins++;
    } else {
      this.profile.losses++;
    }

    const expected = 1 / (1 + Math.pow(10, (opponentRating - this.profile.rating) / 400));
    const kFactor = 32;
    const delta = Math.round(kFactor * ((won ? 1 : 0) - expected));
    this.profile.rating = Math.max(100, this.profile.rating + delta);

    const pct = Math.round((this.profile.wins / this.profile.games) * 100);
    this.profile.winRate = `${pct}%`;

    this.profile.history.unshift({
      date: new Date().toLocaleDateString('vi-VN'),
      won,
      mode,
      delta: delta >= 0 ? `+${delta}` : `${delta}`,
      ratingAfter: this.profile.rating
    });
    if (this.profile.history.length > 20) this.profile.history.pop();

    this.clearActiveRoom();
    this.save();
    return { delta, newRating: this.profile.rating };
  }
}

window.playerStorage = new PlayerStorage();
