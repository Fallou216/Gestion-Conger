const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Conge = require('../models/Conge');
const { auth, authorizeRoles } = require('../middleware/auth');

// ══════════════════════════════════════════════
// EXPORT EXCEL — Toutes les demandes
// ══════════════════════════════════════════════
router.get('/excel', auth, authorizeRoles('admin', 'responsable'), async (req, res) => {
  try {
    const { statut, dateDebut, dateFin } = req.query;

    // Filtres
    const filter = {};
    if (statut && statut !== 'tous') filter.statut = statut;
    if (dateDebut || dateFin) {
      filter.dateDemande = {};
      if (dateDebut) filter.dateDemande.$gte = new Date(dateDebut);
      if (dateFin) filter.dateDemande.$lte = new Date(dateFin + 'T23:59:59');
    }

    const conges = await Conge.find(filter)
      .populate('employe', 'nom prenom email')
      .sort({ dateDemande: -1 });

    // Créer le workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CongesPro';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Demandes de congés', {
      properties: { defaultRowHeight: 22 }
    });

    // En-tête du titre
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'CongesPro — Demandes de congés';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF4F46E5' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 35;

    // Date d'export
    sheet.mergeCells('A2:H2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Exporté le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    dateCell.font = { size: 10, color: { argb: 'FF94A3B8' } };
    dateCell.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // Ligne vide
    sheet.addRow([]);

    // Colonnes
    sheet.columns = [
      { key: 'nom', width: 20 },
      { key: 'prenom', width: 20 },
      { key: 'email', width: 30 },
      { key: 'dateDebut', width: 15 },
      { key: 'dateFin', width: 15 },
      { key: 'duree', width: 10 },
      { key: 'categorie', width: 15 },
      { key: 'statut', width: 15 },
      { key: 'motif', width: 30 },
    ];

    // En-têtes colonnes (row 4)
    const headerRow = sheet.addRow([
      'Nom', 'Prénom', 'Email', 'Date début', 'Date fin', 'Durée (j)', 'Catégorie', 'Statut', 'Motif'
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF1E293B' } }
      };
    });
    headerRow.height = 28;

    // Données
    conges.forEach((c, i) => {
      const row = sheet.addRow({
        nom: c.employe?.nom || '—',
        prenom: c.employe?.prenom || '—',
        email: c.employe?.email || '—',
        dateDebut: new Date(c.dateDebut).toLocaleDateString('fr-FR'),
        dateFin: new Date(c.dateFin).toLocaleDateString('fr-FR'),
        duree: c.dureeJours || 0,
        categorie: c.categorie || 'annuel',
        statut: c.statut,
        motif: c.motif || '—',
      });

      // Couleur alternée
      const bgColor = i % 2 === 0 ? 'FFF8FAFC' : 'FFF1F5F9';
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });

      // Couleur du statut
      const statutCell = row.getCell(8);
      if (c.statut === 'approuvé') {
        statutCell.font = { color: { argb: 'FF16A34A' }, bold: true };
      } else if (c.statut === 'refusé') {
        statutCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      } else {
        statutCell.font = { color: { argb: 'FFEA580C' }, bold: true };
      }
    });

    // Ligne de total
    sheet.addRow([]);
    const totalRow = sheet.addRow([
      `Total : ${conges.length} demande(s)`, '', '',
      '', '', '', '',
      `Approuvées : ${conges.filter(c => c.statut === 'approuvé').length}`,
      `En attente : ${conges.filter(c => c.statut === 'en attente').length}`,
    ]);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: 'FF4F46E5' } };
    });

    // Envoyer
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=conges_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Erreur export Excel :', err);
    res.status(500).json({ message: 'Erreur lors de l\'export Excel.' });
  }
});

// ══════════════════════════════════════════════
// EXPORT PDF — Toutes les demandes
// ══════════════════════════════════════════════
router.get('/pdf', auth, authorizeRoles('admin', 'responsable'), async (req, res) => {
  try {
    const { statut, dateDebut, dateFin } = req.query;

    const filter = {};
    if (statut && statut !== 'tous') filter.statut = statut;
    if (dateDebut || dateFin) {
      filter.dateDemande = {};
      if (dateDebut) filter.dateDemande.$gte = new Date(dateDebut);
      if (dateFin) filter.dateDemande.$lte = new Date(dateFin + 'T23:59:59');
    }

    const conges = await Conge.find(filter)
      .populate('employe', 'nom prenom email')
      .sort({ dateDemande: -1 });

    // Créer le PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=conges_${Date.now()}.pdf`);
    doc.pipe(res);

    // ── HEADER ──
    doc.fontSize(22).fillColor('#4F46E5').text('CongesPro', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#64748B').text('Rapport des demandes de congés', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor('#94A3B8').text(
      `Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      { align: 'center' }
    );
    doc.moveDown(1);

    // ── STATS RÉSUMÉ ──
    const nbApprouve = conges.filter(c => c.statut === 'approuvé').length;
    const nbAttente = conges.filter(c => c.statut === 'en attente').length;
    const nbRefuse = conges.filter(c => c.statut === 'refusé').length;

    doc.fontSize(10).fillColor('#1E293B');
    doc.text(`Total : ${conges.length}   |   Approuvées : ${nbApprouve}   |   En attente : ${nbAttente}   |   Refusées : ${nbRefuse}`, { align: 'center' });
    doc.moveDown(1);

    // ── TABLEAU ──
    const colWidths = [100, 100, 80, 80, 50, 80, 80, 150];
    const headers = ['Employé', 'Email', 'Début', 'Fin', 'Jours', 'Catégorie', 'Statut', 'Motif'];
    const startX = 40;
    let y = doc.y;

    // Header row
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 25).fill('#4F46E5');
    let x = startX;
    headers.forEach((h, i) => {
      doc.fontSize(9).fillColor('#FFFFFF').text(h, x + 4, y + 7, { width: colWidths[i] - 8, align: 'left' });
      x += colWidths[i];
    });
    y += 25;

    // Data rows
    conges.forEach((c, i) => {
      if (y > 520) {
        doc.addPage();
        y = 40;
        // Redessiner le header sur la nouvelle page
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 25).fill('#4F46E5');
        let xh = startX;
        headers.forEach((h, hi) => {
          doc.fontSize(9).fillColor('#FFFFFF').text(h, xh + 4, y + 7, { width: colWidths[hi] - 8 });
          xh += colWidths[hi];
        });
        y += 25;
      }

      const bgColor = i % 2 === 0 ? '#F8FAFC' : '#F1F5F9';
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 22).fill(bgColor);

      const row = [
        `${c.employe?.prenom || ''} ${c.employe?.nom || ''}`,
        c.employe?.email || '—',
        new Date(c.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        new Date(c.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        String(c.dureeJours || 0),
        c.categorie || 'annuel',
        c.statut,
        (c.motif || '—').substring(0, 30),
      ];

      x = startX;
      row.forEach((val, ci) => {
        let color = '#1E293B';
        if (ci === 6) {
          color = val === 'approuvé' ? '#16A34A' : val === 'refusé' ? '#DC2626' : '#EA580C';
        }
        doc.fontSize(8).fillColor(color).text(val, x + 4, y + 6, { width: colWidths[ci] - 8, align: 'left' });
        x += colWidths[ci];
      });
      y += 22;
    });

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#94A3B8').text('© CongesPro — Gestion des congés', startX, y + 20, { align: 'center', width: 720 });

    doc.end();
  } catch (err) {
    console.error('Erreur export PDF :', err);
    res.status(500).json({ message: 'Erreur lors de l\'export PDF.' });
  }
});

// ══════════════════════════════════════════════
// EXPORT EXCEL — Mes demandes (employé)
// ══════════════════════════════════════════════
router.get('/excel/mes', auth, authorizeRoles('employe'), async (req, res) => {
  try {
    const conges = await Conge.find({ employe: req.user.id }).sort({ dateDemande: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Mes congés');

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'Mes demandes de congés';
    sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF4F46E5' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 30;
    sheet.addRow([]);

    sheet.columns = [
      { key: 'dateDebut', width: 15 },
      { key: 'dateFin', width: 15 },
      { key: 'duree', width: 10 },
      { key: 'categorie', width: 15 },
      { key: 'statut', width: 15 },
      { key: 'motif', width: 35 },
      { key: 'dateDemande', width: 18 },
    ];

    const headerRow = sheet.addRow(['Date début', 'Date fin', 'Durée (j)', 'Catégorie', 'Statut', 'Motif', 'Date demande']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.alignment = { horizontal: 'center' };
    });

    conges.forEach((c, i) => {
      const row = sheet.addRow({
        dateDebut: new Date(c.dateDebut).toLocaleDateString('fr-FR'),
        dateFin: new Date(c.dateFin).toLocaleDateString('fr-FR'),
        duree: c.dureeJours || 0,
        categorie: c.categorie || 'annuel',
        statut: c.statut,
        motif: c.motif || '—',
        dateDemande: new Date(c.dateDemande).toLocaleDateString('fr-FR'),
      });
      const bg = i % 2 === 0 ? 'FFF8FAFC' : 'FFF1F5F9';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=mes_conges_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Erreur export Excel employé :', err);
    res.status(500).json({ message: 'Erreur export.' });
  }
});

module.exports = router;