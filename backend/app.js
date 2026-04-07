const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const seedAdmin = require('./config/seedAdmin');

// 🔹 Charger les variables d'environnement
dotenv.config();

const app = express();

// 🔹 Middlewares globaux
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// 🔹 Pour servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 Connexion à MongoDB + création admin par défaut
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ MongoDB connecté');
  await seedAdmin();
})
.catch(err => {
  console.error('❌ Erreur de connexion MongoDB :', err.message);
  process.exit(1);
});

// 🔹 Routes importées
const authRoutes = require('./routes/auth.routes');
const serviceRoutes = require('./routes/service.routes');
const userRoutes = require('./routes/user.routes');
const congeRoutes = require('./routes/conge.routes');

// 🔹 Définition des routes API
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conges', congeRoutes);

// 🔹 Route test
app.get('/api/ping', (req, res) => {
  res.send('✅ API opérationnelle');
});

// 🔹 Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});