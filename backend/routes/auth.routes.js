const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

// ✅ Inscription
router.post('/register', register);

// ✅ Connexion
router.post('/login', login);

// ✅ Mot de passe oublié — envoie un email de reset
router.post('/forgot-password', forgotPassword);

// ✅ Réinitialiser le mot de passe avec le token
router.post('/reset-password/:token', resetPassword);

module.exports = router;