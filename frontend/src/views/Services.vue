<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Administration</div>
        <h1 class="page-title">Services</h1>
      </div>
      <div class="topbar-right">
        <div class="date-pill">📅 {{ todayLabel }}</div>
        <button class="add-btn" @click="showForm = !showForm">
          <span v-if="!showForm">＋ Nouveau service</span>
          <span v-else>✕ Fermer</span>
        </button>
      </div>
    </div>

    <!-- KPI CARDS -->
    <div class="kpi-grid">
      <div class="kpi kpi-total">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">🏢</div>
        <div class="kpi-val">{{ services.length }}</div>
        <div class="kpi-lbl">Total services</div>
        <div class="kpi-trend">Actifs</div>
      </div>
      <div class="kpi kpi-recent">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">📊</div>
        <div class="kpi-val">{{ avgEmployes }}</div>
        <div class="kpi-lbl">Moy. employés</div>
        <div class="kpi-trend">Par service</div>
      </div>
      <div class="kpi kpi-active">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">✅</div>
        <div class="kpi-val">{{ services.length }}</div>
        <div class="kpi-lbl">Opérationnels</div>
        <div class="kpi-trend">100%</div>
      </div>
    </div>

    <!-- FORMULAIRE AJOUT (collapsible) -->
    <transition name="slide">
      <div class="card form-card" v-if="showForm">
        <div class="card-hd">
          <span class="card-title">{{ editMode ? 'Modifier le service' : 'Créer un service' }}</span>
          <span class="card-sub">{{ editMode ? 'Mise à jour' : 'Nouveau' }}</span>
        </div>
        <div class="form-body">
          <div class="field-group">
            <label class="field-label">Nom du service</label>
            <div class="input-wrap" :class="{ focused: focusNom }">
              <span class="input-icon">🏢</span>
              <input
                v-model="formNom"
                type="text"
                placeholder="RH, Comptabilité, IT, Marketing…"
                class="field-input"
                @focus="focusNom = true"
                @blur="focusNom = false"
                @keyup.enter="editMode ? validerModification() : ajouterService()"
                ref="inputNom"
              />
            </div>
          </div>

          <div class="form-actions">
            <button
              class="submit-btn"
              @click="editMode ? validerModification() : ajouterService()"
              :disabled="!formNom.trim()"
            >
              <span v-if="editMode">✓ Enregistrer les modifications</span>
              <span v-else>＋ Ajouter le service</span>
            </button>
            <button v-if="editMode" class="cancel-btn" @click="annulerModification">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- LISTE DES SERVICES -->
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Tous les services</span>
        <div class="sbox">
          <span class="s-icon">🔍</span>
          <input
            v-model="recherche"
            type="text"
            placeholder="Rechercher un service…"
            class="s-input"
          />
        </div>
      </div>

      <!-- Loader -->
      <div class="loader-wrap" v-if="chargement">
        <div class="spinner"></div>
        <span>Chargement des services…</span>
      </div>

      <!-- Empty -->
      <div class="empty" v-else-if="!servicesFiltres.length">
        <div class="empty-icon">🏢</div>
        <p>Aucun service trouvé</p>
        <span>{{ recherche ? 'Essayez une autre recherche' : 'Créez votre premier service' }}</span>
      </div>

      <!-- Grid de services -->
      <div class="services-grid" v-else>
        <div
          class="service-card"
          v-for="(service, index) in servicesFiltres"
          :key="service._id"
          :style="{ animationDelay: (index * 0.05) + 's' }"
        >
          <div class="sc-header">
            <div class="sc-avatar" :style="{ background: avatarColor(index) }">
              {{ service.nom.charAt(0).toUpperCase() }}
            </div>
            <div class="sc-info">
              <div class="sc-name">{{ service.nom }}</div>
              <div class="sc-meta">Service actif</div>
            </div>
          </div>
          <div class="sc-actions">
            <button class="sc-btn sc-edit" @click="editerService(service)" title="Modifier">
              ✏️
            </button>
            <button class="sc-btn sc-del" @click="supprimerService(service._id)" title="Supprimer">
              🗑️
            </button>
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

const AVATAR_COLORS = [
  'linear-gradient(135deg, #4f46e5, #7c3aed)',
  'linear-gradient(135deg, #0891b2, #0e7490)',
  'linear-gradient(135deg, #be185d, #9d174d)',
  'linear-gradient(135deg, #b45309, #92400e)',
  'linear-gradient(135deg, #047857, #065f46)',
  'linear-gradient(135deg, #7c3aed, #5b21b6)',
  'linear-gradient(135deg, #dc2626, #991b1b)',
  'linear-gradient(135deg, #2563eb, #1d4ed8)',
];

export default {
  name: 'ServicesView',
  data() {
    return {
      services: [],
      formNom: '',
      recherche: '',
      editMode: false,
      editId: null,
      showForm: false,
      chargement: true,
      focusNom: false,
      toast: { visible: false, message: '', type: 'success' },
    };
  },

  computed: {
    todayLabel() {
      return new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    },
    avgEmployes() {
      return this.services.length ? '—' : '0';
    },
    servicesFiltres() {
      const q = this.recherche.toLowerCase();
      if (!q) return this.services;
      return this.services.filter(s => s.nom.toLowerCase().includes(q));
    },
  },

  methods: {
    async chargerServices() {
      this.chargement = true;
      try {
        const res = await axios.get('/services');
        this.services = res.data;
      } catch {
        this.showToast('Impossible de charger les services', 'error');
      } finally {
        this.chargement = false;
      }
    },

    async ajouterService() {
      if (!this.formNom.trim()) return;
      try {
        await axios.post('/services', { nom: this.formNom.trim() });
        this.formNom = '';
        this.showToast('Service créé avec succès', 'success');
        await this.chargerServices();
      } catch (err) {
        this.showToast(err.response?.data?.message || 'Erreur lors de l\'ajout', 'error');
      }
    },

    editerService(service) {
      this.editMode = true;
      this.editId = service._id;
      this.formNom = service.nom;
      this.showForm = true;
      this.$nextTick(() => {
        this.$refs.inputNom?.focus();
      });
    },

    async validerModification() {
      if (!this.formNom.trim()) return;
      try {
        await axios.put(`/services/${this.editId}`, { nom: this.formNom.trim() });
        this.showToast('Service modifié avec succès', 'success');
        this.annulerModification();
        await this.chargerServices();
      } catch (err) {
        this.showToast(err.response?.data?.message || 'Erreur lors de la modification', 'error');
      }
    },

    annulerModification() {
      this.editMode = false;
      this.editId = null;
      this.formNom = '';
      this.showForm = false;
    },

    async supprimerService(id) {
      if (!confirm('Supprimer ce service définitivement ?')) return;
      try {
        await axios.delete(`/services/${id}`);
        this.showToast('Service supprimé', 'success');
        await this.chargerServices();
      } catch {
        this.showToast('Erreur lors de la suppression', 'error');
      }
    },

    avatarColor(index) {
      return AVATAR_COLORS[index % AVATAR_COLORS.length];
    },

    showToast(message, type = 'success') {
      this.toast = { visible: true, message, type };
      setTimeout(() => { this.toast.visible = false; }, 3500);
    },
  },

  mounted() {
    this.chargerServices();
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
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
.breadcrumb { font-size: 11px; color: #4a5568; letter-spacing: .12em; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
.page-title { font-size: 28px; font-weight: 800; color: #f7fafc; letter-spacing: -.025em; margin: 0; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.date-pill { background: #111827; border: 1px solid #1e293b; border-radius: 99px; padding: 9px 18px; font-size: 12px; color: #94a3b8; font-weight: 500; text-transform: capitalize; }

.add-btn {
  padding: 10px 20px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white; font-size: 13px; font-weight: 700;
  font-family: 'Sora', sans-serif; cursor: pointer;
  transition: opacity .2s, transform .15s;
}
.add-btn:hover { opacity: .88; transform: translateY(-1px); }

/* ── KPI ── */
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
.kpi { border-radius: 20px; padding: 24px; position: relative; overflow: hidden; transition: transform .25s, box-shadow .25s; }
.kpi:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,.4); }
.kpi-total { background: linear-gradient(145deg, #1e1b4b, #312e81); border: 1px solid rgba(99,102,241,.25); }
.kpi-recent { background: linear-gradient(145deg, #0c1a2e, #0c2a4a); border: 1px solid rgba(56,130,221,.2); }
.kpi-active { background: linear-gradient(145deg, #052e16, #14532d); border: 1px solid rgba(22,163,74,.2); }
.kpi-glow { position: absolute; top: -24px; right: -24px; width: 90px; height: 90px; border-radius: 50%; opacity: .2; pointer-events: none; }
.kpi-total .kpi-glow { background: #818cf8; }
.kpi-recent .kpi-glow { background: #60a5fa; }
.kpi-active .kpi-glow { background: #4ade80; }
.kpi-icon-wrap { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 18px; }
.kpi-total .kpi-icon-wrap { background: rgba(79,70,229,.25); }
.kpi-recent .kpi-icon-wrap { background: rgba(56,130,221,.25); }
.kpi-active .kpi-icon-wrap { background: rgba(22,163,74,.25); }
.kpi-val { font-size: 38px; font-weight: 800; letter-spacing: -.04em; color: #f8fafc; line-height: 1; }
.kpi-lbl { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 5px; text-transform: uppercase; letter-spacing: .08em; }
.kpi-trend { position: absolute; bottom: 18px; right: 18px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
.kpi-total .kpi-trend { background: rgba(79,70,229,.3); color: #a5b4fc; }
.kpi-recent .kpi-trend { background: rgba(56,130,221,.3); color: #93c5fd; }
.kpi-active .kpi-trend { background: rgba(22,163,74,.3); color: #4ade80; }

/* ── CARD ── */
.card { background: #111827; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; margin-bottom: 24px; }
.card-hd { padding: 20px 24px 16px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.card-title { font-size: 15px; font-weight: 700; color: #f1f5f9; }
.card-sub { font-size: 12px; color: #475569; background: #1e293b; padding: 3px 12px; border-radius: 99px; font-weight: 500; }

/* ── FORM ── */
.form-body { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .07em; }
.input-wrap {
  display: flex; align-items: center; gap: 10px;
  background: #1e293b; border: 1px solid #334155;
  border-radius: 12px; padding: 13px 16px;
  transition: border-color .2s, box-shadow .2s;
}
.input-wrap.focused { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.15); }
.input-icon { font-size: 16px; flex-shrink: 0; }
.field-input {
  background: none; border: none; outline: none;
  font-size: 14px; font-family: 'Sora', sans-serif;
  color: #e2e8f0; flex: 1;
}
.field-input::placeholder { color: #475569; }

.form-actions { display: flex; gap: 12px; }
.submit-btn {
  flex: 1; padding: 14px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border: none; border-radius: 12px;
  color: white; font-size: 14px; font-weight: 700;
  font-family: 'Sora', sans-serif; cursor: pointer;
  transition: opacity .2s, transform .15s;
}
.submit-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
.submit-btn:disabled { opacity: .4; cursor: not-allowed; }
.cancel-btn {
  padding: 14px 24px; border-radius: 12px;
  border: 1px solid #334155; background: #1e293b;
  color: #94a3b8; font-size: 14px; font-weight: 600;
  font-family: 'Sora', sans-serif; cursor: pointer;
  transition: all .2s;
}
.cancel-btn:hover { border-color: #f87171; color: #f87171; background: rgba(248,113,113,.08); }

/* ── SEARCH ── */
.sbox { display: flex; align-items: center; gap: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 8px 14px; transition: border-color .2s; }
.sbox:focus-within { border-color: #4f46e5; }
.s-icon { font-size: 13px; color: #475569; }
.s-input { background: none; border: none; outline: none; font-size: 13px; font-family: 'Sora', sans-serif; color: #e2e8f0; width: 200px; }
.s-input::placeholder { color: #475569; }

/* ── STATES ── */
.loader-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 14px; color: #475569; font-size: 13px; }
.spinner { width: 34px; height: 34px; border: 3px solid #1e293b; border-top-color: #4f46e5; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty { display: flex; flex-direction: column; align-items: center; padding: 70px 20px; gap: 8px; color: #334155; text-align: center; }
.empty-icon { font-size: 48px; }
.empty p { font-size: 14px; font-weight: 600; color: #475569; margin: 0; }
.empty span { font-size: 12px; color: #334155; }

/* ── SERVICES GRID ── */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  padding: 20px;
}

.service-card {
  display: flex; align-items: center; justify-content: space-between;
  background: #0d1422;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 18px 20px;
  transition: all .25s;
  animation: fadeInUp .4s ease both;
}
.service-card:hover { border-color: #334155; background: #131c30; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.sc-header { display: flex; align-items: center; gap: 14px; }
.sc-avatar {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 16px; font-weight: 800;
  flex-shrink: 0;
}
.sc-name { font-size: 14px; font-weight: 700; color: #f1f5f9; }
.sc-meta { font-size: 11px; color: #475569; margin-top: 2px; }

.sc-actions { display: flex; gap: 6px; }
.sc-btn {
  width: 34px; height: 34px;
  border: 1px solid #1e293b; border-radius: 10px;
  cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  background: #1e293b; color: #94a3b8;
  transition: all .15s; font-family: inherit;
}
.sc-btn:hover { transform: scale(1.1); }
.sc-edit:hover { background: rgba(79,70,229,.15); border-color: rgba(79,70,229,.3); }
.sc-del:hover { background: rgba(248,113,113,.12); border-color: rgba(248,113,113,.3); }

/* ── SLIDE TRANSITION ── */
.slide-enter-active, .slide-leave-active { transition: all .3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-12px); }

/* ── TOAST ── */
.toast { position: fixed; bottom: 28px; right: 28px; padding: 14px 22px; border-radius: 14px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 10px; z-index: 9999; font-family: 'Sora', sans-serif; }
.toast-success { background: #052e16; color: #4ade80; border: 1px solid rgba(74,222,128,.2); box-shadow: 0 4px 24px rgba(74,222,128,.15); }
.toast-error { background: #1a0a0a; color: #f87171; border: 1px solid rgba(248,113,113,.2); box-shadow: 0 4px 24px rgba(248,113,113,.15); }
.toast-enter-active, .toast-leave-active { transition: all .35s cubic-bezier(.34,1.56,.64,1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px) scale(.95); }

/* ── RESPONSIVE ── */
@media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .services-grid { grid-template-columns: 1fr; } }
@media (max-width: 700px) { .db { padding: 16px 14px 50px; } .page-title { font-size: 22px; } .topbar { flex-direction: column; align-items: flex-start; } .kpi-grid { gap: 12px; } }
</style>