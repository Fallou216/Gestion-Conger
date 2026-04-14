<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Calendrier</div>
        <h1 class="page-title">Calendrier des congés</h1>
      </div>
      <div class="topbar-right">
        <div class="legend-row">
          <span class="leg-item"><span class="leg-dot leg-ok"></span> Approuvé</span>
          <span class="leg-item"><span class="leg-dot leg-wait"></span> En attente</span>
          <span class="leg-item"><span class="leg-dot leg-no"></span> Refusé</span>
          <span class="leg-item"><span class="leg-dot leg-ferie"></span> Férié</span>
        </div>
      </div>
    </div>

    <!-- NAVIGATION MOIS -->
    <div class="month-nav">
      <button class="nav-btn" @click="prevMonth">◂</button>
      <div class="month-label">
        <span class="month-name">{{ monthLabel }}</span>
        <span class="month-year">{{ currentYear }}</span>
      </div>
      <button class="nav-btn" @click="nextMonth">▸</button>
      <button class="today-btn" @click="goToday">Aujourd'hui</button>

      <!-- Filtre statut -->
      <div class="filter-tabs">
        <button :class="['ftab', { on: filtreStatut === 'tous' }]" @click="filtreStatut = 'tous'">Tous</button>
        <button :class="['ftab', { on: filtreStatut === 'approuvé' }]" @click="filtreStatut = 'approuvé'">Approuvés</button>
        <button :class="['ftab', { on: filtreStatut === 'en attente' }]" @click="filtreStatut = 'en attente'">En attente</button>
      </div>
    </div>

    <!-- CALENDRIER -->
    <div class="card cal-card">
      <div class="cal-header">
        <div class="cal-day-name" v-for="d in joursSemaine" :key="d">{{ d }}</div>
      </div>

      <div class="cal-grid">
        <div
          class="cal-cell"
          v-for="(cell, i) in calendarCells"
          :key="i"
          :class="{
            'other-month': !cell.currentMonth,
            'is-today': cell.isToday,
            'is-weekend': cell.isWeekend,
            'is-ferie': cell.isFerie,
          }"
          @click="cell.events.length ? selectEvent(cell.events[0]) : null"
        >
          <div class="cell-header">
            <span class="cell-day" :class="{ today: cell.isToday }">{{ cell.day }}</span>
            <span class="ferie-badge" v-if="cell.isFerie" :title="cell.ferieNom">🎉</span>
          </div>

          <!-- Nom du jour férié -->
          <div class="ferie-label" v-if="cell.isFerie && cell.currentMonth">{{ cell.ferieNom }}</div>

          <!-- Congés -->
          <div class="cell-events">
            <div
              class="event"
              v-for="evt in cell.events.slice(0, 2)"
              :key="evt._id"
              :class="['evt-' + statusKey(evt.statut), catClass(evt)]"
              :title="eventTooltip(evt)"
              @click.stop="selectEvent(evt)"
            >
              <span class="evt-cat-dot" :class="'cat-' + (evt.categorie || 'annuel')"></span>
              <span class="evt-label">{{ eventLabel(evt) }}</span>
            </div>
            <div class="evt-more" v-if="cell.events.length > 2" @click.stop="showDayDetail(cell)">
              +{{ cell.events.length - 2 }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DÉTAIL ÉVÉNEMENT -->
    <transition name="slide">
      <div class="card detail-card" v-if="selectedEvent">
        <div class="card-hd">
          <span class="card-title">Détail du congé</span>
          <button class="close-btn" @click="selectedEvent = null">✕</button>
        </div>
        <div class="detail-body">
          <div class="detail-row" v-if="isResponsable && selectedEvent.employe">
            <span class="detail-label">Employé</span>
            <div class="detail-val emp-info">
              <div class="detail-avatar">{{ initiales(selectedEvent.employe.nom, selectedEvent.employe.prenom) }}</div>
              <span>{{ selectedEvent.employe.prenom }} {{ selectedEvent.employe.nom }}</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Période</span>
            <span class="detail-val">{{ formatDate(selectedEvent.dateDebut) }} → {{ formatDate(selectedEvent.dateFin) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Durée</span>
            <span class="detail-val detail-highlight">{{ selectedEvent.dureeJours || duree(selectedEvent.dateDebut, selectedEvent.dateFin) }} jour(s)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Catégorie</span>
            <span class="detail-val">
              <span class="cat-badge" :class="'cat-b-' + (selectedEvent.categorie || 'annuel')">
                {{ catLabel(selectedEvent.categorie) }}
              </span>
            </span>
          </div>
          <div class="detail-row" v-if="selectedEvent.motifExceptionnel">
            <span class="detail-label">Motif exceptionnel</span>
            <span class="detail-val">{{ excLabel(selectedEvent.motifExceptionnel) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Motif</span>
            <span class="detail-val">{{ selectedEvent.motif || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Statut</span>
            <span :class="['status-badge', 's-' + statusKey(selectedEvent.statut)]">{{ selectedEvent.statut }}</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- JOURS FÉRIÉS DU MOIS -->
    <div class="card" v-if="feriesDuMois.length">
      <div class="card-hd">
        <span class="card-title">🎉 Jours fériés ce mois</span>
        <span class="card-sub">{{ feriesDuMois.length }} jour{{ feriesDuMois.length > 1 ? 's' : '' }}</span>
      </div>
      <div class="feries-body">
        <div class="ferie-row" v-for="f in feriesDuMois" :key="f.date">
          <span class="ferie-date">{{ formatDateShort(f.date) }}</span>
          <span class="ferie-name">{{ f.nom }}</span>
          <span class="ferie-jour">{{ jourSemaine(f.date) }}</span>
        </div>
      </div>
    </div>

    <!-- STATS MOIS -->
    <div class="kpi-grid">
      <div class="kpi kpi-total">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">📋</div>
        <div class="kpi-val">{{ monthStats.total }}</div>
        <div class="kpi-lbl">Ce mois</div>
      </div>
      <div class="kpi kpi-ok">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">✅</div>
        <div class="kpi-val">{{ monthStats.approuve }}</div>
        <div class="kpi-lbl">Approuvés</div>
      </div>
      <div class="kpi kpi-wait">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">⏳</div>
        <div class="kpi-val">{{ monthStats.attente }}</div>
        <div class="kpi-lbl">En attente</div>
      </div>
      <div class="kpi kpi-ferie">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">🎉</div>
        <div class="kpi-val">{{ feriesDuMois.length }}</div>
        <div class="kpi-lbl">Jours fériés</div>
      </div>
    </div>

    <div class="loader-wrap" v-if="chargement">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
import axios from '../axios';

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS_NOMS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

export default {
  name: 'CalendrierView',
  data() {
    return {
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      conges: [],
      joursFeries: [],
      chargement: true,
      selectedEvent: null,
      filtreStatut: 'tous',
      joursSemaine: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    };
  },

  computed: {
    isResponsable() {
      const role = localStorage.getItem('role');
      return role === 'responsable' || role === 'admin';
    },
    monthLabel() { return MOIS_NOMS[this.currentMonth]; },

    congesFiltres() {
      if (this.filtreStatut === 'tous') return this.conges;
      return this.conges.filter(c => c.statut === this.filtreStatut);
    },

    feriesDuMois() {
      return this.joursFeries.filter(f => {
        const d = new Date(f.date);
        return d.getMonth() === this.currentMonth && d.getFullYear() === this.currentYear;
      });
    },

    calendarCells() {
      const year = this.currentYear;
      const month = this.currentMonth;
      const firstDay = new Date(year, month, 1);
      let startDow = firstDay.getDay();
      startDow = startDow === 0 ? 6 : startDow - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

      const cells = [];

      // Mois précédent
      for (let i = startDow - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const m = month === 0 ? 11 : month - 1;
        const y = month === 0 ? year - 1 : year;
        const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dow = cells.length % 7;
        const ferie = this.getFerie(dateStr);
        cells.push({ day:d, currentMonth:false, isToday:false, isWeekend:dow>=5, date:dateStr, events:this.getEventsForDate(dateStr), isFerie:!!ferie, ferieNom:ferie?.nom||'' });
      }

      // Mois courant
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dow = cells.length % 7;
        const ferie = this.getFerie(dateStr);
        cells.push({ day:d, currentMonth:true, isToday:dateStr===todayStr, isWeekend:dow>=5, date:dateStr, events:this.getEventsForDate(dateStr), isFerie:!!ferie, ferieNom:ferie?.nom||'' });
      }

      // Mois suivant
      const remaining = 42 - cells.length;
      for (let d = 1; d <= remaining; d++) {
        const m = month === 11 ? 0 : month + 1;
        const y = month === 11 ? year + 1 : year;
        const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dow = cells.length % 7;
        const ferie = this.getFerie(dateStr);
        cells.push({ day:d, currentMonth:false, isToday:false, isWeekend:dow>=5, date:dateStr, events:this.getEventsForDate(dateStr), isFerie:!!ferie, ferieNom:ferie?.nom||'' });
      }

      return cells;
    },

    monthStats() {
      const year = this.currentYear;
      const month = this.currentMonth;
      const mConges = this.conges.filter(c => {
        const d = new Date(c.dateDebut);
        return d.getMonth() === month && d.getFullYear() === year;
      });
      return {
        total: mConges.length,
        approuve: mConges.filter(c => c.statut === 'approuvé').length,
        attente: mConges.filter(c => c.statut === 'en attente').length,
      };
    },
  },

  watch: {
    currentYear() { this.chargerFeries(); },
  },

  methods: {
    async chargerConges() {
      this.chargement = true;
      try {
        const endpoint = this.isResponsable ? '/conges' : '/conges/mes';
        const res = await axios.get(endpoint);
        this.conges = res.data;
      } catch { console.error('Erreur chargement congés'); }
      finally { this.chargement = false; }
    },

    async chargerFeries() {
      try {
        const res = await axios.get(`/feries/liste/${this.currentYear}`);
        this.joursFeries = res.data;
      } catch { console.error('Erreur chargement fériés'); }
    },

    getFerie(dateStr) {
      return this.joursFeries.find(f => f.date === dateStr);
    },

    getEventsForDate(dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      return this.congesFiltres.filter(c => {
        const debut = new Date(new Date(c.dateDebut).toISOString().split('T')[0] + 'T00:00:00');
        const fin = new Date(new Date(c.dateFin).toISOString().split('T')[0] + 'T00:00:00');
        return d >= debut && d <= fin;
      });
    },

    prevMonth() {
      if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
      else this.currentMonth--;
    },
    nextMonth() {
      if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
      else this.currentMonth++;
    },
    goToday() { this.currentMonth = new Date().getMonth(); this.currentYear = new Date().getFullYear(); },

    selectEvent(evt) { this.selectedEvent = evt; },
    showDayDetail(cell) { if (cell.events.length) this.selectedEvent = cell.events[0]; },

    eventLabel(evt) {
      if (this.isResponsable && evt.employe) return `${evt.employe.prenom?.[0]||''}. ${evt.employe.nom||''}`;
      return evt.motif?.substring(0, 15) || catLabel(evt.categorie);
    },
    eventTooltip(evt) {
      const label = this.isResponsable && evt.employe ? `${evt.employe.prenom} ${evt.employe.nom}` : (evt.motif || 'Congé');
      return `${label} — ${evt.statut} (${this.catLabel(evt.categorie)})`;
    },

    statusKey(s) { return s === 'approuvé' ? 'ok' : s === 'refusé' ? 'no' : 'wait'; },
    catClass(evt) { return 'cat-evt-' + (evt.categorie || 'annuel'); },
    catLabel(cat) {
      if (cat === 'exceptionnel') return 'Exceptionnel';
      if (cat === 'autre') return 'Autre';
      return 'Annuel';
    },
    excLabel(motif) {
      const labels = {
        mariage_employe: 'Mariage de l\'employé', mariage_enfant_frere_soeur: 'Mariage enfant/frère/sœur',
        deces_conjoint_descendant: 'Décès conjoint/descendant', deces_ascendant_frere_soeur: 'Décès ascendant/frère/sœur',
        deces_beau_pere_belle_mere: 'Décès beau-père/belle-mère', naissance_enfant: 'Naissance d\'un enfant',
        bapteme_enfant: 'Baptême d\'un enfant', premiere_communion: 'Première communion',
        hospitalisation_famille: 'Hospitalisation famille',
      };
      return labels[motif] || motif;
    },

    initiales(nom, prenom) { return ((prenom?.[0]||'') + (nom?.[0]||'')).toUpperCase(); },
    formatDate(d) { return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }); },
    formatDateShort(d) { return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }); },
    jourSemaine(d) { return JOURS_NOMS[new Date(d).getDay()]; },
    duree(a, b) { return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1); },
  },

  mounted() { this.chargerConges(); this.chargerFeries(); },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
.db { font-family:'Sora',sans-serif; background:var(--bg-primary,#0a0f1e); min-height:100vh; padding:28px 32px 60px; color:var(--text-secondary,#e2e8f0); }
.topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
.breadcrumb { font-size:11px; color:var(--text-dim); letter-spacing:.12em; text-transform:uppercase; font-weight:600; margin-bottom:5px; }
.page-title { font-size:28px; font-weight:800; color:var(--text-primary); letter-spacing:-.025em; margin:0; }

.legend-row { display:flex; gap:16px; flex-wrap:wrap; }
.leg-item { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-muted); font-weight:600; }
.leg-dot { width:10px; height:10px; border-radius:3px; }
.leg-ok { background:#4ade80; } .leg-wait { background:#fb923c; } .leg-no { background:#f87171; }
.leg-ferie { background:#facc15; }

/* NAV MOIS */
.month-nav { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
.nav-btn { width:36px; height:36px; border-radius:10px; border:1px solid var(--border-light,#334155); background:var(--bg-card,#111827); color:var(--text-muted); font-size:14px; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; font-family:inherit; }
.nav-btn:hover { border-color:var(--accent); color:var(--accent-lighter); }
.month-label { display:flex; flex-direction:column; align-items:center; min-width:140px; }
.month-name { font-size:20px; font-weight:800; color:var(--text-primary); }
.month-year { font-size:11px; color:var(--text-dim); font-weight:600; }
.today-btn { padding:8px 18px; border-radius:10px; border:1px solid var(--border-light); background:var(--bg-card); color:var(--text-muted); font-size:12px; font-weight:600; cursor:pointer; font-family:'Sora',sans-serif; transition:all .2s; }
.today-btn:hover { border-color:var(--accent); color:var(--accent-lighter); }
.filter-tabs { display:flex; gap:4px; margin-left:auto; }
.ftab { padding:7px 14px; border-radius:8px; border:1px solid var(--border-light); background:none; color:var(--text-dim); font-size:11px; font-weight:600; font-family:'Sora',sans-serif; cursor:pointer; transition:all .2s; }
.ftab:hover { color:var(--text-primary); border-color:var(--accent); }
.ftab.on { background:rgba(79,70,229,.15); color:var(--accent-lighter); border-color:var(--accent); }

/* CARD */
.card { background:var(--bg-card,#111827); border:1px solid var(--border,#1e293b); border-radius:20px; overflow:hidden; margin-bottom:20px; }
.card-hd { padding:18px 24px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
.card-title { font-size:15px; font-weight:700; color:var(--text-primary); }
.card-sub { font-size:12px; color:var(--text-dim); background:var(--bg-input); padding:3px 12px; border-radius:99px; font-weight:500; }

/* CALENDRIER */
.cal-header { display:grid; grid-template-columns:repeat(7,1fr); border-bottom:1px solid var(--border); }
.cal-day-name { padding:12px 0; text-align:center; font-size:11px; font-weight:700; color:var(--text-dim); text-transform:uppercase; letter-spacing:.1em; }
.cal-grid { display:grid; grid-template-columns:repeat(7,1fr); }
.cal-cell { min-height:100px; border-right:1px solid rgba(30,41,59,.3); border-bottom:1px solid rgba(30,41,59,.3); padding:6px 8px; transition:background .15s; cursor:default; position:relative; }
.cal-cell:nth-child(7n) { border-right:none; }
.cal-cell:hover { background:var(--bg-hover,#131c30); }
.cal-cell.other-month { opacity:.35; }
.cal-cell.is-weekend { background:rgba(30,41,59,.15); }
.cal-cell.is-today { background:rgba(79,70,229,.06); box-shadow:inset 0 0 0 1px rgba(79,70,229,.25); }
.cal-cell.is-ferie { background:rgba(250,204,21,.04); }
.cal-cell.is-ferie.is-today { background:rgba(250,204,21,.06); }

.cell-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
.cell-day { font-size:12px; font-weight:600; color:var(--text-muted); }
.cell-day.today { background:var(--accent); color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }
.ferie-badge { font-size:12px; cursor:help; }
.ferie-label { font-size:8px; color:#facc15; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; line-height:1.2; }

/* ÉVÉNEMENTS */
.cell-events { display:flex; flex-direction:column; gap:2px; }
.event { display:flex; align-items:center; gap:4px; padding:2px 6px; border-radius:4px; cursor:pointer; transition:all .15s; font-size:9px; font-weight:600; white-space:nowrap; overflow:hidden; }
.evt-ok { background:rgba(74,222,128,.12); color:#4ade80; }
.evt-wait { background:rgba(251,146,60,.12); color:#fb923c; }
.evt-no { background:rgba(248,113,113,.12); color:#f87171; }
.event:hover { filter:brightness(1.3); transform:translateX(2px); }
.evt-cat-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
.cat-annuel { background:#818cf8; }
.cat-exceptionnel { background:#fb923c; }
.cat-autre { background:#94a3b8; }
.evt-label { overflow:hidden; text-overflow:ellipsis; }
.evt-more { font-size:9px; color:var(--text-dim); font-weight:700; cursor:pointer; padding:1px 6px; }
.evt-more:hover { color:var(--accent-lighter); }

/* DÉTAIL */
.detail-card { margin-bottom:20px; }
.close-btn { width:28px; height:28px; border-radius:8px; border:1px solid var(--border-light); background:var(--bg-input); color:var(--text-muted); cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; transition:all .15s; font-family:inherit; }
.close-btn:hover { background:rgba(248,113,113,.12); color:#f87171; border-color:rgba(248,113,113,.3); }
.detail-body { padding:20px 24px; }
.detail-row { display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid rgba(30,41,59,.3); }
.detail-row:last-child { border-bottom:none; }
.detail-label { font-size:12px; color:var(--text-dim); font-weight:600; }
.detail-val { font-size:13px; color:var(--text-secondary); font-weight:600; }
.detail-highlight { color:var(--accent-lighter); font-weight:800; }
.emp-info { display:flex; align-items:center; gap:10px; }
.detail-avatar { width:28px; height:28px; border-radius:8px; background:var(--gradient-accent); color:white; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; }

/* Catégorie badges */
.cat-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:99px; }
.cat-b-annuel { background:rgba(129,140,248,.15); color:#818cf8; }
.cat-b-exceptionnel { background:rgba(251,146,60,.15); color:#fb923c; }
.cat-b-autre { background:rgba(148,163,184,.15); color:#94a3b8; }

/* Status badges */
.status-badge { font-size:11px; font-weight:700; padding:4px 12px; border-radius:99px; }
.s-ok { background:rgba(74,222,128,.12); color:#4ade80; }
.s-wait { background:rgba(251,146,60,.12); color:#fb923c; }
.s-no { background:rgba(248,113,113,.12); color:#f87171; }

/* JOURS FÉRIÉS DU MOIS */
.feries-body { padding:8px 0; }
.ferie-row { display:flex; align-items:center; gap:16px; padding:12px 24px; border-bottom:1px solid rgba(30,41,59,.3); transition:background .15s; }
.ferie-row:last-child { border-bottom:none; }
.ferie-row:hover { background:var(--bg-hover); }
.ferie-date { font-size:13px; font-weight:700; color:#facc15; min-width:60px; }
.ferie-name { font-size:13px; font-weight:600; color:var(--text-secondary); flex:1; }
.ferie-jour { font-size:11px; color:var(--text-dim); font-weight:500; text-transform:capitalize; }

/* KPI */
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px; }
.kpi { border-radius:20px; padding:24px; position:relative; overflow:hidden; transition:transform .25s; }
.kpi:hover { transform:translateY(-4px); box-shadow:var(--shadow-lg,0 12px 40px rgba(0,0,0,.4)); }
.kpi-total { background:var(--kpi-indigo,linear-gradient(145deg,#1e1b4b,#312e81)); border:1px solid rgba(99,102,241,.25); }
.kpi-ok { background:var(--kpi-green,linear-gradient(145deg,#052e16,#14532d)); border:1px solid rgba(22,163,74,.2); }
.kpi-wait { background:var(--kpi-orange,linear-gradient(145deg,#1c1007,#431407)); border:1px solid rgba(234,88,12,.2); }
.kpi-ferie { background:linear-gradient(145deg,#1a1700,#422006); border:1px solid rgba(250,204,21,.2); }
.kpi-glow { position:absolute; top:-24px; right:-24px; width:90px; height:90px; border-radius:50%; opacity:.2; }
.kpi-total .kpi-glow { background:#818cf8; } .kpi-ok .kpi-glow { background:#4ade80; } .kpi-wait .kpi-glow { background:#fb923c; } .kpi-ferie .kpi-glow { background:#facc15; }
.kpi-icon-wrap { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:18px; background:rgba(255,255,255,.08); }
.kpi-val { font-size:36px; font-weight:800; color:var(--text-primary); line-height:1; letter-spacing:-.04em; }
.kpi-lbl { font-size:11px; color:var(--text-muted); font-weight:600; margin-top:5px; text-transform:uppercase; letter-spacing:.08em; }

/* LOADER */
.loader-wrap { display:flex; justify-content:center; padding:40px; }
.spinner { width:30px; height:30px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin .6s linear infinite; }
@keyframes spin { to{transform:rotate(360deg);} }

/* TRANSITIONS */
.slide-enter-active { animation:slideUp .3s ease; }
.slide-leave-active { animation:slideUp .2s ease reverse; }
@keyframes slideUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }

@media (max-width:1000px) { .kpi-grid{grid-template-columns:repeat(2,1fr);} .cal-cell{min-height:70px;} .month-nav{flex-wrap:wrap;} }
@media (max-width:700px) { .db{padding:16px 14px 50px;} .page-title{font-size:22px;} .cal-cell{min-height:55px;padding:3px 4px;} .event{font-size:8px;} .ferie-label{display:none;} .filter-tabs{width:100%;} }
</style>