const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { logAction } = require('../services/activityService');

// ✅ Voir mon profil
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-motDePasse -resetPasswordToken -resetPasswordExpires')
      .populate('service', 'nom');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json(user);
  } catch (err) {
    console.error('Erreur getProfile :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Modifier mon profil (nom, prénom, email)
exports.updateProfile = async (req, res) => {
  try {
    const { nom, prenom, email } = req.body;

    // Vérifier si l'email est déjà pris par un autre utilisateur
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
      }
    }

    const updateData = {};
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true })
      .select('-motDePasse -resetPasswordToken -resetPasswordExpires')
      .populate('service', 'nom');

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    logAction(req.user.id, 'profil_modifie', `Profil mis à jour : ${user.prenom} ${user.nom}`, '', req);

    res.json({ message: 'Profil mis à jour avec succès.', user });
  } catch (err) {
    console.error('Erreur updateProfile :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Changer mon mot de passe
exports.changePassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs.' });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    // Vérifier l'ancien mot de passe
    const isMatch = await user.comparePassword(ancienMotDePasse);
    if (!isMatch) {
      return res.status(400).json({ message: 'Ancien mot de passe incorrect.' });
    }

    // Mettre à jour
    user.motDePasse = nouveauMotDePasse;
    await user.save();

    logAction(req.user.id, 'mot_de_passe_change', 'Mot de passe modifié', '', req);

    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    console.error('Erreur changePassword :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Upload photo de profil
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    // Supprimer l'ancienne photo si elle existe
    if (user.photo) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'photos', user.photo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.photo = req.file.filename;
    await user.save({ validateBeforeSave: false });

    logAction(req.user.id, 'photo_uploadee', 'Photo de profil mise à jour', '', req);

    res.json({ message: 'Photo mise à jour.', photo: user.photo });
  } catch (err) {
    console.error('Erreur uploadPhoto :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Supprimer ma photo de profil
exports.deletePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    if (user.photo) {
      const filePath = path.join(__dirname, '..', 'uploads', 'photos', user.photo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      user.photo = null;
      await user.save({ validateBeforeSave: false });
    }

    logAction(req.user.id, 'photo_supprimee', 'Photo de profil supprimée', '', req);

    res.json({ message: 'Photo supprimée.' });
  } catch (err) {
    console.error('Erreur deletePhoto :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};