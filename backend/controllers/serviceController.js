const Service = require('../models/Service');
const { logAction } = require('../services/activityService');

// ✅ Créer un nouveau service
exports.createService = async (req, res) => {
  try {
    const { nom } = req.body;

    const existing = await Service.findOne({ nom: nom.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Service déjà existant.' });
    }

    const service = new Service({ nom: nom.trim() });
    await service.save();

    logAction(req.user.id, 'service_cree', `Service créé : ${nom.trim()}`, nom.trim(), req);

    res.status(201).json(service);
  } catch (err) {
    console.error('Erreur createService :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Récupérer tous les services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ nom: 1 });
    res.json(services);
  } catch (err) {
    console.error('Erreur getServices :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Mettre à jour un service
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;

    const updated = await Service.findByIdAndUpdate(
      id,
      { nom: nom.trim() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Service non trouvé.' });
    }

    logAction(req.user.id, 'service_modifie', `Service modifié : ${nom.trim()}`, nom.trim(), req);

    res.json(updated);
  } catch (err) {
    console.error('Erreur updateService :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Supprimer un service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Service non trouvé.' });
    }

    logAction(req.user.id, 'service_supprime', `Service supprimé : ${deleted.nom}`, deleted.nom, req);

    res.json({ message: 'Service supprimé.' });
  } catch (err) {
    console.error('Erreur deleteService :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};