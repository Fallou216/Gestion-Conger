const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendPasswordChangedEmail
} = require('../services/emailService');

// Fonction pour générer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// ✅ Inscription (register) — UNIQUEMENT pour les employés
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, service } = req.body;

    // Vérifie si l'email existe déjà
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email déjà utilisé.' });
    }

    // Création — rôle forcé à 'employe' (sécurité)
    const user = new User({
      nom,
      prenom,
      email,
      motDePasse,
      role: 'employe',
      service: service || undefined
    });

    await user.save();

    // 📧 Envoyer email de bienvenue
    sendWelcomeEmail(user);

    return res.status(201).json({ message: 'Compte créé avec succès.' });
  } catch (err) {
    console.error('Erreur register :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Connexion (login)
exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(motDePasse))) {
      return res.status(400).json({ message: 'Email ou mot de passe invalide.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Erreur login :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Mot de passe oublié — envoie un lien de réinitialisation par email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // On ne révèle pas si l'email existe ou non (sécurité)
      return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    // Générer un token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Sauvegarder dans la base
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save({ validateBeforeSave: false });

    // 📧 Envoyer l'email de reset
    await sendResetPasswordEmail(user, resetToken);

    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (err) {
    console.error('Erreur forgotPassword :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Réinitialiser le mot de passe avec le token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { motDePasse } = req.body;

    if (!motDePasse || motDePasse.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    // Hasher le token reçu pour le comparer
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Lien invalide ou expiré. Veuillez refaire une demande.' });
    }

    // Mettre à jour le mot de passe
    user.motDePasse = motDePasse;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // 📧 Envoyer email de confirmation
    sendPasswordChangedEmail(user);

    res.json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' });
  } catch (err) {
    console.error('Erreur resetPassword :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};