<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Responsable</div>
        <h1 class="page-title">Tableau de bord</h1>
      </div>
      <div class="topbar-right">
        <div class="date-pill">📅 {{ todayLabel }}</div>
        <div class="notif-btn" @click="filtreStatut = 'en attente'" title="Demandes en attente">
          🔔
          <span class="notif-dot" v-if="nbAttente > 0">{{ nbAttente }}</span>
        </div>
      </div>
    </div>

    <!-- KPI CARDS -->
    <div class="kpi-grid">
      <div class="kpi kpi-total" @click="filtreStatut = 'tous'">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">📋</div>
        <div class="kpi-val">{{ conges.length }}</div>
        <div class="kpi-lbl">Total demandes</div>
        <div class="kpi-trend">Ce mois</div>
      </div>
      <div class="kpi kpi-wait" @click="filtreStatut = 'en attente'">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">⏳</div>
        <div class="kpi-val">{{ nbAttente }}</div>
        <div class="kpi-lbl">En attente</div>
        <div class="kpi-trend">À traiter</div>
      </div>
      <div class="kpi kpi-ok" @click="filtreStatut = 'approuvé'">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">✅</div>
        <div class="kpi-val">{{ nbApprouve }}</div>
        <div class="kpi-lbl">Approuvées</div>
        <div class="kpi-trend">{{ pct(nbApprouve) }}%</div>
      </div>
      <div class="kpi kpi-no" @click="filtreStatut = 'refusé'">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">✗</div>
        <div class="kpi-val">{{ nbRefuse }}</div>
        <div class="kpi-lbl">Refusées</div>
        <div class="kpi-trend">{{ pct(nbRefuse) }}%</div>
      </div>
    </div>

    <!-- GRAPHIQUES -->
    <div class="main-grid">

      <!-- DONUT -->
      <div class="card">
        <div class="card-hd">
          <span class="card-title">Répartition des statuts</span>
          <span class="card-sub">Vue globale</span>
        </div>
        <div class="donut-area">
          <svg viewBox="0 0 120 120" class="donut-svg">
            <circle cx="60" cy="60" r="48" fill="none" stroke="#1e293b" stroke-width="14"/>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#4ade80" stroke-width="14"
              stroke-dasharray="0 301.6" stroke-linecap="round" transform="rotate(-90 60 60)"
              :style="donutApprouve"/>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#fb923c" stroke-width="14"
              stroke-dasharray="0 301.6" stroke-linecap="round" transform="rotate(-90 60 60)"
              :style="donutAttente"/>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#f87171" stroke-width="14"
              stroke-dasharray="0 301.6" stroke-linecap="round" transform="rotate(-90 60 60)"
              :style="donutRefuse"/>
            <text x="60" y="55" text-anchor="middle" class="donut-val">{{ conges.length }}</text>
            <text x="60" y="68" text-anchor="middle" class="donut-lbl">demandes</text>
          </svg>
          <div class="legend">
            <div class="leg-block" v-for="item in legendItems" :key="item.label">
              <div class="leg-row">
                <div class="leg-dot" :style="{ background: item.color }"></div>
                <div class="leg-name">{{ item.label }}</div>
                <div class="leg-pct">{{ pct(item.count) }}%</div>
              </div>
              <div class="leg-bar-track">
                <div class="leg-bar-fill" :style="{ width: pct(item.count) + '%', background: item.color }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- BARRES MENSUELLES -->
      <div class="card">
        <div class="card-hd">
          <span class="card-title">Demandes par mois</span>
          <span class="card-sub">{{ new Date().getFullYear() }}</span>
        </div>
        <div class="bar-zone">
          <div class="bcol" v-for="(m, i) in moisData" :key="i">
            <div class="bwrap">
              <div
                class="bar"
                :style="{
                  height: barHeight(m.count) + '%',
                  background: m.isCurrentMonth ? '#818cf8' : (m.count > 0 ? '#4f46e5' : '#1e293b')
                }"
                :title="m.label + ' : ' + m.count + ' demande(s)'"
              ></div>
            </div>
            <div class="blbl">{{ m.short }}</div>
          </div>
        </div>
      </div>

    </div>

    <!-- TABLEAU -->
    <div class="card table-card">
      <div class="card-hd">
        <span class="card-title">Toutes les demandes</span>
        <div class="filters">
          <div class="sbox">
            <span class="s-icon">🔍</span>
            <input v-model="recherche" type="text" placeholder="Rechercher un employé…" class="s-input" />
          </div>
          <div class="tabs">
            <button
              v-for="tab in tabs" :key="tab.val"
              :class="['tab', { on: filtreStatut === tab.val }]"
              @click="filtreStatut = tab.val"
            >
              {{ tab.label }}
              <span class="tab-badge" v-if="tab.count > 0">{{ tab.count }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="loader-wrap" v-if="chargement">
        <div class="spinner"></div>
        <span>Chargement des données…</span>
      </div>

      <div class="empty" v-else-if="!congesFiltres.length">
        <div class="empty-icon">📭</div>
        <p>Aucune demande trouvée</p>
      </div>

      <div class="tbl-wrap" v-else>
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Période</th>
              <th>Durée</th>
              <th>Motif</th>
              <th>Pièce jointe</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr class="trow" v-for="conge in congesFiltres" :key="conge._id">
              <td>
                <div class="emp-cell">
                  <div class="avatar" :style="{ background: avatarColor(conge.employe?.nom) }">
                    {{ initiales(conge.employe?.nom, conge.employe?.prenom) }}
                  </div>
                  <div>
                    <div class="emp-name">{{ conge.employe?.prenom }} {{ conge.employe?.nom }}</div>
                    <div class="emp-email">{{ conge.employe?.email || '—' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="periode">
                  <span class="pd">{{ formatDate(conge.dateDebut) }}</span>
                  <span class="arr">→</span>
                  <span class="pd">{{ formatDate(conge.dateFin) }}</span>
                </div>
              </td>
              <td><span class="dur-badge">{{ duree(conge.dateDebut, conge.dateFin) }}j</span></td>
              <td><span class="motif">{{ conge.motif || '—' }}</span></td>
              <td>
                <a v-if="conge.fichier" :href="`${apiUrl}/uploads/${conge.fichier}`" target="_blank" class="file-link">📎 Voir</a>
                <span v-else class="no-data">—</span>
              </td>
              <td>
                <span :class="['status-badge', statusClass(conge.statut)]">
                  {{ statusIcon(conge.statut) }} {{ conge.statut }}
                </span>
              </td>
              <td>
                <div class="act-btns">
                  <button v-if="conge.statut === 'en attente'" @click="changerStatut(conge._id, 'approuvé')" class="abtn abtn-ok" title="Approuver">✅</button>
                  <button v-if="conge.statut === 'en attente'" @click="changerStatut(conge._id, 'refusé')"  class="abtn abtn-no" title="Refuser">✗</button>
                  <button @click="supprimerDemande(conge._id)" class="abtn abtn-del" title="Supprimer">🗑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TOAST -->
    <transition name="toast">
      <div v-if="toast.visible" :class="['toast', `toast-${toast.type}`]">
        <span>{{ toast.type === 'success' ? '✅' : '❌' }}</span>
        {{ toast.message }}
      </div>
    </transition>

  </div>
</template>

<script>
import axios from '../axios';

const MOIS = [
  { short: 'Jan', label: 'Janvier' }, { short: 'Fév', label: 'Février' },
  { short: 'Mar', label: 'Mars' },    { short: 'Avr', label: 'Avril' },
  { short: 'Mai', label: 'Mai' },     { short: 'Jun', label: 'Juin' },
  { short: 'Jul', label: 'Juillet' }, { short: 'Aoû', label: 'Août' },
  { short: 'Sep', label: 'Septembre'},{ short: 'Oct', label: 'Octobre' },
  { short: 'Nov', label: 'Novembre' },{ short: 'Déc', label: 'Décembre' },
];

const AVATAR_COLORS = [
  'linear-gradient(135deg,#4f46e5,#7c3aed)',
  'linear-gradient(135deg,#0891b2,#0e7490)',
  'linear-gradient(135deg,#be185d,#9d174d)',
  'linear-gradient(135deg,#b45309,#92400e)',
  'linear-gradient(135deg,#047857,#065f46)',
  'linear-gradient(135deg,#7c3aed,#5b21b6)',
];

export default {
  name: 'DashboardResponsable',
  data() {
    return {
      conges: [],
      chargement: true,
      recherche: '',
      filtreStatut: 'tous',
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      toast: { visible: false, message: '', type: 'success' },
    };
  },

  computed: {
    todayLabel() {
      return new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    },
    nbAttente()  { return this.conges.filter(c => c.statut === 'en attente').length; },
    nbApprouve() { return this.conges.filter(c => c.statut === 'approuvé').length; },
    nbRefuse()   { return this.conges.filter(c => c.statut === 'refusé').length; },

    legendItems() {
      return [
        { label: 'Approuvées', color: '#4ade80', count: this.nbApprouve },
        { label: 'En attente', color: '#fb923c', count: this.nbAttente },
        { label: 'Refusées',   color: '#f87171', count: this.nbRefuse },
      ];
    },

    tabs() {
      return [
        { val: 'tous',       label: 'Tous',       count: this.conges.length },
        { val: 'en attente', label: 'En attente', count: this.nbAttente },
        { val: 'approuvé',   label: 'Approuvées', count: this.nbApprouve },
        { val: 'refusé',     label: 'Refusées',   count: this.nbRefuse },
      ];
    },

    congesFiltres() {
      return this.conges.filter(c => {
        const okStatut  = this.filtreStatut === 'tous' || c.statut === this.filtreStatut;
        const q         = this.recherche.toLowerCase();
        const okSearch  = !q
          || (c.employe?.nom    || '').toLowerCase().includes(q)
          || (c.employe?.prenom || '').toLowerCase().includes(q)
          || (c.employe?.email  || '').toLowerCase().includes(q);
        return okStatut && okSearch;
      });
    },

    moisData() {
      const annee = new Date().getFullYear();
      const moisCourant = new Date().getMonth();
      return MOIS.map(({ short, label }, i) => {
        const count = this.conges.filter(c => {
          const d = new Date(c.dateDebut);
          return d.getFullYear() === annee && d.getMonth() === i;
        }).length;
        return { short, label, count, isCurrentMonth: i === moisCourant };
      });
    },

    donutApprouve() {
      const circ = 301.6, t = this.conges.length || 1;
      return { strokeDasharray: `${(this.nbApprouve/t)*circ} ${circ}`, strokeDashoffset: '0' };
    },
    donutAttente() {
      const circ = 301.6, t = this.conges.length || 1;
      return {
        strokeDasharray: `${(this.nbAttente/t)*circ} ${circ}`,
        strokeDashoffset: -((this.nbApprouve/t)*circ)
      };
    },
    donutRefuse() {
      const circ = 301.6, t = this.conges.length || 1;
      return {
        strokeDasharray: `${(this.nbRefuse/t)*circ} ${circ}`,
        strokeDashoffset: -(((this.nbApprouve+this.nbAttente)/t)*circ)
      };
    },
  },

  methods: {
    async chargerConges() {
      this.chargement = true;
      try {
        const res = await axios.get('/conges');
        this.conges = res.data;
      } catch {
        this.showToast('Erreur lors du chargement', 'error');
      } finally {
        this.chargement = false;
      }
    },

    async changerStatut(id, statut) {
      try {
        await axios.put(`/conges/${id}`, { statut });
        await this.chargerConges();
        this.showToast(`Demande ${statut} avec succès`, 'success');
      } catch {
        this.showToast('Erreur lors de la mise à jour', 'error');
      }
    },

    async supprimerDemande(id) {
      if (!confirm('Supprimer cette demande définitivement ?')) return;
      try {
        await axios.delete(`/conges/admin/${id}`);
        await this.chargerConges();
        this.showToast('Demande supprimée', 'success');
      } catch {
        this.showToast('Impossible de supprimer', 'error');
      }
    },

    formatDate(d) {
      return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
    },
    duree(debut, fin) {
      return Math.max(1, Math.round((new Date(fin) - new Date(debut)) / 86400000) + 1);
    },
    initiales(nom, prenom) {
      return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || '?';
    },
    avatarColor(nom) {
      return AVATAR_COLORS[(nom || '').charCodeAt(0) % AVATAR_COLORS.length];
    },
    pct(val) {
      const t = this.conges.length;
      return t ? Math.round((val / t) * 100) : 0;
    },
    barHeight(count) {
      const max = Math.max(...this.moisData.map(m => m.count), 1);
      return Math.round((count / max) * 100);
    },
    statusClass(s) {
      return s === 'approuvé' ? 's-ok' : s === 'refusé' ? 's-no' : 's-wait';
    },
    statusIcon(s) {
      return s === 'approuvé' ? '✓' : s === 'refusé' ? '✗' : '⏳';
    },
    showToast(message, type = 'success') {
      this.toast = { visible: true, message, type };
      setTimeout(() => { this.toast.visible = false; }, 3500);
    },
  },

  mounted() { this.chargerConges(); }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

.db {
  font-family: 'Sora', sans-serif;
  background: #0a0f1e;
  min-height: 100vh;
  padding: 28px 32px 60px;
  color: #e2e8f0;
}

/* TOPBAR */
.topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
.breadcrumb { font-size:11px; color:#4a5568; letter-spacing:.12em; text-transform:uppercase; font-weight:600; margin-bottom:5px; }
.page-title { font-size:28px; font-weight:800; color:#f7fafc; letter-spacing:-.025em; margin:0; }
.topbar-right { display:flex; align-items:center; gap:12px; }
.date-pill { background:#111827; border:1px solid #1e293b; border-radius:99px; padding:9px 18px; font-size:12px; color:#94a3b8; font-weight:500; text-transform:capitalize; }
.notif-btn { position:relative; width:42px; height:42px; background:#111827; border:1px solid #1e293b; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; cursor:pointer; transition:border-color .2s; }
.notif-btn:hover { border-color:#4f46e5; }
.notif-dot { position:absolute; top:-5px; right:-5px; width:18px; height:18px; background:#f43f5e; border-radius:50%; border:2px solid #0a0f1e; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:white; }

/* KPI */
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
.kpi { border-radius:20px; padding:24px; position:relative; overflow:hidden; cursor:pointer; transition:transform .25s, box-shadow .25s; }
.kpi:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,.4); }
.kpi-total { background:linear-gradient(145deg,#1e1b4b,#312e81); border:1px solid rgba(99,102,241,.25); }
.kpi-wait  { background:linear-gradient(145deg,#1c1007,#431407); border:1px solid rgba(234,88,12,.2); }
.kpi-ok    { background:linear-gradient(145deg,#052e16,#14532d); border:1px solid rgba(22,163,74,.2); }
.kpi-no    { background:linear-gradient(145deg,#1a0a0a,#450a0a); border:1px solid rgba(220,38,38,.2); }
.kpi-glow  { position:absolute; top:-24px; right:-24px; width:90px; height:90px; border-radius:50%; opacity:.2; pointer-events:none; }
.kpi-total .kpi-glow { background:#818cf8; }
.kpi-wait  .kpi-glow { background:#fb923c; }
.kpi-ok    .kpi-glow { background:#4ade80; }
.kpi-no    .kpi-glow { background:#f87171; }
.kpi-icon-wrap { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:18px; }
.kpi-total .kpi-icon-wrap { background:rgba(79,70,229,.25); }
.kpi-wait  .kpi-icon-wrap { background:rgba(234,88,12,.25); }
.kpi-ok    .kpi-icon-wrap { background:rgba(22,163,74,.25); }
.kpi-no    .kpi-icon-wrap { background:rgba(220,38,38,.25); }
.kpi-val  { font-size:38px; font-weight:800; letter-spacing:-.04em; color:#f8fafc; line-height:1; }
.kpi-lbl  { font-size:11px; color:#94a3b8; font-weight:600; margin-top:5px; text-transform:uppercase; letter-spacing:.08em; }
.kpi-trend { position:absolute; bottom:18px; right:18px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:99px; }
.kpi-total .kpi-trend { background:rgba(79,70,229,.3);  color:#a5b4fc; }
.kpi-wait  .kpi-trend { background:rgba(234,88,12,.3);  color:#fb923c; }
.kpi-ok    .kpi-trend { background:rgba(22,163,74,.3);  color:#4ade80; }
.kpi-no    .kpi-trend { background:rgba(220,38,38,.3);  color:#f87171; }

/* GRID */
.main-grid { display:grid; grid-template-columns:1fr 2fr; gap:20px; margin-bottom:24px; }

/* CARD */
.card { background:#111827; border:1px solid #1e293b; border-radius:20px; overflow:hidden; }
.card-hd { padding:20px 24px 16px; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
.card-title { font-size:15px; font-weight:700; color:#f1f5f9; }
.card-sub { font-size:12px; color:#475569; background:#1e293b; padding:3px 12px; border-radius:99px; font-weight:500; }

/* DONUT */
.donut-area { display:flex; flex-direction:column; align-items:center; padding:24px 20px; gap:22px; }
.donut-svg { width:150px; height:150px; }
.donut-val { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; fill:#f8fafc; }
.donut-lbl { font-family:'Sora',sans-serif; font-size:9px; fill:#475569; font-weight:500; }
.legend { display:flex; flex-direction:column; gap:12px; width:100%; }
.leg-block { display:flex; flex-direction:column; gap:5px; }
.leg-row { display:flex; align-items:center; gap:10px; }
.leg-dot { width:10px; height:10px; border-radius:3px; flex-shrink:0; }
.leg-name { flex:1; font-size:13px; color:#94a3b8; font-weight:500; }
.leg-pct { font-size:13px; font-weight:700; color:#f1f5f9; }
.leg-bar-track { width:100%; height:3px; background:#1e293b; border-radius:99px; overflow:hidden; }
.leg-bar-fill { height:100%; border-radius:99px; transition:width .6s ease; }

/* BARS */
.bar-zone { padding:16px 24px 20px; height:200px; display:flex; align-items:flex-end; gap:7px; }
.bcol { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; height:100%; }
.bwrap { flex:1; display:flex; align-items:flex-end; width:100%; }
.bar { width:100%; min-height:4px; border-radius:6px 6px 0 0; transition:height .4s ease, opacity .2s; cursor:pointer; }
.bar:hover { opacity:.7; }
.blbl { font-size:10px; color:#334155; font-weight:600; }

/* TABLE */
.filters { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.sbox { display:flex; align-items:center; gap:8px; background:#1e293b; border:1px solid #334155; border-radius:10px; padding:8px 14px; transition:border-color .2s; }
.sbox:focus-within { border-color:#4f46e5; }
.s-icon { font-size:13px; color:#475569; }
.s-input { background:none; border:none; outline:none; font-size:13px; font-family:'Sora',sans-serif; color:#e2e8f0; width:190px; }
.s-input::placeholder { color:#475569; }
.tabs { display:flex; gap:4px; flex-wrap:wrap; }
.tab { padding:7px 16px; border-radius:10px; font-size:12px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; border:1px solid #334155; background:transparent; color:#64748b; transition:all .2s; display:flex; align-items:center; gap:6px; }
.tab:hover { background:#1e293b; color:#94a3b8; }
.tab.on { background:#4f46e5; color:white; border-color:#4f46e5; }
.tab-badge { background:rgba(255,255,255,.15); border-radius:99px; padding:1px 7px; font-size:11px; }
.tab:not(.on) .tab-badge { background:#1e293b; color:#475569; }

.loader-wrap { display:flex; flex-direction:column; align-items:center; padding:60px; gap:14px; color:#475569; font-size:13px; }
.spinner { width:34px; height:34px; border:3px solid #1e293b; border-top-color:#4f46e5; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.empty { display:flex; flex-direction:column; align-items:center; padding:70px; gap:12px; color:#334155; }
.empty-icon { font-size:42px; }
.empty p { font-size:14px; font-weight:500; }

.tbl-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13px; }
thead tr { background:#0d1422; }
th { padding:13px 22px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#334155; white-space:nowrap; }
.trow { border-bottom:1px solid #0d1422; transition:background .15s; }
.trow:hover { background:#131c30; }
td { padding:15px 22px; vertical-align:middle; }

.emp-cell { display:flex; align-items:center; gap:12px; }
.avatar { width:38px; height:38px; border-radius:11px; color:white; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.emp-name { font-weight:600; color:#f1f5f9; font-size:13px; }
.emp-email { font-size:11px; color:#475569; margin-top:2px; }

.periode { display:flex; align-items:center; gap:6px; }
.pd { font-weight:600; color:#94a3b8; font-size:12px; white-space:nowrap; }
.arr { color:#334155; font-size:12px; }

.dur-badge { background:#1e1b4b; color:#a5b4fc; font-size:11px; font-weight:700; padding:4px 11px; border-radius:99px; white-space:nowrap; border:1px solid rgba(165,180,252,.15); }
.motif { color:#475569; font-size:12px; max-width:130px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
.file-link { color:#818cf8; font-weight:600; font-size:12px; text-decoration:none; }
.file-link:hover { text-decoration:underline; }
.no-data { color:#334155; }

.status-badge { display:inline-flex; align-items:center; gap:4px; padding:5px 13px; border-radius:99px; font-size:11px; font-weight:700; text-transform:capitalize; white-space:nowrap; }
.s-wait { background:rgba(234,88,12,.15);  color:#fb923c; border:1px solid rgba(234,88,12,.2); }
.s-ok   { background:rgba(74,222,128,.1);  color:#4ade80; border:1px solid rgba(74,222,128,.2); }
.s-no   { background:rgba(248,113,113,.1); color:#f87171; border:1px solid rgba(248,113,113,.2); }

.act-btns { display:flex; gap:6px; }
.abtn { width:32px; height:32px; border:1px solid #1e293b; border-radius:9px; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; background:#1e293b; color:#94a3b8; transition:transform .15s, background .15s; font-family:inherit; }
.abtn:hover { transform:scale(1.15); }
.abtn-ok:hover  { background:rgba(74,222,128,.15);  border-color:rgba(74,222,128,.3); }
.abtn-no:hover  { background:rgba(248,113,113,.15); border-color:rgba(248,113,113,.3); color:#f87171; }
.abtn-del:hover { background:rgba(71,85,105,.3); }

/* TOAST */
.toast { position:fixed; bottom:28px; right:28px; padding:14px 22px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; z-index:9999; }
.toast-success { background:#052e16; color:#4ade80; border:1px solid rgba(74,222,128,.2); box-shadow:0 4px 24px rgba(74,222,128,.15); }
.toast-error   { background:#1a0a0a; color:#f87171; border:1px solid rgba(248,113,113,.2); box-shadow:0 4px 24px rgba(248,113,113,.15); }
.toast-enter-active, .toast-leave-active { transition:all .35s cubic-bezier(.34,1.56,.64,1); }
.toast-enter-from, .toast-leave-to { opacity:0; transform:translateY(20px) scale(.95); }

/* RESPONSIVE */
@media (max-width:1100px) { .kpi-grid{grid-template-columns:repeat(2,1fr);} .main-grid{grid-template-columns:1fr;} }
@media (max-width:700px)  { .db{padding:16px 14px 50px;} .kpi-grid{grid-template-columns:repeat(2,1fr);gap:12px;} .page-title{font-size:22px;} .topbar{flex-direction:column;align-items:flex-start;} .filters{flex-direction:column;align-items:flex-start;width:100%;} .s-input{width:100%;} .tabs{flex-wrap:wrap;} }
</style>
