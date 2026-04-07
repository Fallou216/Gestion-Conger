// config/db.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Charger les variables d’environnement depuis le fichier .env
dotenv.config();

// Fonction de connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connexion à MongoDB réussie');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB :', error.message);
    process.exit(1); // Quitter le processus en cas d’échec
  }
};

module.exports = connectDB;
