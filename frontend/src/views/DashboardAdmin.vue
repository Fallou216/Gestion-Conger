<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Administration</div>
        <h1 class="page-title">Dashboard Admin</h1>
      </div>
      <div class="topbar-right">
        <div class="date-pill">📅 {{ todayLabel }}</div>
        <div class="live-badge">
          <span class="live-dot"></span>
          {{ stats ? stats.conges.employesEnConge : 0 }} en congé
        </div>
      </div>
    </div>

    <!-- LOADER -->
    <div class="loader-wrap" v-if="chargement">
      <div class="spinner"></div>
      <span>Chargement des statistiques…</span>
    </div>

    <template v-else-if="stats">

      <!-- KPI ROW 1 — Utilisateurs -->
      <div class="kpi-grid kpi-5">
        <div class="kpi kpi-users">
          <div class="kpi-glow"></div>
          <div class="kpi-icon-wrap">👥</div>
          <div class="kpi-val">{{ stats.utilisateurs.total }}</div>
          <div class="kpi-lbl">Utilisateurs</div>
          <div class="kpi-trend">Total</div>
        </div>
        <div class="kpi kpi-emp">
          <div class="kpi-glow"></div>
          <div class="kpi-icon-wrap">👤</div>
          <div class="kpi-val">{{ stats.utilisateurs.employes }}</div>
          <div class="kpi-lbl">Employés</div>
          <div class="kpi-trend">Actifs</div>
        </div>
        <div class="kpi kpi-resp">
          <div class="kpi-glow"></div>
          <div class="kpi-icon-wrap">👑</div>
          <div class="kpi-val">{{ stats.utilisateurs.responsables }}</div>
          <div class="kpi-lbl">Responsables</div>
          <div class="kpi-trend">Actifs</div>
        </div>
        <div class="kpi kpi-serv">
          <div class="kpi-glow"></div>
          <div class="kpi-icon-wrap">🏢</div>
          <div class="kpi-val">{{ stats.services.total }}</div>
          <div class="kpi-lbl">Services</div>
          <div class="kpi-trend">Actifs</div>
        </div>
        <div class="kpi kpi-new">
          <div class="kpi-glow"></div>
          <div class="kpi-icon-wrap">🆕</div>
          <div class="kpi-val">{{ stats.utilisateurs.nouveauxCeMois }}</div>
          <div class="kpi-lbl">Nouveaux</div>
          <div class="kpi-trend">Ce mois</div>
        </div>
      </div>

      <!-- KPI ROW 2 — Congés -->
      <div class="kpi-grid">
        <div class="kpi kpi-total">
          <div class="kpi-glow"></div>
          <div class="kpi-icon-wrap">📋</div>
          <div class="kpi-val">{{ stats.conges.total }}</div>
          <div class="kpi-lbl">Total demandes</div>
          <div class="kpi-trend">Global</div>
        </div>
        <div class="kpi kpi-wait">
          <div class="kpi-glow"></div>
          <div class="kpi-icon-wrap">⏳</div>
          <div class="kpi-val">{{ stats.conges.enAttente }}</div>
          <div class="kpi-lbl">En attente</div>
          <div class="kpi-trend">À traiter</div>
        </div>
        <div class="kpi kpi-ok">
          <div class="kpi-glow"></div>
          <div class="kpi-icon-wrap">✅</div>
          <div class="kpi-val">{{ stats.conges.approuves }}</div>
          <div class="kpi-lbl">Approuvées</div>
          <div class="kpi-trend">{{ stats.conges.tauxApprobation }}%</div>
        </div>
        <div class="kpi kpi-no">
          <div class="kpi-glow"></div>
          <div class="kpi-icon-wrap">❌</div>
          <div class="kpi-val">{{ stats.conges.refuses }}</div>
          <div class="kpi-lbl">Refusées</div>
          <div class="kpi-trend">{{ 100 - stats.conges.tauxApprobation }}%</div>
        </div>
      </div>

      <!-- GRAPHIQUES ROW 1 -->
      <div class="charts-grid">
        <div class="card chart-card">
          <div class="card-hd">
            <span class="card-title">Répartition des statuts</span>
            <span class="card-sub">Global</span>
          </div>
          <div class="chart-body chart-center">
            <canvas id="adminDoughnut"></canvas>
          </div>
        </div>
        <div class="card chart-card">
          <div class="card-hd">
            <span class="card-title">Demandes par mois</span>
            <span class="card-sub">{{ currentYear }}</span>
          </div>
          <div class="chart-body">
            <canvas id="adminBar"></canvas>
          </div>
        </div>
      </div>

      <!-- GRAPHIQUES ROW 2 -->
      <div class="charts-grid">
        <div class="card chart-card">
          <div class="card-hd">
            <span class="card-title">Par catégorie</span>
            <span class="card-sub">Types de congés</span>
          </div>
          <div class="chart-body chart-center">
            <canvas id="adminCatChart"></canvas>
          </div>
        </div>
        <div class="card chart-card">
          <div class="card-hd">
            <span class="card-title">Top employés</span>
            <span class="card-sub">Jours de congés</span>
          </div>
          <div class="chart-body">
            <canvas id="adminTopChart"></canvas>
          </div>
        </div>
      </div>

      <!-- ROW 3 : Employés par service + Infos en direct -->
      <div class="charts-grid">
        <div class="card chart-card">
          <div class="card-hd">
            <span class="card-title">Employés par service</span>
            <span class="card-sub">Répartition</span>
          </div>
          <div class="chart-body chart-center">
            <canvas id="adminServiceChart"></canvas>
          </div>
        </div>

        <div class="card">
          <div class="card-hd">
            <span class="card-title">Situation actuelle</span>
            <span class="card-sub">En direct</span>
          </div>
          <div class="live-body">
            <div class="live-row">
              <div class="live-icon">🏖️</div>
              <div class="live-info">
                <div class="live-label">Employés en congé</div>
                <div class="live-desc">Actuellement absents</div>
              </div>
              <div class="live-val">{{ stats.conges.employesEnConge }}</div>
            </div>
            <div class="live-row">
              <div class="live-icon">📋</div>
              <div class="live-info">
                <div class="live-label">Demandes ce mois</div>
                <div class="live-desc">Nouvelles soumissions</div>
              </div>
              <div class="live-val">{{ stats.conges.ceMois }}</div>
            </div>
            <div class="live-row">
              <div class="live-icon">⏳</div>
              <div class="live-info">
                <div class="live-label">À traiter</div>
                <div class="live-desc">En attente d'action</div>
              </div>
              <div class="live-val live-urgent">{{ stats.conges.enAttente }}</div>
            </div>
            <div class="live-row">
              <div class="live-icon">📊</div>
              <div class="live-info">
                <div class="live-label">Taux d'approbation</div>
                <div class="live-desc">Demandes traitées</div>
              </div>
              <div class="live-val live-green">{{ stats.conges.tauxApprobation }}%</div>
            </div>
            <div class="live-row">
              <div class="live-icon">🆕</div>
              <div class="live-info">
                <div class="live-label">Nouveaux inscrits</div>
                <div class="live-desc">Ce mois-ci</div>
              </div>
              <div class="live-val">{{ stats.utilisateurs.nouveauxCeMois }}</div>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script>
import axios from '../axios';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const MOIS_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default {
  name: 'DashboardAdmin',
  data() {
    return {
      stats: null,
      chargement: true,
      charts: {},
    };
  },
  computed: {
    currentYear() { return new Date().getFullYear(); },
    todayLabel() {
      return new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    },
  },
  methods: {
    async chargerStats() {
      this.chargement = true;
      try {
        const res = await axios.get('/stats');
        this.stats = res.data;
        setTimeout(() => this.renderCharts(), 300);
      } catch (err) {
        console.error('Erreur chargement stats :', err);
      } finally {
        this.chargement = false;
      }
    },

    renderCharts() {
      this.renderDoughnut();
      this.renderBar();
      this.renderCatChart();
      this.renderTopChart();
      this.renderServiceChart();
    },

    destroyChart(name) {
      if (this.charts[name]) { this.charts[name].destroy(); this.charts[name] = null; }
    },

    renderDoughnut() {
      this.destroyChart('doughnut');
      const el = document.getElementById('adminDoughnut');
      if (!el) return;
      this.charts.doughnut = new Chart(el, {
        type: 'doughnut',
        data: {
          labels: ['Approuvées', 'En attente', 'Refusées'],
          datasets: [{
            data: [this.stats.conges.approuves, this.stats.conges.enAttente, this.stats.conges.refuses],
            backgroundColor: ['#4ade80', '#fb923c', '#f87171'],
            borderColor: '#111827', borderWidth: 4, hoverOffset: 8,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '70%',
          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 14, usePointStyle: true, font: { size: 11, family: "'Sora'" } } } },
        },
      });
    },

    renderBar() {
      this.destroyChart('bar');
      const el = document.getElementById('adminBar');
      if (!el || !this.stats.demandesParMois) return;
      this.charts.bar = new Chart(el, {
        type: 'bar',
        data: {
          labels: MOIS_LABELS,
          datasets: [
            { label: 'Approuvées', data: this.stats.demandesParMois.map(m => m.approuve), backgroundColor: 'rgba(74,222,128,0.7)', borderRadius: 6, borderSkipped: false },
            { label: 'En attente', data: this.stats.demandesParMois.map(m => m.attente), backgroundColor: 'rgba(251,146,60,0.7)', borderRadius: 6, borderSkipped: false },
            { label: 'Refusées', data: this.stats.demandesParMois.map(m => m.refuse), backgroundColor: 'rgba(248,113,113,0.7)', borderRadius: 6, borderSkipped: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { color: '#94a3b8', padding: 14, usePointStyle: true, font: { size: 11, family: "'Sora'" } } } },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { color: '#475569', font: { size: 10, family: "'Sora'" } } },
            y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#475569', stepSize: 1, font: { size: 10, family: "'Sora'" } } },
          },
        },
      });
    },

    renderCatChart() {
      this.destroyChart('cat');
      const el = document.getElementById('adminCatChart');
      if (!el || !this.stats.parCategorie) return;
      const catLabels = { annuel: 'Annuel', exceptionnel: 'Exceptionnel', autre: 'Autre' };
      const catColors = { annuel: '#818cf8', exceptionnel: '#fb923c', autre: '#64748b' };
      this.charts.cat = new Chart(el, {
        type: 'doughnut',
        data: {
          labels: this.stats.parCategorie.map(c => catLabels[c._id] || c._id),
          datasets: [{
            data: this.stats.parCategorie.map(c => c.count),
            backgroundColor: this.stats.parCategorie.map(c => catColors[c._id] || '#475569'),
            borderColor: '#111827', borderWidth: 4, hoverOffset: 8,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 14, usePointStyle: true, font: { size: 11, family: "'Sora'" } } } },
        },
      });
    },

    renderTopChart() {
      this.destroyChart('top');
      const el = document.getElementById('adminTopChart');
      if (!el || !this.stats.topEmployes?.length) return;
      this.charts.top = new Chart(el, {
        type: 'bar',
        data: {
          labels: this.stats.topEmployes.map(e => `${e.prenom} ${e.nom}`),
          datasets: [{
            label: 'Jours',
            data: this.stats.topEmployes.map(e => e.totalJours),
            backgroundColor: ['rgba(79,70,229,0.7)', 'rgba(124,58,237,0.7)', 'rgba(8,145,178,0.7)', 'rgba(4,120,87,0.7)', 'rgba(180,83,9,0.7)'],
            borderRadius: 8, borderSkipped: false,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: 'rgba(30,41,59,0.5)' }, ticks: { color: '#475569', stepSize: 1, font: { size: 10, family: "'Sora'" } } },
            y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11, family: "'Sora'" } } },
          },
        },
      });
    },

    renderServiceChart() {
      this.destroyChart('service');
      const el = document.getElementById('adminServiceChart');
      if (!el || !this.stats.services.repartition?.length) return;
      const colors = ['#4f46e5', '#0891b2', '#be185d', '#b45309', '#047857', '#7c3aed', '#dc2626', '#2563eb'];
      this.charts.service = new Chart(el, {
        type: 'pie',
        data: {
          labels: this.stats.services.repartition.map(s => s.nom),
          datasets: [{
            data: this.stats.services.repartition.map(s => s.count),
            backgroundColor: this.stats.services.repartition.map((_, i) => colors[i % colors.length] + 'b3'),
            borderColor: '#111827', borderWidth: 3,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, usePointStyle: true, font: { size: 11, family: "'Sora'" } } } },
        },
      });
    },
  },

  mounted() { this.chargerStats(); },
  beforeUnmount() { Object.keys(this.charts).forEach(k => this.destroyChart(k)); },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

.db { font-family:'Sora',sans-serif; background:#0a0f1e; min-height:100vh; padding:28px 32px 60px; color:#e2e8f0; }

.topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
.breadcrumb { font-size:11px; color:#4a5568; letter-spacing:.12em; text-transform:uppercase; font-weight:600; margin-bottom:5px; }
.page-title { font-size:28px; font-weight:800; color:#f7fafc; letter-spacing:-.025em; margin:0; }
.topbar-right { display:flex; align-items:center; gap:12px; }
.date-pill { background:#111827; border:1px solid #1e293b; border-radius:99px; padding:9px 18px; font-size:12px; color:#94a3b8; font-weight:500; text-transform:capitalize; }
.live-badge { display:flex; align-items:center; gap:8px; background:rgba(74,222,128,.08); border:1px solid rgba(74,222,128,.2); border-radius:99px; padding:9px 18px; font-size:12px; color:#4ade80; font-weight:600; }
.live-dot { width:8px; height:8px; border-radius:50%; background:#4ade80; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }

/* KPI */
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
.kpi-5 { grid-template-columns:repeat(5,1fr); }
.kpi { border-radius:20px; padding:24px; position:relative; overflow:hidden; transition:transform .25s, box-shadow .25s; }
.kpi:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,.4); }

.kpi-users { background:linear-gradient(145deg,#1e1b4b,#312e81); border:1px solid rgba(99,102,241,.25); }
.kpi-emp { background:linear-gradient(145deg,#052e16,#14532d); border:1px solid rgba(22,163,74,.2); }
.kpi-resp { background:linear-gradient(145deg,#1c1007,#431407); border:1px solid rgba(234,88,12,.2); }
.kpi-serv { background:linear-gradient(145deg,#0c1a2e,#0c2a4a); border:1px solid rgba(56,130,221,.2); }
.kpi-new { background:linear-gradient(145deg,#1a0a2e,#3b0764); border:1px solid rgba(168,85,247,.2); }
.kpi-total { background:linear-gradient(145deg,#1e1b4b,#312e81); border:1px solid rgba(99,102,241,.25); }
.kpi-wait { background:linear-gradient(145deg,#1c1007,#431407); border:1px solid rgba(234,88,12,.2); }
.kpi-ok { background:linear-gradient(145deg,#052e16,#14532d); border:1px solid rgba(22,163,74,.2); }
.kpi-no { background:linear-gradient(145deg,#1a0a0a,#450a0a); border:1px solid rgba(220,38,38,.2); }

.kpi-glow { position:absolute; top:-24px; right:-24px; width:90px; height:90px; border-radius:50%; opacity:.2; pointer-events:none; }
.kpi-users .kpi-glow { background:#818cf8; } .kpi-emp .kpi-glow { background:#4ade80; } .kpi-resp .kpi-glow { background:#fb923c; }
.kpi-serv .kpi-glow { background:#60a5fa; } .kpi-new .kpi-glow { background:#a78bfa; }
.kpi-total .kpi-glow { background:#818cf8; } .kpi-wait .kpi-glow { background:#fb923c; }
.kpi-ok .kpi-glow { background:#4ade80; } .kpi-no .kpi-glow { background:#f87171; }

.kpi-icon-wrap { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:18px; }
.kpi-users .kpi-icon-wrap { background:rgba(79,70,229,.25); } .kpi-emp .kpi-icon-wrap { background:rgba(22,163,74,.25); }
.kpi-resp .kpi-icon-wrap { background:rgba(234,88,12,.25); } .kpi-serv .kpi-icon-wrap { background:rgba(56,130,221,.25); }
.kpi-new .kpi-icon-wrap { background:rgba(168,85,247,.25); } .kpi-total .kpi-icon-wrap { background:rgba(79,70,229,.25); }
.kpi-wait .kpi-icon-wrap { background:rgba(234,88,12,.25); } .kpi-ok .kpi-icon-wrap { background:rgba(22,163,74,.25); }
.kpi-no .kpi-icon-wrap { background:rgba(220,38,38,.25); }

.kpi-val { font-size:38px; font-weight:800; letter-spacing:-.04em; color:#f8fafc; line-height:1; }
.kpi-lbl { font-size:11px; color:#94a3b8; font-weight:600; margin-top:5px; text-transform:uppercase; letter-spacing:.08em; }
.kpi-trend { position:absolute; bottom:18px; right:18px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:99px; }
.kpi-users .kpi-trend { background:rgba(79,70,229,.3); color:#a5b4fc; } .kpi-emp .kpi-trend { background:rgba(22,163,74,.3); color:#4ade80; }
.kpi-resp .kpi-trend { background:rgba(234,88,12,.3); color:#fb923c; } .kpi-serv .kpi-trend { background:rgba(56,130,221,.3); color:#93c5fd; }
.kpi-new .kpi-trend { background:rgba(168,85,247,.3); color:#c4b5fd; }
.kpi-total .kpi-trend { background:rgba(79,70,229,.3); color:#a5b4fc; } .kpi-wait .kpi-trend { background:rgba(234,88,12,.3); color:#fb923c; }
.kpi-ok .kpi-trend { background:rgba(22,163,74,.3); color:#4ade80; } .kpi-no .kpi-trend { background:rgba(220,38,38,.3); color:#f87171; }

/* CHARTS */
.charts-grid { display:grid; grid-template-columns:1fr 2fr; gap:20px; margin-bottom:24px; }
.card { background:#111827; border:1px solid #1e293b; border-radius:20px; overflow:hidden; }
.card-hd { padding:20px 24px 16px; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; }
.card-title { font-size:15px; font-weight:700; color:#f1f5f9; }
.card-sub { font-size:12px; color:#475569; background:#1e293b; padding:3px 12px; border-radius:99px; font-weight:500; }
.chart-body { padding:20px; height:280px; position:relative; }
.chart-center { display:flex; align-items:center; justify-content:center; }

/* LIVE STATS */
.live-body { padding:8px 0; }
.live-row { display:flex; align-items:center; gap:16px; padding:16px 24px; border-bottom:1px solid #0d1422; transition:background .15s; }
.live-row:last-child { border-bottom:none; }
.live-row:hover { background:#131c30; }
.live-icon { font-size:22px; width:44px; height:44px; border-radius:12px; background:#1e293b; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.live-info { flex:1; }
.live-label { font-size:13px; font-weight:700; color:#f1f5f9; }
.live-desc { font-size:11px; color:#475569; margin-top:2px; }
.live-val { font-size:24px; font-weight:800; color:#a5b4fc; letter-spacing:-.03em; }
.live-urgent { color:#fb923c; }
.live-green { color:#4ade80; }

/* LOADER */
.loader-wrap { display:flex; flex-direction:column; align-items:center; padding:80px; gap:14px; color:#475569; font-size:13px; }
.spinner { width:34px; height:34px; border:3px solid #1e293b; border-top-color:#4f46e5; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to{transform:rotate(360deg);} }

/* RESPONSIVE */
@media (max-width:1200px) { .kpi-5{grid-template-columns:repeat(3,1fr);} }
@media (max-width:1100px) { .kpi-grid{grid-template-columns:repeat(2,1fr);} .charts-grid{grid-template-columns:1fr;} }
@media (max-width:700px) { .db{padding:16px 14px 50px;} .page-title{font-size:22px;} .topbar{flex-direction:column;align-items:flex-start;} .kpi-5{grid-template-columns:repeat(2,1fr);} .chart-body{height:220px;} }
</style>