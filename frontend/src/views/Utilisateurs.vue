<template>
  <div class="db">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <div class="breadcrumb">⬡ Gestion des Congés · Administration</div>
        <h1 class="page-title">Gestion des employés</h1>
      </div>
      <div class="topbar-right">
        <div class="date-pill">📅 {{ todayLabel }}</div>
        <button class="add-btn" @click="showFormAjout = !showFormAjout">
          <span v-if="!showFormAjout">＋ Nouvel employé</span>
          <span v-else>✕ Fermer</span>
        </button>
      </div>
    </div>

    <!-- KPI CARDS -->
    <div class="kpi-grid">
      <div class="kpi kpi-total">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">👥</div>
        <div class="kpi-val">{{ utilisateurs.length }}</div>
        <div class="kpi-lbl">Total employés</div>
        <div class="kpi-trend">Effectif</div>
      </div>
      <div class="kpi kpi-resp">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">👑</div>
        <div class="kpi-val">{{ nbResponsables }}</div>
        <div class="kpi-lbl">Responsables</div>
        <div class="kpi-trend">{{ pctResp }}%</div>
      </div>
      <div class="kpi kpi-emp">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">👤</div>
        <div class="kpi-val">{{ nbEmployes }}</div>
        <div class="kpi-lbl">Employés</div>
        <div class="kpi-trend">{{ pctEmp }}%</div>
      </div>
      <div class="kpi kpi-serv">
        <div class="kpi-glow"></div>
        <div class="kpi-icon-wrap">🏢</div>
        <div class="kpi-val">{{ services.length }}</div>
        <div class="kpi-lbl">Services</div>
        <div class="kpi-trend">Actifs</div>
      </div>
    </div>

    <!-- FORMULAIRE AJOUT -->
    <transition name="slide">
      <div class="card form-card" v-if="showFormAjout">
        <div class="card-hd">
          <span class="card-title">Ajouter un employé</span>
          <span class="card-sub">Nouveau</span>
        </div>
        <div class="form-body">
          <div class="form-grid">
            <div class="field-group">
              <label class="field-label">Nom</label>
              <div class="input-wrap" :class="{ focused: focus.nom }">
                <span class="input-icon">👤</span>
                <input v-model="formAjout.nom" type="text" placeholder="Nom" class="field-input"
                  @focus="focus.nom = true" @blur="focus.nom = false" required />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Prénom</label>
              <div class="input-wrap" :class="{ focused: focus.prenom }">
                <span class="input-icon">👤</span>
                <input v-model="formAjout.prenom" type="text" placeholder="Prénom" class="field-input"
                  @focus="focus.prenom = true" @blur="focus.prenom = false" required />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Email</label>
              <div class="input-wrap" :class="{ focused: focus.email }">
                <span class="input-icon">✉️</span>
                <input v-model="formAjout.email" type="email" placeholder="email@example.com" class="field-input"
                  @focus="focus.email = true" @blur="focus.email = false" required />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Mot de passe</label>
              <div class="input-wrap" :class="{ focused: focus.mdp }">
                <span class="input-icon">🔒</span>
                <input v-model="formAjout.motDePasse" type="password" placeholder="Min. 6 caractères" class="field-input"
                  @focus="focus.mdp = true" @blur="focus.mdp = false" required />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Rôle</label>
              <div class="input-wrap select-wrap" :class="{ focused: focus.role }">
                <span class="input-icon">🎯</span>
                <select v-model="formAjout.role" class="field-input field-select"
                  @focus="focus.role = true" @blur="focus.role = false" required>
                  <option disabled value="">— Choisir —</option>
                  <option value="employe">Employé</option>
                  <option value="responsable">Responsable</option>
                </select>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Service</label>
              <div class="input-wrap select-wrap" :class="{ focused: focus.service }">
                <span class="input-icon">🏢</span>
                <select v-model="formAjout.service" class="field-input field-select"
                  @focus="focus.service = true" @blur="focus.service = false">
                  <option value="">— Aucun —</option>
                  <option v-for="s in services" :key="s._id" :value="s._id">{{ s.nom }}</option>
                </select>
              </div>
            </div>
          </div>
          <button
            class="submit-btn"
            @click="ajouterUtilisateur"
            :disabled="!formAjout.nom || !formAjout.prenom || !formAjout.email || !formAjout.motDePasse || !formAjout.role"
          >
            ＋ Créer l'employé
          </button>
        </div>
      </div>
    </transition>

    <!-- TABLEAU -->
    <div class="card table-card">
      <div class="card-hd">
        <span class="card-title">Liste des employés</span>
        <div class="filters">
          <div class="sbox">
            <span class="s-icon">🔍</span>
            <input v-model="recherche" type="text" placeholder="Rechercher…" class="s-input" />
          </div>
          <div class="tabs">
            <button :class="['tab', { on: filtreRole === 'tous' }]" @click="filtreRole = 'tous'">Tous <span class="tab-badge">{{ utilisateurs.length }}</span></button>
            <button :class="['tab', { on: filtreRole === 'employe' }]" @click="filtreRole = 'employe'">Employés <span class="tab-badge">{{ nbEmployes }}</span></button>
            <button :class="['tab', { on: filtreRole === 'responsable' }]" @click="filtreRole = 'responsable'">Responsables <span class="tab-badge">{{ nbResponsables }}</span></button>
          </div>
        </div>
      </div>

      <!-- Loader -->
      <div class="loader-wrap" v-if="chargement">
        <div class="spinner"></div>
        <span>Chargement des données…</span>
      </div>

      <!-- Empty -->
      <div class="empty" v-else-if="!utilisateursFiltres.length">
        <div class="empty-icon">👥</div>
        <p>Aucun employé trouvé</p>
        <span>{{ recherche ? 'Essayez une autre recherche' : 'Ajoutez votre premier employé' }}</span>
      </div>

      <!-- Table -->
      <div class="tbl-wrap" v-else>
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Service</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr class="trow" v-for="user in utilisateursFiltres" :key="user._id">

              <!-- MODE ÉDITION -->
              <template v-if="editId === user._id">
                <td>
                  <div class="edit-row">
                    <input v-model="formEdit.nom" class="edit-input" placeholder="Nom" />
                    <input v-model="formEdit.prenom" class="edit-input" placeholder="Prénom" />
                  </div>
                </td>
                <td><input v-model="formEdit.email" class="edit-input" placeholder="Email" /></td>
                <td>
                  <select v-model="formEdit.role" class="edit-select">
                    <option value="employe">Employé</option>
                    <option value="responsable">Responsable</option>
                  </select>
                </td>
                <td>
                  <select v-model="formEdit.service" class="edit-select">
                    <option value="">— Aucun —</option>
                    <option v-for="s in services" :key="s._id" :value="s._id">{{ s.nom }}</option>
                  </select>
                </td>
                <td>
                  <div class="act-btns">
                    <button class="abtn abtn-ok" @click="validerEdition(user._id)" title="Valider">✓</button>
                    <button class="abtn abtn-no" @click="annulerEdition" title="Annuler">✕</button>
                  </div>
                </td>
              </template>

              <!-- MODE AFFICHAGE -->
              <template v-else>
                <td>
                  <div class="emp-cell">
                    <div class="avatar" :style="{ background: avatarColor(user.nom) }">
                      {{ initiales(user.nom, user.prenom) }}
                    </div>
                    <div>
                      <div class="emp-name">{{ user.prenom }} {{ user.nom }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="email-text">{{ user.email }}</span></td>
                <td>
                  <span :class="['role-badge', user.role === 'responsable' ? 'rb-resp' : 'rb-emp']">
                    {{ user.role === 'responsable' ? '👑 Responsable' : '👤 Employé' }}
                  </span>
                </td>
                <td><span class="service-text">{{ user.service?.nom || '—' }}</span></td>
                <td>
                  <div class="act-btns">
                    <button class="abtn abtn-edit" @click="activerEdition(user)" title="Modifier">✏️</button>
                    <button class="abtn abtn-del" @click="supprimerUtilisateur(user._id)" title="Supprimer">🗑️</button>
                  </div>
                </td>
              </template>
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
  name: 'UtilisateursView',
  data() {
    return {
      utilisateurs: [],
      services: [],
      recherche: '',
      filtreRole: 'tous',
      chargement: true,
      showFormAjout: false,
      editId: null,
      formEdit: {},
      formAjout: {
        nom: '', prenom: '', email: '',
        motDePasse: '', role: '', service: ''
      },
      focus: {
        nom: false, prenom: false, email: false,
        mdp: false, role: false, service: false
      },
      toast: { visible: false, message: '', type: 'success' },
    };
  },

  computed: {
    todayLabel() {
      return new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    },
    nbResponsables() { return this.utilisateurs.filter(u => u.role === 'responsable').length; },
    nbEmployes() { return this.utilisateurs.filter(u => u.role === 'employe').length; },
    pctResp() {
      const t = this.utilisateurs.length;
      return t ? Math.round((this.nbResponsables / t) * 100) : 0;
    },
    pctEmp() {
      const t = this.utilisateurs.length;
      return t ? Math.round((this.nbEmployes / t) * 100) : 0;
    },
    utilisateursFiltres() {
      return this.utilisateurs.filter(u => {
        const q = this.recherche.toLowerCase();
        const okRole = this.filtreRole === 'tous' || u.role === this.filtreRole;
        const okSearch = !q
          || u.nom.toLowerCase().includes(q)
          || u.prenom.toLowerCase().includes(q)
          || u.email.toLowerCase().includes(q);
        return okRole && okSearch;
      });
    },
  },

  methods: {
    async chargerUtilisateurs() {
      this.chargement = true;
      try {
        const res = await axios.get('/users');
        this.utilisateurs = res.data;
      } catch {
        this.showToast('Impossible de charger les utilisateurs', 'error');
      } finally {
        this.chargement = false;
      }
    },

    async chargerServices() {
      try {
        const res = await axios.get('/services');
        this.services = res.data;
      } catch {
        console.error('Impossible de charger les services');
      }
    },

    async ajouterUtilisateur() {
      try {
        await axios.post('/users', this.formAjout);
        this.formAjout = { nom: '', prenom: '', email: '', motDePasse: '', role: '', service: '' };
        this.showFormAjout = false;
        this.showToast('Employé ajouté avec succès', 'success');
        await this.chargerUtilisateurs();
      } catch (err) {
        this.showToast(err.response?.data?.message || 'Erreur lors de l\'ajout', 'error');
      }
    },

    activerEdition(user) {
      this.editId = user._id;
      this.formEdit = {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        service: user.service?._id || ''
      };
    },

    annulerEdition() {
      this.editId = null;
      this.formEdit = {};
    },

    async validerEdition(id) {
      try {
        await axios.put(`/users/${id}`, this.formEdit);
        this.editId = null;
        this.showToast('Employé modifié avec succès', 'success');
        await this.chargerUtilisateurs();
      } catch {
        this.showToast('Erreur lors de la mise à jour', 'error');
      }
    },

    async supprimerUtilisateur(id) {
      if (!confirm('Supprimer cet utilisateur définitivement ?')) return;
      try {
        await axios.delete(`/users/${id}`);
        this.showToast('Utilisateur supprimé', 'success');
        await this.chargerUtilisateurs();
      } catch {
        this.showToast('Erreur lors de la suppression', 'error');
      }
    },

    initiales(nom, prenom) {
      return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || '?';
    },
    avatarColor(nom) {
      return AVATAR_COLORS[(nom || '').charCodeAt(0) % AVATAR_COLORS.length];
    },

    showToast(message, type = 'success') {
      this.toast = { visible: true, message, type };
      setTimeout(() => { this.toast.visible = false; }, 3500);
    },
  },

  mounted() {
    this.chargerUtilisateurs();
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
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.kpi { border-radius: 20px; padding: 24px; position: relative; overflow: hidden; transition: transform .25s, box-shadow .25s; }
.kpi:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,.4); }
.kpi-total { background: linear-gradient(145deg, #1e1b4b, #312e81); border: 1px solid rgba(99,102,241,.25); }
.kpi-resp { background: linear-gradient(145deg, #1c1007, #431407); border: 1px solid rgba(234,88,12,.2); }
.kpi-emp { background: linear-gradient(145deg, #052e16, #14532d); border: 1px solid rgba(22,163,74,.2); }
.kpi-serv { background: linear-gradient(145deg, #0c1a2e, #0c2a4a); border: 1px solid rgba(56,130,221,.2); }
.kpi-glow { position: absolute; top: -24px; right: -24px; width: 90px; height: 90px; border-radius: 50%; opacity: .2; pointer-events: none; }
.kpi-total .kpi-glow { background: #818cf8; }
.kpi-resp .kpi-glow { background: #fb923c; }
.kpi-emp .kpi-glow { background: #4ade80; }
.kpi-serv .kpi-glow { background: #60a5fa; }
.kpi-icon-wrap { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 18px; }
.kpi-total .kpi-icon-wrap { background: rgba(79,70,229,.25); }
.kpi-resp .kpi-icon-wrap { background: rgba(234,88,12,.25); }
.kpi-emp .kpi-icon-wrap { background: rgba(22,163,74,.25); }
.kpi-serv .kpi-icon-wrap { background: rgba(56,130,221,.25); }
.kpi-val { font-size: 38px; font-weight: 800; letter-spacing: -.04em; color: #f8fafc; line-height: 1; }
.kpi-lbl { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 5px; text-transform: uppercase; letter-spacing: .08em; }
.kpi-trend { position: absolute; bottom: 18px; right: 18px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
.kpi-total .kpi-trend { background: rgba(79,70,229,.3); color: #a5b4fc; }
.kpi-resp .kpi-trend { background: rgba(234,88,12,.3); color: #fb923c; }
.kpi-emp .kpi-trend { background: rgba(22,163,74,.3); color: #4ade80; }
.kpi-serv .kpi-trend { background: rgba(56,130,221,.3); color: #93c5fd; }

/* ── CARD ── */
.card { background: #111827; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; margin-bottom: 24px; }
.card-hd { padding: 20px 24px 16px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.card-title { font-size: 15px; font-weight: 700; color: #f1f5f9; }
.card-sub { font-size: 12px; color: #475569; background: #1e293b; padding: 3px 12px; border-radius: 99px; font-weight: 500; }

/* ── FORM ── */
.form-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .07em; }
.input-wrap {
  display: flex; align-items: center; gap: 10px;
  background: #1e293b; border: 1px solid #334155;
  border-radius: 12px; padding: 12px 16px;
  transition: border-color .2s, box-shadow .2s;
}
.input-wrap.focused { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.15); }
.select-wrap { padding: 10px 14px; }
.input-icon { font-size: 15px; flex-shrink: 0; }
.field-input {
  background: none; border: none; outline: none;
  font-size: 13px; font-family: 'Sora', sans-serif;
  color: #e2e8f0; flex: 1; width: 100%;
}
.field-input::placeholder { color: #475569; }
.field-select { cursor: pointer; }
.field-select option { background: #1e293b; color: #e2e8f0; }

.submit-btn {
  width: 100%; padding: 14px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border: none; border-radius: 12px;
  color: white; font-size: 14px; font-weight: 700;
  font-family: 'Sora', sans-serif; cursor: pointer;
  transition: opacity .2s, transform .15s;
}
.submit-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
.submit-btn:disabled { opacity: .4; cursor: not-allowed; }

/* ── FILTERS ── */
.filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sbox { display: flex; align-items: center; gap: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 8px 14px; transition: border-color .2s; }
.sbox:focus-within { border-color: #4f46e5; }
.s-icon { font-size: 13px; color: #475569; }
.s-input { background: none; border: none; outline: none; font-size: 13px; font-family: 'Sora', sans-serif; color: #e2e8f0; width: 180px; }
.s-input::placeholder { color: #475569; }
.tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.tab { padding: 7px 16px; border-radius: 10px; font-size: 12px; font-weight: 600; font-family: 'Sora', sans-serif; cursor: pointer; border: 1px solid #334155; background: transparent; color: #64748b; transition: all .2s; display: flex; align-items: center; gap: 6px; }
.tab:hover { background: #1e293b; color: #94a3b8; }
.tab.on { background: #4f46e5; color: white; border-color: #4f46e5; }
.tab-badge { background: rgba(255,255,255,.15); border-radius: 99px; padding: 1px 7px; font-size: 11px; }
.tab:not(.on) .tab-badge { background: #1e293b; color: #475569; }

/* ── STATES ── */
.loader-wrap { display: flex; flex-direction: column; align-items: center; padding: 60px; gap: 14px; color: #475569; font-size: 13px; }
.spinner { width: 34px; height: 34px; border: 3px solid #1e293b; border-top-color: #4f46e5; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty { display: flex; flex-direction: column; align-items: center; padding: 70px 20px; gap: 8px; color: #334155; text-align: center; }
.empty-icon { font-size: 48px; }
.empty p { font-size: 14px; font-weight: 600; color: #475569; margin: 0; }
.empty span { font-size: 12px; color: #334155; }

/* ── TABLE ── */
.tbl-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead tr { background: #0d1422; }
th { padding: 13px 22px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #334155; white-space: nowrap; }
.trow { border-bottom: 1px solid #0d1422; transition: background .15s; }
.trow:hover { background: #131c30; }
td { padding: 15px 22px; vertical-align: middle; }

.emp-cell { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 38px; height: 38px; border-radius: 11px;
  color: white; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.emp-name { font-weight: 600; color: #f1f5f9; font-size: 13px; }
.email-text { color: #475569; font-size: 12px; }

.role-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 12px; border-radius: 99px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
}
.rb-resp { background: rgba(79,70,229,.15); color: #a5b4fc; border: 1px solid rgba(79,70,229,.2); }
.rb-emp { background: rgba(16,185,129,.12); color: #6ee7b7; border: 1px solid rgba(16,185,129,.2); }

.service-text { color: #64748b; font-size: 12px; font-weight: 500; }

/* ── INLINE EDIT ── */
.edit-row { display: flex; gap: 8px; }
.edit-input {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 8px; padding: 8px 12px;
  font-size: 12px; font-family: 'Sora', sans-serif;
  color: #e2e8f0; outline: none; width: 100%;
  transition: border-color .2s;
}
.edit-input:focus { border-color: #4f46e5; }
.edit-select {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 8px; padding: 8px 12px;
  font-size: 12px; font-family: 'Sora', sans-serif;
  color: #e2e8f0; cursor: pointer; outline: none;
  width: 100%;
}
.edit-select option { background: #1e293b; color: #e2e8f0; }

/* ── ACTION BUTTONS ── */
.act-btns { display: flex; gap: 6px; }
.abtn {
  width: 34px; height: 34px;
  border: 1px solid #1e293b; border-radius: 9px;
  cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  background: #1e293b; color: #94a3b8;
  transition: all .15s; font-family: inherit;
}
.abtn:hover { transform: scale(1.12); }
.abtn-edit:hover { background: rgba(79,70,229,.15); border-color: rgba(79,70,229,.3); }
.abtn-del:hover { background: rgba(248,113,113,.12); border-color: rgba(248,113,113,.3); }
.abtn-ok { background: rgba(74,222,128,.1); border-color: rgba(74,222,128,.2); color: #4ade80; }
.abtn-ok:hover { background: rgba(74,222,128,.2); }
.abtn-no { background: rgba(248,113,113,.1); border-color: rgba(248,113,113,.2); color: #f87171; }
.abtn-no:hover { background: rgba(248,113,113,.2); }

/* ── SLIDE ── */
.slide-enter-active, .slide-leave-active { transition: all .3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-12px); }

/* ── TOAST ── */
.toast { position: fixed; bottom: 28px; right: 28px; padding: 14px 22px; border-radius: 14px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 10px; z-index: 9999; font-family: 'Sora', sans-serif; }
.toast-success { background: #052e16; color: #4ade80; border: 1px solid rgba(74,222,128,.2); box-shadow: 0 4px 24px rgba(74,222,128,.15); }
.toast-error { background: #1a0a0a; color: #f87171; border: 1px solid rgba(248,113,113,.2); box-shadow: 0 4px 24px rgba(248,113,113,.15); }
.toast-enter-active, .toast-leave-active { transition: all .35s cubic-bezier(.34,1.56,.64,1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px) scale(.95); }

/* ── RESPONSIVE ── */
@media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .form-grid { grid-template-columns: 1fr; } }
@media (max-width: 700px) { .db { padding: 16px 14px 50px; } .page-title { font-size: 22px; } .topbar { flex-direction: column; align-items: flex-start; } .kpi-grid { gap: 12px; } .filters { flex-direction: column; align-items: flex-start; width: 100%; } .s-input { width: 100%; } }
</style>