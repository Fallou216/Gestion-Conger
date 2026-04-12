const User = require('../models/User');
const Conge = require('../models/Conge');

/**
 * Recalcule le solde de congés d'un employé selon le droit sénégalais.
 * 
 * Règle : 2 jours ouvrables / mois de service effectif
 * Le solde = droits acquis - jours consommés (approuvés)
 * 
 * Période de référence : 12 mois de travail
 */
async function recalculerSolde(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || user.role === 'admin') return;

    // Droit annuel selon ancienneté + mère de famille
    const droitAnnuel = user.calculerDroitAnnuel();

    // Calculer les mois de service depuis la création du compte
    const dateCreation = new Date(user.createdAt || Date.now());
    const now = new Date();
    const moisService = Math.floor((now - dateCreation) / (30.44 * 24 * 60 * 60 * 1000));

    // Pour les années complètes : droitAnnuel × nombre d'années
    const anneesCompletes = Math.floor(moisService / 12);
    const moisRestants = moisService % 12;
    const droitsAcquis = (anneesCompletes * droitAnnuel) + Math.min(moisRestants * 2, droitAnnuel);

    // Jours consommés (congés annuels approuvés uniquement — exceptionnels non déductibles)
    const congesApprouves = await Conge.find({
      employe: userId,
      statut: 'approuvé',
      categorie: { $ne: 'exceptionnel' }
    });

    const joursConsommes = congesApprouves.reduce((total, c) => total + (c.dureeJours || 0), 0);

    // Solde = droits acquis - jours consommés
    const solde = Math.max(0, droitsAcquis - joursConsommes);

    // Mettre à jour le solde
    await User.findByIdAndUpdate(userId, { soldeConges: solde });

    return {
      droitAnnuel,
      droitsAcquis,
      joursConsommes,
      solde,
      moisService,
      anneesCompletes,
      dateCreation,
    };
  } catch (err) {
    console.error('Erreur recalcul solde :', err.message);
    return null;
  }
}

/**
 * Recalcule le solde de tous les employés
 */
async function recalculerTousLesSoldes() {
  try {
    const employes = await User.find({ role: 'employe' });
    for (const emp of employes) {
      await recalculerSolde(emp._id);
    }
    console.log(`✅ Soldes recalculés pour ${employes.length} employé(s)`);
  } catch (err) {
    console.error('Erreur recalcul tous soldes :', err.message);
  }
}

module.exports = { recalculerSolde, recalculerTousLesSoldes };