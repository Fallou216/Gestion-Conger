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

    <!-- SPACER -->
    <div class="sb-spacer"></div>

    <!-- USER SECTION -->
    <div class="sb-user">
      <div class="sb-user-info" v-if="!collapsed">
        <div class="sb-avatar">{{ userInitiales }}</div>
        <div class="sb-user-details">
          <div class="sb-user-name">{{ userName }}</div>
          <div class="sb-user-role">{{ role === 'admin' ? 'Administrateur' : role === 'responsable' ? 'Responsable' : 'Employé' }}</div>
        </div>
      </div>
      <div class="sb-avatar sb-avatar-mini" v-else :title="userName">{{ userInitiales }}</div>

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
    menuItems() {
      if (this.role === 'admin') {
        return [
          { icon: '📊', label: 'Dashboard', to: '/admin/dashboard' },
          { icon: '👥', label: 'Employés', to: '/admin/utilisateurs' },
          { icon: '🏢', label: 'Services', to: '/admin/services' },
          { icon: '📋', label: 'Demandes', to: '/admin/demandes' },
          { icon: '📅', label: 'Calendrier', to: '/admin/calendrier' },
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
    logout() {
      ['token', 'role', 'nom', 'prenom'].forEach(k => localStorage.removeItem(k));
      this.role = '';
      this.$router.push('/');
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

.sidebar {
  font-family: 'Sora', sans-serif;
  width: 260px;
  min-height: 100vh;
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
  overflow: hidden;
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