<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Employé</div>
        <h1 class="page-title">Mes demandes</h1>
      </div>
      <div class="topbar-right">
        <button class="export-btn" @click="exportMesConges" title="Exporter en Excel">
          📊 Exporter
        </button>
        <div class="date-pill">📅 {{ todayLabel }}</div>
      </div>
    </div>

    <!-- KPI CARDS -->
    <div class="kpi-grid">
      <div class="kpi kpi-total">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">📋</div>
        <div class="kpi-val">{{ conges.length }}</div>
        <div class="kpi-lbl">Total</div>
        <div class="kpi-trend">Historique</div>
      </div>
      <div class="kpi kpi-wait">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">⏳</div>
        <div class="kpi-val">{{ nbAttente }}</div>
        <div class="kpi-lbl">En attente</div>
        <div class="kpi-trend">En cours</div>
      </div>
      <div class="kpi kpi-ok">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">✅</div>
        <div class="kpi-val">{{ nbApprouve }}</div>
        <div class="kpi-lbl">Approuvées</div>
        <div class="kpi-trend">{{ pct(nbApprouve) }}%</div>
      </div>
      <div class="kpi kpi-no">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">✗</div>
        <div class="kpi-val">{{ nbRefuse }}</div>
        <div class="kpi-lbl">Refusées</div>
        <div class="kpi-trend">{{ pct(nbRefuse) }}%</div>
      </div>
    </div>

    <!-- TABLEAU -->
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Historique complet</span>
        <div class="filters">
          <div class="sbox">
            <span class="s-icon">🔍</span>
            <input
              v-model="recherche"
              type="text"
              placeholder="Rechercher par motif…"
              class="s-input"
            />
          </div>
          <div class="tabs">
            <button
              v-for="tab in tabs" :key="tab.val"
              :class="['tab', { on: filtre === tab.val }]"
              @click="filtre = tab.val"
            >
              {{ tab.label }}
              <span class="tab-badge" v-if="tab.count > 0">{{ tab.count }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loader -->
      <div class="loader-wrap" v-if="chargement">
        <div class="spinner"></div>
        <span>Chargement…</span>
      </div>

      <!-- Empty -->
      <div class="empty" v-else-if="!congesFiltres.length">
        <div class="empty-icon">📭</div>
        <p>Aucune demande trouvée</p>
        <span>{{ filtre !== 'tous' ? 'Essayez un autre filtre' : 'Soumettez votre première demande depuis le dashboard' }}</span>
      </div>

      <!-- Table -->
      <div class="tbl-wrap" v-else>
        <table>
          <thead>
            <tr>
              <th>Période</th>
              <th>Durée</th>
              <th>Motif</th>
              <th>Pièce jointe</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr class="trow" v-for="conge in congesFiltres" :key="conge._id">
              <td>
                <div class="periode">
                  <span class="pd">{{ formatDate(conge.dateDebut) }}</span>
                  <span class="arr">→</span>
                  <span class="pd">{{ formatDate(conge.dateFin) }}</span>
                </div>
              </td>
              <td>
                <span class="dur-badge">{{ duree(conge.dateDebut, conge.dateFin) }}j</span>
              </td>
              <td>
                <span class="motif-text">{{ conge.motif || '—' }}</span>
              </td>
              <td>
                <a
                  v-if="conge.fichier"
                  :href="`${apiUrl}/uploads/${conge.fichier}`"
                  target="_blank"
                  class="file-link"
                >📎 Voir</a>
                <span v-else class="no-data">—</span>
              </td>
              <td>
                <span :class="['status-badge', statusClass(conge.statut)]">
                  {{ statusIcon(conge.statut) }} {{ conge.statut }}
                </span>
              </td>
              <td>
                <button
                  v-if="conge.statut === 'en attente'"
                  @click="supprimer(conge._id)"
                  class="btn-del"
                  title="Supprimer"
                >🗑 Supprimer</button>
                <span v-else class="no-data">—</span>
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

export default {
  name: 'MesDemandes',
  data() {
    return {
      conges: [],
      chargement: true,
      recherche: '',
      filtre: 'tous',
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
        const okStatut = this.filtre === 'tous' || c.statut === this.filtre;
        const q = this.recherche.toLowerCase();
        const okSearch = !q || (c.motif || '').toLowerCase().includes(q);
        return okStatut && okSearch;
      });
    },
  },

  methods: {
    async chargerDemandes() {
      this.chargement = true;
      try {
        const res = await axios.get('/conges/mes');
        this.conges = res.data;
      } catch {
        this.showToast('Erreur lors du chargement', 'error');
      } finally {
        this.chargement = false;
      }
    },

    async supprimer(id) {
      if (!confirm('Supprimer cette demande ?')) return;
      try {
        await axios.delete(`/conges/${id}`);
        await this.chargerDemandes();
        this.showToast('Demande supprimée', 'success');
      } catch {
        this.showToast('Erreur lors de la suppression', 'error');
      }
    },

    formatDate(d) {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    duree(debut, fin) {
      return Math.max(1, Math.round((new Date(fin) - new Date(debut)) / 86400000) + 1);
    },
    pct(val) {
      const t = this.conges.length;
      return t ? Math.round((val / t) * 100) : 0;
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

    async exportMesConges() {
      try {
        const res = await axios.get('/export/excel/mes', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `mes_conges_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showToast('Export téléchargé', 'success');
      } catch {
        this.showToast('Erreur export', 'error');
      }
    },
  },

  mounted() { this.chargerDemandes(); }
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
.date-pill { background:#111827; border:1px solid #1e293b; border-radius:99px; padding:9px 18px; font-size:12px; color:#94a3b8; font-weight:500; text-transform:capitalize; }
.export-btn { padding:8px 16px; border-radius:10px; border:1px solid #334155; background:#111827; color:#94a3b8; font-size:12px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:6px; }
.export-btn:hover { border-color:#16a34a; color:#4ade80; background:rgba(74,222,128,.08); transform:translateY(-1px); }

/* KPI */
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
.kpi { border-radius:20px; padding:24px; position:relative; overflow:hidden; transition:transform .25s, box-shadow .25s; }
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

/* CARD */
.card { background:#111827; border:1px solid #1e293b; border-radius:20px; overflow:hidden; }
.card-hd { padding:20px 24px 16px; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.card-title { font-size:15px; font-weight:700; color:#f1f5f9; }

/* Filters */
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

/* States */
.loader-wrap { display:flex; flex-direction:column; align-items:center; padding:60px; gap:14px; color:#475569; font-size:13px; }
.spinner { width:32px; height:32px; border:3px solid #1e293b; border-top-color:#4f46e5; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.empty { display:flex; flex-direction:column; align-items:center; padding:70px 20px; gap:8px; color:#334155; text-align:center; }
.empty-icon { font-size:42px; }
.empty p { font-size:14px; font-weight:600; color:#475569; }
.empty span { font-size:12px; color:#334155; }

/* Table */
.tbl-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13px; }
thead tr { background:#0d1422; }
th { padding:13px 22px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#334155; white-space:nowrap; }
.trow { border-bottom:1px solid #0d1422; transition:background .15s; }
.trow:hover { background:#131c30; }
td { padding:15px 22px; vertical-align:middle; }

.periode { display:flex; align-items:center; gap:6px; }
.pd { font-weight:600; color:#94a3b8; font-size:12px; white-space:nowrap; }
.arr { color:#334155; font-size:12px; }
.dur-badge { background:#1e1b4b; color:#a5b4fc; font-size:11px; font-weight:700; padding:4px 11px; border-radius:99px; border:1px solid rgba(165,180,252,.15); white-space:nowrap; }
.motif-text { color:#475569; font-size:12px; max-width:160px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
.file-link { color:#818cf8; font-weight:600; font-size:12px; text-decoration:none; }
.file-link:hover { text-decoration:underline; }
.no-data { color:#334155; }

.status-badge { display:inline-flex; align-items:center; gap:4px; padding:5px 13px; border-radius:99px; font-size:11px; font-weight:700; text-transform:capitalize; white-space:nowrap; }
.s-wait { background:rgba(234,88,12,.15);  color:#fb923c; border:1px solid rgba(234,88,12,.2); }
.s-ok   { background:rgba(74,222,128,.1);  color:#4ade80; border:1px solid rgba(74,222,128,.2); }
.s-no   { background:rgba(248,113,113,.1); color:#f87171; border:1px solid rgba(248,113,113,.2); }

.btn-del { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; border:1px solid rgba(248,113,113,.2); background:rgba(248,113,113,.08); color:#f87171; font-size:12px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; transition:all .2s; white-space:nowrap; }
.btn-del:hover { background:rgba(248,113,113,.18); border-color:rgba(248,113,113,.35); transform:scale(1.03); }

/* Toast */
.toast { position:fixed; bottom:28px; right:28px; padding:14px 22px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; z-index:9999; }
.toast-success { background:#052e16; color:#4ade80; border:1px solid rgba(74,222,128,.2); box-shadow:0 4px 24px rgba(74,222,128,.15); }
.toast-error   { background:#1a0a0a; color:#f87171; border:1px solid rgba(248,113,113,.2); box-shadow:0 4px 24px rgba(248,113,113,.15); }
.toast-enter-active, .toast-leave-active { transition:all .35s cubic-bezier(.34,1.56,.64,1); }
.toast-enter-from, .toast-leave-to { opacity:0; transform:translateY(20px) scale(.95); }

/* Responsive */
@media (max-width:1100px) { .kpi-grid { grid-template-columns:repeat(2,1fr); } }
@media (max-width:700px)  { .db{padding:16px 14px 50px;} .kpi-grid{grid-template-columns:repeat(2,1fr);gap:12px;} .page-title{font-size:22px;} .topbar{flex-direction:column;align-items:flex-start;} .filters{flex-direction:column;align-items:flex-start;width:100%;} .s-input{width:100%;} }
</style>