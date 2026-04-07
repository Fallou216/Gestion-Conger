const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 📁 Créer le dossier "uploads" s'il n'existe pas
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// 🗂️ Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const nomFichier = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, nomFichier);
  }
});

// 🛡️ Filtrage des types de fichiers (facultatif)
const fileFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

// 📦 Exporter le middleware prêt à l'emploi
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // max 5 Mo
});

module.exports = upload;
