<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style>
/* RESET GLOBAL */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* FOND GENERAL — Dark theme */
body {
  font-family: 'Sora', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #0a0f1e;
  color: #e2e8f0;
  min-height: 100vh;
}

/* CONTENEUR PRINCIPAL */
#app {
  min-height: 100vh;
}
</style>