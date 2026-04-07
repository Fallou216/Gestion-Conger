const express = require('express');
const router = express.Router();
const {
  createService,
  getServices,
  updateService,
  deleteService
} = require('../controllers/serviceController');

const { auth, authorizeRoles } = require('../middleware/auth');

/**
 * 🔓 Route publique (sans auth) — utilisée pendant l’inscription
 * POST /api/services
 * Permet de créer un service si l’utilisateur en crée un lors de l’inscription
 */
router.post('/', createService);

/**
 * 🔐 GET /api/services
 * Récupère tous les services — protégé pour les utilisateurs connectés (ou public si tu préfères)
 */
router.get('/', getServices);

/**
 * 🔐 PUT /api/services/:id
 * Modifier un service (réservé aux responsables)
 */
router.put('/:id', auth, authorizeRoles('responsable'), updateService);

/**
 * 🔐 DELETE /api/services/:id
 * Supprimer un service (réservé aux responsables)
 */
router.delete('/:id', auth, authorizeRoles('responsable'), deleteService);

module.exports = router;
