const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'responsable', 'employe'],
    default: 'employe'
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: false
  },

  // ── Champs spécifiques droit du travail Sénégal ──
  dateNaissance: {
    type: Date,
    default: null
  },
  // Nombre d'enfants de moins de 14 ans (pour mères de famille)
  nbEnfantsMoins14: {
    type: Number,
    default: 0
  },
  // Est-ce une mère de famille (pour les congés supplémentaires)
  isMere: {
    type: Boolean,
    default: false
  },

  // ── Solde de congés (calculé automatiquement) ──
  soldeConges: {
    type: Number,
    default: 0
  },

  // ── Photo de profil ──
  photo: {
    type: String,
    default: null
  },

  // ── Reset password ──
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true }); // ← ajoute createdAt et updatedAt automatiquement

// 🔐 Hashage automatique du mot de passe
userSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) return next();
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
  next();
});

userSchema.methods.comparePassword = function (motDePasse) {
  return bcrypt.compare(motDePasse, this.motDePasse);
};

/**
 * Calcule le droit annuel de congés selon le Code du Travail du Sénégal
 * - Base : 2 jours ouvrables / mois = 24 jours / an
 * - Ancienneté depuis la création du compte : +1j (10 ans), +2j (15 ans), +3j (20 ans), +7j (25 ans)
 * - Mères : +1j / enfant < 14 ans
 */
userSchema.methods.calculerDroitAnnuel = function () {
  let droitBase = 24;

  // Ancienneté basée sur createdAt (date de création du compte)
  const dateRef = this.createdAt || new Date();
  const now = new Date();
  const annees = Math.floor((now - new Date(dateRef)) / (365.25 * 24 * 60 * 60 * 1000));

  if (annees >= 25) droitBase += 7;
  else if (annees >= 20) droitBase += 3;
  else if (annees >= 15) droitBase += 2;
  else if (annees >= 10) droitBase += 1;

  // Congés supplémentaires mères de famille
  if (this.isMere && this.nbEnfantsMoins14 > 0) {
    droitBase += this.nbEnfantsMoins14;
  }

  return droitBase;
};

module.exports = mongoose.model('User', userSchema);