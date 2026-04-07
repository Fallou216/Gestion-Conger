const User = require('../models/User');

/**
 * Crée un compte Admin par défaut s'il n'en existe pas encore.
 * Email : admin@congespro.com
 * Mot de passe : Admin@2026
 */
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('✅ Compte admin existant :', adminExists.email);
      return;
    }

    const admin = new User({
      nom: 'Admin',
      prenom: 'Super',
      email: 'falloudioum216@gmail.com',
      motDePasse: 'Fallou@2026',
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Compte admin créé : falloudioum216@gmail.com / Fallou@2026');
  } catch (err) {
    console.error('❌ Erreur création admin :', err.message);
  }
};

module.exports = seedAdmin;