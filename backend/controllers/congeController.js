const Conge = require('../models/Conge');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const {
  sendNewRequestEmail,
  sendStatusChangeEmail,
  sendDeletedByAdminEmail
} = require('../services/emailService');

// ✅ EMPLOYÉ : Créer une demande de congé + notifier les responsables
exports.creerConge = async (req, res) => {
  try {
    const { dateDebut, dateFin, motif } = req.body;
    const fichier = req.file ? req.file.filename : null;

    // Validation : pas plus de 30 jours
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const duree = (fin - debut) / (1000 * 60 * 60 * 24);

    if (duree > 30) {
      return res.status(400).json({ message: 'Les congés ne peuvent pas dépasser 30 jours.' });
    }

    const nouveauConge = new Conge({
      employe: req.user.id,
      dateDebut,
      dateFin,
      motif,
      fichier
    });

    await nouveauConge.save();

    // 📧 Notifier tous les responsables
    try {
      const employe = await User.findById(req.user.id);
      const responsables = await User.find({ role: 'responsable' }).select('email nom prenom');
      if (responsables.length > 0 && employe) {
        sendNewRequestEmail(employe, nouveauConge, responsables);
      }
    } catch (emailErr) {
      console.error('Erreur notification email :', emailErr.message);
    }

    res.status(201).json(nouveauConge);
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

// ✅ EMPLOYÉ : Supprimer une demande personnelle
exports.supprimerConge = async (req, res) => {
  try {
    const conge = await Conge.findOne({ _id: req.params.id, employe: req.user.id });
    if (!conge) {
      return res.status(404).json({ message: 'Demande non trouvée ou non autorisée.' });
    }

    // Supprimer le fichier s'il existe
    if (conge.fichier) {
      const filePath = path.join(__dirname, '..', 'uploads', conge.fichier);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await conge.deleteOne();
    res.json({ message: 'Demande supprimée.' });
  } catch (err) {
    console.error('Erreur suppression congé :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ RESPONSABLE : Voir toutes les demandes
exports.tousLesConges = async (req, res) => {
  try {
    const conges = await Conge.find()
      .populate('employe', 'nom prenom email')
      .sort({ dateDemande: -1 });
    res.json(conges);
  } catch (err) {
    console.error('Erreur tousLesConges :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ RESPONSABLE : Changer le statut + notifier l'employé par email
exports.changerStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['approuvé', 'refusé'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const conge = await Conge.findByIdAndUpdate(id, { statut }, { new: true }).populate('employe', 'nom prenom email');
    if (!conge) {
      return res.status(404).json({ message: 'Demande non trouvée.' });
    }

    // 📧 Notifier l'employé
    try {
      if (conge.employe) {
        sendStatusChangeEmail(conge.employe, conge, statut);
      }
    } catch (emailErr) {
      console.error('Erreur notification email statut :', emailErr.message);
    }

    res.json(conge);
  } catch (err) {
    console.error('Erreur changement statut :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ RESPONSABLE : Supprimer n'importe quelle demande + notifier l'employé
exports.responsableSupprimerConge = async (req, res) => {
  try {
    const conge = await Conge.findById(req.params.id).populate('employe', 'nom prenom email');
    if (!conge) return res.status(404).json({ message: 'Demande non trouvée.' });

    // 📧 Notifier l'employé avant suppression
    try {
      if (conge.employe) {
        sendDeletedByAdminEmail(conge.employe, conge);
      }
    } catch (emailErr) {
      console.error('Erreur notification email suppression :', emailErr.message);
    }

    if (conge.fichier) {
      const filePath = path.join(__dirname, '..', 'uploads', conge.fichier);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await conge.deleteOne();
    res.json({ message: 'Demande supprimée par le responsable.' });
  } catch (err) {
    console.error('Erreur responsable suppression congé :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};