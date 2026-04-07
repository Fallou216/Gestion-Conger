import axios from 'axios';

// Création d'une instance Axios avec une URL de base
const instance = axios.create({
  baseURL: 'http://localhost:5000/api' // 🔁 À adapter si ton backend est déployé ailleurs
});

// Intercepteur pour ajouter automatiquement le token JWT à chaque requête
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // 🔐 récupération du token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // ajout dans le header
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default instance;
