const express = require('express');
const router = express.Router();
const {
  createService,
  getServices,
  updateService,
  deleteService
} = require('../controllers/serviceController');

const { auth, authorizeRoles } = require('../middleware/auth');

// 🔓 GET — public (utilisé pendant l'inscription)
router.get('/', getServices);

// 🔐 POST — admin uniquement
router.post('/', auth, authorizeRoles('admin'), createService);

// 🔐 PUT — admin uniquement
router.put('/:id', auth, authorizeRoles('admin'), updateService);

// 🔐 DELETE — admin uniquement
router.delete('/:id', auth, authorizeRoles('admin'), deleteService);

module.exports = router;