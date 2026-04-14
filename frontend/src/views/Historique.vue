<template>
  <div class="db">
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Administration</div>
        <h1 class="page-title">Historique d'activité</h1>
      </div>
      <div class="topbar-right">
        <div class="date-pill">📅 {{ todayLabel }}</div>
      </div>
    </div>

    <!-- STATS -->
    <div class="kpi-grid" v-if="stats">
      <div class="kpi kpi-total">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">📊</div>
        <div class="kpi-val">{{ stats.aujourdhui }}</div>
        <div class="kpi-lbl">Aujourd'hui</div>
      </div>
      <div class="kpi kpi-week">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">📅</div>
        <div class="kpi-val">{{ stats.semaine }}</div>
        <div class="kpi-lbl">Cette semaine</div>
      </div>
      <div class="kpi kpi-all">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">🗂️</div>
        <div class="kpi-val">{{ stats.total }}</div>
        <div class="kpi-lbl">Total actions</div>
      </div>
    </div>

    <!-- FILTRES -->
    <div class="card filter-card">
      <div class="filters">
        <div class="filter-group">
          <label>Action</label>
          <select v-model="filtreAction" @change="charger(1)" class="filter-select">
            <option value="tous">Toutes les actions</option>
            <option v-for="a in actionsDispos" :key="a.val" :value="a.val">{{ a.icon }} {{ a.label }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Du</label>
          <input type="date" v-model="dateDebut" @change="charger(1)" class="filter-input" />
        </div>
        <div class="filter-group">
          <label>Au</label>
          <input type="date" v-model="dateFin" @change="charger(1)" class="filter-input" />
        </div>
        <button class="filter-reset" @click="resetFiltres">✕ Réinitialiser</button>
      </div>
    </div>

    <!-- TIMELINE -->
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Activité récente</span>
        <span class="card-sub">{{ total }} action{{ total > 1 ? 's' : '' }}</span>
      </div>

      <div class="timeline-body" v-if="logs.length">
        <div v-for="(log, i) in logs" :key="log._id" class="tl-item">
          <div class="tl-dot" :class="'dot-' + actionColor(log.action)"></div>
          <div class="tl-line" v-if="i < logs.length - 1"></div>
          <div class="tl-content">
            <div class="tl-header">
              <span class="tl-icon">{{ actionIcon(log.action) }}</span>
              <span class="tl-action-label">{{ actionLabel(log.action) }}</span>
              <span class="tl-time">{{ timeAgo(log.createdAt) }}</span>
            </div>
            <div class="tl-details" v-if="log.details">{{ log.details }}</div>
            <div class="tl-user" v-if="log.utilisateur">
              <span class="tl-avatar">{{ initiales(log.utilisateur) }}</span>
              <span class="tl-user-name">{{ log.utilisateur.prenom }} {{ log.utilisateur.nom }}</span>
              <span class="tl-user-role" :class="'role-' + log.utilisateur.role">{{ log.utilisateur.role }}</span>
            </div>
            <div class="tl-meta">
              {{ formatDate(log.createdAt) }}
            </div>
          </div>
        </div>
      </div>

      <div class="empty" v-else-if="!chargement">
        <span class="empty-icon">📭</span>
        <p>Aucune activité trouvée</p>
      </div>

      <div class="loader-wrap" v-if="chargement">
        <div class="spinner"></div>
      </div>

      <!-- PAGINATION -->
      <div class="pagination" v-if="pages > 1">
        <button class="pag-btn" :disabled="page <= 1" @click="charger(page - 1)">← Précédent</button>
        <span class="pag-info">Page {{ page }} / {{ pages }}</span>
        <button class="pag-btn" :disabled="page >= pages" @click="charger(page + 1)">Suivant →</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '../axios';

export default {
  name: 'HistoriqueView',
  data() {
    return {
      logs: [], stats: null, total: 0, page: 1, pages: 1,
      chargement: true,
      filtreAction: 'tous', dateDebut: '', dateFin: '',
      actionsDispos: [
        { val: 'connexion', label: 'Connexion', icon: '🔑' },
        { val: 'inscription', label: 'Inscription', icon: '📝' },
        { val: 'demande_creee', label: 'Demande créée', icon: '📋' },
        { val: 'demande_approuvee', label: 'Demande approuvée', icon: '✅' },
        { val: 'demande_refusee', label: 'Demande refusée', icon: '❌' },
        { val: 'demande_supprimee', label: 'Demande supprimée (employé)', icon: '🗑️' },
        { val: 'demande_supprimee_admin', label: 'Demande supprimée (admin)', icon: '🗑️' },
        { val: 'profil_modifie', label: 'Profil modifié', icon: '👤' },
        { val: 'mot_de_passe_change', label: 'Mot de passe changé', icon: '🔒' },
        { val: 'utilisateur_cree', label: 'Utilisateur créé', icon: '➕' },
        { val: 'utilisateur_supprime', label: 'Utilisateur supprimé', icon: '🗑️' },
        { val: 'export_excel', label: 'Export Excel', icon: '📊' },
        { val: 'export_pdf', label: 'Export PDF', icon: '📄' },
      ],
    };
  },
  computed: {
    todayLabel() {
      return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    },
  },
  methods: {
    async charger(p = 1) {
      this.chargement = true;
      this.page = p;
      try {
        let url = `/activity?page=${p}&limit=30`;
        if (this.filtreAction !== 'tous') url += `&action=${this.filtreAction}`;
        if (this.dateDebut) url += `&dateDebut=${this.dateDebut}`;
        if (this.dateFin) url += `&dateFin=${this.dateFin}`;

        const res = await axios.get(url);
        this.logs = res.data.logs;
        this.total = res.data.total;
        this.pages = res.data.pages;
      } catch { console.error('Erreur chargement historique'); }
      finally { this.chargement = false; }
    },
    async chargerStats() {
      try {
        const res = await axios.get('/activity/stats');
        this.stats = res.data;
      } catch { /* silencieux */ }
    },
    resetFiltres() {
      this.filtreAction = 'tous'; this.dateDebut = ''; this.dateFin = '';
      this.charger(1);
    },
    actionIcon(action) {
      const icons = {
        connexion: '🔑', inscription: '📝', deconnexion: '🚪',
        demande_creee: '📋', demande_approuvee: '✅', demande_refusee: '❌',
        demande_supprimee: '🗑️', demande_supprimee_admin: '🗑️',
        profil_modifie: '👤', mot_de_passe_change: '🔒',
        photo_uploadee: '📷', photo_supprimee: '📷',
        utilisateur_cree: '➕', utilisateur_modifie: '✏️', utilisateur_supprime: '🗑️',
        service_cree: '🏢', service_modifie: '🏢', service_supprime: '🏢',
        export_excel: '📊', export_pdf: '📄',
      };
      return icons[action] || '📌';
    },
    actionLabel(action) {
      const labels = {
        connexion: 'Connexion', inscription: 'Inscription', deconnexion: 'Déconnexion',
        demande_creee: 'Demande créée', demande_approuvee: 'Demande approuvée',
        demande_refusee: 'Demande refusée', demande_supprimee: 'Demande supprimée',
        demande_supprimee_admin: 'Suppression par admin',
        profil_modifie: 'Profil modifié', mot_de_passe_change: 'Mot de passe changé',
        photo_uploadee: 'Photo uploadée', photo_supprimee: 'Photo supprimée',
        utilisateur_cree: 'Utilisateur créé', utilisateur_modifie: 'Utilisateur modifié',
        utilisateur_supprime: 'Utilisateur supprimé',
        service_cree: 'Service créé', service_modifie: 'Service modifié',
        service_supprime: 'Service supprimé',
        export_excel: 'Export Excel', export_pdf: 'Export PDF',
      };
      return labels[action] || action;
    },
    actionColor(action) {
      if (['connexion', 'inscription'].includes(action)) return 'blue';
      if (['demande_approuvee'].includes(action)) return 'green';
      if (['demande_refusee'].includes(action)) return 'red';
      if (action.includes('supprime')) return 'red';
      if (['demande_creee'].includes(action)) return 'indigo';
      if (action.includes('export')) return 'orange';
      return 'gray';
    },
    initiales(u) {
      if (!u) return '??';
      return ((u.prenom?.[0] || '') + (u.nom?.[0] || '')).toUpperCase();
    },
    timeAgo(date) {
      const s = Math.floor((Date.now() - new Date(date)) / 1000);
      if (s < 60) return 'À l\'instant';
      if (s < 3600) return Math.floor(s / 60) + ' min';
      if (s < 86400) return Math.floor(s / 3600) + 'h';
      if (s < 604800) return Math.floor(s / 86400) + 'j';
      return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    },
    formatDate(d) {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
  },
  mounted() { this.charger(); this.chargerStats(); },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
.db { font-family:'Sora',sans-serif; background:var(--bg-primary,#0a0f1e); min-height:100vh; padding:28px 32px 60px; color:var(--text-secondary,#e2e8f0); }
.topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
.breadcrumb { font-size:11px; color:var(--text-dim); letter-spacing:.12em; text-transform:uppercase; font-weight:600; margin-bottom:5px; }
.page-title { font-size:28px; font-weight:800; color:var(--text-primary); letter-spacing:-.025em; margin:0; }
.date-pill { background:var(--bg-card); border:1px solid var(--border); border-radius:99px; padding:9px 18px; font-size:12px; color:var(--text-muted); font-weight:500; text-transform:capitalize; }

/* KPI */
.kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
.kpi { border-radius:20px; padding:24px; position:relative; overflow:hidden; transition:transform .25s, box-shadow .25s; }
.kpi:hover { transform:translateY(-4px); box-shadow:var(--shadow-lg); }
.kpi-total { background:var(--kpi-indigo,linear-gradient(145deg,#1e1b4b,#312e81)); border:1px solid rgba(99,102,241,.25); }
.kpi-week { background:var(--kpi-blue,linear-gradient(145deg,#0c1a2e,#0c2a4a)); border:1px solid rgba(56,130,221,.2); }
.kpi-all { background:var(--kpi-green,linear-gradient(145deg,#052e16,#14532d)); border:1px solid rgba(22,163,74,.2); }
.kpi-glow { position:absolute; top:-24px; right:-24px; width:90px; height:90px; border-radius:50%; opacity:.2; }
.kpi-total .kpi-glow { background:#818cf8; } .kpi-week .kpi-glow { background:#60a5fa; } .kpi-all .kpi-glow { background:#4ade80; }
.kpi-icon-wrap { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:18px; background:rgba(255,255,255,.08); }
.kpi-val { font-size:36px; font-weight:800; color:var(--text-primary); line-height:1; letter-spacing:-.04em; }
.kpi-lbl { font-size:11px; color:var(--text-muted); font-weight:600; margin-top:5px; text-transform:uppercase; letter-spacing:.08em; }

/* FILTERS */
.filter-card { padding:20px 24px; margin-bottom:20px; }
.filters { display:flex; align-items:flex-end; gap:14px; flex-wrap:wrap; }
.filter-group { display:flex; flex-direction:column; gap:6px; }
.filter-group label { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.07em; }
.filter-select, .filter-input { background:var(--bg-input); border:1px solid var(--border-light); border-radius:10px; padding:10px 14px; font-size:12px; font-family:'Sora',sans-serif; color:var(--text-secondary); outline:none; min-width:180px; }
.filter-select:focus, .filter-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(79,70,229,.15); }
.filter-select option { background:var(--bg-input); }
.filter-reset { padding:10px 16px; border-radius:10px; border:1px solid var(--border-light); background:none; color:var(--text-muted); font-size:12px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; transition:all .2s; }
.filter-reset:hover { border-color:var(--danger); color:var(--danger); }

/* CARD */
.card { background:var(--bg-card); border:1px solid var(--border); border-radius:20px; overflow:hidden; margin-bottom:20px; }
.card-hd { padding:20px 24px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
.card-title { font-size:15px; font-weight:700; color:var(--text-primary); }
.card-sub { font-size:12px; color:var(--text-dim); background:var(--bg-input); padding:3px 12px; border-radius:99px; font-weight:500; }

/* TIMELINE */
.timeline-body { padding:16px 24px; }
.tl-item { display:flex; gap:16px; position:relative; padding-bottom:24px; }
.tl-item:last-child { padding-bottom:8px; }
.tl-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; margin-top:5px; z-index:1; }
.dot-blue { background:#4f46e5; box-shadow:0 0 8px rgba(79,70,229,.4); }
.dot-green { background:#4ade80; box-shadow:0 0 8px rgba(74,222,128,.4); }
.dot-red { background:#f87171; box-shadow:0 0 8px rgba(248,113,113,.4); }
.dot-orange { background:#fb923c; box-shadow:0 0 8px rgba(251,146,60,.4); }
.dot-indigo { background:#818cf8; box-shadow:0 0 8px rgba(129,140,248,.4); }
.dot-gray { background:var(--text-dark); }
.tl-line { position:absolute; left:5px; top:20px; bottom:0; width:2px; background:var(--border); z-index:0; }
.tl-content { flex:1; min-width:0; }
.tl-header { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.tl-icon { font-size:16px; }
.tl-action-label { font-size:13px; font-weight:700; color:var(--text-primary); }
.tl-time { font-size:11px; color:var(--text-dark); font-weight:600; margin-left:auto; }
.tl-details { font-size:12px; color:var(--text-muted); margin-top:6px; line-height:1.5; }
.tl-user { display:flex; align-items:center; gap:8px; margin-top:8px; }
.tl-avatar { width:24px; height:24px; border-radius:7px; background:var(--gradient-accent); color:white; font-size:9px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.tl-user-name { font-size:12px; font-weight:600; color:var(--text-secondary); }
.tl-user-role { font-size:10px; font-weight:700; padding:2px 8px; border-radius:99px; }
.role-admin { background:rgba(234,88,12,.15); color:#fb923c; }
.role-responsable { background:rgba(79,70,229,.15); color:#a5b4fc; }
.role-employe { background:rgba(16,185,129,.12); color:#6ee7b7; }
.tl-meta { font-size:10px; color:var(--text-dark); margin-top:6px; }

/* EMPTY */
.empty { display:flex; flex-direction:column; align-items:center; padding:48px; gap:12px; }
.empty-icon { font-size:40px; }
.empty p { font-size:13px; color:var(--text-dim); }

/* LOADER */
.loader-wrap { display:flex; justify-content:center; padding:32px; }
.spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* PAGINATION */
.pagination { display:flex; align-items:center; justify-content:center; gap:16px; padding:20px; border-top:1px solid var(--border); }
.pag-btn { padding:8px 18px; border-radius:10px; border:1px solid var(--border-light); background:var(--bg-input); color:var(--text-muted); font-size:12px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; transition:all .2s; }
.pag-btn:hover:not(:disabled) { border-color:var(--accent); color:var(--accent-lighter); }
.pag-btn:disabled { opacity:.35; cursor:not-allowed; }
.pag-info { font-size:12px; color:var(--text-dim); font-weight:600; }

@media (max-width:900px) { .kpi-grid{grid-template-columns:1fr;} .filters{flex-direction:column;} }
@media (max-width:700px) { .db{padding:16px 14px 50px;} .page-title{font-size:22px;} }
</style>