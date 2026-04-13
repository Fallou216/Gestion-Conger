<template>
  <div id="app">
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style>
#app {
  min-height: 100vh;
  position: relative;
}

.bg-glow {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(120px);
  opacity: 0.03;
}
.bg-glow-1 {
  width: 600px; height: 600px;
  background: #4f46e5;
  top: -200px; right: -200px;
  animation: bgFloat 20s ease-in-out infinite;
}
.bg-glow-2 {
  width: 500px; height: 500px;
  background: #7c3aed;
  bottom: -150px; left: -150px;
  animation: bgFloat 25s ease-in-out infinite reverse;
}
@keyframes bgFloat {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(30px, -20px); }
  50% { transform: translate(-20px, 30px); }
  75% { transform: translate(20px, 20px); }
}
</style>