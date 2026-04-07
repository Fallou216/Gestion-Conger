const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier si l'utilisateur est connecté
exports.auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Vérifie si un token est présent dans le header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non autorisé, token manquant.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-motDePasse');
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide.' });
  }
};

// Middleware pour vérifier le rôle de l'utilisateur
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit.' });
    }
    next();
  };
};
