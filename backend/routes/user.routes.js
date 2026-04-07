const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const { auth, authorizeRoles } = require('../middleware/auth');

// 📌 Tous les utilisateurs (GET) – réservé aux responsables
router.get('/', auth, authorizeRoles('responsable'), getAllUsers);

// 📌 Créer un utilisateur (POST) – réservé aux responsables
router.post('/', auth, authorizeRoles('responsable'), createUser);

// 📌 Modifier un utilisateur (PUT) – réservé aux responsables
router.put('/:id', auth, authorizeRoles('responsable'), updateUser);

// 📌 Supprimer un utilisateur (DELETE) – réservé aux responsables
router.delete('/:id', auth, authorizeRoles('responsable'), deleteUser);

module.exports = router;
