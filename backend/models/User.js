const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schéma utilisateur
const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  motDePasse: {
    type: String,
    required: true
  },
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
  // ── Champs pour la réinitialisation du mot de passe ──
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
});

// 🔐 Hashage automatique du mot de passe avant enregistrement
userSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) return next();
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
  next();
});

// 🔐 Comparaison du mot de passe saisi avec le hash
userSchema.methods.comparePassword = function (motDePasse) {
  return bcrypt.compare(motDePasse, this.motDePasse);
};

module.exports = mongoose.model('User', userSchema);