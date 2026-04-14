<template>
  <aside :class="['sidebar', { collapsed }]">

    <!-- LOGO -->
    <div class="sb-logo">
      <div class="logo-icon">📅</div>
      <transition name="fade-text">
        <span class="logo-text" v-if="!collapsed">Congés<span class="logo-pro">Pro</span></span>
      </transition>
    </div>

    <!-- NAV -->
    <nav class="sb-nav">
      <div class="nav-section" v-if="!collapsed">
        <span class="nav-label">{{ role === 'admin' ? 'Administration' : role === 'responsable' ? 'Gestion' : 'Mon espace' }}</span>
      </div>

      <router-link
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        :class="['sb-link', { active: isActive(item.to) }]"
        :title="collapsed ? item.label : ''"
      >
        <span class="sb-icon">{{ item.icon }}</span>
        <transition name="fade-text">
          <span class="sb-text" v-if="!collapsed">{{ item.label }}</span>
        </transition>
        <transition name="fade-text">
          <span class="sb-badge" v-if="item.badge && item.badge() > 0 && !collapsed">{{ item.badge() }}</span>
        </transition>
      </router-link>
    </nav>

    <!-- NOTIFICATIONS BELL -->
    <div class="sb-notif-section">
      <button class="sb-notif-btn" @click="toggleNotifs" :title="collapsed ? `${notifCount} notification(s)` : ''">
        <span class="sb-icon">🔔</span>
        <transition name="fade-text">
          <span class="sb-text" v-if="!collapsed">Notifications</span>
        </transition>
        <span class="notif-badge" v-if="notifCount > 0">{{ notifCount > 99 ? '99+' : notifCount }}</span>
      </button>
    </div>

    <!-- PANNEAU NOTIFICATIONS -->
    <transition name="notif-panel">
      <div class="notif-panel" v-if="showNotifs" @click.stop>
        <div class="np-header">
          <span class="np-title">🔔 Notifications</span>
          <div class="np-actions">
            <button class="np-action" @click="toutMarquerLu" title="Tout marquer comme lu" v-if="notifCount > 0">✓ Tout lire</button>
            <button class="np-close" @click="showNotifs = false">✕</button>
          </div>
        </div>
        <div class="np-body">
          <div class="np-empty" v-if="!notifications.length">
            <span>🔕</span>
            <p>Aucune notification</p>
          </div>
          <div
            v-for="n in notifications"
            :key="n._id"
            :class="['np-item', { unread: !n.lue }]"
            @click="clicNotif(n)"
          >
            <div class="np-icon">{{ notifIcon(n.type) }}</div>
            <div class="np-content">
              <div class="np-item-title">{{ n.titre }}</div>
              <div class="np-item-msg">{{ n.message }}</div>
              <div class="np-item-time">{{ timeAgo(n.createdAt) }}</div>
            </div>
            <button class="np-del" @click.stop="supprimerNotif(n._id)" title="Supprimer">✕</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- SPACER -->
    <div class="sb-spacer"></div>

    <!-- THEME TOGGLE -->
    <div class="sb-theme-section">
      <button class="sb-theme-btn" @click="toggleTheme" :title="collapsed ? (isDark ? 'Mode clair' : 'Mode sombre') : ''">
        <span class="sb-icon theme-icon" :class="{ rotate: themeAnimating }">{{ isDark ? '☀️' : '🌙' }}</span>
        <transition name="fade-text">
          <span class="sb-text" v-if="!collapsed">{{ isDark ? 'Mode clair' : 'Mode sombre' }}</span>
        </transition>
      </button>
    </div>

    <!-- USER SECTION -->
    <div class="sb-user">
      <div class="sb-user-info" v-if="!collapsed">
        <div class="sb-avatar" v-if="!userPhoto">{{ userInitiales }}</div>
        <img v-else :src="userPhotoUrl" class="sb-avatar-img" alt="Photo" />
        <div class="sb-user-details">
          <div class="sb-user-name">{{ userName }}</div>
          <div class="sb-user-role">{{ role === 'admin' ? 'Administrateur' : role === 'responsable' ? 'Responsable' : 'Employé' }}</div>
        </div>
      </div>
      <div v-if="collapsed" :title="userName">
        <div class="sb-avatar sb-avatar-mini" v-if="!userPhoto">{{ userInitiales }}</div>
        <img v-else :src="userPhotoUrl" class="sb-avatar-img sb-avatar-mini" alt="Photo" />
      </div>

      <router-link :to="profilRoute" class="sb-logout sb-profil-link" style="color:#94a3b8;text-decoration:none;" :title="collapsed ? 'Mon profil' : ''">
        <span class="sb-icon">👤</span>
        <transition name="fade-text">
          <span class="sb-text" v-if="!collapsed">Mon profil</span>
        </transition>
      </router-link>

      <button class="sb-logout" @click="logout" :title="collapsed ? 'Déconnexion' : ''">
        <span class="sb-icon">🚪</span>
        <transition name="fade-text">
          <span class="sb-text" v-if="!collapsed">Déconnexion</span>
        </transition>
      </button>
    </div>

    <!-- TOGGLE -->
    <button class="sb-toggle" @click="collapsed = !collapsed" :title="collapsed ? 'Ouvrir' : 'Réduire'">
      <span :class="['toggle-arrow', { flipped: collapsed }]">◂</span>
    </button>

  </aside>
</template>

<script>
export default {
  name: 'SidebarComponent',
  data() {
    return {
      collapsed: false,
      role: localStorage.getItem('role') || '',
      showNotifs: false,
      notifications: [],
      notifCount: 0,
      notifInterval: null,
      isDark: true,
      themeAnimating: false,
    };
  },
  computed: {
    userName() {
      const prenom = localStorage.getItem('prenom') || '';
      const nom = localStorage.getItem('nom') || '';
      return (prenom + ' ' + nom).trim() || 'Utilisateur';
    },
    userInitiales() {
      const parts = this.userName.trim().split(' ').filter(Boolean);
      return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : this.userName.slice(0, 2).toUpperCase();
    },
    userPhoto() {
      return localStorage.getItem('photo') || '';
    },
    userPhotoUrl() {
      if (!this.userPhoto) return '';
      const api = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${api}/uploads/photos/${this.userPhoto}`;
    },
    profilRoute() {
      if (this.role === 'admin') return '/admin/profil';
      if (this.role === 'responsable') return '/responsable/profil';
      return '/employe/profil';
    },
    menuItems() {
      if (this.role === 'admin') {
        return [
          { icon: '📊', label: 'Dashboard', to: '/admin/dashboard' },
          { icon: '👥', label: 'Employés', to: '/admin/utilisateurs' },
          { icon: '🏢', label: 'Services', to: '/admin/services' },
          { icon: '📋', label: 'Demandes', to: '/admin/demandes' },
          { icon: '📅', label: 'Calendrier', to: '/admin/calendrier' },
          { icon: '📜', label: 'Historique', to: '/admin/historique' },
        ];
      }
      if (this.role === 'responsable') {
        return [
          { icon: '📊', label: 'Dashboard', to: '/responsable/demandes' },
          { icon: '📅', label: 'Calendrier', to: '/responsable/calendrier' },
        ];
      }
      return [
        { icon: '🏠', label: 'Dashboard', to: '/employe/dashboard' },
        { icon: '📝', label: 'Nouvelle demande', to: '/employe/soumettre' },
        { icon: '📋', label: 'Mes demandes', to: '/employe/mes-demandes' },
        { icon: '📅', label: 'Calendrier', to: '/employe/calendrier' },
      ];
    },
  },
  watch: {
    $route() {
      this.role = localStorage.getItem('role') || '';
    },
  },
  methods: {
    isActive(path) {
      return this.$route.path === path;
    },
    toggleTheme() {
      this.themeAnimating = true;
      setTimeout(() => { this.themeAnimating = false; }, 500);
      this.isDark = !this.isDark;
      const theme = this.isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    },
    initTheme() {
      const saved = localStorage.getItem('theme');
      if (saved === 'light') {
        this.isDark = false;
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        this.isDark = true;
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    },
    logout() {
      ['token', 'role', 'nom', 'prenom', 'photo'].forEach(k => localStorage.removeItem(k));
      this.role = '';
      this.$router.push('/');
    },
    handleOutsideNotif(e) {
      if (this.showNotifs && !e.target.closest('.notif-panel') && !e.target.closest('.sb-notif-btn')) {
        this.showNotifs = false;
      }
    },
    async chargerNotifCount() {
      try {
        const axios = (await import('../axios')).default;
        const res = await axios.get('/notifications/count');
        this.notifCount = res.data.count;
      } catch { /* silencieux */ }
    },
    async chargerNotifs() {
      try {
        const axios = (await import('../axios')).default;
        const res = await axios.get('/notifications?limit=30');
        this.notifications = res.data.notifications;
        this.notifCount = this.notifications.filter(n => !n.lue).length;
      } catch { /* silencieux */ }
    },
    async toggleNotifs() {
      this.showNotifs = !this.showNotifs;
      if (this.showNotifs) await this.chargerNotifs();
    },
    async clicNotif(n) {
      if (!n.lue) {
        try {
          const axios = (await import('../axios')).default;
          await axios.put(`/notifications/${n._id}/lire`);
          n.lue = true;
          this.notifCount = Math.max(0, this.notifCount - 1);
        } catch { /* silencieux */ }
      }
      if (n.lien) {
        this.showNotifs = false;
        this.$router.push(n.lien);
      }
    },
    async toutMarquerLu() {
      try {
        const axios = (await import('../axios')).default;
        await axios.put('/notifications/lire-tout');
        this.notifications.forEach(n => n.lue = true);
        this.notifCount = 0;
      } catch { /* silencieux */ }
    },
    async supprimerNotif(id) {
      try {
        const axios = (await import('../axios')).default;
        await axios.delete(`/notifications/${id}`);
        this.notifications = this.notifications.filter(n => n._id !== id);
        this.notifCount = this.notifications.filter(n => !n.lue).length;
      } catch { /* silencieux */ }
    },
    notifIcon(type) {
      const icons = {
        nouvelle_demande: '📋', demande_approuvee: '✅', demande_refusee: '❌',
        demande_supprimee: '🗑️', bienvenue: '🎉', rappel_fin_conge: '⏰',
        conge_termine: '🏠', info: 'ℹ️'
      };
      return icons[type] || '🔔';
    },
    timeAgo(date) {
      const s = Math.floor((Date.now() - new Date(date)) / 1000);
      if (s < 60) return 'À l\'instant';
      if (s < 3600) return Math.floor(s / 60) + ' min';
      if (s < 86400) return Math.floor(s / 3600) + 'h';
      if (s < 604800) return Math.floor(s / 86400) + 'j';
      return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    },
  },
  mounted() {
    this.initTheme();
    document.addEventListener('click', this.handleOutsideNotif);
    this.chargerNotifCount();
    // Polling toutes les 30 secondes
    this.notifInterval = setInterval(() => this.chargerNotifCount(), 30000);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideNotif);
    if (this.notifInterval) clearInterval(this.notifInterval);
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

.sidebar {
  font-family: 'Sora', sans-serif;
  width: 260px;
  height: 100vh;
  background: #0d1117;
  border-right: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  transition: width .3s cubic-bezier(.4,0,.2,1);
  overflow-x: hidden;
  overflow-y: auto;
}
.sidebar.collapsed {
  width: 72px;
}

/* ── LOGO ── */
.sb-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px 24px;
  white-space: nowrap;
}
.logo-icon {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(79,70,229,.3);
}
.logo-text {
  font-size: 18px;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: -.02em;
}
.logo-pro { color: #818cf8; }

/* ── NAV ── */
.sb-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-section {
  padding: 16px 12px 8px;
}
.nav-label {
  font-size: 10px;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: .12em;
}

.sb-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-decoration: none;
  transition: all .2s;
  white-space: nowrap;
  position: relative;
}
.sb-link:hover {
  background: #1e293b;
  color: #e2e8f0;
}
.sb-link.active {
  background: rgba(79,70,229,.15);
  color: #a5b4fc;
}
.sb-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #4f46e5;
  border-radius: 0 4px 4px 0;
}

.sb-icon {
  font-size: 17px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}
.sb-text {
  flex: 1;
  overflow: hidden;
}
.sb-badge {
  background: #f43f5e;
  color: white;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 99px;
  min-width: 18px;
  text-align: center;
}

/* ── THEME TOGGLE ── */
.sb-theme-section { padding: 4px 0; }
.sb-theme-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px; border-radius: 12px;
  border: none; background: none; cursor: pointer;
  font-size: 13px; font-weight: 600; color: var(--text-muted, #64748b);
  font-family: 'Sora', sans-serif; width: 100%;
  transition: all .2s; white-space: nowrap;
}
.sb-theme-btn:hover { background: var(--bg-input, #1e293b); color: var(--text-primary, #e2e8f0); }
.theme-icon { transition: transform .5s cubic-bezier(.34,1.56,.64,1); }
.theme-icon.rotate { transform: rotate(360deg); }

/* ── NOTIFICATIONS ── */
.sb-notif-section { padding: 8px 0; }
.sb-notif-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px; border-radius: 12px;
  border: none; background: none; cursor: pointer;
  font-size: 13px; font-weight: 600; color: #64748b;
  font-family: 'Sora', sans-serif; width: 100%;
  transition: all .2s; position: relative; white-space: nowrap;
}
.sb-notif-btn:hover { background: #1e293b; color: #e2e8f0; }
.notif-badge {
  position: absolute; top: 4px; left: 28px;
  background: #f43f5e; color: white;
  font-size: 9px; font-weight: 800;
  min-width: 16px; height: 16px;
  border-radius: 99px; padding: 0 4px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #0d1117;
  animation: notifPulse 2s infinite;
}
@keyframes notifPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Panneau notifications */
.notif-panel {
  position: fixed; top: 0; left: 260px;
  width: 380px; height: 100vh;
  background: #111827; border-left: 1px solid #1e293b;
  box-shadow: 8px 0 32px rgba(0,0,0,.4);
  z-index: 999; display: flex; flex-direction: column;
  font-family: 'Sora', sans-serif;
}
.sidebar.collapsed ~ .notif-panel,
.sidebar.collapsed .notif-panel { left: 72px; }

.np-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #1e293b;
  display: flex; align-items: center; justify-content: space-between;
}
.np-title { font-size: 15px; font-weight: 700; color: #f1f5f9; }
.np-actions { display: flex; align-items: center; gap: 8px; }
.np-action {
  background: rgba(79,70,229,.15); border: 1px solid rgba(79,70,229,.2);
  color: #a5b4fc; padding: 5px 12px; border-radius: 8px;
  font-size: 11px; font-weight: 600; cursor: pointer;
  font-family: 'Sora', sans-serif; transition: all .2s;
}
.np-action:hover { background: rgba(79,70,229,.25); }
.np-close {
  width: 28px; height: 28px; border-radius: 8px;
  border: 1px solid #334155; background: #1e293b; color: #94a3b8;
  cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s; font-family: inherit;
}
.np-close:hover { background: rgba(248,113,113,.12); color: #f87171; }

.np-body { flex: 1; overflow-y: auto; }
.np-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; gap: 8px; color: #334155; font-size: 32px; }
.np-empty p { font-size: 13px; color: #475569; margin: 0; }

.np-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 16px 20px; border-bottom: 1px solid #0d1422;
  cursor: pointer; transition: background .15s; position: relative;
}
.np-item:hover { background: #131c30; }
.np-item.unread { background: rgba(79,70,229,.04); border-left: 3px solid #4f46e5; }
.np-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
.np-content { flex: 1; min-width: 0; }
.np-item-title { font-size: 13px; font-weight: 700; color: #f1f5f9; margin-bottom: 3px; }
.np-item.unread .np-item-title { color: #a5b4fc; }
.np-item-msg { font-size: 12px; color: #64748b; line-height: 1.5; }
.np-item-time { font-size: 10px; color: #334155; margin-top: 6px; font-weight: 600; }
.np-del {
  position: absolute; top: 12px; right: 12px;
  width: 22px; height: 22px; border-radius: 6px;
  border: none; background: transparent; color: #334155;
  cursor: pointer; font-size: 10px;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: all .15s;
}
.np-item:hover .np-del { opacity: 1; }
.np-del:hover { background: rgba(248,113,113,.12); color: #f87171; }

/* Animation panneau */
.notif-panel-enter-active, .notif-panel-leave-active { transition: all .3s ease; }
.notif-panel-enter-from, .notif-panel-leave-to { transform: translateX(-20px); opacity: 0; }

/* ── SPACER ── */
.sb-spacer { flex: 1; }

/* ── USER ── */
.sb-user {
  border-top: 1px solid #1e293b;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sb-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px;
}
.sb-avatar {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sb-avatar-mini {
  margin: 0 auto;
}
.sb-avatar-img {
  width: 36px; height: 36px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}
.sb-avatar-img.sb-avatar-mini {
  margin: 0 auto;
  display: block;
}
.sb-user-details { overflow: hidden; }
.sb-user-name {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sb-user-role {
  font-size: 11px;
  color: #475569;
  margin-top: 1px;
}

.sb-logout {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  font-family: 'Sora', sans-serif;
  transition: all .2s;
  white-space: nowrap;
}
.sb-logout:hover {
  background: rgba(248,113,113,.1);
  color: #f87171;
}

/* ── TOGGLE ── */
.sb-toggle {
  position: absolute;
  top: 28px;
  right: -14px;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #111827;
  border: 1px solid #1e293b;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s;
  z-index: 10;
}
.sb-toggle:hover {
  background: #1e293b;
  color: #e2e8f0;
  border-color: #334155;
}
.toggle-arrow {
  transition: transform .3s;
  display: inline-block;
}
.toggle-arrow.flipped {
  transform: rotate(180deg);
}

/* ── FADE TEXT ── */
.fade-text-enter-active { transition: opacity .2s .1s; }
.fade-text-leave-active { transition: opacity .15s; }
.fade-text-enter-from, .fade-text-leave-to { opacity: 0; }

/* ── MOBILE ── */
@media (max-width: 768px) {
  .sidebar {
    width: 72px;
  }
  .sb-text, .sb-badge, .nav-label, .sb-user-info, .logo-text { display: none !important; }
  .sb-toggle { display: none; }
}
</style>