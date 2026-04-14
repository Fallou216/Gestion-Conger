const Conge = require('../models/Conge');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { recalculerSolde } = require('../services/soldeService');
const {
  sendNewRequestEmail,
  sendStatusChangeEmail,
  sendDeletedByAdminEmail
} = require('../services/emailService');
const {
  notifierNouvelleDemande,
  notifierChangementStatut,
  notifierSuppression
} = require('../services/notificationService');
const { calculerJoursOuvrables, joursFeriesDansPeriode } = require('../services/joursFeries');
const { logAction } = require('../services/activityService');

// ── Durées légales des congés exceptionnels (non déductibles du solde) ──
const DUREES_EXCEPTIONNELS = {
  'mariage_employe': 3,
  'mariage_enfant_frere_soeur': 1,
  'deces_conjoint_descendant': 5,
  'deces_ascendant_frere_soeur': 2,
  'deces_beau_pere_belle_mere': 2,
  'naissance_enfant': 1,
  'bapteme_enfant': 1,
  'premiere_communion': 1,
  'hospitalisation_famille': 3,
};

// ✅ EMPLOYÉ : Créer une demande + vérifier solde + notifier responsables
exports.creerConge = async (req, res) => {
  try {
    const { dateDebut, dateFin, motif, categorie, periodeAnnuel, motifExceptionnel } = req.body;
    const fichier = req.file ? req.file.filename : null;

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (fin < debut) {
      return res.status(400).json({ message: 'La date de fin doit être après la date de début.' });
    }

    // ── Calcul jours ouvrables (exclut dimanches + jours fériés Sénégal) ──
    let dureeJours = calculerJoursOuvrables(debut, fin);
    const feriesPeriode = joursFeriesDansPeriode(debut, fin);

    const cat = categorie || 'annuel';

    // ── Congés exceptionnels : durée imposée par la loi ──
    if (cat === 'exceptionnel' && motifExceptionnel && DUREES_EXCEPTIONNELS[motifExceptionnel]) {
      const dureeLegale = DUREES_EXCEPTIONNELS[motifExceptionnel];
      if (dureeJours > dureeLegale) {
        return res.status(400).json({
          message: `Ce type de congé exceptionnel est limité à ${dureeLegale} jour(s) ouvrables selon le Code du Travail.`
        });
      }
    }

    // ── Congés annuels : vérifier le solde ──
    if (cat === 'annuel') {
      if (dureeJours > 30) {
        return res.status(400).json({ message: 'Les congés annuels ne peuvent pas dépasser 30 jours ouvrables.' });
      }
      const employe = await User.findById(req.user.id);
      if (employe && dureeJours > employe.soldeConges) {
        return res.status(400).json({
          message: `Solde insuffisant. Vous avez ${employe.soldeConges} jour(s) disponible(s) et vous demandez ${dureeJours} jour(s).`
        });
      }
    }

    // ── Demi-journées ──
    if (cat === 'annuel' && (periodeAnnuel === 'matinee' || periodeAnnuel === 'apres_midi')) {
      dureeJours = 0.5;
    }

    const nouveauConge = new Conge({
      employe: req.user.id,
      dateDebut, dateFin,
      motif: motif || '',
      categorie: cat,
      periodeAnnuel: cat === 'annuel' ? (periodeAnnuel || 'totalite') : undefined,
      motifExceptionnel: cat === 'exceptionnel' ? (motifExceptionnel || '') : undefined,
      fichier,
      dureeJours
    });

    await nouveauConge.save();

    // 📝 Log
    logAction(req.user.id, 'demande_creee', `Demande ${cat} du ${dateDebut} au ${dateFin} (${dureeJours}j)`, '', req);

    // 📧 + 🔔 Notifier les responsables et l'admin
    try {
      const employe = await User.findById(req.user.id);
      const gestionnaires = await User.find({
        role: { $in: ['responsable', 'admin'] }
      }).select('email nom prenom');
      if (gestionnaires.length > 0 && employe) {
        sendNewRequestEmail(employe, nouveauConge, gestionnaires);
        notifierNouvelleDemande(employe, nouveauConge);
      }
    } catch (emailErr) {
      console.error('Erreur notification :', emailErr.message);
    }

    res.status(201).json({
      ...nouveauConge.toObject(),
      joursOuvrables: dureeJours,
      joursFeriesExclus: feriesPeriode.map(f => ({ date: f.date, nom: f.nom })),
      nbFeriesExclus: feriesPeriode.length
    });
  } catch (err) {
    console.error('Erreur création congé :', err);
    res.status(500).json({ message: 'Erreur lors de la création du congé.' });
  }
};

// ✅ EMPLOYÉ : Voir ses propres demandes
exports.mesConges = async (req, res) => {
  try {
    const conges = await Conge.find({ employe: req.user.id }).sort({ dateDemande: -1 });
    res.json(conges);
  } catch (err) {
    console.error('Erreur mesConges :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ EMPLOYÉ : Voir son solde de congés
exports.monSolde = async (req, res) => {
  try {
    const info = await recalculerSolde(req.user.id);
    if (!info) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json(info);
  } catch (err) {
    console.error('Erreur monSolde :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ EMPLOYÉ : Supprimer une demande personnelle
exports.supprimerConge = async (req, res) => {
  try {
    const conge = await Conge.findOne({ _id: req.params.id, employe: req.user.id });
    if (!conge) return res.status(404).json({ message: 'Demande non trouvée.' });

    if (conge.fichier) {
      const filePath = path.join(__dirname, '..', 'uploads', conge.fichier);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await conge.deleteOne();

    // Recalculer le solde
    await recalculerSolde(req.user.id);

    res.json({ message: 'Demande supprimée.' });
  } catch (err) {
    console.error('Erreur suppression congé :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ RESPONSABLE/ADMIN : Voir toutes les demandes
exports.tousLesConges = async (req, res) => {
  try {
    const conges = await Conge.find()
      .populate('employe', 'nom prenom email soldeConges')
      .sort({ dateDemande: -1 });
    res.json(conges);
  } catch (err) {
    console.error('Erreur tousLesConges :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ RESPONSABLE/ADMIN : Changer statut + recalculer solde + notifier
exports.changerStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['approuvé', 'refusé'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const conge = await Conge.findByIdAndUpdate(id, { statut }, { new: true })
      .populate('employe', 'nom prenom email');
    if (!conge) return res.status(404).json({ message: 'Demande non trouvée.' });

    // Recalculer le solde de l'employé
    if (conge.employe) {
      await recalculerSolde(conge.employe._id);
    }

    // 📝 Log
    const actionType = statut === 'approuvé' ? 'demande_approuvee' : 'demande_refusee';
    logAction(req.user.id, actionType, `Demande de ${conge.employe?.prenom} ${conge.employe?.nom} ${statut}`, conge.employe?.email || '', req);

    // 📧 + 🔔 Notifier l'employé
    try {
      if (conge.employe) {
        sendStatusChangeEmail(conge.employe, conge, statut);
        notifierChangementStatut(conge.employe, conge, statut);
      }
    } catch (emailErr) {
      console.error('Erreur notification statut :', emailErr.message);
    }

    res.json(conge);
  } catch (err) {
    console.error('Erreur changement statut :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ RESPONSABLE/ADMIN : Supprimer une demande + notifier + recalculer
exports.responsableSupprimerConge = async (req, res) => {
  try {
    const conge = await Conge.findById(req.params.id).populate('employe', 'nom prenom email');
    if (!conge) return res.status(404).json({ message: 'Demande non trouvée.' });

    // 📧 + 🔔 Notifier l'employé
    try {
      if (conge.employe) {
        sendDeletedByAdminEmail(conge.employe, conge);
        notifierSuppression(conge.employe, conge);
      }
    } catch (emailErr) {
      console.error('Erreur notification suppression :', emailErr.message);
    }

    const employeId = conge.employe?._id;

    if (conge.fichier) {
      const filePath = path.join(__dirname, '..', 'uploads', conge.fichier);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await conge.deleteOne();

    // Recalculer le solde
    if (employeId) await recalculerSolde(employeId);

    // 📝 Log
    logAction(req.user.id, 'demande_supprimee_admin', `Demande de ${conge.employe?.prenom} ${conge.employe?.nom} supprimée`, conge.employe?.email || '', req);

    res.json({ message: 'Demande supprimée par le responsable.' });
  } catch (err) {
    console.error('Erreur responsable suppression congé :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};