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
    </div>

    <!-- CALENDRIER -->
    <div class="card cal-card">
      <!-- Jours de la semaine -->
      <div class="cal-header">
        <div class="cal-day-name" v-for="d in joursSemaine" :key="d">{{ d }}</div>
      </div>

      <!-- Grille -->
      <div class="cal-grid">
        <div
          class="cal-cell"
          v-for="(cell, i) in calendarCells"
          :key="i"
          :class="{
            'other-month': !cell.currentMonth,
            'is-today': cell.isToday,
            'is-weekend': cell.isWeekend
          }"
        >
          <div class="cell-header">
            <span class="cell-day" :class="{ today: cell.isToday }">{{ cell.day }}</span>
          </div>
          <div class="cell-events">
            <div
              class="event"
              v-for="evt in cell.events"
              :key="evt._id"
              :class="['evt-' + statusKey(evt.statut)]"
              :title="eventTooltip(evt)"
              @click="selectEvent(evt)"
            >
              <span class="evt-label">{{ eventLabel(evt) }}</span>
            </div>
            <div class="evt-more" v-if="cell.events.length > 3">
              +{{ cell.events.length - 3 }} autres
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DÉTAIL D'UN ÉVÉNEMENT -->
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
              <div class="detail-avatar" :style="{ background: avatarColor(selectedEvent.employe.nom) }">
                {{ initiales(selectedEvent.employe.nom, selectedEvent.employe.prenom) }}
              </div>
              <span>{{ selectedEvent.employe.prenom }} {{ selectedEvent.employe.nom }}</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Période</span>
            <span class="detail-val">{{ formatDate(selectedEvent.dateDebut) }} → {{ formatDate(selectedEvent.dateFin) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Durée</span>
            <span class="detail-val detail-highlight">{{ duree(selectedEvent.dateDebut, selectedEvent.dateFin) }} jour{{ duree(selectedEvent.dateDebut, selectedEvent.dateFin) > 1 ? 's' : '' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Motif</span>
            <span class="detail-val">{{ selectedEvent.motif || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Statut</span>
            <span :class="['status-badge', 's-' + statusKey(selectedEvent.statut)]">
              {{ selectedEvent.statut }}
            </span>
          </div>
        </div>
      </div>
    </transition>

    <!-- STATS MOIS EN COURS -->
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
      <div class="kpi kpi-days">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">🗓️</div>
        <div class="kpi-val">{{ monthStats.jours }}</div>
        <div class="kpi-lbl">Jours posés</div>
      </div>
    </div>

    <!-- LOADER -->
    <div class="loader-wrap" v-if="chargement">
      <div class="spinner"></div>
      <span>Chargement…</span>
    </div>

  </div>
</template>

<script>
import axios from '../axios';

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const AVATAR_COLORS = [
  'linear-gradient(135deg, #4f46e5, #7c3aed)',
  'linear-gradient(135deg, #0891b2, #0e7490)',
  'linear-gradient(135deg, #be185d, #9d174d)',
  'linear-gradient(135deg, #b45309, #92400e)',
  'linear-gradient(135deg, #047857, #065f46)',
  'linear-gradient(135deg, #7c3aed, #5b21b6)',
];

export default {
  name: 'CalendrierView',
  data() {
    return {
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      conges: [],
      chargement: true,
      selectedEvent: null,
      joursSemaine: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    };
  },

  computed: {
    isResponsable() {
      const role = localStorage.getItem('role');
      return role === 'responsable' || role === 'admin';
    },

    monthLabel() {
      return MOIS_NOMS[this.currentMonth];
    },

    calendarCells() {
      const year = this.currentYear;
      const month = this.currentMonth;

      // Premier jour du mois (0=dimanche, on convertit en lundi=0)
      const firstDay = new Date(year, month, 1);
      let startDow = firstDay.getDay(); // 0=dim
      startDow = startDow === 0 ? 6 : startDow - 1; // lun=0

      // Nombre de jours dans le mois
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const cells = [];

      // Jours du mois précédent
      for (let i = startDow - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const m = month === 0 ? 11 : month - 1;
        const y = month === 0 ? year - 1 : year;
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dow = cells.length % 7;
        cells.push({
          day: d, currentMonth: false, isToday: false,
          isWeekend: dow >= 5, date: dateStr,
          events: this.getEventsForDate(dateStr)
        });
      }

      // Jours du mois courant
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dow = cells.length % 7;
        cells.push({
          day: d, currentMonth: true,
          isToday: dateStr === todayStr,
          isWeekend: dow >= 5, date: dateStr,
          events: this.getEventsForDate(dateStr)
        });
      }

      // Compléter les jours du mois suivant
      const remaining = 42 - cells.length; // 6 semaines
      for (let d = 1; d <= remaining; d++) {
        const m = month === 11 ? 0 : month + 1;
        const y = month === 11 ? year + 1 : year;
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dow = cells.length % 7;
        cells.push({
          day: d, currentMonth: false, isToday: false,
          isWeekend: dow >= 5, date: dateStr,
          events: this.getEventsForDate(dateStr)
        });
      }

      return cells;
    },

    monthStats() {
      const year = this.currentYear;
      const month = this.currentMonth;
      const monthConges = this.conges.filter(c => {
        const debut = new Date(c.dateDebut);
        const fin = new Date(c.dateFin);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        return debut <= monthEnd && fin >= monthStart;
      });

      return {
        total: monthConges.length,
        approuve: monthConges.filter(c => c.statut === 'approuvé').length,
        attente: monthConges.filter(c => c.statut === 'en attente').length,
        jours: monthConges
          .filter(c => c.statut === 'approuvé')
          .reduce((sum, c) => sum + this.duree(c.dateDebut, c.dateFin), 0),
      };
    },
  },

  methods: {
    async chargerConges() {
      this.chargement = true;
      try {
        const endpoint = this.isResponsable ? '/conges' : '/conges/mes';
        const res = await axios.get(endpoint);
        this.conges = res.data;
      } catch {
        console.error('Erreur chargement congés');
      } finally {
        this.chargement = false;
      }
    },

    getEventsForDate(dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      return this.conges.filter(c => {
        const debut = new Date(new Date(c.dateDebut).toISOString().split('T')[0] + 'T00:00:00');
        const fin = new Date(new Date(c.dateFin).toISOString().split('T')[0] + 'T00:00:00');
        return d >= debut && d <= fin;
      }).slice(0, 3); // Max 3 visibles par cellule
    },

    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
    },

    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
    },

    goToday() {
      this.currentMonth = new Date().getMonth();
      this.currentYear = new Date().getFullYear();
    },

    selectEvent(evt) {
      this.selectedEvent = evt;
    },

    eventLabel(evt) {
      if (this.isResponsable && evt.employe) {
        return `${evt.employe.prenom?.[0] || ''}. ${evt.employe.nom || ''}`;
      }
      return evt.motif || 'Congé';
    },

    eventTooltip(evt) {
      const label = this.isResponsable && evt.employe
        ? `${evt.employe.prenom} ${evt.employe.nom}`
        : (evt.motif || 'Congé');
      return `${label} — ${evt.statut}`;
    },

    statusKey(statut) {
      if (statut === 'approuvé') return 'ok';
      if (statut === 'refusé') return 'no';
      return 'wait';
    },

    formatDate(d) {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
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
  },

  mounted() {
    this.chargerConges();
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

/* ── BASE ── */
.db {
  font-family: 'Sora', sans-serif;
  background: #0a0f1e;
  min-height: 100vh;
  padding: 28px 32px 60px;
  color: #e2e8f0;
}

/* ── TOPBAR ── */
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.breadcrumb { font-size: 11px; color: #4a5568; letter-spacing: .12em; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
.page-title { font-size: 28px; font-weight: 800; color: #f7fafc; letter-spacing: -.025em; margin: 0; }

.legend-row { display: flex; align-items: center; gap: 16px; }
.leg-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; font-weight: 600; }
.leg-dot { width: 10px; height: 10px; border-radius: 3px; }
.leg-ok { background: #4ade80; }
.leg-wait { background: #fb923c; }
.leg-no { background: #f87171; }

/* ── MONTH NAV ── */
.month-nav {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 20px;
}
.nav-btn {
  width: 38px; height: 38px;
  border-radius: 10px; border: 1px solid #1e293b;
  background: #111827; color: #94a3b8;
  font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s; font-family: inherit;
}
.nav-btn:hover { background: #1e293b; color: #e2e8f0; border-color: #334155; }
.month-label { display: flex; align-items: baseline; gap: 8px; }
.month-name { font-size: 22px; font-weight: 800; color: #f8fafc; }
.month-year { font-size: 14px; font-weight: 600; color: #475569; }
.today-btn {
  padding: 8px 18px; border-radius: 10px;
  border: 1px solid #334155; background: #111827;
  color: #94a3b8; font-size: 12px; font-weight: 600;
  font-family: 'Sora', sans-serif; cursor: pointer;
  transition: all .2s; margin-left: 8px;
}
.today-btn:hover { background: rgba(79,70,229,.15); color: #a5b4fc; border-color: rgba(79,70,229,.3); }

/* ── CALENDAR CARD ── */
.card { background: #111827; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; margin-bottom: 24px; }
.card-hd { padding: 20px 24px 16px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 15px; font-weight: 700; color: #f1f5f9; }

.cal-header {
  display: grid; grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #1e293b;
}
.cal-day-name {
  padding: 14px; text-align: center;
  font-size: 11px; font-weight: 700;
  color: #475569; text-transform: uppercase;
  letter-spacing: .08em;
}

.cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
}

.cal-cell {
  min-height: 100px;
  border-right: 1px solid #0d1422;
  border-bottom: 1px solid #0d1422;
  padding: 8px;
  transition: background .15s;
  position: relative;
}
.cal-cell:nth-child(7n) { border-right: none; }
.cal-cell:hover { background: #131c30; }
.cal-cell.other-month { opacity: .3; }
.cal-cell.is-weekend { background: rgba(30,41,59,.3); }
.cal-cell.is-today { background: rgba(79,70,229,.06); }

.cell-header {
  display: flex; align-items: center; justify-content: flex-end;
  margin-bottom: 6px;
}
.cell-day {
  font-size: 12px; font-weight: 700; color: #64748b;
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
}
.cell-day.today {
  background: #4f46e5; color: white;
}

/* ── EVENTS ── */
.cell-events { display: flex; flex-direction: column; gap: 3px; }

.event {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.event:hover { transform: scale(1.02); filter: brightness(1.2); }

.evt-ok {
  background: rgba(74,222,128,.12);
  color: #4ade80;
  border-left: 3px solid #4ade80;
}
.evt-wait {
  background: rgba(251,146,60,.12);
  color: #fb923c;
  border-left: 3px solid #fb923c;
}
.evt-no {
  background: rgba(248,113,113,.1);
  color: #f87171;
  border-left: 3px solid #f87171;
}

.evt-label { }
.evt-more {
  font-size: 9px; color: #475569; font-weight: 600;
  padding: 2px 0; text-align: center;
}

/* ── DETAIL CARD ── */
.detail-card { margin-bottom: 24px; }
.close-btn {
  width: 30px; height: 30px;
  border-radius: 8px; border: 1px solid #334155;
  background: #1e293b; color: #94a3b8;
  cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s; font-family: inherit;
}
.close-btn:hover { background: rgba(248,113,113,.12); color: #f87171; border-color: rgba(248,113,113,.3); }

.detail-body { padding: 20px 24px; display: flex; flex-direction: column; }
.detail-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #1a2236;
}
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 12px; color: #475569; font-weight: 600; }
.detail-val { font-size: 13px; color: #e2e8f0; font-weight: 600; }
.detail-highlight { color: #a5b4fc; font-size: 16px; font-weight: 800; }

.emp-info { display: flex; align-items: center; gap: 10px; }
.detail-avatar {
  width: 30px; height: 30px; border-radius: 8px;
  color: white; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 13px; border-radius: 99px;
  font-size: 11px; font-weight: 700;
  text-transform: capitalize; white-space: nowrap;
}
.s-ok   { background: rgba(74,222,128,.1);  color: #4ade80; border: 1px solid rgba(74,222,128,.2); }
.s-wait { background: rgba(234,88,12,.15);  color: #fb923c; border: 1px solid rgba(234,88,12,.2); }
.s-no   { background: rgba(248,113,113,.1); color: #f87171; border: 1px solid rgba(248,113,113,.2); }

/* ── KPI ── */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.kpi { border-radius: 20px; padding: 24px; position: relative; overflow: hidden; transition: transform .25s, box-shadow .25s; }
.kpi:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,.4); }
.kpi-total { background: linear-gradient(145deg, #1e1b4b, #312e81); border: 1px solid rgba(99,102,241,.25); }
.kpi-ok    { background: linear-gradient(145deg, #052e16, #14532d); border: 1px solid rgba(22,163,74,.2); }
.kpi-wait  { background: linear-gradient(145deg, #1c1007, #431407); border: 1px solid rgba(234,88,12,.2); }
.kpi-days  { background: linear-gradient(145deg, #0c1a2e, #0c2a4a); border: 1px solid rgba(56,130,221,.2); }
.kpi-glow { position: absolute; top: -24px; right: -24px; width: 90px; height: 90px; border-radius: 50%; opacity: .2; pointer-events: none; }
.kpi-total .kpi-glow { background: #818cf8; }
.kpi-ok    .kpi-glow { background: #4ade80; }
.kpi-wait  .kpi-glow { background: #fb923c; }
.kpi-days  .kpi-glow { background: #60a5fa; }
.kpi-icon-wrap { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 18px; }
.kpi-total .kpi-icon-wrap { background: rgba(79,70,229,.25); }
.kpi-ok    .kpi-icon-wrap { background: rgba(22,163,74,.25); }
.kpi-wait  .kpi-icon-wrap { background: rgba(234,88,12,.25); }
.kpi-days  .kpi-icon-wrap { background: rgba(56,130,221,.25); }
.kpi-val { font-size: 38px; font-weight: 800; letter-spacing: -.04em; color: #f8fafc; line-height: 1; }
.kpi-lbl { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 5px; text-transform: uppercase; letter-spacing: .08em; }

/* ── LOADER ── */
.loader-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 14px; color: #475569; font-size: 13px; }
.spinner { width: 34px; height: 34px; border: 3px solid #1e293b; border-top-color: #4f46e5; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── TRANSITIONS ── */
.slide-enter-active, .slide-leave-active { transition: all .3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-12px); }

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .cal-cell { min-height: 80px; padding: 5px; }
  .event { font-size: 9px; padding: 2px 5px; }
}
@media (max-width: 700px) {
  .db { padding: 16px 14px 50px; }
  .page-title { font-size: 22px; }
  .topbar { flex-direction: column; align-items: flex-start; }
  .cal-day-name { padding: 10px 4px; font-size: 9px; }
  .cal-cell { min-height: 60px; padding: 4px; }
  .cell-day { font-size: 10px; width: 22px; height: 22px; }
  .event { display: none; }
  .kpi-grid { gap: 12px; }
  .month-name { font-size: 18px; }
}
</style>