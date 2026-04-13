import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Styles globaux
import './style.css';
import './assets/animations.css';

const app = createApp(App);
app.use(router);
app.mount('#app');