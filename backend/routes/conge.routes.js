const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  creerConge, mesConges, monSolde, tousLesConges,
  changerStatut, supprimerConge, responsableSupprimerConge
} = require('../controllers/congeController');

const { auth, authorizeRoles } = require('../middleware/auth');

// 📦 Configuration multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage });

// 📌 EMPLOYÉ
router.post('/', auth, authorizeRoles('employe'), upload.single('fichier'), creerConge);
router.get('/mes', auth, authorizeRoles('employe'), mesConges);
router.get('/solde', auth, authorizeRoles('employe'), monSolde);
router.delete('/:id', auth, authorizeRoles('employe'), supprimerConge);

// 📌 RESPONSABLE + ADMIN
router.get('/', auth, authorizeRoles('responsable', 'admin'), tousLesConges);
router.put('/:id', auth, authorizeRoles('responsable', 'admin'), changerStatut);
router.delete('/admin/:id', auth, authorizeRoles('responsable', 'admin'), responsableSupprimerConge);

module.exports = router;