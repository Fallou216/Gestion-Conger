const Conge = require('../models/Conge');
const User = require('../models/User');
const { sendCongeRappelEmail, sendCongeFinEmail } = require('./emailService');

/**
 * Vérifie les congés en cours et envoie des rappels :
 * - 3 jours avant la fin du congé → email de rappel
 * - Le jour de fin du congé → email de fin
 * 
 * À exécuter quotidiennement (via setInterval ou cron)
 */
async function verifierRappels() {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const dans3Jours = new Date(now);
    dans3Jours.setDate(dans3Jours.getDate() + 3);

    // ── Rappel 3 jours avant la fin ──
    const congesAvantFin = await Conge.find({
      statut: 'approuvé',
      rappelAvantFinEnvoye: false,
      dateFin: {
        $gte: now,
        $lte: dans3Jours
      }
    }).populate('employe', 'nom prenom email');

    for (const conge of congesAvantFin) {
      if (conge.employe) {
        await sendCongeRappelEmail(conge.employe, conge);
        conge.rappelAvantFinEnvoye = true;
        await conge.save();
        console.log(`📧 Rappel avant-fin envoyé à ${conge.employe.email}`);
      }
    }

    // ── Notification fin de congé (aujourd'hui) ──
    const congesFin = await Conge.find({
      statut: 'approuvé',
      rappelFinEnvoye: false,
      dateFin: {
        $gte: now,
        $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('employe', 'nom prenom email');

    for (const conge of congesFin) {
      if (conge.employe) {
        await sendCongeFinEmail(conge.employe, conge);
        conge.rappelFinEnvoye = true;
        await conge.save();
        console.log(`📧 Notification fin de congé envoyée à ${conge.employe.email}`);
      }
    }

    if (congesAvantFin.length || congesFin.length) {
      console.log(`🔔 Rappels: ${congesAvantFin.length} avant-fin, ${congesFin.length} fin`);
    }
  } catch (err) {
    console.error('❌ Erreur vérification rappels :', err.message);
  }
}

module.exports = { verifierRappels };