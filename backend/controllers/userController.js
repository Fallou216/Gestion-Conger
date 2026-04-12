const User = require('../models/User');
const { sendWelcomeEmail } = require('../services/emailService');
const { recalculerSolde } = require('../services/soldeService');

// ✅ Lister tous les utilisateurs
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

// ✅ Créer un utilisateur (admin uniquement)
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, role, service, nbEnfantsMoins14, isMere } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seul l\'admin peut créer des comptes.' });
    }
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
      nom, prenom, email, motDePasse, role,
      service: service || undefined,
      nbEnfantsMoins14: nbEnfantsMoins14 || 0,
      isMere: isMere || false,
    });

    await user.save();

    // Calculer le solde initial
    await recalculerSolde(user._id);

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
    const { nom, prenom, email, role, service, nbEnfantsMoins14, isMere } = req.body;

    if (role === 'admin') {
      return res.status(403).json({ message: 'Impossible d\'attribuer le rôle admin.' });
    }

    const updateData = { nom, prenom, email, role, service: service || undefined };
    if (nbEnfantsMoins14 !== undefined) updateData.nbEnfantsMoins14 = nbEnfantsMoins14;
    if (isMere !== undefined) updateData.isMere = isMere;

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select('-motDePasse').populate('service', 'nom');

    if (!updated) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Recalculer le solde après modification
    await recalculerSolde(id);

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

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
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