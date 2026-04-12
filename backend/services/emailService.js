const nodemailer = require('nodemailer');
require('dotenv').config();

// ── TRANSPORTEUR SMTP ──
let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

// Vérifier la connexion au démarrage (appelé après dotenv.config dans app.js)
setTimeout(() => {
  getTransporter().verify()
    .then(() => console.log('✅ Service email prêt'))
    .catch((err) => console.warn('⚠️ Email non configuré :', err.message));
}, 500);

// ── TEMPLATE HTML DE BASE ──
const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Tahoma,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:14px;padding:12px 16px;margin-bottom:16px;">
        <span style="font-size:24px;">📅</span>
      </div>
      <h1 style="color:#f8fafc;font-size:22px;margin:0;">Congés<span style="color:#818cf8;">Pro</span></h1>
    </div>

    <!-- Card -->
    <div style="background:#111827;border:1px solid #1e293b;border-radius:20px;overflow:hidden;">
      <div style="padding:32px;">
        <h2 style="color:#f1f5f9;font-size:20px;margin:0 0 8px;">${title}</h2>
        ${content}
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="color:#475569;font-size:12px;margin:0;">© ${new Date().getFullYear()} CongesPro — Gestion des congés simplifiée</p>
      <p style="color:#334155;font-size:11px;margin-top:8px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
`;

// ── INFO ROW HELPER ──
const infoRow = (label, value) => `
  <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #1e293b;">
    <span style="color:#94a3b8;font-size:13px;font-weight:600;">${label}</span>
    <span style="color:#e2e8f0;font-size:13px;font-weight:600;">${value}</span>
  </div>
`;

// ── BOUTON HELPER ──
const buttonBlock = (text, url, color = '#4f46e5') => `
  <div style="text-align:center;margin-top:28px;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,${color},#7c3aed);color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:700;">${text}</a>
  </div>
`;

// ── FORMAT DATE ──
const formatDate = (d) => {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const dureeJours = (debut, fin) => {
  return Math.max(1, Math.round((new Date(fin) - new Date(debut)) / 86400000) + 1);
};

// ══════════════════════════════════════════════
// FONCTIONS D'ENVOI D'EMAIL
// ══════════════════════════════════════════════

/**
 * 1. EMAIL DE BIENVENUE — après inscription
 */
exports.sendWelcomeEmail = async (user) => {
  try {
    const content = `
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin-top:12px;">
        Bonjour <strong style="color:#e2e8f0;">${user.prenom} ${user.nom}</strong>,
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Bienvenue sur <strong style="color:#a5b4fc;">CongesPro</strong> ! Votre compte a été créé avec succès.
      </p>
      <div style="background:#0d1422;border-radius:12px;padding:20px;margin:20px 0;">
        ${infoRow('Nom complet', `${user.prenom} ${user.nom}`)}
        ${infoRow('Email', user.email)}
        ${infoRow('Rôle', user.role === 'responsable' ? '👑 Responsable' : '👤 Employé')}
      </div>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Vous pouvez dès maintenant vous connecter et ${user.role === 'employe' ? 'soumettre vos demandes de congés' : 'gérer les demandes de votre équipe'}.
      </p>
      ${buttonBlock('Se connecter', process.env.FRONTEND_URL || 'http://localhost:5173')}
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"CongesPro" <noreply@congespro.com>',
      to: user.email,
      subject: '🎉 Bienvenue sur CongesPro !',
      html: baseTemplate(content, 'Bienvenue ! 👋'),
    });
    console.log(`📧 Email de bienvenue envoyé à ${user.email}`);
  } catch (err) {
    console.error('❌ Erreur envoi email bienvenue :', err.message);
  }
};

/**
 * 2. EMAIL NOUVELLE DEMANDE — notifie le(s) responsable(s)
 */
exports.sendNewRequestEmail = async (employe, conge, responsables) => {
  try {
    const content = `
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin-top:12px;">
        Une nouvelle demande de congé a été soumise et nécessite votre attention.
      </p>
      <div style="background:#0d1422;border-radius:12px;padding:20px;margin:20px 0;">
        ${infoRow('Employé', `${employe.prenom} ${employe.nom}`)}
        ${infoRow('Email', employe.email)}
        ${infoRow('Date début', formatDate(conge.dateDebut))}
        ${infoRow('Date fin', formatDate(conge.dateFin))}
        ${infoRow('Durée', `${dureeJours(conge.dateDebut, conge.dateFin)} jour(s)`)}
        ${infoRow('Motif', conge.motif || '—')}
        <div style="padding:12px 0;">
          <span style="display:inline-block;background:rgba(251,146,60,.15);color:#fb923c;padding:5px 14px;border-radius:99px;font-size:12px;font-weight:700;border:1px solid rgba(251,146,60,.2);">⏳ En attente</span>
        </div>
      </div>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Connectez-vous pour approuver ou refuser cette demande.
      </p>
      ${buttonBlock('Voir les demandes', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/responsable/demandes`)}
    `;

    const emails = responsables.map(r => r.email);
    if (emails.length === 0) return;

    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"CongesPro" <noreply@congespro.com>',
      to: emails.join(','),
      subject: `📋 Nouvelle demande de congé — ${employe.prenom} ${employe.nom}`,
      html: baseTemplate(content, 'Nouvelle demande de congé'),
    });
    console.log(`📧 Email nouvelle demande envoyé à ${emails.length} responsable(s)`);
  } catch (err) {
    console.error('❌ Erreur envoi email nouvelle demande :', err.message);
  }
};

/**
 * 3. EMAIL STATUT CHANGÉ — notifie l'employé (approuvé/refusé)
 */
exports.sendStatusChangeEmail = async (employe, conge, statut) => {
  try {
    const isApproved = statut === 'approuvé';
    const statusColor = isApproved ? '#4ade80' : '#f87171';
    const statusBg = isApproved ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.1)';
    const statusBorder = isApproved ? 'rgba(74,222,128,.2)' : 'rgba(248,113,113,.2)';
    const statusIcon = isApproved ? '✅' : '❌';
    const statusText = isApproved ? 'Approuvée' : 'Refusée';

    const content = `
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin-top:12px;">
        Bonjour <strong style="color:#e2e8f0;">${employe.prenom}</strong>,
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Votre demande de congé a été <strong style="color:${statusColor};">${statut}</strong> par votre responsable.
      </p>
      <div style="background:#0d1422;border-radius:12px;padding:20px;margin:20px 0;">
        ${infoRow('Date début', formatDate(conge.dateDebut))}
        ${infoRow('Date fin', formatDate(conge.dateFin))}
        ${infoRow('Durée', `${dureeJours(conge.dateDebut, conge.dateFin)} jour(s)`)}
        ${infoRow('Motif', conge.motif || '—')}
        <div style="padding:12px 0;">
          <span style="display:inline-block;background:${statusBg};color:${statusColor};padding:5px 14px;border-radius:99px;font-size:12px;font-weight:700;border:1px solid ${statusBorder};">${statusIcon} ${statusText}</span>
        </div>
      </div>
      ${isApproved
        ? '<p style="color:#94a3b8;font-size:14px;line-height:1.7;">Profitez bien de vos congés ! 🎉</p>'
        : '<p style="color:#94a3b8;font-size:14px;line-height:1.7;">N\'hésitez pas à soumettre une nouvelle demande si nécessaire.</p>'
      }
      ${buttonBlock('Voir mes demandes', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/employe/mes-demandes`)}
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"CongesPro" <noreply@congespro.com>',
      to: employe.email,
      subject: `${statusIcon} Votre demande de congé a été ${statut}`,
      html: baseTemplate(content, `Demande ${statusText}`),
    });
    console.log(`📧 Email statut (${statut}) envoyé à ${employe.email}`);
  } catch (err) {
    console.error('❌ Erreur envoi email statut :', err.message);
  }
};

/**
 * 4. EMAIL SUPPRESSION — notifie l'employé quand le responsable supprime sa demande
 */
exports.sendDeletedByAdminEmail = async (employe, conge) => {
  try {
    const content = `
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin-top:12px;">
        Bonjour <strong style="color:#e2e8f0;">${employe.prenom}</strong>,
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Votre demande de congé a été <strong style="color:#f87171;">supprimée</strong> par un responsable.
      </p>
      <div style="background:#0d1422;border-radius:12px;padding:20px;margin:20px 0;">
        ${infoRow('Date début', formatDate(conge.dateDebut))}
        ${infoRow('Date fin', formatDate(conge.dateFin))}
        ${infoRow('Motif', conge.motif || '—')}
      </div>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Pour toute question, contactez votre responsable.
      </p>
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"CongesPro" <noreply@congespro.com>',
      to: employe.email,
      subject: '🗑️ Votre demande de congé a été supprimée',
      html: baseTemplate(content, 'Demande supprimée'),
    });
    console.log(`📧 Email suppression envoyé à ${employe.email}`);
  } catch (err) {
    console.error('❌ Erreur envoi email suppression :', err.message);
  }
};

/**
 * 5. EMAIL MOT DE PASSE OUBLIÉ — envoie le lien de réinitialisation
 */
exports.sendResetPasswordEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const content = `
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin-top:12px;">
        Bonjour <strong style="color:#e2e8f0;">${user.prenom}</strong>,
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en créer un nouveau.
      </p>
      ${buttonBlock('Réinitialiser mon mot de passe', resetUrl)}
      <div style="background:rgba(251,146,60,.08);border:1px solid rgba(251,146,60,.2);border-radius:12px;padding:16px;margin-top:24px;">
        <p style="color:#fb923c;font-size:12px;margin:0;font-weight:600;">
          ⚠️ Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
      </div>
      <p style="color:#475569;font-size:12px;margin-top:20px;line-height:1.6;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
        <span style="color:#818cf8;word-break:break-all;">${resetUrl}</span>
      </p>
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"CongesPro" <noreply@congespro.com>',
      to: user.email,
      subject: '🔐 Réinitialisation de votre mot de passe',
      html: baseTemplate(content, 'Mot de passe oublié'),
    });
    console.log(`📧 Email reset password envoyé à ${user.email}`);
  } catch (err) {
    console.error('❌ Erreur envoi email reset :', err.message);
  }
};

/**
 * 6. EMAIL CONFIRMATION RESET — après changement de mot de passe réussi
 */
exports.sendPasswordChangedEmail = async (user) => {
  try {
    const content = `
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin-top:12px;">
        Bonjour <strong style="color:#e2e8f0;">${user.prenom}</strong>,
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Votre mot de passe a été <strong style="color:#4ade80;">modifié avec succès</strong>.
      </p>
      <div style="background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.15);border-radius:12px;padding:16px;margin:20px 0;">
        <p style="color:#4ade80;font-size:13px;margin:0;font-weight:600;">
          ✅ Modification effectuée le ${formatDate(new Date())}
        </p>
      </div>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement votre administrateur.
      </p>
      ${buttonBlock('Se connecter', process.env.FRONTEND_URL || 'http://localhost:5173')}
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"CongesPro" <noreply@congespro.com>',
      to: user.email,
      subject: '✅ Mot de passe modifié avec succès',
      html: baseTemplate(content, 'Mot de passe modifié'),
    });
    console.log(`📧 Email confirmation reset envoyé à ${user.email}`);
  } catch (err) {
    console.error('❌ Erreur envoi email confirmation reset :', err.message);
  }
};

/**
 * 7. EMAIL RAPPEL AVANT FIN DE CONGÉ — 3 jours avant la fin
 */
exports.sendCongeRappelEmail = async (employe, conge) => {
  try {
    const joursRestants = Math.max(0, Math.round((new Date(conge.dateFin) - new Date()) / 86400000));
    const content = `
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin-top:12px;">
        Bonjour <strong style="color:#e2e8f0;">${employe.prenom}</strong>,
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Votre congé touche bientôt à sa fin. Il vous reste <strong style="color:#fb923c;">${joursRestants} jour(s)</strong>.
      </p>
      <div style="background:#0d1422;border-radius:12px;padding:20px;margin:20px 0;">
        ${infoRow('Date début', formatDate(conge.dateDebut))}
        ${infoRow('Date fin', formatDate(conge.dateFin))}
        ${infoRow('Jours restants', joursRestants + ' jour(s)')}
      </div>
      <div style="background:rgba(251,146,60,.08);border:1px solid rgba(251,146,60,.2);border-radius:12px;padding:16px;margin-top:16px;">
        <p style="color:#fb923c;font-size:13px;margin:0;font-weight:600;">
          ⏰ Pensez à préparer votre retour au travail le ${formatDate(new Date(new Date(conge.dateFin).getTime() + 86400000))}
        </p>
      </div>
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"CongesPro" <noreply@congespro.com>',
      to: employe.email,
      subject: `⏰ Rappel — Votre congé se termine dans ${joursRestants} jour(s)`,
      html: baseTemplate(content, 'Rappel de fin de congé'),
    });
    console.log(`📧 Rappel avant-fin envoyé à ${employe.email}`);
  } catch (err) {
    console.error('❌ Erreur envoi rappel avant-fin :', err.message);
  }
};

/**
 * 8. EMAIL FIN DE CONGÉ — le jour de la fin
 */
exports.sendCongeFinEmail = async (employe, conge) => {
  try {
    const content = `
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin-top:12px;">
        Bonjour <strong style="color:#e2e8f0;">${employe.prenom}</strong>,
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;">
        Votre période de congé <strong style="color:#4ade80;">prend fin aujourd'hui</strong>.
      </p>
      <div style="background:#0d1422;border-radius:12px;padding:20px;margin:20px 0;">
        ${infoRow('Date début', formatDate(conge.dateDebut))}
        ${infoRow('Date fin', formatDate(conge.dateFin))}
        ${infoRow('Durée totale', (conge.dureeJours || '—') + ' jour(s)')}
      </div>
      <div style="background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.15);border-radius:12px;padding:16px;margin-top:16px;">
        <p style="color:#4ade80;font-size:13px;margin:0;font-weight:600;">
          ✅ Bon retour au travail ! Nous espérons que vous avez passé un excellent congé.
        </p>
      </div>
      ${buttonBlock('Voir mon solde', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/employe/dashboard`)}
    `;

    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"CongesPro" <noreply@congespro.com>',
      to: employe.email,
      subject: '✅ Votre congé prend fin aujourd\'hui — Bon retour !',
      html: baseTemplate(content, 'Fin de congé'),
    });
    console.log(`📧 Email fin de congé envoyé à ${employe.email}`);
  } catch (err) {
    console.error('❌ Erreur envoi email fin congé :', err.message);
  }
};