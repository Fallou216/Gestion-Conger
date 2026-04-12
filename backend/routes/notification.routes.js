const express = require('express');
const router = express.Router();

const {
  getNotifications,
  countNonLues,
  marquerLue,
  toutMarquerLu,
  supprimerNotification
} = require('../controllers/notificationController');

const { auth } = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.get('/count', auth, countNonLues);
router.put('/lire-tout', auth, toutMarquerLu);
router.put('/:id/lire', auth, marquerLue);
router.delete('/:id', auth, supprimerNotification);

module.exports = router;