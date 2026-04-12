const mongoose = require('mongoose');

const congeSchema = new mongoose.Schema({
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  motif: { type: String, required: false, default: '' },

  // ── Catégorie de congé ──
  categorie: {
    type: String,
    enum: ['annuel', 'exceptionnel', 'autre'],
    default: 'annuel'
  },

  // ── Sous-type pour congés annuels ──
  periodeAnnuel: {
    type: String,
    enum: ['totalite', 'partie', 'matinee', 'apres_midi', 'journee'],
    default: 'totalite'
  },

  // ── Sous-type pour congés exceptionnels (non déductibles) ──
  motifExceptionnel: {
    type: String,
    enum: [
      'mariage_employe',           // 3 jours
      'mariage_enfant_frere_soeur', // 1 jour
      'deces_conjoint_descendant',  // 5 jours
      'deces_ascendant_frere_soeur', // 2 jours
      'deces_beau_pere_belle_mere', // 2 jours
      'naissance_enfant',           // 1 jour
      'bapteme_enfant',             // 1 jour
      'premiere_communion',         // 1 jour
      'hospitalisation_famille',    // 3 jours
      ''
    ],
    default: ''
  },

  fichier: { type: String, required: false },
  statut: {
    type: String,
    enum: ['en attente', 'approuvé', 'refusé'],
    default: 'en attente'
  },
  dureeJours: { type: Number, default: 0 },
  dateDemande: { type: Date, default: Date.now },

  // ── Notifications de rappel ──
  rappelAvantFinEnvoye: { type: Boolean, default: false },
  rappelFinEnvoye: { type: Boolean, default: false }
});

// Calcul automatique de la durée en jours avant sauvegarde
congeSchema.pre('save', function (next) {
  if (this.dateDebut && this.dateFin) {
    this.dureeJours = Math.max(1, Math.round((new Date(this.dateFin) - new Date(this.dateDebut)) / 86400000) + 1);
  }
  next();
});

module.exports = mongoose.model('Conge', congeSchema);