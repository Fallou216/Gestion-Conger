const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'nouvelle_demande',      // → responsable/admin
      'demande_approuvee',     // → employé
      'demande_refusee',       // → employé
      'demande_supprimee',     // → employé
      'bienvenue',             // → nouvel utilisateur
      'rappel_fin_conge',      // → employé
      'conge_termine',         // → employé
      'info'                   // → général
    ],
    required: true
  },
  titre: { type: String, required: true },
  message: { type: String, required: true },
  lue: { type: Boolean, default: false },
  lien: { type: String, default: '' },
  // Référence optionnelle au congé concerné
  conge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conge',
    default: null
  }
}, { timestamps: true });

// Index pour les requêtes fréquentes
notificationSchema.index({ destinataire: 1, lue: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);