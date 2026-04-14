/**
 * Jours fériés du Sénégal
 * 
 * Fêtes fixes : dates identiques chaque année
 * Fêtes variables : dépendent du calendrier lunaire (islamique) ou de Pâques
 * Les dates islamiques changent chaque année — elles sont mises ici par année
 * L'admin pourra les mettre à jour via une future interface
 */

// ── Fêtes fixes (mois 0-indexé : janvier = 0) ──
const FETES_FIXES = [
  { mois: 0, jour: 1, nom: 'Jour de l\'An' },
  { mois: 3, jour: 4, nom: 'Fête de l\'Indépendance' },
  { mois: 4, jour: 1, nom: 'Fête du Travail' },
  { mois: 7, jour: 15, nom: 'Assomption' },
  { mois: 10, jour: 1, nom: 'Toussaint' },
  { mois: 11, jour: 25, nom: 'Noël' },
];

// ── Fêtes variables par année (islamiques + chrétiennes mobiles) ──
const FETES_VARIABLES = {
  2025: [
    { mois: 2, jour: 31, nom: 'Aïd el-Fitr (Korité)' },
    { mois: 5, jour: 7, nom: 'Aïd el-Adha (Tabaski)' },
    { mois: 5, jour: 27, nom: 'Tamkharit (Achoura)' },
    { mois: 7, jour: 15, nom: 'Grand Magal de Touba' },
    { mois: 8, jour: 5, nom: 'Maouloud (Naissance du Prophète)' },
    { mois: 3, jour: 21, nom: 'Lundi de Pâques' },
    { mois: 4, jour: 29, nom: 'Ascension' },
    { mois: 5, jour: 9, nom: 'Lundi de Pentecôte' },
  ],
  2026: [
    { mois: 2, jour: 20, nom: 'Aïd el-Fitr (Korité)' },
    { mois: 4, jour: 27, nom: 'Aïd el-Adha (Tabaski)' },
    { mois: 5, jour: 25, nom: 'Tamkharit (Achoura)' },
    { mois: 7, jour: 1, nom: 'Grand Magal de Touba' },
    { mois: 7, jour: 25, nom: 'Maouloud (Naissance du Prophète)' },
    { mois: 2, jour: 30, nom: 'Lundi de Pâques' },
    { mois: 4, jour: 14, nom: 'Ascension' },
    { mois: 4, jour: 25, nom: 'Lundi de Pentecôte' },
  ],
  2027: [
    { mois: 2, jour: 10, nom: 'Aïd el-Fitr (Korité)' },
    { mois: 4, jour: 17, nom: 'Aïd el-Adha (Tabaski)' },
    { mois: 5, jour: 15, nom: 'Tamkharit (Achoura)' },
    { mois: 6, jour: 21, nom: 'Grand Magal de Touba' },
    { mois: 7, jour: 14, nom: 'Maouloud (Naissance du Prophète)' },
    { mois: 2, jour: 29, nom: 'Lundi de Pâques' },
    { mois: 4, jour: 6, nom: 'Ascension' },
    { mois: 4, jour: 17, nom: 'Lundi de Pentecôte' },
  ],
};

/**
 * Retourne la liste de tous les jours fériés pour une année donnée
 * Format : tableau de dates (Date)
 */
function getJoursFeries(annee) {
  const jours = [];

  // Fêtes fixes
  for (const f of FETES_FIXES) {
    jours.push({
      date: new Date(annee, f.mois, f.jour),
      nom: f.nom
    });
  }

  // Fêtes variables
  const variables = FETES_VARIABLES[annee];
  if (variables) {
    for (const f of variables) {
      jours.push({
        date: new Date(annee, f.mois, f.jour),
        nom: f.nom
      });
    }
  }

  return jours;
}

/**
 * Vérifie si une date est un jour férié
 */
function estJourFerie(date) {
  const d = new Date(date);
  const annee = d.getFullYear();
  const feries = getJoursFeries(annee);
  return feries.some(f =>
    f.date.getFullYear() === d.getFullYear() &&
    f.date.getMonth() === d.getMonth() &&
    f.date.getDate() === d.getDate()
  );
}

/**
 * Vérifie si une date est un dimanche
 */
function estDimanche(date) {
  return new Date(date).getDay() === 0;
}

/**
 * Calcule le nombre de jours ouvrables entre 2 dates
 * EXCLUT : dimanches + jours fériés du Sénégal
 */
function calculerJoursOuvrables(dateDebut, dateFin) {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  debut.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  let joursOuvrables = 0;
  const current = new Date(debut);

  while (current <= fin) {
    if (!estDimanche(current) && !estJourFerie(current)) {
      joursOuvrables++;
    }
    current.setDate(current.getDate() + 1);
  }

  return Math.max(1, joursOuvrables);
}

/**
 * Retourne les jours fériés qui tombent dans une période donnée
 */
function joursFeriesDansPeriode(dateDebut, dateFin) {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  debut.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  const annees = new Set();
  const current = new Date(debut);
  while (current <= fin) {
    annees.add(current.getFullYear());
    current.setDate(current.getDate() + 1);
  }

  const feries = [];
  for (const annee of annees) {
    const joursFeries = getJoursFeries(annee);
    for (const jf of joursFeries) {
      if (jf.date >= debut && jf.date <= fin) {
        feries.push(jf);
      }
    }
  }

  return feries;
}

module.exports = {
  getJoursFeries,
  estJourFerie,
  estDimanche,
  calculerJoursOuvrables,
  joursFeriesDansPeriode,
  FETES_FIXES,
  FETES_VARIABLES
};