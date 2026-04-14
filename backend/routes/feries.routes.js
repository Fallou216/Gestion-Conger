const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { calculerJoursOuvrables, joursFeriesDansPeriode, getJoursFeries } = require('../services/joursFeries');

// ✅ Calculer les jours ouvrables entre 2 dates
router.get('/calculer', auth, (req, res) => {
  try {
    const { dateDebut, dateFin } = req.query;
    if (!dateDebut || !dateFin) return res.status(400).json({ message: 'dateDebut et dateFin requis.' });

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    if (fin < debut) return res.status(400).json({ message: 'Date fin avant date début.' });

    const joursOuvrables = calculerJoursOuvrables(debut, fin);
    const joursCalendaires = Math.round((fin - debut) / 86400000) + 1;
    const feries = joursFeriesDansPeriode(debut, fin);

    let dimanches = 0;
    const cur = new Date(debut);
    while (cur <= fin) { if (cur.getDay() === 0) dimanches++; cur.setDate(cur.getDate() + 1); }

    res.json({
      joursOuvrables, joursCalendaires, dimanches,
      joursFeries: feries.map(f => ({ date: f.date.toISOString().split('T')[0], nom: f.nom })),
      nbFeriesExclus: feries.length,
      totalExclus: dimanches + feries.length
    });
  } catch (err) {
    console.error('Erreur calcul jours ouvrables :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ✅ Liste des jours fériés d'une année
router.get('/liste/:annee', auth, (req, res) => {
  try {
    const annee = parseInt(req.params.annee);
    if (!annee || annee < 2020 || annee > 2030) return res.status(400).json({ message: 'Année invalide.' });

    const feries = getJoursFeries(annee);
    res.json(feries.map(f => ({
      date: f.date.toISOString().split('T')[0],
      nom: f.nom,
      jour: f.date.toLocaleDateString('fr-FR', { weekday: 'long' })
    })));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;