import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Fichier CSS global (animations, base, etc.)
import './assets/styles.css';

const app = createApp(App);

// Utilisation du routeur Vue
app.use(router);

// Lancement de l'application
app.mount('#app');
