<template>
  <div class="register-page">

    <!-- PANNEAU GAUCHE — Branding -->
    <div class="left-panel">
      <div class="brand">
        <div class="brand-logo">
          <span>📅</span>
        </div>
        <h1 class="brand-name">Congés<span class="brand-pro">Pro</span></h1>
        <p class="brand-tagline">Créez votre compte et rejoignez<br/>votre équipe en quelques secondes.</p>
      </div>

      <div class="steps">
        <div class="step" v-for="(s, i) in steps" :key="i">
          <div class="step-num">{{ i + 1 }}</div>
          <div>
            <div class="step-title">{{ s.title }}</div>
            <div class="step-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>

      <div class="left-footer">
        <div class="stat-row">
          <div class="stat" v-for="s in stats" :key="s.label">
            <div class="stat-val">{{ s.val }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="deco-circle deco-1"></div>
      <div class="deco-circle deco-2"></div>
    </div>

    <!-- PANNEAU DROIT — Formulaire -->
    <div class="right-panel">
      <div class="form-card">

        <div class="form-header">
          <div class="form-badge">Inscription</div>
          <h2 class="form-title">Créer un compte</h2>
          <p class="form-sub">Remplissez les informations ci-dessous</p>
        </div>

        <div class="form-body">

          <!-- Nom + Prénom -->
          <div class="row-2">
            <div class="field">
              <label class="field-label">Nom</label>
              <div class="input-wrap" :class="{ focused: focusNom }">
                <span class="input-icon">👤</span>
                <input
                  v-model="nom"
                  type="text"
                  placeholder="Votre nom"
                  class="field-input"
                  @focus="focusNom = true"
                  @blur="focusNom = false"
                  required
                />
              </div>
            </div>
            <div class="field">
              <label class="field-label">Prénom</label>
              <div class="input-wrap" :class="{ focused: focusPrenom }">
                <span class="input-icon">👤</span>
                <input
                  v-model="prenom"
                  type="text"
                  placeholder="Votre prénom"
                  class="field-input"
                  @focus="focusPrenom = true"
                  @blur="focusPrenom = false"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Email -->
          <div class="field">
            <label class="field-label">Adresse email</label>
            <div class="input-wrap" :class="{ focused: focusEmail }">
              <span class="input-icon">✉️</span>
              <input
                v-model="email"
                type="email"
                placeholder="votre@email.com"
                class="field-input"
                autocomplete="email"
                @focus="focusEmail = true"
                @blur="focusEmail = false"
                required
              />
            </div>
          </div>

          <!-- Mot de passe -->
          <div class="field">
            <label class="field-label">Mot de passe</label>
            <div class="input-wrap" :class="{ focused: focusMdp }">
              <span class="input-icon">🔒</span>
              <input
                v-model="motDePasse"
                :type="showPass ? 'text' : 'password'"
                placeholder="Minimum 6 caractères"
                class="field-input"
                autocomplete="new-password"
                @focus="focusMdp = true"
                @blur="focusMdp = false"
                required
              />
              <button type="button" class="toggle-pass" @click="showPass = !showPass">
                {{ showPass ? '🙈' : '👁️' }}
              </button>
            </div>
            <!-- Jauge de force -->
            <div class="strength-bar" v-if="motDePasse">
              <div
                class="strength-fill"
                :style="{ width: strengthPct + '%', background: strengthColor }"
              ></div>
            </div>
            <div class="strength-label" v-if="motDePasse">
              <span :style="{ color: strengthColor }">{{ strengthLabel }}</span>
            </div>
          </div>

          <!-- Rôle -->
          <div class="field">
            <label class="field-label">Rôle</label>
            <div class="role-grid">
              <div
                :class="['role-card', { selected: role === 'employe' }]"
                @click="role = 'employe'"
              >
                <span class="role-icon">👤</span>
                <span class="role-name">Employé</span>
                <div class="role-check" v-if="role === 'employe'">✓</div>
              </div>
              <div
                :class="['role-card', { selected: role === 'responsable' }]"
                @click="role = 'responsable'"
              >
                <span class="role-icon">👑</span>
                <span class="role-name">Responsable</span>
                <div class="role-check" v-if="role === 'responsable'">✓</div>
              </div>
            </div>
          </div>

          <!-- Service existant -->
          <div class="field">
            <label class="field-label">Service <span class="optional">(optionnel)</span></label>
            <div class="input-wrap select-wrap" :class="{ focused: focusService }">
              <span class="input-icon">🏢</span>
              <select
                v-model="service"
                class="field-input field-select"
                @focus="focusService = true"
                @blur="focusService = false"
              >
                <option value="">— Aucun service —</option>
                <option v-for="s in services" :key="s._id" :value="s._id">
                  {{ s.nom }}
                </option>
              </select>
            </div>
          </div>

          <!-- Nouveau service -->
          <div class="field">
            <label class="field-label">Créer un nouveau service <span class="optional">(optionnel)</span></label>
            <div class="input-wrap" :class="{ focused: focusNewService }">
              <span class="input-icon">➕</span>
              <input
                v-model="nouveauService"
                type="text"
                placeholder="RH, Comptabilité, IT…"
                class="field-input"
                @focus="focusNewService = true"
                @blur="focusNewService = false"
              />
            </div>
          </div>

          <!-- Alertes -->
          <transition name="fade">
            <div class="alert alert-success" v-if="message">✅ {{ message }}</div>
          </transition>
          <transition name="fade">
            <div class="alert alert-error" v-if="erreur">⚠️ {{ erreur }}</div>
          </transition>

          <!-- Bouton -->
          <button
            class="submit-btn"
            @click="register"
            :disabled="loading || !nom || !prenom || !email || !motDePasse"
            :class="{ loading }"
          >
            <span v-if="!loading">Créer mon compte →</span>
            <span v-else class="btn-spinner"></span>
          </button>

          <!-- Lien connexion -->
          <p class="login-link">
            Déjà un compte ?
            <router-link to="/" class="login-a">Se connecter</router-link>
          </p>

        </div>
      </div>

      <div class="right-footer">
        <span>© 2026 CongesPro</span>
        <span class="dot-sep">·</span>
        <span>Tous droits réservés</span>
      </div>
    </div>

  </div>
</template>

<script>
import axios from '../axios';

export default {
  name: 'RegisterView',
  data() {
    return {
      nom: '',
      prenom: '',
      email: '',
      motDePasse: '',
      role: 'employe',
      service: '',
      nouveauService: '',
      services: [],
      message: '',
      erreur: '',
      loading: false,
      showPass: false,
      focusNom: false,
      focusPrenom: false,
      focusEmail: false,
      focusMdp: false,
      focusService: false,
      focusNewService: false,
      steps: [
        { title: 'Remplissez vos infos', desc: 'Nom, email, mot de passe' },
        { title: 'Choisissez votre rôle', desc: 'Employé ou Responsable RH' },
        { title: 'Rejoignez votre équipe', desc: 'Accédez à votre dashboard' },
      ],
      stats: [
        { val: '< 1min', label: 'Inscription' },
        { val: '100%', label: 'Gratuit' },
        { val: '0', label: 'Papier' },
      ],
    };
  },

  computed: {
    strengthPct() {
      const p = this.motDePasse;
      if (!p) return 0;
      let score = 0;
      if (p.length >= 6)  score += 25;
      if (p.length >= 10) score += 25;
      if (/[A-Z]/.test(p)) score += 25;
      if (/[0-9!@#$%^&*]/.test(p)) score += 25;
      return score;
    },
    strengthColor() {
      const p = this.strengthPct;
      if (p <= 25) return '#f87171';
      if (p <= 50) return '#fb923c';
      if (p <= 75) return '#facc15';
      return '#4ade80';
    },
    strengthLabel() {
      const p = this.strengthPct;
      if (p <= 25) return 'Faible';
      if (p <= 50) return 'Moyen';
      if (p <= 75) return 'Bon';
      return 'Excellent';
    },
  },

  methods: {
    async register() {
      this.erreur = '';
      this.message = '';
      this.loading = true;
      let serviceId = this.service || undefined;

      try {
        if (this.nouveauService.trim()) {
          const nomService = this.nouveauService.trim();
          try {
            const res = await axios.post('/services', { nom: nomService });
            serviceId = res.data._id;
          } catch (err) {
            if (err.response?.status === 400) {
              const res = await axios.get('/services');
              const existing = res.data.find(s => s.nom.toLowerCase() === nomService.toLowerCase());
              if (existing) serviceId = existing._id;
            } else throw err;
          }
        }

        await axios.post('/auth/register', {
          nom: this.nom,
          prenom: this.prenom,
          email: this.email,
          motDePasse: this.motDePasse,
          role: this.role,
          service: serviceId,
        });

        this.message = 'Inscription réussie ! Vous pouvez maintenant vous connecter.';
        this.nom = this.prenom = this.email = this.motDePasse = '';
        this.role = 'employe';
        this.service = '';
        this.nouveauService = '';
        await this.chargerServices();

        setTimeout(() => { this.$router.push('/'); }, 2500);

      } catch (err) {
        this.erreur = err.response?.data?.message || 'Erreur lors de l\'inscription.';
      } finally {
        this.loading = false;
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
  },

  mounted() { this.chargerServices(); }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

/* ── PAGE ── */
.register-page {
  font-family: 'Sora', sans-serif;
  display: flex;
  min-height: 100vh;
  background: #0a0f1e;
}

/* ── PANNEAU GAUCHE ── */
.left-panel {
  flex: 1;
  background: linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #0a0f1e 100%);
  border-right: 1px solid #1e293b;
  padding: 48px 52px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}
.brand { z-index: 1; }
.brand-logo {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(79,70,229,.35);
}
.brand-name { font-size: 32px; font-weight: 800; color: #f8fafc; letter-spacing: -.03em; margin: 0 0 12px; }
.brand-pro  { color: #818cf8; }
.brand-tagline { font-size: 16px; color: #64748b; line-height: 1.7; margin: 0; }

.steps { display: flex; flex-direction: column; gap: 22px; z-index: 1; }
.step { display: flex; align-items: flex-start; gap: 14px; }
.step-num {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: rgba(79,70,229,.2);
  border: 1px solid rgba(79,70,229,.3);
  color: #a5b4fc;
  font-size: 12px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.step-title { font-size: 14px; font-weight: 700; color: #e2e8f0; margin-bottom: 3px; }
.step-desc  { font-size: 12px; color: #475569; line-height: 1.5; }

.stat-row   { display: flex; gap: 32px; z-index: 1; }
.stat-val   { font-size: 22px; font-weight: 800; color: #f8fafc; letter-spacing: -.02em; }
.stat-label { font-size: 11px; color: #475569; font-weight: 500; text-transform: uppercase; letter-spacing: .06em; margin-top: 3px; }

.deco-circle { position: absolute; border-radius: 50%; pointer-events: none; }
.deco-1 { width: 320px; height: 320px; border: 1px solid rgba(79,70,229,.1); bottom: -80px; right: -80px; }
.deco-2 { width: 200px; height: 200px; border: 1px solid rgba(79,70,229,.06); bottom: -20px; right: -20px; }

/* ── PANNEAU DROIT ── */
.right-panel {
  flex: 0 0 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 36px;
  gap: 20px;
  overflow-y: auto;
}

.form-card {
  width: 100%;
  max-width: 460px;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 24px;
  overflow: hidden;
  animation: slideUp .5s cubic-bezier(.34,1.56,.64,1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

.form-header {
  padding: 28px 28px 20px;
  border-bottom: 1px solid #1e293b;
}
.form-badge {
  display: inline-block;
  background: rgba(79,70,229,.15);
  color: #a5b4fc;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  padding: 4px 14px;
  border-radius: 99px;
  border: 1px solid rgba(79,70,229,.2);
  margin-bottom: 14px;
}
.form-title { font-size: 22px; font-weight: 800; color: #f8fafc; letter-spacing: -.02em; margin: 0 0 6px; }
.form-sub   { font-size: 13px; color: #475569; margin: 0; }

.form-body { padding: 24px 28px 28px; display: flex; flex-direction: column; gap: 16px; }

/* Ligne 2 colonnes */
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.field { display: flex; flex-direction: column; gap: 7px; }
.field-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .07em; }
.optional { font-weight: 400; color: #475569; text-transform: none; letter-spacing: 0; }

.input-wrap {
  display: flex; align-items: center; gap: 10px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 11px;
  padding: 11px 14px;
  transition: border-color .2s, box-shadow .2s;
}
.input-wrap.focused { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.15); }
.select-wrap { padding: 10px 14px; }
.input-icon { font-size: 15px; flex-shrink: 0; }
.field-input {
  background: none; border: none; outline: none;
  font-size: 13px; font-family: 'Sora', sans-serif;
  color: #e2e8f0; flex: 1;
}
.field-input::placeholder { color: #475569; }
.field-select { cursor: pointer; }
.field-select option { background: #1e293b; color: #e2e8f0; }

.toggle-pass { background: none; border: none; cursor: pointer; font-size: 15px; padding: 0; opacity: .6; transition: opacity .2s; }
.toggle-pass:hover { opacity: 1; }

/* Jauge de force */
.strength-bar { height: 3px; background: #1e293b; border-radius: 99px; overflow: hidden; margin-top: 6px; }
.strength-fill { height: 100%; border-radius: 99px; transition: width .4s ease, background .4s; }
.strength-label { font-size: 11px; font-weight: 600; margin-top: 4px; }

/* Rôle cards */
.role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.role-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 14px 10px;
  cursor: pointer;
  position: relative;
  transition: all .2s;
}
.role-card:hover { border-color: #4f46e5; }
.role-card.selected { background: rgba(79,70,229,.12); border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.1); }
.role-icon { font-size: 22px; }
.role-name { font-size: 12px; font-weight: 700; color: #94a3b8; }
.role-card.selected .role-name { color: #a5b4fc; }
.role-check {
  position: absolute; top: 7px; right: 7px;
  width: 18px; height: 18px;
  background: #4f46e5; border-radius: 50%;
  color: white; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.alert { border-radius: 10px; padding: 11px 14px; font-size: 13px; font-weight: 500; }
.alert-success { background: rgba(74,222,128,.1);  color: #4ade80; border: 1px solid rgba(74,222,128,.2); }
.alert-error   { background: rgba(248,113,113,.1); color: #f87171; border: 1px solid rgba(248,113,113,.2); }

.submit-btn {
  width: 100%; padding: 14px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border: none; border-radius: 12px;
  color: white; font-size: 14px; font-weight: 700;
  font-family: 'Sora', sans-serif;
  cursor: pointer;
  transition: opacity .2s, transform .15s;
  display: flex; align-items: center; justify-content: center;
  margin-top: 4px;
}
.submit-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
.submit-btn:disabled { opacity: .35; cursor: not-allowed; }
.btn-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.3); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.login-link { text-align: center; font-size: 13px; color: #475569; margin: 0; }
.login-a { color: #818cf8; font-weight: 700; text-decoration: none; }
.login-a:hover { color: #a5b4fc; text-decoration: underline; }

.right-footer { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #334155; }
.dot-sep { color: #1e293b; }

.fade-enter-active, .fade-leave-active { transition: opacity .3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── RESPONSIVE ── */
@media (max-width: 960px) {
  .register-page  { flex-direction: column; }
  .left-panel     { padding: 32px 28px; min-height: 240px; }
  .right-panel    { flex: 1; padding: 28px 16px; }
}
@media (max-width: 480px) {
  .row-2 { grid-template-columns: 1fr; }
  .form-header, .form-body { padding-left: 18px; padding-right: 18px; }
}
</style>