const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Crée une notification pour un utilisateur
 */
async function creerNotification({ destinataire, type, titre, message, lien, conge }) {
  try {
    const notif = new Notification({
      destinataire,
      type,
      titre,
      message,
      lien: lien || '',
      conge: conge || null
    });
    await notif.save();
    return notif;
  } catch (err) {
    console.error('Erreur création notification :', err.message);
  }
}

/**
 * Notifier les responsables et admin d'une nouvelle demande
 */
async function notifierNouvelleDemande(employe, conge) {
  try {
    const gestionnaires = await User.find({ role: { $in: ['responsable', 'admin'] } }).select('_id');
    for (const g of gestionnaires) {
      await creerNotification({
        destinataire: g._id,
        type: 'nouvelle_demande',
        titre: 'Nouvelle demande de congé',
        message: `${employe.prenom} ${employe.nom} a soumis une demande de congé.`,
        lien: '/admin/demandes',
        conge: conge._id
      });
    }
  } catch (err) {
    console.error('Erreur notif nouvelle demande :', err.message);
  }
}

/**
 * Notifier l'employé du changement de statut
 */
async function notifierChangementStatut(employe, conge, statut) {
  try {
    const isOk = statut === 'approuvé';
    const role = (await User.findById(employe._id || employe))?.role || 'employe';
    const lien = role === 'employe' ? '/employe/mes-demandes' : '/responsable/demandes';

    await creerNotification({
      destinataire: employe._id || employe,
      type: isOk ? 'demande_approuvee' : 'demande_refusee',
      titre: isOk ? 'Demande approuvée ✅' : 'Demande refusée ❌',
      message: isOk
        ? 'Votre demande de congé a été approuvée. Bon congé !'
        : 'Votre demande de congé a été refusée.',
      lien,
      conge: conge._id
    });
  } catch (err) {
    console.error('Erreur notif changement statut :', err.message);
  }
}

/**
 * Notifier l'employé de la suppression de sa demande
 */
async function notifierSuppression(employe, conge) {
  try {
    await creerNotification({
      destinataire: employe._id || employe,
      type: 'demande_supprimee',
      titre: 'Demande supprimée 🗑️',
      message: 'Votre demande de congé a été supprimée par un responsable.',
      lien: '/employe/mes-demandes',
      conge: conge._id
    });
  } catch (err) {
    console.error('Erreur notif suppression :', err.message);
  }
}

/**
 * Notification de bienvenue
 */
async function notifierBienvenue(userId) {
  try {
    await creerNotification({
      destinataire: userId,
      type: 'bienvenue',
      titre: 'Bienvenue sur CongesPro ! 🎉',
      message: 'Votre compte a été créé avec succès. Vous pouvez maintenant soumettre vos demandes de congés.',
      lien: '/employe/dashboard'
    });
  } catch (err) {
    console.error('Erreur notif bienvenue :', err.message);
  }
}

/**
 * Notification rappel fin de congé
 */
async function notifierRappelFinConge(employeId, conge, joursRestants) {
  try {
    await creerNotification({
      destinataire: employeId,
      type: 'rappel_fin_conge',
      titre: `Congé se termine dans ${joursRestants}j ⏰`,
      message: `Votre congé se termine dans ${joursRestants} jour(s). Préparez votre retour !`,
      lien: '/employe/dashboard',
      conge: conge._id
    });
  } catch (err) {
    console.error('Erreur notif rappel :', err.message);
  }
}

/**
 * Notification congé terminé
 */
async function notifierCongeTermine(employeId, conge) {
  try {
    await creerNotification({
      destinataire: employeId,
      type: 'conge_termine',
      titre: 'Congé terminé — Bon retour ! ✅',
      message: 'Votre période de congé est terminée. Bienvenue !',
      lien: '/employe/dashboard',
      conge: conge._id
    });
  } catch (err) {
    console.error('Erreur notif congé terminé :', err.message);
  }
}

module.exports = {
  creerNotification,
  notifierNouvelleDemande,
  notifierChangementStatut,
  notifierSuppression,
  notifierBienvenue,
  notifierRappelFinConge,
  notifierCongeTermine
};