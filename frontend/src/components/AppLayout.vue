<template>
  <div class="app-layout">
    <SidebarComponent />
    <main class="layout-main" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <transition name="fade" mode="out-in">
        <router-view />
      </transition>
    </main>
  </div>
</template>

<script>
import SidebarComponent from './Sidebar.vue';

export default {
  name: 'AppLayout',
  components: { SidebarComponent },
  data() {
    return {
      sidebarCollapsed: false,
    };
  },
};
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #0a0f1e;
}

.layout-main {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  transition: margin-left .3s cubic-bezier(.4,0,.2,1);
}

/* Quand on détecte que la sidebar est collapsed via CSS */
@media (max-width: 768px) {
  .layout-main {
    margin-left: 72px;
  }
}

/* ANIMATION DE ROUTE */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>