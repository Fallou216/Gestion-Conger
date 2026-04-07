<template>
  <header class="header">
    <div class="container">

      <!-- LOGO -->
      <router-link
        :to="role === 'employe' ? '/employe/dashboard' : role === 'responsable' ? '/responsable/demandes' : '/'"
        class="logo"
      >
        <div class="logo-icon">📅</div>
        <span class="logo-text">Congés<span class="logo-pro">Pro</span></span>
      </router-link>

      <!-- NAV DESKTOP -->
      <nav class="nav" v-if="isLoggedIn">

        <!-- Employé -->
        <template v-if="role === 'employe'">
          <router-link to="/employe/dashboard" class="nav-link" active-class="active">
            <span class="nav-icon">🏠</span>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/employe/mes-demandes" class="nav-link" active-class="active">
            <span class="nav-icon">📋</span>
            <span>Mes demandes</span>
          </router-link>
        </template>

        <!-- Responsable -->
        <template v-else-if="role === 'responsable'">
          <router-link to="/responsable/demandes" class="nav-link" active-class="active">
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/services" class="nav-link" active-class="active">
            <span class="nav-icon">🏢</span>
            <span>Services</span>
          </router-link>
          <router-link to="/utilisateurs" class="nav-link" active-class="active">
            <span class="nav-icon">👥</span>
            <span>Employés</span>
          </router-link>
        </template>

      </nav>

      <!-- DROITE -->
      <div class="right-zone" v-if="isLoggedIn">

        <!-- Badge rôle -->
        <div class="role-badge" :class="role === 'responsable' ? 'role-resp' : 'role-emp'">
          {{ role === 'responsable' ? '👑 Responsable' : '👤 Employé' }}
        </div>

        <!-- Avatar + menu -->
        <div class="user-menu" ref="userMenu">
          <button class="avatar-btn" @click="menuOpen = !menuOpen">
            <div class="avatar">{{ userInitiales }}</div>
            <span class="avatar-name">{{ userName }}</span>
            <span class="chevron" :class="{ open: menuOpen }">▾</span>
          </button>

          <transition name="dropdown">
            <div class="dropdown" v-if="menuOpen" @click.stop>
              <div class="dropdown-header">
                <div class="dh-avatar">{{ userInitiales }}</div>
                <div>
                  <div class="dh-name">{{ userName }}</div>
                  <div class="dh-role">{{ role === 'responsable' ? 'Responsable RH' : 'Employé' }}</div>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item logout-item" @click="logout">
                <span>🚪</span>
                <span>Déconnexion</span>
              </button>
            </div>
          </transition>
        </div>

        <!-- Burger mobile -->
        <button class="burger" @click="mobileOpen = !mobileOpen" aria-label="Menu">
          <span :class="['burger-line', { open: mobileOpen }]"></span>
          <span :class="['burger-line', { open: mobileOpen }]"></span>
          <span :class="['burger-line', { open: mobileOpen }]"></span>
        </button>

      </div>
    </div>

    <!-- MENU MOBILE -->
    <transition name="mobile-menu">
      <div class="mobile-nav" v-if="mobileOpen && isLoggedIn">

        <template v-if="role === 'employe'">
          <router-link to="/employe/dashboard"    class="mobile-link" @click="mobileOpen = false">🏠 Dashboard</router-link>
          <router-link to="/employe/mes-demandes" class="mobile-link" @click="mobileOpen = false">📋 Mes demandes</router-link>
        </template>

        <template v-else-if="role === 'responsable'">
          <router-link to="/responsable/demandes" class="mobile-link" @click="mobileOpen = false">📊 Dashboard</router-link>
          <router-link to="/services"             class="mobile-link" @click="mobileOpen = false">🏢 Services</router-link>
          <router-link to="/utilisateurs"         class="mobile-link" @click="mobileOpen = false">👥 Employés</router-link>
        </template>

        <div class="mobile-divider"></div>
        <button class="mobile-link mobile-logout" @click="logout">🚪 Déconnexion</button>

      </div>
    </transition>

  </header>
</template>

<script>
export default {
  name: 'AppHeader',
  data() {
    return {
      role: localStorage.getItem('role') || '',
      menuOpen: false,
      mobileOpen: false,
    };
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('token');
    },
    userName() {
      const prenom = localStorage.getItem('prenom') || '';
      const nom    = localStorage.getItem('nom')    || '';
      return (prenom + ' ' + nom).trim() || 'Utilisateur';
    },
    userInitiales() {
      const parts = this.userName.trim().split(' ').filter(Boolean);
      return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : this.userName.slice(0, 2).toUpperCase();
    },
  },
  watch: {
    $route() {
      this.role       = localStorage.getItem('role') || '';
      this.menuOpen   = false;
      this.mobileOpen = false;
    },
  },
  methods: {
    logout() {
      ['token','role','nom','prenom'].forEach(k => localStorage.removeItem(k));
      this.role = '';
      this.menuOpen = false;
      this.mobileOpen = false;
      this.$router.push('/');
    },
    handleOutsideClick(e) {
      if (this.$refs.userMenu && !this.$refs.userMenu.contains(e.target)) {
        this.menuOpen = false;
      }
    },
  },
  mounted()   { document.addEventListener('click', this.handleOutsideClick); },
  unmounted() { document.removeEventListener('click', this.handleOutsideClick); },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

/* ── BASE ── */
.header {
  font-family: 'Sora', sans-serif;
  background: #0d1117;
  border-bottom: 1px solid #1e293b;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* ── LOGO ── */
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}
.logo-icon {
  width: 34px; height: 34px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  box-shadow: 0 2px 10px rgba(79,70,229,.35);
}
.logo-text {
  font-size: 17px;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: -.02em;
}
.logo-pro { color: #818cf8; }

/* ── NAV DESKTOP ── */
.nav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  padding-left: 24px;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-decoration: none;
  transition: background .18s, color .18s;
  white-space: nowrap;
}
.nav-link:hover { background: #1e293b; color: #e2e8f0; }
.nav-link.active { background: rgba(79,70,229,.15); color: #a5b4fc; }
.nav-icon { font-size: 15px; }

/* ── DROITE ── */
.right-zone {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.role-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 99px;
  white-space: nowrap;
}
.role-resp { background: rgba(79,70,229,.15); color: #a5b4fc; border: 1px solid rgba(79,70,229,.2); }
.role-emp  { background: rgba(16,185,129,.12); color: #6ee7b7; border: 1px solid rgba(16,185,129,.2); }

/* Avatar menu */
.user-menu { position: relative; }
.avatar-btn {
  display: flex; align-items: center; gap: 9px;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 99px;
  padding: 5px 14px 5px 5px;
  cursor: pointer;
  transition: border-color .2s;
  font-family: 'Sora', sans-serif;
}
.avatar-btn:hover { border-color: #334155; }
.avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.avatar-name { font-size: 12px; font-weight: 600; color: #94a3b8; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chevron { font-size: 11px; color: #475569; transition: transform .2s; }
.chevron.open { transform: rotate(180deg); }

/* Dropdown */
.dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 220px;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
  z-index: 100;
}
.dropdown-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px;
}
.dh-avatar {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dh-name  { font-size: 13px; font-weight: 700; color: #f1f5f9; }
.dh-role  { font-size: 11px; color: #475569; margin-top: 2px; }
.dropdown-divider { height: 1px; background: #1e293b; }
.dropdown-item {
  width: 100%;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Sora', sans-serif;
  color: #94a3b8;
  text-align: left;
  transition: background .15s, color .15s;
}
.dropdown-item:hover { background: #1e293b; }
.logout-item:hover { background: rgba(248,113,113,.1); color: #f87171; }

/* Dropdown animation */
.dropdown-enter-active, .dropdown-leave-active { transition: all .2s cubic-bezier(.34,1.56,.64,1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-8px) scale(.97); }

/* ── BURGER ── */
.burger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
}
.burger-line {
  display: block;
  width: 22px; height: 2px;
  background: #64748b;
  border-radius: 2px;
  transition: all .25s;
}
.burger-line:nth-child(1).open { transform: rotate(45deg) translate(5px,5px); background: #e2e8f0; }
.burger-line:nth-child(2).open { opacity: 0; }
.burger-line:nth-child(3).open { transform: rotate(-45deg) translate(5px,-5px); background: #e2e8f0; }

/* ── MOBILE MENU ── */
.mobile-nav {
  background: #0d1117;
  border-top: 1px solid #1e293b;
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mobile-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Sora', sans-serif;
  text-align: left;
  transition: background .15s, color .15s;
}
.mobile-link:hover,
.mobile-link.router-link-active { background: #1e293b; color: #e2e8f0; }
.mobile-divider { height: 1px; background: #1e293b; margin: 6px 0; }
.mobile-logout:hover { background: rgba(248,113,113,.1); color: #f87171; }

/* Mobile menu animation */
.mobile-menu-enter-active, .mobile-menu-leave-active { transition: all .25s ease; }
.mobile-menu-enter-from, .mobile-menu-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .nav       { display: none; }
  .role-badge { display: none; }
  .avatar-name { display: none; }
  .burger    { display: flex; }
}
@media (max-width: 480px) {
  .container { padding: 0 14px; }
}
</style>