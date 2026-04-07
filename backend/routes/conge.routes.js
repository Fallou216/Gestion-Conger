const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  creerConge,
  mesConges,
  tousLesConges,
  changerStatut,
  supprimerConge,
  responsableSupprimerConge
} = require('../controllers/congeController');

const { auth, authorizeRoles } = require('../middleware/auth');

// 📦 Configuration multer pour upload de fichier (facultatif)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// 📌 EMPLOYÉ

// Créer une demande avec pièce jointe facultative
router.post('/', auth, authorizeRoles('employe'), upload.single('fichier'), creerConge);

// Voir ses propres demandes
router.get('/mes', auth, authorizeRoles('employe'), mesConges);

// Supprimer une de ses propres demandes
router.delete('/:id', auth, authorizeRoles('employe'), supprimerConge);

// 📌 RESPONSABLE

// Voir toutes les demandes
router.get('/', auth, authorizeRoles('responsable'), tousLesConges);

// Changer le statut (approuvé / refusé)
router.put('/:id', auth, authorizeRoles('responsable'), changerStatut);

// Supprimer une demande (même approuvée/refusée)
router.delete('/admin/:id', auth, authorizeRoles('responsable'), responsableSupprimerConge);

module.exports = router;
