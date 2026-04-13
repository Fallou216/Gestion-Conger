<template>
  <div class="app-layout">
    <SidebarComponent ref="sidebar" />
    <main class="layout-main" :class="{ 'sb-collapsed': sidebarCollapsed }">
      <router-view v-slot="{ Component }">
        <transition name="page-content" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script>
import SidebarComponent from './Sidebar.vue';

export default {
  name: 'AppLayout',
  components: { SidebarComponent },
  data() {
    return { sidebarCollapsed: false };
  },
  mounted() {
    // Observer le state collapsed de la sidebar
    this.checkCollapsed();
    this.observer = new MutationObserver(() => this.checkCollapsed());
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) this.observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
  },
  beforeUnmount() {
    if (this.observer) this.observer.disconnect();
  },
  methods: {
    checkCollapsed() {
      const sidebar = document.querySelector('.sidebar');
      this.sidebarCollapsed = sidebar?.classList.contains('collapsed') || false;
    },
  },
};
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary, #0a0f1e);
  position: relative;
  z-index: 1;
}

.layout-main {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  transition: margin-left .3s cubic-bezier(.4, 0, .2, 1);
}

.layout-main.sb-collapsed {
  margin-left: 72px;
}

/* Transition de contenu */
.page-content-enter-active {
  animation: contentIn 0.3s ease both;
}
.page-content-leave-active {
  animation: contentOut 0.15s ease both;
}
@keyframes contentIn {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes contentOut {
  to { opacity: 0; }
}

@media (max-width: 768px) {
  .layout-main { margin-left: 72px; }
}
</style>