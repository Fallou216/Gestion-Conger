const mongoose = require('mongoose');

const congeSchema = new mongoose.Schema({
  employe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  },
 motif: {
    type: String,
    required: false,
    default: ''
},
  fichier: {
    type: String, // Le nom du fichier stocké (ex: 'nom.pdf')
    required: false
  },
  statut: {
    type: String,
    enum: ['en attente', 'approuvé', 'refusé'],
    default: 'en attente'
  },
  dateDemande: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Conge', congeSchema);
