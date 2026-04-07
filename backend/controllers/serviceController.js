const Service = require('../models/Service');

// ✅ Créer un nouveau service
exports.createService = async (req, res) => {
  try {
    const { nom } = req.body;

    // Vérifier si le service existe déjà
    const existing = await Service.findOne({ nom: nom.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Service déjà existant.' });
    }

    // Créer un nouveau service
    const service = new Service({ nom: nom.trim() });
    await service.save();

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

    res.json({ message: 'Service supprimé.' });
  } catch (err) {
    console.error('Erreur deleteService :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
