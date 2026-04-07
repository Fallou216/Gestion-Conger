const User = require('../models/User');

// ✅ Lister tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('service', 'nom') // Inclut le nom du service associé
      .select('-motDePasse');     // Ne retourne jamais le mot de passe
    res.json(users);
  } catch (err) {
    console.error('Erreur getAllUsers :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Créer un nouvel utilisateur (utilisé par les admins/responsables)
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, role, service } = req.body;

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
      service: service || undefined // Service facultatif
    });

    await user.save();

    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (err) {
    console.error('Erreur createUser :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Modifier un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, role, service } = req.body;

    const updated = await User.findByIdAndUpdate(
      id,
      {
        nom,
        prenom,
        email,
        role,
        service: service || undefined
      },
      { new: true }
    ).select('-motDePasse');

    if (!updated) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Erreur updateUser :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.json({ message: 'Utilisateur supprimé.' });
  } catch (err) {
    console.error('Erreur deleteUser :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
