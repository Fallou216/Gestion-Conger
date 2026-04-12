const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  getProfile,
  updateProfile,
  changePassword,
  uploadPhoto,
  deletePhoto
} = require('../controllers/profileController');

const { auth } = require('../middleware/auth');

// 📁 Créer le dossier photos s'il n'existe pas
const photosDir = path.join(__dirname, '..', 'uploads', 'photos');
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}

// 📦 Multer pour les photos de profil
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, photosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo-${req.user.id}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Format non autorisé. Utilisez JPG, PNG ou WebP.'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }); // Max 2 Mo

// 📌 Routes
router.get('/', auth, getProfile);
router.put('/', auth, updateProfile);
router.put('/password', auth, changePassword);
router.post('/photo', auth, upload.single('photo'), uploadPhoto);
router.delete('/photo', auth, deletePhoto);

module.exports = router;