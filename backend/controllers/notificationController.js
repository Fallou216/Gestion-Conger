const Notification = require('../models/Notification');

// ✅ Mes notifications (paginées)
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ destinataire: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ destinataire: req.user.id });

    res.json({ notifications, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Erreur getNotifications :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Compter les non lues
exports.countNonLues = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      destinataire: req.user.id,
      lue: false
    });
    res.json({ count });
  } catch (err) {
    console.error('Erreur countNonLues :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Marquer une notification comme lue
exports.marquerLue = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, destinataire: req.user.id },
      { lue: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification non trouvée.' });
    res.json(notif);
  } catch (err) {
    console.error('Erreur marquerLue :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Tout marquer comme lu
exports.toutMarquerLu = async (req, res) => {
  try {
    await Notification.updateMany(
      { destinataire: req.user.id, lue: false },
      { lue: true }
    );
    res.json({ message: 'Toutes les notifications ont été marquées comme lues.' });
  } catch (err) {
    console.error('Erreur toutMarquerLu :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Supprimer une notification
exports.supprimerNotification = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id: req.params.id,
      destinataire: req.user.id
    });
    if (!notif) return res.status(404).json({ message: 'Notification non trouvée.' });
    res.json({ message: 'Notification supprimée.' });
  } catch (err) {
    console.error('Erreur supprimerNotification :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};