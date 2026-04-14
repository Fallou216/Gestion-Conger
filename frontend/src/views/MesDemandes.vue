<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Employé</div>
        <h1 class="page-title">Mes demandes</h1>
      </div>
      <div class="topbar-right">
        <div class="solde-pill" v-if="soldeInfo">
          🌴 Solde : <strong>{{ soldeInfo.solde }}j</strong> / {{ soldeInfo.droitAnnuel }}j
        </div>
        <button class="export-btn" @click="exportMesConges" title="Exporter en Excel">📊 Excel</button>
        <div class="date-pill">📅 {{ todayLabel }}</div>
      </div>
    </div>

    <!-- KPI -->
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
        <div class="kpi-icon-wrap">❌</div>
        <div class="kpi-val">{{ nbRefuse }}</div>
        <div class="kpi-lbl">Refusées</div>
        <div class="kpi-trend">{{ pct(nbRefuse) }}%</div>
      </div>
    </div>

    <div class="main-grid">

      <!-- TABLEAU -->
      <div class="card">
        <div class="card-hd">
          <span class="card-title">Historique complet</span>
          <span class="card-sub">{{ congesFiltres.length }} résultat{{ congesFiltres.length > 1 ? 's' : '' }}</span>
        </div>

        <!-- FILTRES -->
        <div class="filter-bar">
          <div class="sbox">
            <span class="s-icon">🔍</span>
            <input v-model="recherche" type="text" placeholder="Rechercher…" class="s-input" />
          </div>
          <div class="tabs">
            <button v-for="tab in tabsStatut" :key="tab.val" :class="['tab', { on: filtre === tab.val }]" @click="filtre = tab.val">
              {{ tab.label }}
              <span class="tab-badge" v-if="tab.count > 0">{{ tab.count }}</span>
            </button>
          </div>
          <div class="tabs cat-tabs">
            <button v-for="tab in tabsCat" :key="tab.val" :class="['tab tab-cat', { on: filtreCat === tab.val }]" @click="filtreCat = tab.val">
              {{ tab.icon }} {{ tab.label }}
            </button>
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
          <span class="empty-sub">{{ filtre !== 'tous' || filtreCat !== 'tous' ? 'Essayez un autre filtre' : 'Soumettez votre première demande' }}</span>
        </div>

        <!-- Table -->
        <div class="tbl-wrap" v-else>
          <table>
            <thead>
              <tr>
                <th @click="toggleSort('dateDebut')" class="sortable">Période {{ sortIcon('dateDebut') }}</th>
                <th>Durée</th>
                <th>Catégorie</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr class="trow" v-for="conge in congesPagines" :key="conge._id"
                :class="{ selected: selectedId === conge._id }"
                @click="selectConge(conge)">
                <td>
                  <div class="periode">
                    <span class="pd">{{ formatDate(conge.dateDebut) }}</span>
                    <span class="arr">→</span>
                    <span class="pd">{{ formatDate(conge.dateFin) }}</span>
                  </div>
                </td>
                <td><span class="dur-badge">{{ conge.dureeJours || duree(conge.dateDebut, conge.dateFin) }}j</span></td>
                <td>
                  <span class="cat-badge" :class="'cat-' + (conge.categorie || 'annuel')">
                    {{ catIcon(conge.categorie) }} {{ catLabel(conge.categorie) }}
                  </span>
                </td>
                <td><span class="motif-text">{{ conge.motif?.substring(0, 25) || '—' }}{{ conge.motif?.length > 25 ? '…' : '' }}</span></td>
                <td>
                  <span :class="['status-badge', statusClass(conge.statut)]">
                    {{ statusIcon(conge.statut) }} {{ conge.statut }}
                  </span>
                </td>
                <td>
                  <button v-if="conge.statut === 'en attente'" @click.stop="supprimer(conge._id)" class="btn-del" title="Supprimer">🗑</button>
                  <span v-else class="no-data">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div class="pagination" v-if="totalPages > 1">
          <button class="pag-btn" :disabled="page <= 1" @click="page--">← Précédent</button>
          <span class="pag-info">Page {{ page }} / {{ totalPages }}</span>
          <button class="pag-btn" :disabled="page >= totalPages" @click="page++">Suivant →</button>
        </div>
      </div>

      <!-- PANNEAU DÉTAIL -->
      <transition name="slide">
        <div class="card detail-panel" v-if="selected">
          <div class="card-hd">
            <span class="card-title">Détails</span>
            <button class="close-btn" @click="selected = null; selectedId = null">✕</button>
          </div>
          <div class="detail-body">

            <div class="detail-status-bar" :class="'dsb-' + statusKey(selected.statut)">
              <span>{{ statusIcon(selected.statut) }}</span>
              <span>{{ selected.statut }}</span>
            </div>

            <div class="d-row">
              <span class="d-label">Catégorie</span>
              <span class="cat-badge" :class="'cat-' + (selected.categorie || 'annuel')">
                {{ catIcon(selected.categorie) }} {{ catLabel(selected.categorie) }}
              </span>
            </div>

            <div class="d-row" v-if="selected.periodeAnnuel && selected.categorie === 'annuel'">
              <span class="d-label">Période</span>
              <span class="d-val">{{ periodeLabel(selected.periodeAnnuel) }}</span>
            </div>

            <div class="d-row" v-if="selected.motifExceptionnel">
              <span class="d-label">Motif exceptionnel</span>
              <span class="d-val">{{ excLabel(selected.motifExceptionnel) }}</span>
            </div>

            <div class="d-row">
              <span class="d-label">Date début</span>
              <span class="d-val">{{ formatDateLong(selected.dateDebut) }}</span>
            </div>
            <div class="d-row">
              <span class="d-label">Date fin</span>
              <span class="d-val">{{ formatDateLong(selected.dateFin) }}</span>
            </div>
            <div class="d-row">
              <span class="d-label">Durée</span>
              <span class="d-val d-highlight">{{ selected.dureeJours || duree(selected.dateDebut, selected.dateFin) }} jour(s)</span>
            </div>
            <div class="d-row">
              <span class="d-label">Motif</span>
              <span class="d-val">{{ selected.motif || '—' }}</span>
            </div>
            <div class="d-row">
              <span class="d-label">Date de demande</span>
              <span class="d-val">{{ formatDateLong(selected.dateDemande || selected.createdAt) }}</span>
            </div>
            <div class="d-row" v-if="selected.fichier">
              <span class="d-label">Justificatif</span>
              <a :href="`${apiUrl}/uploads/${selected.fichier}`" target="_blank" class="file-link">📎 Voir le fichier</a>
            </div>

            <button v-if="selected.statut === 'en attente'" class="btn-del-full" @click="supprimer(selected._id)">
              🗑 Supprimer cette demande
            </button>
          </div>
        </div>
      </transition>
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
      conges: [], chargement: true,
      recherche: '', filtre: 'tous', filtreCat: 'tous',
      sortField: 'dateDebut', sortAsc: false,
      page: 1, perPage: 10,
      selected: null, selectedId: null,
      soldeInfo: null,
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      toast: { visible: false, message: '', type: 'success' },
    };
  },
  computed: {
    todayLabel() { return new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }); },
    nbAttente() { return this.conges.filter(c => c.statut === 'en attente').length; },
    nbApprouve() { return this.conges.filter(c => c.statut === 'approuvé').length; },
    nbRefuse() { return this.conges.filter(c => c.statut === 'refusé').length; },

    tabsStatut() {
      return [
        { val: 'tous', label: 'Tous', count: this.conges.length },
        { val: 'en attente', label: 'En attente', count: this.nbAttente },
        { val: 'approuvé', label: 'Approuvées', count: this.nbApprouve },
        { val: 'refusé', label: 'Refusées', count: this.nbRefuse },
      ];
    },
    tabsCat() {
      return [
        { val: 'tous', label: 'Tous', icon: '📋' },
        { val: 'annuel', label: 'Annuel', icon: '🌴' },
        { val: 'exceptionnel', label: 'Except.', icon: '⭐' },
        { val: 'autre', label: 'Autre', icon: '📝' },
      ];
    },

    congesFiltres() {
      let result = this.conges.filter(c => {
        const okStatut = this.filtre === 'tous' || c.statut === this.filtre;
        const okCat = this.filtreCat === 'tous' || (c.categorie || 'annuel') === this.filtreCat;
        const q = this.recherche.toLowerCase();
        const okSearch = !q || (c.motif || '').toLowerCase().includes(q)
          || (c.categorie || '').toLowerCase().includes(q)
          || (c.motifExceptionnel || '').toLowerCase().includes(q);
        return okStatut && okCat && okSearch;
      });

      // Tri
      result.sort((a, b) => {
        const va = new Date(a[this.sortField] || a.dateDebut);
        const vb = new Date(b[this.sortField] || b.dateDebut);
        return this.sortAsc ? va - vb : vb - va;
      });

      return result;
    },

    totalPages() { return Math.ceil(this.congesFiltres.length / this.perPage); },
    congesPagines() {
      const start = (this.page - 1) * this.perPage;
      return this.congesFiltres.slice(start, start + this.perPage);
    },
  },

  watch: {
    filtre() { this.page = 1; },
    filtreCat() { this.page = 1; },
    recherche() { this.page = 1; },
  },

  methods: {
    async chargerDemandes() {
      this.chargement = true;
      try {
        const res = await axios.get('/conges/mes');
        this.conges = res.data;
      } catch { this.showToast('Erreur chargement', 'error'); }
      finally { this.chargement = false; }
    },
    async chargerSolde() {
      try { const res = await axios.get('/conges/solde'); this.soldeInfo = res.data; } catch {}
    },

    async supprimer(id) {
      if (!confirm('Supprimer cette demande ?')) return;
      try {
        await axios.delete(`/conges/${id}`);
        if (this.selectedId === id) { this.selected = null; this.selectedId = null; }
        await this.chargerDemandes();
        await this.chargerSolde();
        this.showToast('Demande supprimée', 'success');
      } catch { this.showToast('Erreur suppression', 'error'); }
    },

    selectConge(c) { this.selected = c; this.selectedId = c._id; },
    toggleSort(field) {
      if (this.sortField === field) this.sortAsc = !this.sortAsc;
      else { this.sortField = field; this.sortAsc = true; }
    },
    sortIcon(field) { return this.sortField === field ? (this.sortAsc ? '↑' : '↓') : ''; },

    catLabel(cat) { return cat === 'exceptionnel' ? 'Except.' : cat === 'autre' ? 'Autre' : 'Annuel'; },
    catIcon(cat) { return cat === 'exceptionnel' ? '⭐' : cat === 'autre' ? '📝' : '🌴'; },
    periodeLabel(p) {
      const labels = { totalite: 'Totalité', partie: 'Une partie', matinee: 'Matinée', apres_midi: 'Après-midi', journee: 'Journée entière' };
      return labels[p] || p;
    },
    excLabel(m) {
      const labels = {
        mariage_employe: 'Mariage de l\'employé', mariage_enfant_frere_soeur: 'Mariage enfant/frère/sœur',
        deces_conjoint_descendant: 'Décès conjoint/descendant', deces_ascendant_frere_soeur: 'Décès ascendant/frère/sœur',
        deces_beau_pere_belle_mere: 'Décès beau-père/belle-mère', naissance_enfant: 'Naissance d\'un enfant',
        bapteme_enfant: 'Baptême', premiere_communion: 'Première communion', hospitalisation_famille: 'Hospitalisation famille',
      };
      return labels[m] || m;
    },
    statusKey(s) { return s === 'approuvé' ? 'ok' : s === 'refusé' ? 'no' : 'wait'; },
    statusClass(s) { return 's-' + this.statusKey(s); },
    statusIcon(s) { return s === 'approuvé' ? '✓' : s === 'refusé' ? '✗' : '⏳'; },
    formatDate(d) { return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }); },
    formatDateLong(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }); },
    duree(a, b) { return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1); },
    pct(v) { return this.conges.length ? Math.round((v / this.conges.length) * 100) : 0; },
    showToast(message, type = 'success') { this.toast = { visible:true, message, type }; setTimeout(() => { this.toast.visible = false; }, 3500); },

    async exportMesConges() {
      try {
        const res = await axios.get('/export/excel/mes', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a'); a.href = url;
        a.download = `mes_conges_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click(); window.URL.revokeObjectURL(url);
        this.showToast('Export téléchargé', 'success');
      } catch { this.showToast('Erreur export', 'error'); }
    },
  },
  mounted() { this.chargerDemandes(); this.chargerSolde(); },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
.db { font-family:'Sora',sans-serif; background:var(--bg-primary,#0a0f1e); min-height:100vh; padding:28px 32px 60px; color:var(--text-secondary,#e2e8f0); }
.topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
.breadcrumb { font-size:11px; color:var(--text-dim); letter-spacing:.12em; text-transform:uppercase; font-weight:600; margin-bottom:5px; }
.page-title { font-size:28px; font-weight:800; color:var(--text-primary); letter-spacing:-.025em; margin:0; }
.topbar-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.date-pill { background:var(--bg-card); border:1px solid var(--border); border-radius:99px; padding:9px 18px; font-size:12px; color:var(--text-muted); font-weight:500; text-transform:capitalize; }
.solde-pill { background:linear-gradient(135deg,#1e1b4b,#312e81); border:1px solid rgba(99,102,241,.3); border-radius:99px; padding:9px 18px; font-size:12px; color:#a5b4fc; font-weight:600; }
.solde-pill strong { color:#c4b5fd; font-weight:800; }
.export-btn { padding:8px 16px; border-radius:10px; border:1px solid var(--border-light,#334155); background:var(--bg-card); color:var(--text-muted); font-size:12px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; transition:all .2s; }
.export-btn:hover { border-color:#16a34a; color:#4ade80; background:rgba(74,222,128,.08); transform:translateY(-1px); }

.main-grid { display:grid; grid-template-columns:1fr 360px; gap:20px; }

/* KPI */
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
.kpi { border-radius:20px; padding:24px; position:relative; overflow:hidden; transition:transform .25s; }
.kpi:hover { transform:translateY(-4px); box-shadow:var(--shadow-lg,0 12px 40px rgba(0,0,0,.4)); }
.kpi-total { background:var(--kpi-indigo,linear-gradient(145deg,#1e1b4b,#312e81)); border:1px solid rgba(99,102,241,.25); }
.kpi-wait { background:var(--kpi-orange,linear-gradient(145deg,#1c1007,#431407)); border:1px solid rgba(234,88,12,.2); }
.kpi-ok { background:var(--kpi-green,linear-gradient(145deg,#052e16,#14532d)); border:1px solid rgba(22,163,74,.2); }
.kpi-no { background:var(--kpi-red,linear-gradient(145deg,#1a0a0a,#450a0a)); border:1px solid rgba(220,38,38,.2); }
.kpi-glow { position:absolute; top:-24px; right:-24px; width:90px; height:90px; border-radius:50%; opacity:.2; }
.kpi-total .kpi-glow { background:#818cf8; } .kpi-wait .kpi-glow { background:#fb923c; } .kpi-ok .kpi-glow { background:#4ade80; } .kpi-no .kpi-glow { background:#f87171; }
.kpi-icon-wrap { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:18px; background:rgba(255,255,255,.08); }
.kpi-val { font-size:36px; font-weight:800; color:var(--text-primary); line-height:1; letter-spacing:-.04em; }
.kpi-lbl { font-size:11px; color:var(--text-muted); font-weight:600; margin-top:5px; text-transform:uppercase; letter-spacing:.08em; }
.kpi-trend { position:absolute; bottom:18px; right:18px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:99px; background:rgba(255,255,255,.06); color:var(--text-dim); }

/* CARD */
.card { background:var(--bg-card,#111827); border:1px solid var(--border,#1e293b); border-radius:20px; overflow:hidden; }
.card-hd { padding:18px 24px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
.card-title { font-size:15px; font-weight:700; color:var(--text-primary); }
.card-sub { font-size:12px; color:var(--text-dim); background:var(--bg-input); padding:3px 12px; border-radius:99px; font-weight:500; }

/* FILTRES */
.filter-bar { padding:16px 24px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; border-bottom:1px solid var(--border); }
.sbox { display:flex; align-items:center; gap:8px; background:var(--bg-input); border:1px solid var(--border-light); border-radius:10px; padding:8px 14px; min-width:200px; }
.s-icon { font-size:14px; } .s-input { background:none; border:none; outline:none; font-size:12px; font-family:'Sora',sans-serif; color:var(--text-secondary); flex:1; }
.s-input::placeholder { color:var(--text-dim); }
.tabs { display:flex; gap:4px; } .cat-tabs { margin-left:auto; }
.tab { padding:6px 12px; border-radius:8px; border:1px solid var(--border-light,#334155); background:none; color:var(--text-dim); font-size:11px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:4px; }
.tab:hover { color:var(--text-primary); border-color:var(--accent); }
.tab.on { background:rgba(79,70,229,.15); color:var(--accent-lighter,#a5b4fc); border-color:var(--accent); }
.tab-badge { font-size:9px; background:rgba(255,255,255,.1); padding:1px 6px; border-radius:99px; }

/* TABLE */
.tbl-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
thead tr { background:var(--bg-table-head,#0d1422); }
th { padding:12px 16px; font-size:11px; font-weight:700; color:var(--text-dark); text-transform:uppercase; letter-spacing:.08em; text-align:left; white-space:nowrap; }
th.sortable { cursor:pointer; user-select:none; }
th.sortable:hover { color:var(--accent-lighter); }
.trow { border-bottom:1px solid rgba(30,41,59,.3); cursor:pointer; transition:background .15s; }
.trow:hover { background:var(--bg-hover,#131c30); }
.trow.selected { background:rgba(79,70,229,.06); border-left:3px solid var(--accent); }
td { padding:14px 16px; font-size:12px; }
.periode { display:flex; align-items:center; gap:6px; } .pd { color:var(--text-secondary); font-weight:600; } .arr { color:var(--text-dark); font-size:10px; }
.dur-badge { background:rgba(79,70,229,.12); color:var(--accent-lighter); font-size:11px; font-weight:700; padding:3px 10px; border-radius:99px; }
.cat-badge { font-size:10px; font-weight:700; padding:3px 10px; border-radius:99px; display:inline-flex; align-items:center; gap:4px; }
.cat-annuel { background:rgba(129,140,248,.12); color:#818cf8; }
.cat-exceptionnel { background:rgba(251,146,60,.12); color:#fb923c; }
.cat-autre { background:rgba(148,163,184,.12); color:#94a3b8; }
.motif-text { color:var(--text-dim); font-size:11px; }
.status-badge { font-size:11px; font-weight:700; padding:4px 12px; border-radius:99px; white-space:nowrap; }
.s-ok { background:rgba(74,222,128,.12); color:#4ade80; } .s-wait { background:rgba(251,146,60,.12); color:#fb923c; } .s-no { background:rgba(248,113,113,.12); color:#f87171; }
.btn-del { border:1px solid rgba(248,113,113,.2); background:rgba(248,113,113,.06); color:#f87171; padding:5px 10px; border-radius:8px; font-size:11px; cursor:pointer; font-family:'Sora',sans-serif; transition:all .2s; }
.btn-del:hover { background:rgba(248,113,113,.15); }
.no-data { color:var(--text-dark); }
.file-link { color:var(--accent-lighter); font-weight:600; font-size:12px; text-decoration:none; }
.file-link:hover { text-decoration:underline; }

/* PAGINATION */
.pagination { display:flex; align-items:center; justify-content:center; gap:16px; padding:16px; border-top:1px solid var(--border); }
.pag-btn { padding:7px 16px; border-radius:8px; border:1px solid var(--border-light); background:var(--bg-input); color:var(--text-muted); font-size:11px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; transition:all .2s; }
.pag-btn:hover:not(:disabled) { border-color:var(--accent); color:var(--accent-lighter); }
.pag-btn:disabled { opacity:.3; cursor:not-allowed; }
.pag-info { font-size:11px; color:var(--text-dim); font-weight:600; }

/* DÉTAIL PANEL */
.detail-panel { position:sticky; top:20px; }
.close-btn { width:28px; height:28px; border-radius:8px; border:1px solid var(--border-light); background:var(--bg-input); color:var(--text-muted); cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; transition:all .15s; font-family:inherit; }
.close-btn:hover { background:rgba(248,113,113,.12); color:#f87171; }
.detail-body { padding:0 24px 24px; }
.detail-status-bar { display:flex; align-items:center; gap:8px; padding:12px 16px; border-radius:12px; margin:16px 0; font-size:13px; font-weight:700; }
.dsb-ok { background:rgba(74,222,128,.1); color:#4ade80; } .dsb-wait { background:rgba(251,146,60,.1); color:#fb923c; } .dsb-no { background:rgba(248,113,113,.1); color:#f87171; }
.d-row { display:flex; align-items:center; justify-content:space-between; padding:11px 0; border-bottom:1px solid rgba(30,41,59,.3); }
.d-row:last-child { border-bottom:none; }
.d-label { font-size:11px; color:var(--text-dim); font-weight:600; }
.d-val { font-size:12px; color:var(--text-secondary); font-weight:600; text-align:right; max-width:60%; }
.d-highlight { color:var(--accent-lighter); font-weight:800; font-size:14px; }
.btn-del-full { width:100%; margin-top:16px; padding:12px; border-radius:10px; border:1px solid rgba(248,113,113,.2); background:rgba(248,113,113,.06); color:#f87171; font-size:13px; font-weight:700; font-family:'Sora',sans-serif; cursor:pointer; transition:all .2s; }
.btn-del-full:hover { background:rgba(248,113,113,.15); }

/* EMPTY */
.empty { display:flex; flex-direction:column; align-items:center; padding:48px; gap:8px; }
.empty-icon { font-size:40px; } .empty p { font-size:14px; color:var(--text-muted); font-weight:700; margin:0; } .empty-sub { font-size:12px; color:var(--text-dim); }
.loader-wrap { display:flex; flex-direction:column; align-items:center; padding:40px; gap:10px; color:var(--text-dim); font-size:12px; }
.spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to{transform:rotate(360deg);} }

/* TRANSITIONS */
.slide-enter-active { animation:slideIn .3s ease; } .slide-leave-active { animation:slideIn .2s ease reverse; }
@keyframes slideIn { from{opacity:0;transform:translateX(16px);} to{opacity:1;transform:translateX(0);} }
.toast { position:fixed; bottom:28px; right:28px; padding:14px 22px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; z-index:9999; font-family:'Sora',sans-serif; }
.toast-success { background:#052e16; color:#4ade80; border:1px solid rgba(74,222,128,.2); } .toast-error { background:#1a0a0a; color:#f87171; border:1px solid rgba(248,113,113,.2); }
.toast-enter-active,.toast-leave-active { transition:all .35s cubic-bezier(.34,1.56,.64,1); }
.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(20px) scale(.95); }

@media (max-width:1100px) { .main-grid{grid-template-columns:1fr;} .detail-panel{position:static;} }
@media (max-width:900px) { .kpi-grid{grid-template-columns:repeat(2,1fr);} }
@media (max-width:700px) { .db{padding:16px 14px 50px;} .page-title{font-size:22px;} .filter-bar{flex-direction:column;align-items:stretch;} .sbox{min-width:auto;} .cat-tabs{margin-left:0;} }
</style>