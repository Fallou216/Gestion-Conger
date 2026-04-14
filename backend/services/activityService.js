const ActivityLog = require('../models/ActivityLog');

/**
 * Enregistre une action dans l'historique
 * @param {string} utilisateurId - ID de l'utilisateur
 * @param {string} action - Type d'action
 * @param {string} details - Description libre
 * @param {string} cible - Élément concerné (nom employé, service, etc.)
 * @param {object} req - Requête Express (pour IP et userAgent)
 */
async function logAction(utilisateurId, action, details = '', cible = '', req = null) {
  try {
    await ActivityLog.create({
      utilisateur: utilisateurId,
      action,
      details,
      cible,
      ip: req?.ip || req?.connection?.remoteAddress || '',
      userAgent: req?.headers?.['user-agent']?.substring(0, 200) || '',
    });
  } catch (err) {
    console.error('Erreur log activité :', err.message);
  }
}

module.exports = { logAction };