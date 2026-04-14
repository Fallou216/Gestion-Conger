const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { auth, authorizeRoles } = require('../middleware/auth');

// ✅ Historique global (admin uniquement) — paginé + filtrable
router.get('/', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const filter = {};

    // Filtre par action
    if (req.query.action && req.query.action !== 'tous') {
      filter.action = req.query.action;
    }

    // Filtre par utilisateur
    if (req.query.utilisateur) {
      filter.utilisateur = req.query.utilisateur;
    }

    // Filtre par date
    if (req.query.dateDebut || req.query.dateFin) {
      filter.createdAt = {};
      if (req.query.dateDebut) filter.createdAt.$gte = new Date(req.query.dateDebut);
      if (req.query.dateFin) filter.createdAt.$lte = new Date(req.query.dateFin + 'T23:59:59');
    }

    const logs = await ActivityLog.find(filter)
      .populate('utilisateur', 'nom prenom email role photo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Erreur historique :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ✅ Stats des actions (admin) — pour le dashboard
router.get('/stats', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const now = new Date();
    const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const debutSemaine = new Date(debutJour);
    debutSemaine.setDate(debutSemaine.getDate() - 7);

    const actionsAujourdhui = await ActivityLog.countDocuments({ createdAt: { $gte: debutJour } });
    const actionsSemaine = await ActivityLog.countDocuments({ createdAt: { $gte: debutSemaine } });
    const totalActions = await ActivityLog.countDocuments();

    // Top actions
    const topActions = await ActivityLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Activité par jour (7 derniers jours)
    const parJour = [];
    for (let i = 6; i >= 0; i--) {
      const jour = new Date(debutJour);
      jour.setDate(jour.getDate() - i);
      const lendemain = new Date(jour);
      lendemain.setDate(lendemain.getDate() + 1);
      const count = await ActivityLog.countDocuments({
        createdAt: { $gte: jour, $lt: lendemain }
      });
      parJour.push({
        date: jour.toISOString().split('T')[0],
        jour: jour.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        count
      });
    }

    res.json({
      aujourdhui: actionsAujourdhui,
      semaine: actionsSemaine,
      total: totalActions,
      topActions,
      parJour
    });
  } catch (err) {
    console.error('Erreur stats historique :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ✅ Mon historique (tous les rôles)
router.get('/mes', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find({ utilisateur: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments({ utilisateur: req.user.id });

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;