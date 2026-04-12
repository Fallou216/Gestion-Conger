const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const seedAdmin = require('./config/seedAdmin');
const { recalculerTousLesSoldes } = require('./services/soldeService');
const { verifierRappels } = require('./services/rappelService');

dotenv.config();

const app = express();

// 🔹 Middlewares globaux
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// 🔹 Fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 Connexion MongoDB + init
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ MongoDB connecté');
  await seedAdmin();

  // Recalculer les soldes au démarrage
  await recalculerTousLesSoldes();

  // Vérifier les rappels au démarrage
  await verifierRappels();
})
.catch(err => {
  console.error('❌ Erreur de connexion MongoDB :', err.message);
  process.exit(1);
});

// 🔹 Routes
const authRoutes = require('./routes/auth.routes');
const serviceRoutes = require('./routes/service.routes');
const userRoutes = require('./routes/user.routes');
const congeRoutes = require('./routes/conge.routes');
const profileRoutes = require('./routes/profile.routes');
const notificationRoutes = require('./routes/notification.routes');
const statsRoutes = require('./routes/stats.routes');

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conges', congeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);

// 🔹 Servir les photos de profil
app.use('/uploads/photos', express.static(path.join(__dirname, 'uploads', 'photos')));

// 🔹 Route test
app.get('/api/ping', (req, res) => res.send('✅ API opérationnelle'));

// 🔹 Tâches planifiées — toutes les 12 heures
setInterval(async () => {
  console.log('🔄 Tâche planifiée : recalcul soldes + rappels');
  await recalculerTousLesSoldes();
  await verifierRappels();
}, 12 * 60 * 60 * 1000); // 12 heures

// 🔹 Démarrage
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});