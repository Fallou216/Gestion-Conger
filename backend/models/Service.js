const mongoose = require('mongoose');

/**
 * 🔹 Modèle de données pour un Service
 * Chaque service a un nom unique (ex: RH, IT, Comptabilité, etc.)
 */
const serviceSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du service est requis'],
    unique: true, // Assure qu'il n'y ait pas deux services avec le même nom
    trim: true
  }
});

module.exports = mongoose.model('Service', serviceSchema);
