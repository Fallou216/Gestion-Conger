<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Employé</div>
        <h1 class="page-title">Mon espace congés</h1>
      </div>
      <div class="topbar-right">
        <div class="date-pill">📅 {{ todayLabel }}</div>
        <div class="user-chip">
          <div class="user-av">{{ userInitiales }}</div>
          <span class="user-name">{{ userName }}</span>
        </div>
      </div>
    </div>

    <!-- SOLDE CONGÉS -->
    <div class="solde-banner" v-if="soldeInfo">
      <div class="solde-left">
        <div class="solde-icon">🌴</div>
        <div class="solde-text">
          <div class="solde-title">Mon solde de congés</div>
          <div class="solde-sub">Droit annuel : {{ soldeInfo.droitAnnuel }}j · Ancienneté : {{ soldeInfo.anneesCompletes }} an{{ soldeInfo.anneesCompletes > 1 ? 's' : '' }}</div>
        </div>
      </div>
      <div class="solde-right">
        <div class="solde-number">{{ soldeInfo.solde }}</div>
        <div class="solde-unit">jours disponibles</div>
      </div>
      <div class="solde-bar-track">
        <div class="solde-bar-fill" :style="{ width: soldePct + '%' }"></div>
      </div>
      <div class="solde-details">
        <span class="sd-item"><span class="sd-dot sd-acquis"></span> Acquis : {{ soldeInfo.droitsAcquis }}j</span>
        <span class="sd-item"><span class="sd-dot sd-pris"></span> Pris : {{ soldeInfo.joursConsommes }}j</span>
        <span class="sd-item"><span class="sd-dot sd-rest"></span> Restant : {{ soldeInfo.solde }}j</span>
      </div>
    </div>

    <!-- KPI CARDS -->
    <div class="kpi-grid">
      <div class="kpi kpi-solde">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">🌴</div>
        <div class="kpi-val">{{ soldeInfo ? soldeInfo.solde : '—' }}</div>
        <div class="kpi-lbl">Solde congés</div>
        <div class="kpi-trend">Disponible</div>
      </div>
      <div class="kpi kpi-total">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">📋</div>
        <div class="kpi-val">{{ mesConges.length }}</div>
        <div class="kpi-lbl">Total demandes</div>
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
        <div class="kpi-trend">{{ pctVal(nbApprouve) }}%</div>
      </div>
    </div>

    <!-- GRAPHIQUES — toujours dans le DOM -->
    <div class="charts-grid" :style="{ display: mesConges.length ? 'grid' : 'none' }">
      <div class="chart-wrap">
        <div class="card-hd">
          <span class="card-title">Mes statuts</span>
          <span class="card-sub">Répartition</span>
        </div>
        <div class="chart-container">
          <canvas id="empDoughnut"></canvas>
        </div>
      </div>
      <div class="chart-wrap">
        <div class="card-hd">
          <span class="card-title">Mes congés par mois</span>
          <span class="card-sub">{{ currentYear }}</span>
        </div>
        <div class="chart-container">
          <canvas id="empBar"></canvas>
        </div>
      </div>
    </div>

    <!-- MAIN GRID : Formulaire + Liste -->
    <div class="main-grid">

      <!-- FORMULAIRE NOUVELLE DEMANDE -->
      <div class="card form-card">
        <div class="card-hd">
          <span class="card-title">Nouvelle demande</span>
          <span class="card-sub">Congé</span>
        </div>
        <div class="form-body">
          <div class="field-group">
            <label class="field-label">Date de début</label>
            <div class="input-wrap" :class="{ focused: focusDebut }">
              <span class="input-icon">📅</span>
              <input type="date" v-model="dateDebut" class="field-input" :min="today"
                @focus="focusDebut = true" @blur="focusDebut = false" required />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Date de fin</label>
            <div class="input-wrap" :class="{ focused: focusFin }">
              <span class="input-icon">📅</span>
              <input type="date" v-model="dateFin" class="field-input" :min="dateDebut || today"
                @focus="focusFin = true" @blur="focusFin = false" required />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Motif <span class="optional">(optionnel)</span></label>
            <div class="input-wrap textarea-wrap" :class="{ focused: focusMotif }">
              <textarea v-model="motif" class="field-input field-textarea"
                placeholder="Congé annuel, maladie, événement familial…" rows="3"
                @focus="focusMotif = true" @blur="focusMotif = false"></textarea>
            </div>
          </div>

          <!-- Pièce jointe -->
          <div class="field-group">
            <label class="field-label">Pièce jointe <span class="optional">(facultatif)</span></label>
            <div class="upload-zone" :class="{ hasFile: fichier }" @click="$refs.fileInput.click()">
              <input type="file" ref="fileInput" @change="handleFile" class="file-hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              <div v-if="!fichier" class="upload-placeholder">
                <span class="upload-icon">📎</span>
                <span class="upload-text">Cliquez pour joindre un fichier</span>
                <span class="upload-hint">PDF, JPG, PNG, DOC — Max 5 Mo</span>
              </div>
              <div v-else class="upload-file">
                <span class="file-icon">📄</span>
                <div class="file-info">
                  <span class="file-name">{{ fichier.name }}</span>
                  <span class="file-size">{{ formatSize(fichier.size) }}</span>
                </div>
                <button class="file-remove" @click.stop="fichier = null" title="Retirer">✕</button>
              </div>
            </div>
          </div>

          <!-- Preview durée -->
          <div class="duree-preview" v-if="dateDebut && dateFin && dureePreview > 0">
            <span class="duree-icon">⏱️</span>
            <span class="duree-text">Durée : <strong>{{ dureePreview }} jour{{ dureePreview > 1 ? 's' : '' }}</strong></span>
          </div>

          <div class="alert alert-error" v-if="dateErreur">⚠️ {{ dateErreur }}</div>

          <button class="submit-btn" @click="soumettreConge"
            :disabled="loading || !dateDebut || !dateFin" :class="{ loading }">
            <span v-if="!loading">🚀 Envoyer la demande</span>
            <span v-else class="btn-spinner"></span>
          </button>

          <transition name="fade">
            <div class="alert alert-success" v-if="message">✅ {{ message }}</div>
          </transition>
          <transition name="fade">
            <div class="alert alert-error" v-if="erreur && !dateErreur">❌ {{ erreur }}</div>
          </transition>
        </div>
      </div>

      <!-- LISTE DES DEMANDES -->
      <div class="card list-card">
        <div class="card-hd">
          <span class="card-title">Mes demandes</span>
          <div class="filter-tabs">
            <button v-for="tab in tabs" :key="tab.val"
              :class="['ftab', { on: filtre === tab.val }]"
              @click="filtre = tab.val">{{ tab.label }}</button>
          </div>
        </div>

        <div class="loader-wrap" v-if="chargement">
          <div class="spinner"></div>
          <span>Chargement…</span>
        </div>

        <div class="empty" v-else-if="!congesFiltres.length">
          <div class="empty-icon">📭</div>
          <p>Aucune demande</p>
          <span>{{ filtre !== 'tous' ? 'Changez le filtre' : 'Soumettez votre première demande' }}</span>
        </div>

        <div class="conge-list" v-else>
          <div class="conge-item" v-for="conge in congesFiltres" :key="conge._id">
            <div class="conge-left">
              <div class="conge-dates">
                <span class="conge-date-from">{{ formatDate(conge.dateDebut) }}</span>
                <span class="conge-arrow">→</span>
                <span class="conge-date-to">{{ formatDate(conge.dateFin) }}</span>
              </div>
              <div class="conge-meta">
                <span class="conge-dur">{{ duree(conge.dateDebut, conge.dateFin) }} jour{{ duree(conge.dateDebut, conge.dateFin) > 1 ? 's' : '' }}</span>
                <span class="conge-motif" v-if="conge.motif">· {{ conge.motif }}</span>
              </div>
            </div>
            <div class="conge-right">
              <span :class="['status-badge', statusClass(conge.statut)]">
                {{ statusIcon(conge.statut) }} {{ conge.statut }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TIMELINE -->
    <div class="card timeline-card" v-if="mesConges.length">
      <div class="card-hd">
        <span class="card-title">Historique récent</span>
        <span class="card-sub">5 dernières demandes</span>
      </div>
      <div class="timeline">
        <div class="tl-item" v-for="(conge, i) in dernierConges" :key="conge._id">
          <div class="tl-line" v-if="i < dernierConges.length - 1"></div>
          <div :class="['tl-dot', statusClass(conge.statut)]"></div>
          <div class="tl-content">
            <div class="tl-dates">{{ formatDate(conge.dateDebut) }} → {{ formatDate(conge.dateFin) }}</div>
            <div class="tl-info">
              <span class="tl-dur">{{ duree(conge.dateDebut, conge.dateFin) }}j</span>
              <span :class="['tl-badge', statusClass(conge.statut)]">{{ conge.statut }}</span>
            </div>
          </div>
        </div>
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
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: 'DashboardEmploye',
  data() {
    return {
      dateDebut: '', dateFin: '', motif: '', fichier: null,
      mesConges: [],
      message: '', erreur: '',
      chargement: true, loading: false,
      filtre: 'tous',
      focusDebut: false, focusFin: false, focusMotif: false,
      toast: { visible: false, message: '', type: 'success' },
      doughnutChart: null,
      barChartInstance: null,
      soldeInfo: null,
    };
  },

  computed: {
    currentYear() { return new Date().getFullYear(); },
    todayLabel() {
      return new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    },
    today() { return new Date().toISOString().split('T')[0]; },
    userName() {
      return localStorage.getItem('nom') || localStorage.getItem('prenom') || 'Employé';
    },
    userInitiales() {
      const n = this.userName;
      const parts = n.trim().split(' ');
      return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
    },
    nbAttente()  { return this.mesConges.filter(c => c.statut === 'en attente').length; },
    nbApprouve() { return this.mesConges.filter(c => c.statut === 'approuvé').length; },
    soldePct() {
      if (!this.soldeInfo || !this.soldeInfo.droitsAcquis) return 0;
      return Math.round((this.soldeInfo.solde / this.soldeInfo.droitsAcquis) * 100);
    },
    totalJours() {
      const annee = new Date().getFullYear();
      return this.mesConges
        .filter(c => c.statut === 'approuvé' && new Date(c.dateDebut).getFullYear() === annee)
        .reduce((sum, c) => sum + this.duree(c.dateDebut, c.dateFin), 0);
    },
    dureePreview() {
      if (!this.dateDebut || !this.dateFin) return 0;
      return this.duree(this.dateDebut, this.dateFin);
    },
    dateErreur() {
      if (this.dateDebut && this.dateFin && new Date(this.dateFin) < new Date(this.dateDebut)) {
        return 'La date de fin doit être après la date de début.';
      }
      return '';
    },
    tabs() {
      return [
        { val: 'tous', label: 'Tous' },
        { val: 'en attente', label: 'En attente' },
        { val: 'approuvé', label: 'Approuvées' },
        { val: 'refusé', label: 'Refusées' },
      ];
    },
    congesFiltres() {
      if (this.filtre === 'tous') return this.mesConges;
      return this.mesConges.filter(c => c.statut === this.filtre);
    },
    dernierConges() {
      return [...this.mesConges].reverse().slice(0, 5);
    },
  },

  methods: {
    pctVal(val) {
      const t = this.mesConges.length;
      return t ? Math.round((val / t) * 100) : 0;
    },

    async soumettreConge() {
      this.message = '';
      this.erreur = '';
      if (this.dateErreur) return;
      this.loading = true;
      try {
        const formData = new FormData();
        formData.append('dateDebut', this.dateDebut);
        formData.append('dateFin', this.dateFin);
        formData.append('motif', this.motif);
        if (this.fichier) formData.append('fichier', this.fichier);
        await axios.post('/conges', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        this.message = 'Demande envoyée avec succès !';
        this.dateDebut = ''; this.dateFin = ''; this.motif = ''; this.fichier = null;
        if (this.$refs.fileInput) this.$refs.fileInput.value = '';
        this.showToast('Demande envoyée avec succès !', 'success');
        await this.chargerMesConges();
      } catch (err) {
        const msg = err.response?.data?.message || 'Erreur lors de la soumission.';
        this.erreur = msg;
        this.showToast(msg, 'error');
      } finally {
        this.loading = false;
        setTimeout(() => { this.message = ''; this.erreur = ''; }, 5000);
      }
    },

    async chargerMesConges() {
      this.chargement = true;
      try {
        const res = await axios.get('/conges/mes');
        this.mesConges = res.data;
      } catch {
        this.showToast('Erreur lors du chargement', 'error');
      } finally {
        this.chargement = false;
        setTimeout(() => { this.renderCharts(); }, 300);
      }
    },

    async chargerSolde() {
      try {
        const res = await axios.get('/conges/solde');
        this.soldeInfo = res.data;
      } catch {
        console.error('Erreur chargement solde');
      }
    },

    renderCharts() {
      this.renderDoughnut();
      this.renderBar();
    },

    renderDoughnut() {
      if (this.doughnutChart) { this.doughnutChart.destroy(); this.doughnutChart = null; }
      const el = document.getElementById('empDoughnut');
      if (!el || !this.mesConges.length) return;
      const nbOk = this.mesConges.filter(c => c.statut === 'approuvé').length;
      const nbWait = this.mesConges.filter(c => c.statut === 'en attente').length;
      const nbNo = this.mesConges.filter(c => c.statut === 'refusé').length;
      this.doughnutChart = new Chart(el, {
        type: 'doughnut',
        data: {
          labels: ['Approuvées', 'En attente', 'Refusées'],
          datasets: [{
            data: [nbOk, nbWait, nbNo],
            backgroundColor: ['#4ade80', '#fb923c', '#f87171'],
            borderColor: '#111827',
            borderWidth: 4,
            hoverOffset: 8,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#94a3b8', padding: 14, usePointStyle: true, pointStyleWidth: 12,
                font: { size: 11, family: "'Sora', sans-serif" },
              },
            },
          },
        },
      });
    },

    renderBar() {
      if (this.barChartInstance) { this.barChartInstance.destroy(); this.barChartInstance = null; }
      const el = document.getElementById('empBar');
      if (!el || !this.mesConges.length) return;
      const annee = new Date().getFullYear();
      const moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
      const data = moisLabels.map((_, i) => {
        return this.mesConges.filter(c => {
          const d = new Date(c.dateDebut);
          return d.getFullYear() === annee && d.getMonth() === i;
        }).length;
      });
      this.barChartInstance = new Chart(el, {
        type: 'bar',
        data: {
          labels: moisLabels,
          datasets: [{
            label: 'Demandes',
            data,
            backgroundColor: 'rgba(79, 70, 229, 0.7)',
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10, family: "'Sora', sans-serif" } } },
            y: { beginAtZero: true, grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#475569', stepSize: 1, font: { size: 10, family: "'Sora', sans-serif" } } },
          },
        },
      });
    },

    formatDate(d) {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    duree(debut, fin) {
      return Math.max(1, Math.round((new Date(fin) - new Date(debut)) / 86400000) + 1);
    },
    statusClass(s) { return s === 'approuvé' ? 's-ok' : s === 'refusé' ? 's-no' : 's-wait'; },
    statusIcon(s) { return s === 'approuvé' ? '✓' : s === 'refusé' ? '✗' : '⏳'; },
    handleFile(event) { const file = event.target.files[0]; if (file) this.fichier = file; },
    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' o';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' Ko';
      return (bytes / 1048576).toFixed(1) + ' Mo';
    },
    showToast(message, type = 'success') {
      this.toast = { visible: true, message, type };
      setTimeout(() => { this.toast.visible = false; }, 3500);
    },
  },

  mounted() {
    this.chargerMesConges();
    this.chargerSolde();
  },
  beforeUnmount() {
    if (this.doughnutChart) this.doughnutChart.destroy();
    if (this.barChartInstance) this.barChartInstance.destroy();
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

.db { font-family:'Sora',sans-serif; background:#0a0f1e; min-height:100vh; padding:28px 32px 60px; color:#e2e8f0; }

/* TOPBAR */
.topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
.breadcrumb { font-size:11px; color:#4a5568; letter-spacing:.12em; text-transform:uppercase; font-weight:600; margin-bottom:5px; }
.page-title { font-size:28px; font-weight:800; color:#f7fafc; letter-spacing:-.025em; margin:0; }
.topbar-right { display:flex; align-items:center; gap:12px; }
.date-pill { background:#111827; border:1px solid #1e293b; border-radius:99px; padding:9px 18px; font-size:12px; color:#94a3b8; font-weight:500; text-transform:capitalize; }
.user-chip { display:flex; align-items:center; gap:10px; background:#111827; border:1px solid #1e293b; border-radius:99px; padding:6px 16px 6px 6px; }
.user-av { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.user-name { font-size:13px; color:#94a3b8; font-weight:600; }

/* SOLDE BANNER */
.solde-banner {
  background: linear-gradient(135deg, #1e1b4b, #312e81);
  border: 1px solid rgba(99,102,241,.3);
  border-radius: 20px; padding: 24px 28px;
  margin-bottom: 24px; position: relative; overflow: hidden;
}
.solde-left { display:flex; align-items:center; gap:14px; }
.solde-icon { font-size:32px; }
.solde-title { font-size:16px; font-weight:800; color:#f8fafc; }
.solde-sub { font-size:11px; color:#94a3b8; margin-top:3px; }
.solde-right { position:absolute; top:24px; right:28px; text-align:right; }
.solde-number { font-size:42px; font-weight:800; color:#a5b4fc; line-height:1; letter-spacing:-.04em; }
.solde-unit { font-size:11px; color:#818cf8; font-weight:600; text-transform:uppercase; letter-spacing:.08em; margin-top:4px; }
.solde-bar-track { height:6px; background:rgba(255,255,255,.08); border-radius:99px; margin-top:20px; overflow:hidden; }
.solde-bar-fill { height:100%; background:linear-gradient(90deg,#4f46e5,#818cf8); border-radius:99px; transition:width .8s ease; }
.solde-details { display:flex; gap:20px; margin-top:12px; }
.sd-item { display:flex; align-items:center; gap:6px; font-size:11px; color:#94a3b8; font-weight:600; }
.sd-dot { width:8px; height:8px; border-radius:50%; }
.sd-acquis { background:#4f46e5; }
.sd-pris { background:#f87171; }
.sd-rest { background:#4ade80; }

/* KPI */
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
.kpi { border-radius:20px; padding:24px; position:relative; overflow:hidden; transition:transform .25s, box-shadow .25s; }
.kpi:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,.4); }
.kpi-solde { background:linear-gradient(145deg,#1e1b4b,#312e81); border:1px solid rgba(99,102,241,.35); }
.kpi-solde .kpi-glow { background:#a5b4fc; }
.kpi-solde .kpi-icon-wrap { background:rgba(79,70,229,.3); }
.kpi-solde .kpi-trend { background:rgba(79,70,229,.4); color:#c4b5fd; }
.kpi-total { background:linear-gradient(145deg,#0c1a2e,#0c2a4a); border:1px solid rgba(56,130,221,.2); }
.kpi-wait  { background:linear-gradient(145deg,#1c1007,#431407); border:1px solid rgba(234,88,12,.2); }
.kpi-ok    { background:linear-gradient(145deg,#052e16,#14532d); border:1px solid rgba(22,163,74,.2); }
.kpi-glow { position:absolute; top:-24px; right:-24px; width:90px; height:90px; border-radius:50%; opacity:.2; pointer-events:none; }
.kpi-total .kpi-glow { background:#60a5fa; } .kpi-wait .kpi-glow { background:#fb923c; }
.kpi-ok .kpi-glow { background:#4ade80; }
.kpi-icon-wrap { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:18px; }
.kpi-total .kpi-icon-wrap { background:rgba(56,130,221,.25); } .kpi-wait .kpi-icon-wrap { background:rgba(234,88,12,.25); }
.kpi-ok .kpi-icon-wrap { background:rgba(22,163,74,.25); }
.kpi-val { font-size:38px; font-weight:800; letter-spacing:-.04em; color:#f8fafc; line-height:1; }
.kpi-lbl { font-size:11px; color:#94a3b8; font-weight:600; margin-top:5px; text-transform:uppercase; letter-spacing:.08em; }
.kpi-trend { position:absolute; bottom:18px; right:18px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:99px; }
.kpi-total .kpi-trend { background:rgba(56,130,221,.3); color:#93c5fd; } .kpi-wait .kpi-trend { background:rgba(234,88,12,.3); color:#fb923c; }
.kpi-ok .kpi-trend { background:rgba(22,163,74,.3); color:#4ade80; }

/* CHARTS */
.charts-grid { grid-template-columns:1fr 2fr; gap:20px; margin-bottom:24px; }
.chart-wrap { background:#111827; border:1px solid #1e293b; border-radius:20px; overflow:hidden; }
.chart-wrap .card-hd { padding:20px 24px 16px; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; }
.card-title { font-size:15px; font-weight:700; color:#f1f5f9; }
.card-sub { font-size:12px; color:#475569; background:#1e293b; padding:3px 12px; border-radius:99px; font-weight:500; }
.chart-container { padding:20px; height:260px; position:relative; }

/* MAIN GRID */
.main-grid { display:grid; grid-template-columns:1fr 1.4fr; gap:20px; margin-bottom:24px; }

/* CARD */
.card { background:#111827; border:1px solid #1e293b; border-radius:20px; overflow:hidden; }
.card-hd { padding:20px 24px 16px; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }

/* FORM */
.form-body { padding:24px; display:flex; flex-direction:column; gap:18px; }
.field-group { display:flex; flex-direction:column; gap:8px; }
.field-label { font-size:12px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; }
.optional { font-weight:400; color:#475569; text-transform:none; letter-spacing:0; }
.input-wrap { display:flex; align-items:center; gap:10px; background:#1e293b; border:1px solid #334155; border-radius:12px; padding:12px 16px; transition:border-color .2s, box-shadow .2s; }
.input-wrap.focused { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.15); }
.textarea-wrap { align-items:flex-start; }
.input-icon { font-size:16px; flex-shrink:0; }
.field-input { background:none; border:none; outline:none; font-size:13px; font-family:'Sora',sans-serif; color:#e2e8f0; width:100%; }
.field-input::placeholder { color:#475569; }
.field-textarea { resize:none; line-height:1.6; }
.field-input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(.5); cursor:pointer; }

/* UPLOAD */
.upload-zone { border:2px dashed #334155; border-radius:14px; padding:20px; text-align:center; cursor:pointer; transition:all .25s; }
.upload-zone:hover { border-color:#4f46e5; background:rgba(79,70,229,.04); }
.upload-zone.hasFile { border-style:solid; border-color:#1e293b; padding:14px 18px; }
.file-hidden { display:none; }
.upload-placeholder { display:flex; flex-direction:column; align-items:center; gap:6px; }
.upload-icon { font-size:22px; } .upload-text { font-size:12px; color:#94a3b8; font-weight:500; } .upload-hint { font-size:10px; color:#475569; }
.upload-file { display:flex; align-items:center; gap:12px; }
.file-icon { font-size:20px; } .file-info { flex:1; text-align:left; }
.file-name { font-size:12px; font-weight:600; color:#e2e8f0; display:block; } .file-size { font-size:10px; color:#475569; }
.file-remove { width:26px; height:26px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#94a3b8; cursor:pointer; font-size:11px; display:flex; align-items:center; justify-content:center; transition:all .15s; font-family:inherit; }
.file-remove:hover { background:rgba(248,113,113,.12); border-color:rgba(248,113,113,.3); color:#f87171; }

.duree-preview { display:flex; align-items:center; gap:8px; background:rgba(79,70,229,.12); border:1px solid rgba(79,70,229,.2); border-radius:10px; padding:10px 16px; font-size:13px; color:#a5b4fc; }
.duree-icon { font-size:16px; } .duree-text strong { font-weight:700; color:#c4b5fd; }

.alert { border-radius:10px; padding:11px 16px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:8px; }
.alert-success { background:rgba(74,222,128,.1); color:#4ade80; border:1px solid rgba(74,222,128,.2); }
.alert-error { background:rgba(248,113,113,.1); color:#f87171; border:1px solid rgba(248,113,113,.2); }

.submit-btn { width:100%; padding:14px; background:linear-gradient(135deg,#4f46e5,#7c3aed); border:none; border-radius:12px; color:white; font-size:14px; font-weight:700; font-family:'Sora',sans-serif; cursor:pointer; transition:opacity .2s, transform .15s; display:flex; align-items:center; justify-content:center; gap:8px; }
.submit-btn:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); }
.submit-btn:disabled { opacity:.4; cursor:not-allowed; }
.submit-btn.loading { pointer-events:none; }
.btn-spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }

/* LIST */
.filter-tabs { display:flex; gap:4px; flex-wrap:wrap; }
.ftab { padding:5px 12px; border-radius:8px; font-size:11px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; border:1px solid #334155; background:transparent; color:#64748b; transition:all .2s; }
.ftab:hover { background:#1e293b; color:#94a3b8; }
.ftab.on { background:#4f46e5; color:white; border-color:#4f46e5; }

.loader-wrap { display:flex; flex-direction:column; align-items:center; padding:50px; gap:14px; color:#475569; font-size:13px; }
.spinner { width:32px; height:32px; border:3px solid #1e293b; border-top-color:#4f46e5; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

.empty { display:flex; flex-direction:column; align-items:center; padding:50px 20px; gap:8px; color:#334155; text-align:center; }
.empty-icon { font-size:38px; } .empty p { font-size:14px; font-weight:600; color:#475569; margin:0; } .empty span { font-size:12px; color:#334155; }

.conge-list { padding:8px 0; }
.conge-item { display:flex; align-items:center; justify-content:space-between; padding:14px 24px; border-bottom:1px solid #0d1422; transition:background .15s; gap:12px; }
.conge-item:hover { background:#131c30; }
.conge-item:last-child { border-bottom:none; }
.conge-left { display:flex; flex-direction:column; gap:5px; }
.conge-dates { display:flex; align-items:center; gap:7px; }
.conge-date-from,.conge-date-to { font-size:13px; font-weight:600; color:#e2e8f0; }
.conge-arrow { font-size:11px; color:#334155; }
.conge-meta { display:flex; align-items:center; gap:6px; }
.conge-dur { font-size:11px; font-weight:700; background:#1e1b4b; color:#a5b4fc; padding:2px 9px; border-radius:99px; border:1px solid rgba(165,180,252,.15); }
.conge-motif { font-size:11px; color:#475569; }

.status-badge { display:inline-flex; align-items:center; gap:4px; padding:5px 12px; border-radius:99px; font-size:11px; font-weight:700; text-transform:capitalize; white-space:nowrap; }
.s-wait { background:rgba(234,88,12,.15); color:#fb923c; border:1px solid rgba(234,88,12,.2); }
.s-ok { background:rgba(74,222,128,.1); color:#4ade80; border:1px solid rgba(74,222,128,.2); }
.s-no { background:rgba(248,113,113,.1); color:#f87171; border:1px solid rgba(248,113,113,.2); }

/* TIMELINE */
.timeline { padding:20px 28px; display:flex; flex-direction:column; }
.tl-item { display:flex; align-items:flex-start; gap:16px; position:relative; padding-bottom:20px; }
.tl-item:last-child { padding-bottom:0; }
.tl-line { position:absolute; left:7px; top:18px; width:2px; height:calc(100%); background:#1e293b; }
.tl-dot { width:16px; height:16px; border-radius:50%; flex-shrink:0; margin-top:3px; border:2px solid #0a0f1e; }
.tl-dot.s-ok { background:#4ade80; box-shadow:0 0 8px rgba(74,222,128,.4); }
.tl-dot.s-wait { background:#fb923c; box-shadow:0 0 8px rgba(251,146,60,.4); }
.tl-dot.s-no { background:#f87171; box-shadow:0 0 8px rgba(248,113,113,.4); }
.tl-content { flex:1; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.tl-dates { font-size:13px; font-weight:600; color:#94a3b8; }
.tl-info { display:flex; align-items:center; gap:8px; }
.tl-dur { font-size:11px; font-weight:700; color:#475569; }
.tl-badge { padding:3px 10px; border-radius:99px; font-size:11px; font-weight:700; text-transform:capitalize; }
.tl-badge.s-ok { background:rgba(74,222,128,.1); color:#4ade80; }
.tl-badge.s-wait { background:rgba(234,88,12,.15); color:#fb923c; }
.tl-badge.s-no { background:rgba(248,113,113,.1); color:#f87171; }

/* TOAST */
.toast { position:fixed; bottom:28px; right:28px; padding:14px 22px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; z-index:9999; font-family:'Sora',sans-serif; }
.toast-success { background:#052e16; color:#4ade80; border:1px solid rgba(74,222,128,.2); box-shadow:0 4px 24px rgba(74,222,128,.15); }
.toast-error { background:#1a0a0a; color:#f87171; border:1px solid rgba(248,113,113,.2); box-shadow:0 4px 24px rgba(248,113,113,.15); }
.toast-enter-active,.toast-leave-active { transition:all .35s cubic-bezier(.34,1.56,.64,1); }
.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(20px) scale(.95); }

.fade-enter-active,.fade-leave-active { transition:opacity .3s; }
.fade-enter-from,.fade-leave-to { opacity:0; }

/* RESPONSIVE */
@media (max-width:1100px) { .kpi-grid{grid-template-columns:repeat(2,1fr);} .main-grid{grid-template-columns:1fr;} .charts-grid{grid-template-columns:1fr !important;} }
@media (max-width:700px) { .db{padding:16px 14px 50px;} .kpi-grid{grid-template-columns:repeat(2,1fr);gap:12px;} .page-title{font-size:22px;} .topbar{flex-direction:column;align-items:flex-start;} }
</style>