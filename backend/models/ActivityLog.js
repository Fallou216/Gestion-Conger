const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'connexion',
      'inscription',
      'deconnexion',
      'demande_creee',
      'demande_approuvee',
      'demande_refusee',
      'demande_supprimee',
      'demande_supprimee_admin',
      'profil_modifie',
      'mot_de_passe_change',
      'photo_uploadee',
      'photo_supprimee',
      'utilisateur_cree',
      'utilisateur_modifie',
      'utilisateur_supprime',
      'service_cree',
      'service_modifie',
      'service_supprime',
      'export_excel',
      'export_pdf',
    ],
    required: true
  },
  details: { type: String, default: '' },
  cible: { type: String, default: '' }, // nom de l'élément concerné
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

activityLogSchema.index({ utilisateur: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);