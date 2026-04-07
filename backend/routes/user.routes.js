const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const { auth, authorizeRoles } = require('../middleware/auth');

// 📌 Lister tous les utilisateurs (admin + responsable)
router.get('/', auth, authorizeRoles('admin', 'responsable'), getAllUsers);

// 📌 Créer un utilisateur (admin uniquement)
router.post('/', auth, authorizeRoles('admin'), createUser);

// 📌 Modifier un utilisateur (admin uniquement)
router.put('/:id', auth, authorizeRoles('admin'), updateUser);

// 📌 Supprimer un utilisateur (admin uniquement)
router.delete('/:id', auth, authorizeRoles('admin'), deleteUser);

module.exports = router;