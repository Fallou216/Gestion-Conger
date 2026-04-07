const User = require('../models/User');
const { sendWelcomeEmail } = require('../services/emailService');

// ✅ Lister tous les utilisateurs (admin + responsable)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('service', 'nom')
      .select('-motDePasse')
      .sort({ role: 1, nom: 1 });
    res.json(users);
  } catch (err) {
    console.error('Erreur getAllUsers :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Créer un utilisateur (admin uniquement — peut créer responsable OU employe)
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, role, service } = req.body;

    // Seul l'admin peut créer des comptes
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seul l\'admin peut créer des comptes.' });
    }

    // L'admin ne peut pas créer un autre admin
    if (role === 'admin') {
      return res.status(403).json({ message: 'Impossible de créer un compte admin.' });
    }

    if (!['employe', 'responsable'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email déjà utilisé.' });
    }

    const user = new User({
      nom,
      prenom,
      email,
      motDePasse,
      role,
      service: service || undefined
    });

    await user.save();

    // 📧 Email de bienvenue
    sendWelcomeEmail(user);

    res.status(201).json({ message: `${role === 'responsable' ? 'Responsable' : 'Employé'} créé avec succès.` });
  } catch (err) {
    console.error('Erreur createUser :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Modifier un utilisateur (admin uniquement)
exports.updateUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seul l\'admin peut modifier les comptes.' });
    }

    const { id } = req.params;
    const { nom, prenom, email, role, service } = req.body;

    // Empêcher de changer un rôle en admin
    if (role === 'admin') {
      return res.status(403).json({ message: 'Impossible d\'attribuer le rôle admin.' });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { nom, prenom, email, role, service: service || undefined },
      { new: true }
    ).select('-motDePasse').populate('service', 'nom');

    if (!updated) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Erreur updateUser :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Supprimer un utilisateur (admin uniquement)
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seul l\'admin peut supprimer des comptes.' });
    }

    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Empêcher la suppression d'un admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de supprimer le compte admin.' });
    }

    await user.deleteOne();
    res.json({ message: 'Utilisateur supprimé.' });
  } catch (err) {
    console.error('Erreur deleteUser :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};