const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Conge = require('../models/Conge');
const Service = require('../models/Service');
const { auth, authorizeRoles } = require('../middleware/auth');

// ✅ Stats globales pour le dashboard admin
router.get('/', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const debutAnnee = new Date(now.getFullYear(), 0, 1);

    // Compteurs utilisateurs
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalEmployes = await User.countDocuments({ role: 'employe' });
    const totalResponsables = await User.countDocuments({ role: 'responsable' });
    const totalServices = await Service.countDocuments();

    // Nouveaux inscrits ce mois
    const nouveauxCeMois = await User.countDocuments({
      role: 'employe',
      createdAt: { $gte: debutMois }
    });

    // Compteurs congés
    const totalConges = await Conge.countDocuments();
    const congesEnAttente = await Conge.countDocuments({ statut: 'en attente' });
    const congesApprouves = await Conge.countDocuments({ statut: 'approuvé' });
    const congesRefuses = await Conge.countDocuments({ statut: 'refusé' });

    // Congés ce mois
    const congesCeMois = await Conge.countDocuments({
      dateDemande: { $gte: debutMois }
    });

    // Congés en cours (approuvés et date actuelle entre début et fin)
    const congesEnCours = await Conge.countDocuments({
      statut: 'approuvé',
      dateDebut: { $lte: now },
      dateFin: { $gte: now }
    });

    // Employés en congé actuellement
    const employesEnConge = await Conge.distinct('employe', {
      statut: 'approuvé',
      dateDebut: { $lte: now },
      dateFin: { $gte: now }
    });

    // Demandes par mois (année en cours)
    const demandesParMois = [];
    for (let m = 0; m < 12; m++) {
      const debut = new Date(now.getFullYear(), m, 1);
      const fin = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59);

      const approuve = await Conge.countDocuments({ statut: 'approuvé', dateDemande: { $gte: debut, $lte: fin } });
      const attente = await Conge.countDocuments({ statut: 'en attente', dateDemande: { $gte: debut, $lte: fin } });
      const refuse = await Conge.countDocuments({ statut: 'refusé', dateDemande: { $gte: debut, $lte: fin } });

      demandesParMois.push({ mois: m, approuve, attente, refuse, total: approuve + attente + refuse });
    }

    // Top 5 employés par jours de congés approuvés
    const topEmployes = await Conge.aggregate([
      { $match: { statut: 'approuvé' } },
      { $group: { _id: '$employe', totalJours: { $sum: '$dureeJours' }, count: { $sum: 1 } } },
      { $sort: { totalJours: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { nom: '$user.nom', prenom: '$user.prenom', totalJours: 1, count: 1 } }
    ]);

    // Répartition par catégorie
    const parCategorie = await Conge.aggregate([
      { $group: { _id: '$categorie', count: { $sum: 1 } } }
    ]);

    // Répartition par service
    const parService = await User.aggregate([
      { $match: { role: 'employe', service: { $ne: null } } },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'srv' } },
      { $unwind: '$srv' },
      { $project: { nom: '$srv.nom', count: 1 } }
    ]);

    // Taux d'approbation
    const totalTraites = congesApprouves + congesRefuses;
    const tauxApprobation = totalTraites > 0 ? Math.round((congesApprouves / totalTraites) * 100) : 0;

    res.json({
      utilisateurs: { total: totalUsers, employes: totalEmployes, responsables: totalResponsables, nouveauxCeMois },
      services: { total: totalServices, repartition: parService },
      conges: {
        total: totalConges, enAttente: congesEnAttente, approuves: congesApprouves,
        refuses: congesRefuses, ceMois: congesCeMois, enCours: congesEnCours,
        employesEnConge: employesEnConge.length, tauxApprobation
      },
      demandesParMois,
      topEmployes,
      parCategorie,
    });
  } catch (err) {
    console.error('Erreur stats admin :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;